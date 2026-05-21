import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Mail, Phone, MoreHorizontal } from "lucide-react"
import { formatPhone, formatCPF, formatDate } from "@/lib/utils"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import PatientFormModal from "@/components/patients/PatientFormModal"
import type { Patient } from "@/types"

export default function Patients() {
  const location = useLocation()
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [formOpen, setFormOpen] = useState(false)

  const load = () => {
    api.patients.list({ search: search || undefined }).then((res) => {
      setPatients(res.data)
    })
  }

  useEffect(() => {
    load()
  }, [search])

  useEffect(() => {
    const state = location.state as { openNewPatient?: boolean } | null
    if (state?.openNewPatient) {
      setFormOpen(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Pacientes</h1>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie o cadastro de pacientes
          </p>
        </div>
        {hasPermission("patients:create") && (
          <Button className="gap-2" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4" />
            Novo Paciente
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou CPF..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">Paciente</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">CPF</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">Contato</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">Convênio</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">Status</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-border hover:bg-surface-alt transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                          {patient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-text">{patient.name}</p>
                          <p className="text-xs text-text-secondary">
                            {formatDate(patient.birthDate, { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {formatCPF(patient.cpf)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {patient.email && (
                          <div className="flex items-center gap-1 text-text-secondary">
                            <Mail className="w-3 h-3" />
                            <span className="text-xs">{patient.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-text-secondary">
                          <Phone className="w-3 h-3" />
                          <span className="text-xs">{formatPhone(patient.phone)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {patient.insurancePlan ?? "Particular"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${patient.active !== false ? "text-green-700" : "text-text-secondary"}`}>
                        {patient.active !== false ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="p-1 rounded hover:bg-surface-alt text-text-secondary hover:text-text transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <PatientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  )
}
