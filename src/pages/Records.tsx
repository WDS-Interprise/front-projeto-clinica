import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Search } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { api } from "@/services/api"
import type { MedicalRecord } from "@/types"

export default function Records() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    api.records.list().then((res) => {
      setRecords(res.data)
    })
  }, [])

  const filtered = search
    ? records.filter(
        (r) =>
          r.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
          r.doctor.name.toLowerCase().includes(search.toLowerCase()) ||
          r.patient.name.toLowerCase().includes(search.toLowerCase())
      )
    : records

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Prontuários</h1>
        <p className="text-sm text-text-secondary mt-1">Histórico médico dos pacientes</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          placeholder="Buscar por paciente, médico ou diagnóstico..."
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((record) => (
          <Card key={record.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">
                        {record.patient.name} • {record.doctor.name}
                      </p>
                      <p className="text-sm font-medium text-text">
                        {record.diagnosis}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {formatDate(record.date, { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-1">Prescrição</p>
                      <p className="text-text">{record.prescription}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-1">Observações</p>
                      <p className="text-text-secondary">{record.notes || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
