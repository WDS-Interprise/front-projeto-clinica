import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { OutrosPageShell } from "@/components/outros/OutrosPageShell"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

type LogRow = {
  id: string
  module: string
  action: string
  description: string
  createdAt: string
  userId: string | null
}

export default function LogsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [module, setModule] = useState("")
  const [logs, setLogs] = useState<LogRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      api.outros
        .logs({ search: search || undefined, module: module || undefined })
        .then((res) => {
          setLogs(res.data)
          setTotal(res.total)
        })
        .catch((err: unknown) => toast(toastMessageFromApiError(err, "Erro ao carregar logs"), "error"))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [search, module, toast])

  const exportCsv = () => {
    const header = "Data,Modulo,Acao,Descricao"
    const rows = logs.map((log) =>
      [
        new Date(log.createdAt).toLocaleString("pt-BR"),
        log.module,
        log.action,
        log.description.replace(/"/g, "'"),
      ]
        .map((cell) => `"${cell}"`)
        .join(",")
    )
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "auditoria-clinmax.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast("Arquivo de auditoria exportado.")
  }

  return (
    <OutrosPageShell title="Logs" description="Auditoria de ações no sistema (somente administradores).">
      <div className="flex flex-wrap items-end gap-3">
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
          <option value="Prescricoes">Prescrições</option>
          <option value="Atendimento">Atendimento</option>
          <option value="Bulas">Bulas</option>
          <option value="CID10">CID 10</option>
        </select>
        <Button type="button" variant="outline" size="sm" onClick={exportCsv} disabled={logs.length === 0}>
          Exportar CSV
        </Button>
      </div>

      <p className="text-xs text-text-secondary">{total} registro(s) nesta busca.</p>

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
