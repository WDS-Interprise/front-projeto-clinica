import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Mail, Phone, Stethoscope, CalendarCheck } from "lucide-react"
import { api } from "@/services/api"
import type { Doctor } from "@/types"

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])

  useEffect(() => {
    api.doctors.list().then(setDoctors)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Médicos</h1>
          <p className="text-sm text-text-secondary mt-1">Corpo clínico da instituição</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Médico
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <Card key={doctor.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                    {doctor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">{doctor.name}</h3>
                    <p className="text-xs text-text-secondary">{doctor.specialty}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  doctor.available ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    doctor.available ? "bg-green-500" : "bg-red-500"
                  }`} />
                  {doctor.available ? "Disponível" : "Indisponível"}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>CRM {doctor.crm}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{doctor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{doctor.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Disponível seg-sex</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
