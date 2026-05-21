import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import type { Permission } from "@/lib/permissions"

export default function PermissionRoute({
  permission,
  children,
  fallback = "/agenda",
}: {
  permission: Permission
  children: React.ReactNode
  fallback?: string
}) {
  const { loading, hasPermission } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-text-secondary">
        Carregando...
      </div>
    )
  }

  if (!hasPermission(permission)) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
