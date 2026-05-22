import type { Notification } from "@/types/notification"

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "appointment",
    title: "Nova consulta agendada",
    description: "Paciente Ana Paula marcou consulta para hoje às 14:30.",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    href: "/agenda",
  },
  {
    id: "n2",
    type: "payment",
    title: "Pagamento confirmado",
    description: "O pagamento da consulta de João Silva foi aprovado.",
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    read: false,
    href: "/agenda",
  },
  {
    id: "n3",
    type: "message",
    title: "Nova mensagem de paciente",
    description: "Lara enviou uma mensagem pelo WhatsApp.",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: false,
    href: "/mensagens",
  },
  {
    id: "n4",
    type: "appointment",
    title: "Horário alterado",
    description: "Consulta de Marcos Lima foi remarcada para amanhã às 09:00.",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true,
    href: "/agenda",
  },
  {
    id: "n5",
    type: "system",
    title: "Atualização do sistema",
    description: "Novas melhorias foram aplicadas ao painel.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
]

export const NOTIFICATIONS_READ_STATE_KEY = "clinic_notifications_read_state"
