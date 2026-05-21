import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Trash2 } from "lucide-react"
import { backofficeApi, type BackofficeClinic } from "@/services/backoffice-api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { Button } from "@/components/ui/button"
import { useConfirm } from "@/hooks/useConfirm"

export default function BackofficeUserFormPage() {
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const { id } = useParams()
  const isEdit = Boolean(id && id !== "novo")
  const navigate = useNavigate()
  const [clinics, setClinics] = useState<BackofficeClinic[]>([])
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([])
  const [linkedDoctorIds, setLinkedDoctorIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    role: "RECEPTION" as "RECEPTION" | "DOCTOR" | "ADMIN",
    name: "",
    email: "",
    password: "",
    phone: "",
    clinicId: "",
    isAccountAdmin: false,
    isClinicAdmin: false,
    active: true,
    crm: "",
    specialty: "Clínico Geral",
  })

  useEffect(() => {
    backofficeApi.clinics.list().then((list) => {
      setClinics(list)
      if (!isEdit && list[0]) setForm((f) => ({ ...f, clinicId: list[0].id }))
    })
  }, [isEdit])

  useEffect(() => {
    if (!form.clinicId) return
    backofficeApi.users.list({ role: "DOCTOR", clinicId: form.clinicId }).then((list) => {
      setDoctors(
        list
          .filter((u) => u.doctorProfile?.id)
          .map((u) => ({ id: u.doctorProfile!.id, name: u.name }))
      )
    })
  }, [form.clinicId])

  useEffect(() => {
    if (!isEdit || !id) return
    backofficeApi.users.getById(id).then((u) => {
      setForm({
        role: u.role,
        name: u.name,
        email: u.email,
        password: "",
        phone: u.phone ?? "",
        clinicId: u.clinicIds?.[0] ?? u.clinics?.[0]?.id ?? "",
        isAccountAdmin: u.isAccountAdmin ?? false,
        isClinicAdmin: u.clinics?.[0]?.isClinicAdmin ?? false,
        active: u.active ?? true,
        crm: u.doctorProfile?.crm ?? "",
        specialty: u.doctorProfile?.specialty ?? "Clínico Geral",
      })
      setLinkedDoctorIds(u.linkedDoctors?.map((d: { id: string }) => d.id) ?? [])
    })
  }, [id, isEdit])

  const handleSave = async () => {
    if (!form.clinicId) return
    setLoading(true)
    try {
      if (isEdit && id) {
        await backofficeApi.users.update(id, {
          name: form.name,
          email: form.email,
          active: form.active,
          phone: form.phone,
          isAccountAdmin: form.isAccountAdmin,
          isClinicAdmin: form.isClinicAdmin,
          clinicId: form.clinicId,
          linkedDoctorIds: form.role === "RECEPTION" ? linkedDoctorIds : undefined,
          ...(form.role === "DOCTOR"
            ? { crm: form.crm, specialty: form.specialty }
            : {}),
          ...(form.password ? { password: form.password } : {}),
        })
      } else {
        await backofficeApi.users.create({
          role: form.role,
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          clinicId: form.clinicId,
          isAccountAdmin: form.isAccountAdmin,
          isClinicAdmin: form.isClinicAdmin,
          linkedDoctorIds: form.role === "RECEPTION" ? linkedDoctorIds : undefined,
          crm: form.crm,
          specialty: form.specialty,
        })
      }
      toast(isEdit ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso.")
      navigate("/backoffice/usuarios")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao salvar"), "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div className="space-y-6 max-w-xl">
      <Link to="/backoffice/usuarios" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-text">
        {isEdit ? "Editar usuário" : "Novo usuário"}
      </h1>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <select
          value={form.role}
          disabled={isEdit}
          onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
          className="w-full h-10 rounded-lg bg-surface-alt border border-border px-3 text-sm text-text"
        >
          <option value="RECEPTION">Recepcionista</option>
          <option value="DOCTOR">Médico</option>
          <option value="ADMIN">Administrador da clínica</option>
        </select>
        <select
          value={form.clinicId}
          onChange={(e) => setForm({ ...form, clinicId: e.target.value })}
          className="w-full h-10 rounded-lg bg-surface-alt border border-border px-3 text-sm text-text"
        >
          <option value="">Selecione a clínica</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full h-10 rounded-lg bg-surface-alt border border-border px-3 text-sm text-text"
        />
        <input
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full h-10 rounded-lg bg-surface-alt border border-border px-3 text-sm text-text"
        />
        <input
          type="password"
          placeholder={isEdit ? "Nova senha (opcional)" : "Senha"}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full h-10 rounded-lg bg-surface-alt border border-border px-3 text-sm text-text"
        />
        <input
          placeholder="Telefone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full h-10 rounded-lg bg-surface-alt border border-border px-3 text-sm text-text"
        />

        {form.role === "DOCTOR" && (
          <>
            <input
              placeholder="CRM"
              value={form.crm}
              onChange={(e) => setForm({ ...form, crm: e.target.value })}
              className="w-full h-10 rounded-lg bg-surface-alt border border-border px-3 text-sm text-text"
            />
            <input
              placeholder="Especialidade"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              className="w-full h-10 rounded-lg bg-surface-alt border border-border px-3 text-sm text-text"
            />
          </>
        )}

        {form.role === "RECEPTION" && doctors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">Médicos vinculados</p>
            {doctors.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={linkedDoctorIds.includes(d.id)}
                  onChange={() =>
                    setLinkedDoctorIds((prev) =>
                      prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                    )
                  }
                />
                {d.name}
              </label>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={form.isClinicAdmin}
            onChange={(e) => setForm({ ...form, isClinicAdmin: e.target.checked })}
          />
          Administrador da clínica
        </label>
        <label className="flex items-center gap-2 text-sm text-amber-300">
          <input
            type="checkbox"
            checked={form.isAccountAdmin}
            onChange={(e) => setForm({ ...form, isAccountAdmin: e.target.checked })}
          />
          Dono da plataforma (acesso ao backoffice)
        </label>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Usuário ativo
          </label>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            className="flex-1 bg-amber-600 hover:bg-amber-500"
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? "Salvando..." : "Salvar alterações"}
          </Button>
          {isEdit && id && (
            <Button
              type="button"
              variant="danger"
              disabled={loading}
              onClick={async () => {
                const ok = await confirm({
                  title: "Excluir usuário",
                  message:
                    "Excluir este usuário? Ele será desativado e não poderá mais acessar o sistema.",
                  confirmLabel: "Excluir",
                  variant: "danger",
                })
                if (!ok) return
                setLoading(true)
                try {
                  await backofficeApi.users.remove(id)
                  toast("Usuário excluído (desativado) com sucesso.")
                  navigate("/backoffice/usuarios")
                } catch (e: unknown) {
                  toast(toastMessageFromApiError(e, "Erro ao excluir"), "error")
                } finally {
                  setLoading(false)
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir
            </Button>
          )}
        </div>
      </div>
    </div>
    <ConfirmDialog />
    </>
  )
}
