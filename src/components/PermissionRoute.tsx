import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { defaultHomePath, type Permission } from "@/lib/permissions"

export default function PermissionRoute({
  permission,
  children,
  fallback,
}: {
  permission: Permission
  children: React.ReactNode
  fallback?: string
}) {
  const { loading, hasPermission, user } = useAuth()
  const home = fallback ?? defaultHomePath(user?.role)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-text-secondary">
        Carregando...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!hasPermission(permission)) {
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}
