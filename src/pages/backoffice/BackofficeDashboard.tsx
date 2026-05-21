import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Users,
  Calendar,
  Stethoscope,
  FileText,
  UserCog,
  Activity,
  Clock,
  RefreshCw,
  Building2,
  AlertCircle,
} from "lucide-react"
import { backofficeApi, type BackofficeMetrics } from "@/services/backoffice-api"
import { Badge } from "@/components/ui/badge"

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administradores",
  DOCTOR: "Médicos",
  RECEPTION: "Recepção",
}

export default function BackofficeDashboard() {
  const [metrics, setMetrics] = useState<BackofficeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await backofficeApi.metrics()
      setMetrics(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar métricas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const o = metrics?.overview

  const statCards = [
    { label: "Pacientes", value: o?.totalPatients, icon: Users, color: "text-sky-400 bg-sky-500/10" },
    { label: "Consultas hoje", value: o?.appointmentsToday, icon: Calendar, color: "text-emerald-400 bg-emerald-500/10" },
    { label: "Total consultas", value: o?.totalAppointments, icon: Activity, color: "text-amber-400 bg-amber-500/10" },
    { label: "Médicos ativos", value: o?.doctorsAvailable, icon: Stethoscope, color: "text-violet-400 bg-violet-500/10" },
    { label: "Total médicos", value: o?.totalDoctors, icon: Stethoscope, color: "text-indigo-400 bg-indigo-500/10" },
    { label: "Prontuários", value: o?.totalRecords, icon: FileText, color: "text-rose-400 bg-rose-500/10" },
    { label: "Usuários do sistema", value: o?.totalUsers, icon: UserCog, color: "text-orange-400 bg-orange-500/10" },
  ]

  const formatPhone = (phone: string) =>
    phone?.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Métricas do site principal</h1>
          <p className="text-sm text-text-secondary mt-1">
            Visão consolidada do ClinMax em tempo real
          </p>
          {metrics?.generatedAt && (
            <p className="text-xs text-text-secondary mt-2">
              Atualizado: {new Date(metrics.generatedAt).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-alt text-text-secondary hover:text-text hover:bg-surface text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-300 bg-red-950/50 border border-red-900 px-4 py-4 rounded-lg space-y-2">
          <p className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </p>
          <ul className="text-xs text-red-200/90 list-disc pl-5 space-y-1">
            <li>Backend rodando: <code className="bg-red-900/50 px-1 rounded">cd back-projeto-clinica && npm run dev</code></li>
            <li>Login backoffice: <strong>admin@clinicare.com</strong> / <strong>admin123</strong></li>
            <li>Os dados são os mesmos do CRM (banco SQLite <code className="bg-red-900/50 px-1 rounded">prisma/dev.db</code>)</li>
          </ul>
        </div>
      )}

      {!error && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/backoffice/clinicas"
            className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-amber-500/40 transition-colors"
          >
            <Building2 className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-text">Clínicas</p>
              <p className="text-xs text-text-secondary">Cadastro e status das clínicas</p>
            </div>
          </Link>
          <Link
            to="/backoffice/usuarios"
            className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-amber-500/40 transition-colors"
          >
            <UserCog className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-text">Usuários</p>
              <p className="text-xs text-text-secondary">{o?.totalUsers ?? 0} no sistema</p>
            </div>
          </Link>
          <Link
            to="/backoffice/pacientes"
            className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-amber-500/40 transition-colors"
          >
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-text">Pacientes</p>
              <p className="text-xs text-text-secondary">{o?.totalPatients ?? 0} cadastrados</p>
            </div>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary">{label}</p>
                <p className="text-2xl font-bold text-text mt-1">
                  {loading ? "—" : (value ?? "—")}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Consultas por status</h2>
          {!metrics?.appointmentsByStatus?.length ? (
            <p className="text-sm text-text-secondary py-4 text-center">Sem dados</p>
          ) : (
            <ul className="space-y-3">
              {metrics.appointmentsByStatus.map((item) => (
                <li
                  key={item.status}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm text-text-secondary">
                    {statusLabels[item.status] || item.status}
                  </span>
                  <span className="text-sm font-bold text-amber-400">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Usuários por perfil</h2>
          {!metrics?.usersByRole?.length ? (
            <p className="text-sm text-text-secondary py-4 text-center">Sem dados</p>
          ) : (
            <ul className="space-y-3">
              {metrics.usersByRole.map((item) => (
                <li
                  key={item.role}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm text-text-secondary">
                    {roleLabels[item.role] || item.role}
                  </span>
                  <span className="text-sm font-bold text-amber-400">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            Próximas consultas
          </h2>
          {!metrics?.upcomingAppointments?.length ? (
            <p className="text-sm text-text-secondary py-8 text-center">Nenhuma consulta agendada</p>
          ) : (
            <div className="space-y-3">
              {metrics.upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-surface-alt/50"
                >
                  <div className="text-sm font-mono font-medium text-amber-400 w-12">
                    {apt.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{apt.patient.name}</p>
                    <p className="text-xs text-text-secondary">
                      {apt.doctor.name} — {apt.doctor.specialty}
                    </p>
                  </div>
                  <Badge status={apt.status.toLowerCase() as "scheduled"} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-amber-400" />
            Últimos pacientes cadastrados
          </h2>
          {!metrics?.recentPatients?.length ? (
            <p className="text-sm text-text-secondary py-8 text-center">Nenhum paciente</p>
          ) : (
            <div className="space-y-3">
              {metrics.recentPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-surface-alt/50"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-text text-xs font-bold shrink-0">
                    {patient.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{patient.name}</p>
                    <p className="text-xs text-text-secondary">{formatPhone(patient.phone)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
