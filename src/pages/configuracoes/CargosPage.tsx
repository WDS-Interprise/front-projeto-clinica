import { useCallback, useEffect, useState } from "react"
import { Plus, Shield, Trash2 } from "lucide-react"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { api, type ClinicRole, type PermissionGroup } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import type { Permission } from "@/lib/permissions"
import { cn } from "@/lib/utils"

export default function CargosPage() {
  const { toast } = useToast()
  const [roles, setRoles] = useState<ClinicRole[]>([])
  const [groups, setGroups] = useState<PermissionGroup[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editPerms, setEditPerms] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")

  const load = useCallback(() => {
    setLoading(true)
    api.clinicRoles
      .list()
      .then((res) => {
        setRoles(res.roles)
        setGroups(res.groups)
        setSelectedId((prev) => prev ?? res.roles[0]?.id ?? null)
      })
      .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar cargos"), "error"))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const selected = roles.find((r) => r.id === selectedId) ?? null

  useEffect(() => {
    if (selected) {
      setEditName(selected.name)
      setEditPerms(selected.permissions)
    }
  }, [selectedId, selected])

  const togglePerm = (perm: Permission) => {
    setEditPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      const updated = await api.clinicRoles.update(selectedId, {
        name: editName,
        permissions: editPerms,
      })
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      toast("Cargo atualizado")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao salvar cargo"), "error")
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (name.length < 2) {
      toast("Informe um nome para o cargo", "error")
      return
    }
    setSaving(true)
    try {
      const created = await api.clinicRoles.create({ name, permissions: [] })
      setRoles((prev) => [...prev, created])
      setSelectedId(created.id)
      setCreateOpen(false)
      setNewName("")
      toast("Cargo criado")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao criar cargo"), "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.clinicRoles.remove(id)
      setRoles((prev) => prev.filter((r) => r.id !== id))
      if (selectedId === id) setSelectedId(roles.find((r) => r.id !== id)?.id ?? null)
      toast("Cargo excluído")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao excluir cargo"), "error")
    }
  }

  return (
    <SettingsLayout>
      <SettingsPageHeader
        title="Cargos e permissões"
        description="Personalize o que cada perfil da equipe pode fazer na clínica."
      />

      {loading ? (
        <p className="text-sm text-text-secondary">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <aside className="rounded-xl border border-border bg-surface p-3 space-y-1">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedId(role.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  selectedId === role.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-text hover:bg-surface-alt"
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  {role.isSystem && <Shield className="h-3.5 w-3.5 shrink-0 opacity-60" />}
                  {role.name}
                </span>
                {role.memberCount != null && (
                  <span className="text-xs text-text-secondary">{role.memberCount}</span>
                )}
              </button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar cargo
            </Button>
          </aside>

          {selected ? (
            <div className="rounded-xl border border-border bg-surface p-6 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-text">Nome do cargo</label>
                  <Input
                    className="mt-1"
                    value={editName}
                    disabled={selected.isSystem}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  {selected.isSystem && (
                    <p className="text-xs text-text-secondary mt-1">
                      Cargos do sistema podem ter permissões editadas, mas o nome é fixo.
                    </p>
                  )}
                </div>
                {!selected.isSystem && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-danger border-danger/30 hover:bg-danger/10"
                    onClick={() => handleDelete(selected.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                )}
              </div>

              {groups.map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    {group.title}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.items.map((item) => (
                      <label
                        key={item.permission}
                        className="flex items-center gap-2 text-sm text-text cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={editPerms.includes(item.permission as Permission)}
                          onChange={() => togglePerm(item.permission as Permission)}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar cargo"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Selecione um cargo.</p>
          )}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo cargo">
        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Auxiliar de recepção"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              Criar
            </Button>
          </div>
        </div>
      </Modal>
    </SettingsLayout>
  )
}
