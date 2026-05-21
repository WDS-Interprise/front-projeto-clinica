import { useCallback, useEffect, useState } from "react"
import { Calendar, Plus, Trash2 } from "lucide-react"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { useConfirm } from "@/hooks/useConfirm"
import type { Doctor, Patient, WaitingListEntry } from "@/types"

const priorityLabels: Record<string, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
}

const statusLabels: Record<string, string> = {
  WAITING: "Aguardando",
  CONTACTED: "Contatado",
  SCHEDULED: "Agendado",
  CANCELLED: "Cancelado",
  NO_ANSWER: "Sem resposta",
}

const quickStatuses = [
  { value: "CONTACTED", label: "Contatado" },
  { value: "NO_ANSWER", label: "Sem resposta" },
  { value: "CANCELLED", label: "Cancelado" },
] as const

interface Props {
  open: boolean
  onClose: () => void
  defaultDoctorId?: string
  onSchedule: (data: {
    patientId: string
    doctorId?: string
    waitingListEntryId: string
  }) => void
}

export default function WaitingListDrawer({
  open,
  onClose,
  defaultDoctorId,
  onSchedule,
}: Props) {
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [entries, setEntries] = useState<WaitingListEntry[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filterDoctorId, setFilterDoctorId] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [patientSearch, setPatientSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [patientId, setPatientId] = useState("")
  const [addDoctorId, setAddDoctorId] = useState("")
  const [priority, setPriority] = useState("NORMAL")
  const [notes, setNotes] = useState("")

  const load = useCallback(() => {
    if (!open) return
    setLoading(true)
    api.waitingList
      .list({
        doctorId: filterDoctorId || undefined,
        status: filterStatus || undefined,
      })
      .then(setEntries)
      .catch((e: unknown) => {
        toast(e instanceof Error ? e.message : "Erro ao carregar lista", "error")
        setEntries([])
      })
      .finally(() => setLoading(false))
  }, [open, filterDoctorId, filterStatus, toast])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!open) return
    api.doctors.list().then(setDoctors)
    setFilterDoctorId(defaultDoctorId ?? "")
  }, [open, defaultDoctorId])

  useEffect(() => {
    if (patientSearch.length < 3) {
      setSearchResults([])
      return
    }
    const t = setTimeout(() => {
      api.patients.list({ search: patientSearch }).then((r) => setSearchResults(r.data))
    }, 300)
    return () => clearTimeout(t)
  }, [patientSearch])

  const handleAdd = async () => {
    if (!patientId) {
      toast("Selecione um paciente", "error")
      return
    }
    try {
      await api.waitingList.create({
        patientId,
        doctorId: addDoctorId || undefined,
        priority,
        notes: notes || undefined,
      })
      toast("Adicionado à lista de espera")
      setShowAdd(false)
      setPatientId("")
      setPatientSearch("")
      setNotes("")
      load()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Erro ao adicionar", "error")
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.waitingList.update(id, { status })
      load()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Erro", "error")
    }
  }

  const handleRemove = async (id: string) => {
    const ok = await confirm({
      title: "Remover da lista",
      message: "Remover da lista de espera?",
      confirmLabel: "Remover",
      variant: "danger",
    })
    if (!ok) return
    try {
      await api.waitingList.remove(id)
      toast("Removido")
      load()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Erro", "error")
    }
  }

  return (
    <>
    <Drawer
      open={open}
      onClose={onClose}
      title="Lista de espera"
      width="lg"
      footer={
        <Button className="w-full gap-2" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="w-4 h-4" />
          {showAdd ? "Cancelar" : "Adicionar à lista"}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterDoctorId}
            onChange={(e) => setFilterDoctorId(e.target.value)}
            className="h-10 rounded border border-border px-2 text-sm"
          >
            <option value="">Todos profissionais</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded border border-border px-2 text-sm"
          >
            <option value="">Todos status</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {showAdd && (
          <div className="rounded-lg border border-border p-4 space-y-3 bg-surface-alt">
            <p className="text-sm font-medium">Novo na fila</p>
            <input
              type="text"
              placeholder="Buscar paciente (min. 3 letras)"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full h-10 rounded border border-border px-3 text-sm"
            />
            {searchResults.length > 0 && (
              <ul className="border border-border rounded max-h-32 overflow-y-auto text-sm">
                {searchResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-surface-alt"
                      onClick={() => {
                        setPatientId(p.id)
                        setPatientSearch(p.name)
                        setSearchResults([])
                      }}
                    >
                      {p.name} — {p.phone}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <select
              value={addDoctorId}
              onChange={(e) => setAddDoctorId(e.target.value)}
              className="w-full h-10 rounded border border-border px-2 text-sm"
            >
              <option value="">Profissional desejado (opcional)</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full h-10 rounded border border-border px-2 text-sm"
            >
              <option value="LOW">Prioridade baixa</option>
              <option value="NORMAL">Prioridade normal</option>
              <option value="HIGH">Prioridade alta</option>
            </select>
            <textarea
              placeholder="Observação"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm min-h-[60px]"
            />
            <Button className="w-full" onClick={handleAdd}>
              Salvar
            </Button>
          </div>
        )}

        {loading && <p className="text-sm text-text-secondary">Carregando...</p>}

        {!loading && entries.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-6">
            Nenhum paciente na lista de espera.
          </p>
        )}

        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{e.patient?.name ?? "—"}</p>
                  <p className="text-xs text-text-secondary">{e.patient?.phone}</p>
                  {e.doctor && (
                    <p className="text-xs text-text-secondary mt-1">
                      {e.doctor.name} · {e.doctor.specialty}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    className={
                      e.priority === "HIGH"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-surface-alt text-text-secondary border-border"
                    }
                  >
                    {priorityLabels[e.priority] ?? e.priority}
                  </Badge>
                  <span className="text-xs text-text-secondary">
                    {statusLabels[e.status] ?? e.status}
                  </span>
                </div>
              </div>
              {e.notes && <p className="text-xs text-text-secondary">{e.notes}</p>}
              {e.status !== "SCHEDULED" && e.status !== "CANCELLED" && (
                <div className="flex flex-wrap gap-1 pt-1">
                  <Button
                    size="sm"
                    className="gap-1 h-8"
                    onClick={() => {
                      onClose()
                      onSchedule({
                        patientId: e.patientId,
                        doctorId: e.doctorId ?? undefined,
                        waitingListEntryId: e.id,
                      })
                    }}
                  >
                    <Calendar className="w-3 h-3" />
                    Agendar
                  </Button>
                  {quickStatuses.map((s) => (
                    <Button
                      key={s.value}
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs"
                      onClick={() => updateStatus(e.id, s.value)}
                    >
                      {s.label}
                    </Button>
                  ))}
                  <button
                    type="button"
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded ml-auto"
                    onClick={() => handleRemove(e.id)}
                    aria-label="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Drawer>
    <ConfirmDialog />
    </>
  )
}
