import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { OutrosPageShell } from "@/components/outros/OutrosPageShell"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

export default function LogsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [module, setModule] = useState("")
  const [logs, setLogs] = useState<
    Array<{ id: string; module: string; action: string; description: string; createdAt: string }>
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      api.outros
        .logs({ search: search || undefined, module: module || undefined })
        .then((res) => setLogs(res.data))
        .catch((err: unknown) => toast(toastMessageFromApiError(err, "Erro ao carregar logs"), "error"))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [search, module, toast])

  return (
    <OutrosPageShell title="Logs" description="Auditoria de ações no sistema (somente administradores).">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar na descrição..."
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-sm"
          />
        </div>
        <select
          value={module}
          onChange={(e) => setModule(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="">Todos os módulos</option>
          <option value="Bulas">Bulas</option>
          <option value="CID10">CID 10</option>
          <option value="Atendimento">Atendimento</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Data/hora</th>
              <th className="text-left p-3">Módulo</th>
              <th className="text-left p-3">Ação</th>
              <th className="text-left p-3">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-text-secondary">
                  Carregando...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-text-secondary">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-border">
                  <td className="p-3 text-text-secondary whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3">{log.module}</td>
                  <td className="p-3 font-mono text-xs">{log.action}</td>
                  <td className="p-3 text-text-secondary">{log.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </OutrosPageShell>
  )
}
