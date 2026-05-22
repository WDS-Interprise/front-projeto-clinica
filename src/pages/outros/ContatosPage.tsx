import { useEffect, useState } from "react"
import { Search, Phone, Mail } from "lucide-react"
import { OutrosPageShell } from "@/components/outros/OutrosPageShell"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

const typeLabels: Record<string, string> = {
  patient: "Paciente",
  professional: "Profissional",
  reception: "Recepção",
  staff: "Equipe",
}

const filters = [
  { value: "", label: "Todos" },
  { value: "patient", label: "Pacientes" },
  { value: "professional", label: "Profissionais" },
  { value: "staff", label: "Equipe" },
]

export default function ContatosPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [contacts, setContacts] = useState<
    Array<{ id: string; name: string; type: string; phone: string | null; email: string | null; subtitle?: string }>
  >([])

  useEffect(() => {
    const t = setTimeout(() => {
      api.outros
        .contacts({ search: search || undefined, type: type || undefined })
        .then(setContacts)
        .catch((err: unknown) => toast(toastMessageFromApiError(err, "Erro ao carregar contatos"), "error"))
    }, 300)
    return () => clearTimeout(t)
  }, [search, type, toast])

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone).then(() => toast("Telefone copiado"))
  }

  return (
    <OutrosPageShell title="Contatos" description="Contatos da clínica, pacientes e profissionais.">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, telefone ou e-mail..."
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-sm"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          {filters.map((f) => (
            <option key={f.value || "all"} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Telefone</th>
              <th className="text-left p-3">E-mail</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">
                  Nenhum contato encontrado
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={`${c.type}-${c.id}`} className="border-t border-border">
                  <td className="p-3">
                    <p className="font-medium text-text">{c.name}</p>
                    {c.subtitle && <p className="text-xs text-text-secondary">{c.subtitle}</p>}
                  </td>
                  <td className="p-3 text-text-secondary">{typeLabels[c.type] ?? c.type}</td>
                  <td className="p-3">{c.phone ?? "—"}</td>
                  <td className="p-3">{c.email ?? "—"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      {c.phone && (
                        <>
                          <a
                            href={`tel:${c.phone}`}
                            className="p-2 rounded-lg hover:bg-surface-alt text-text-secondary"
                            title="Ligar"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => copyPhone(c.phone!)}
                            className="p-2 rounded-lg hover:bg-surface-alt text-xs text-primary"
                          >
                            Copiar
                          </button>
                        </>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="p-2 rounded-lg hover:bg-surface-alt text-text-secondary"
                          title="E-mail"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </OutrosPageShell>
  )
}
