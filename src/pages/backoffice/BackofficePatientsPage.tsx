import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { backofficeApi, type BackofficeClinic } from "@/services/backoffice-api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

export default function BackofficePatientsPage() {
  const { toast } = useToast()
  const [patients, setPatients] = useState<any[]>([])
  const [clinics, setClinics] = useState<BackofficeClinic[]>([])
  const [clinicId, setClinicId] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    backofficeApi.clinics
      .list()
      .then(setClinics)
      .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar clínicas"), "error"))
  }, [toast])

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      backofficeApi.patients
        .list({ clinicId: clinicId || undefined, search: search || undefined })
        .then((r) => {
          setPatients(r.data)
          setTotal(r.total)
        })
        .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar pacientes"), "error"))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [clinicId, search, toast])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Pacientes</h1>
        <p className="text-sm text-text-secondary mt-1">
          Visão global ({total} cadastros) — somente leitura
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            placeholder="Buscar paciente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface border border-border text-sm text-text"
          />
        </div>
        <select
          value={clinicId}
          onChange={(e) => setClinicId(e.target.value)}
          className="h-10 rounded-lg bg-surface border border-border px-3 text-sm text-text min-w-[180px]"
        >
          <option value="">Todas clínicas</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Telefone</th>
              <th className="text-left p-3">Convênio</th>
              <th className="text-left p-3">Clínica</th>
              <th className="text-left p-3">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">
                  Carregando...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">
                  Nenhum paciente
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="border-t border-border text-text-secondary">
                  <td className="p-3 font-medium text-text">{p.name}</td>
                  <td className="p-3">{p.phone}</td>
                  <td className="p-3">{p.insurancePlan ?? "—"}</td>
                  <td className="p-3">{p.clinic?.name ?? "—"}</td>
                  <td className="p-3 text-xs">
                    {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
