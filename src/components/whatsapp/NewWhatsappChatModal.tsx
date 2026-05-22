import { useEffect, useRef, useState } from "react"
import { User, Phone } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { api, type WhatsappChat } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

type PatientOption = {
  id: string
  name: string
  phone?: string
  whatsapp?: string | null
}

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (chat: WhatsappChat) => void
}

type Mode = "patient" | "phone"

export default function NewWhatsappChatModal({ open, onClose, onCreated }: Props) {
  const { toast } = useToast()
  const searchRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>("patient")
  const [patientSearch, setPatientSearch] = useState("")
  const [searchResults, setSearchResults] = useState<PatientOption[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [phone, setPhone] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!open) {
      setMode("patient")
      setPatientSearch("")
      setSearchResults([])
      setShowResults(false)
      setSelectedPatient(null)
      setPhone("")
      setCreating(false)
    }
  }, [open])

  useEffect(() => {
    if (patientSearch.length < 3) {
      setSearchResults([])
      return
    }
    const t = setTimeout(() => {
      api.patients
        .list({ search: patientSearch })
        .then((r) => setSearchResults(r.data))
        .catch((e: unknown) =>
          toast(toastMessageFromApiError(e, "Erro ao buscar pacientes"), "error")
        )
    }, 300)
    return () => clearTimeout(t)
  }, [patientSearch, toast])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const selectPatient = (p: PatientOption) => {
    setSelectedPatient(p)
    setPatientSearch(p.name)
    setShowResults(false)
  }

  const canSubmit =
    mode === "patient" ? !!selectedPatient : phone.replace(/\D/g, "").length >= 10

  const handleSubmit = async () => {
    if (!canSubmit) return
    setCreating(true)
    try {
      const chat =
        mode === "patient" && selectedPatient
          ? await api.whatsapp.createChat({ patientId: selectedPatient.id })
          : await api.whatsapp.createChat({ phone: phone.replace(/\D/g, "") })
      toast("Conversa criada")
      onCreated(chat)
      onClose()
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao criar conversa"), "error")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova conversa"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={creating}>
            Cancelar
          </Button>
          <Button type="button" disabled={!canSubmit || creating} onClick={handleSubmit}>
            {creating ? "Criando..." : "Iniciar conversa"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex rounded-lg border border-border p-1 bg-surface-alt/50">
          <button
            type="button"
            onClick={() => setMode("patient")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === "patient"
                ? "bg-surface text-text shadow-sm"
                : "text-text-secondary hover:text-text"
            )}
          >
            Paciente
          </button>
          <button
            type="button"
            onClick={() => setMode("phone")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === "phone"
                ? "bg-surface text-text shadow-sm"
                : "text-text-secondary hover:text-text"
            )}
          >
            Telefone
          </button>
        </div>

        {mode === "patient" ? (
          <div ref={searchRef} className="relative">
            <label className="block text-sm font-medium text-text mb-1.5">
              Buscar paciente
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                className="w-full h-10 rounded-lg border border-border pl-10 pr-3 text-sm bg-surface text-text"
                placeholder="Digite pelo menos 3 letras..."
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value)
                  setSelectedPatient(null)
                }}
                onFocus={() => patientSearch.length >= 3 && setShowResults(true)}
              />
            </div>
            {showResults && searchResults.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-44 overflow-auto">
                {searchResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-alt"
                      onClick={() => selectPatient(p)}
                    >
                      <span className="font-medium text-text">{p.name}</span>
                      {(p.whatsapp || p.phone) && (
                        <span className="text-text-secondary ml-2 text-xs">
                          {p.whatsapp || p.phone}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {patientSearch.length >= 3 && searchResults.length === 0 && showResults && (
              <p className="text-xs text-text-secondary mt-1.5">
                Nenhum paciente encontrado.
              </p>
            )}
            {selectedPatient && (
              <p className="text-xs text-primary mt-2">
                Selecionado: {selectedPatient.name}
                {(selectedPatient.whatsapp || selectedPatient.phone) &&
                  ` · ${selectedPatient.whatsapp || selectedPatient.phone}`}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Número do WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="tel"
                className="w-full h-10 rounded-lg border border-border pl-10 pr-3 text-sm bg-surface text-text"
                placeholder="DDD + número (ex: 11999998888)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <p className="text-xs text-text-secondary mt-1.5">
              Se o número pertencer a um paciente cadastrado, a conversa será vinculada
              automaticamente.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
