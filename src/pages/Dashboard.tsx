import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Calendar,
  Stethoscope,
  DollarSign,
  Clock,
} from "lucide-react"
import { api } from "@/services/api"

interface DashboardStats {
  totalPatients: number
  totalAppointments: number
  appointmentsToday: number
  doctorsAvailable: number
}

interface UpcomingAppointment {
  id: string
  date: string
  time: string
  status: string
  patient: { id: string; name: string }
  doctor: { id: string; name: string; specialty: string }
}

interface RecentPatient {
  id: string
  name: string
  phone: string
  createdAt: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>([])
  const [recent, setRecent] = useState<RecentPatient[]>([])

  useEffect(() => {
    api.dashboard.stats().then(setStats)
    api.dashboard.upcoming().then(setUpcoming)
    api.dashboard.recentPatients().then(setRecent)
  }, [])

  const statCards = [
    { label: "Total de Pacientes", value: stats?.totalPatients ?? "—", icon: Users, color: "text-primary bg-primary-light" },
    { label: "Consultas Hoje", value: stats?.appointmentsToday ?? "—", icon: Calendar, color: "text-accent bg-green-50" },
    { label: "Médicos Ativos", value: stats?.doctorsAvailable ?? "—", icon: Stethoscope, color: "text-secondary bg-indigo-50" },
    { label: "Total de Consultas", value: stats?.totalAppointments ?? "—", icon: DollarSign, color: "text-warning bg-yellow-50" },
  ]

  const formatPhone = (phone: string) =>
    phone?.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Visão geral da clínica
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary">{label}</p>
                  <p className="text-2xl font-bold text-text">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Próximas Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-text-secondary py-8 text-center">
                Nenhuma consulta agendada
              </p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-alt transition-colors"
                  >
                    <div className="text-sm font-mono font-medium text-primary w-12">
                      {apt.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {apt.patient.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {apt.doctor.name} — {apt.doctor.specialty}
                      </p>
                    </div>
                    <Badge status={apt.status as any} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Últimos Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-text-secondary py-8 text-center">
                Nenhum paciente cadastrado
              </p>
            ) : (
              <div className="space-y-3">
                {recent.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-alt transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {patient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {patient.name}
                      </p>
                      <p className="text-xs text-text-secondary">{formatPhone(patient.phone)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
