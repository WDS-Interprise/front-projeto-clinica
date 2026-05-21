import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building, Clock, Shield, Bell } from "lucide-react"

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Configurações</h1>
        <p className="text-sm text-text-secondary mt-1">Gerencie as configurações da clínica</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              Dados da Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input id="clinic-name" label="Nome da Clínica" defaultValue="CliniCare Centro Médico" />
            <Input id="clinic-cnpj" label="CNPJ" defaultValue="00.000.000/0001-00" />
            <Input id="clinic-phone" label="Telefone" defaultValue="(11) 3000-0000" />
            <Input id="clinic-email" label="E-mail" defaultValue="contato@clinicare.com" />
            <Input id="clinic-address" label="Endereço" defaultValue="Av. Paulista, 1000, São Paulo - SP" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Horários de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"].map((day) => (
              <div key={day} className="flex items-center justify-between py-1">
                <span className="text-sm text-text">{day}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    defaultValue="08:00"
                    className="h-8 w-24 rounded-lg border border-border bg-surface px-2 text-sm text-text focus:outline-none focus:border-primary"
                  />
                  <span className="text-xs text-text-secondary">até</span>
                  <input
                    type="time"
                    defaultValue={day === "Sábado" ? "13:00" : "18:00"}
                    className="h-8 w-24 rounded-lg border border-border bg-surface px-2 text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input id="current-password" label="Senha Atual" type="password" />
            <Input id="new-password" label="Nova Senha" type="password" />
            <Input id="confirm-password" label="Confirmar Senha" type="password" />
            <Button variant="secondary">Alterar Senha</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Lembrete de consultas", desc: "Notificar 24h antes da consulta" },
              { label: "Novos pacientes", desc: "Ao cadastrar um novo paciente" },
              { label: "Resultados de exames", desc: "Quando resultados forem liberados" },
              { label: "Relatórios semanais", desc: "Resumo de atividades da semana" },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text">{label}</p>
                  <p className="text-xs text-text-secondary">{desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary">Cancelar</Button>
        <Button>Salvar Configurações</Button>
      </div>
    </div>
  )
}
