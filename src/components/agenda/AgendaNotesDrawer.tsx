import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import { Plus, Trash2 } from "lucide-react"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { useConfirm } from "@/hooks/useConfirm"
import type { AgendaNote, Doctor } from "@/types"

const typeOptions = [
  { value: "DAY", label: "Dia" },
  { value: "PROFESSIONAL", label: "Profissional" },
  { value: "PATIENT", label: "Paciente" },
  { value: "RECEPTION", label: "Recepção" },
]

const visibilityOptions = [
  { value: "RECEPTION_ONLY", label: "Só recepção" },
  { value: "CLINIC", label: "Toda clínica" },
  { value: "PROFESSIONAL", label: "Profissional" },
  { value: "ADMIN_ONLY", label: "Só admin" },
]

interface Props {
  open: boolean
  onClose: () => void
  noteDate: string
  onCountChange?: (count: number) => void
}

export default function AgendaNotesDrawer({ open, onClose, noteDate, onCountChange }: Props) {
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [notes, setNotes] = useState<AgendaNote[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("DAY")
  const [visibility, setVisibility] = useState("RECEPTION_ONLY")
  const [doctorId, setDoctorId] = useState("")

  const load = useCallback(() => {
    if (!open) return
    setLoading(true)
    api.agendaNotes
      .list({ date: noteDate })
      .then((data) => {
        setNotes(data)
        onCountChange?.(data.length)
      })
      .catch((e: unknown) => {
        toast(e instanceof Error ? e.message : "Erro ao carregar observações", "error")
        setNotes([])
        onCountChange?.(0)
      })
      .finally(() => setLoading(false))
  }, [open, noteDate, toast, onCountChange])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (open) api.doctors.list().then(setDoctors)
  }, [open])

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      toast("Preencha título e descrição", "error")
      return
    }
    try {
      await api.agendaNotes.create({
        title: title.trim(),
        description: description.trim(),
        date: noteDate,
        type,
        visibility,
        doctorId: doctorId || undefined,
      })
      toast("Observação salva")
      setTitle("")
      setDescription("")
      setShowForm(false)
      load()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Erro ao salvar", "error")
    }
  }

  const handleRemove = async (id: string) => {
    const ok = await confirm({
      title: "Remover observação",
      message: "Remover observação?",
      confirmLabel: "Remover",
      variant: "danger",
    })
    if (!ok) return
    try {
      await api.agendaNotes.remove(id)
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
      title={`Observações — ${format(new Date(noteDate + "T12:00:00"), "dd/MM/yyyy")}`}
      width="lg"
      footer={
        <Button className="w-full gap-2" onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4" />
          {showForm ? "Cancelar" : "Nova observação"}
        </Button>
      }
    >
      <p className="text-xs text-text-secondary mb-4">
        Observações administrativas da agenda — não substituem o prontuário clínico.
      </p>

      {showForm && (
        <div className="rounded-lg border border-border p-4 space-y-3 mb-4 bg-surface-alt">
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 rounded border border-border px-3 text-sm"
          />
          <textarea
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm min-h-[80px]"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-10 rounded border border-border px-2 text-sm"
          >
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full h-10 rounded border border-border px-2 text-sm"
          >
            {visibilityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full h-10 rounded border border-border px-2 text-sm"
          >
            <option value="">Profissional (opcional)</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <Button className="w-full" onClick={handleCreate}>
            Salvar observação
          </Button>
        </div>
      )}

      {loading && <p className="text-sm text-text-secondary">Carregando...</p>}

      {!loading && notes.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-6">
          Nenhuma observação para este dia.
        </p>
      )}

      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg border border-border p-3">
            <div className="flex justify-between gap-2">
              <p className="font-medium text-sm">{n.title}</p>
              <button
                type="button"
                className="text-red-600 p-1 hover:bg-red-50 rounded shrink-0"
                onClick={() => handleRemove(n.id)}
                aria-label="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">{n.description}</p>
            <p className="text-xs text-text-secondary mt-2">
              {n.doctor?.name && `${n.doctor.name} · `}
              {visibilityOptions.find((v) => v.value === n.visibility)?.label ?? n.visibility}
            </p>
          </li>
        ))}
      </ul>
    </Drawer>
    <ConfirmDialog />
    </>
  )
}
