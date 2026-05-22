export type NotificationType = "appointment" | "payment" | "message" | "system" | "warning"

export type Notification = {
  id: string
  type: NotificationType
  title: string
  description: string
  createdAt: string
  read: boolean
  href?: string
}
