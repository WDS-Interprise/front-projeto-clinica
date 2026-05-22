import { useEffect, useState } from "react"
import { CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import AgendaScheduleCard from "@/components/settings/AgendaScheduleCard"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/services/api"
import { DEFAULT_AGENDA_SCHEDULE, parseAgendaSchedule, type AgendaSchedule } from "@/lib/agenda-schedule"

export default function AgendaConfigPage() {
  const { toast } = useToast()
  const { hasPermission, clinicId } = useAuth()
  const canManage = hasPermission("clinics:manage")
  const [loading, setLoading] = useState(true)
  const [clinicIdState, setClinicIdState] = useState("")
  const [agenda, setAgenda] = useState<AgendaSchedule>(DEFAULT_AGENDA_SCHEDULE)

  useEffect(() => {
    const applyClinic = (c: { id: string } & Partial<AgendaSchedule>) => {
      setClinicIdState(c.id)
      setAgenda(parseAgendaSchedule(c))
    }

    const loadId = clinicId
    if (!loadId) {
      api.clinics
        .list()
        .then((list) => {
          if (list[0]) applyClinic(list[0])
        })
        .finally(() => setLoading(false))
      return
    }
    api.clinics
      .getById(loadId)
      .then(applyClinic)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [clinicId])

  const handleSave = async () => {
    if (!canManage || !clinicIdState) {
      toast("Sem permissão para alterar horários", "error")
      return
    }
    try {
      await api.clinics.update(clinicIdState, agenda)
      toast("Horários da agenda salvos!")
    } catch (err: any) {
      toast(err.message || "Erro ao salvar", "error")
    }
  }

  if (loading) {
    return (
      <SettingsLayout className="max-w-2xl">
        <p className="text-text-secondary">Carregando...</p>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout className="max-w-2xl">
      <SettingsPageHeader
        icon={<CalendarClock className="w-7 h-7 text-primary" />}
        title="Horários da agenda"
        description="Configure o expediente, intervalo de almoço e duração dos slots exibidos na agenda."
      />

      <AgendaScheduleCard value={agenda} onChange={setAgenda} readOnly={!canManage} />

      {canManage ? (
        <Button onClick={handleSave}>Salvar alterações</Button>
      ) : (
        <p className="text-sm text-text-secondary">
          Visualização apenas. Alterações requerem perfil administrador.
        </p>
      )}
    </SettingsLayout>
  )
}
