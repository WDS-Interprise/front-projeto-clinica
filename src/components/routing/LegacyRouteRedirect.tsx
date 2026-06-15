import { Navigate, useLocation } from "react-router-dom"

const LEGACY_MAP: Record<string, string> = {
  "/financas": "/gestao/financas",
  "/finance": "/gestao/financas",
  "/relatorios": "/gestao/relatorios",
  "/reports": "/gestao/relatorios",
  "/prontuarios": "/pacientes",
  "/medical-records": "/pacientes",
  "/configuracoes": "/configuracoes/clinicas",
}

const PREFIX_MAP: Array<{ from: string; to: string }> = [
  { from: "/financas/", to: "/gestao/financas/" },
  { from: "/relatorios/", to: "/gestao/relatorios/" },
]

export default function LegacyRouteRedirect() {
  const { pathname, search, hash } = useLocation()

  for (const { from, to } of PREFIX_MAP) {
    if (pathname.startsWith(from)) {
      return <Navigate to={`${to}${pathname.slice(from.length)}${search}${hash}`} replace />
    }
  }

  const target = LEGACY_MAP[pathname]
  if (target) {
    return <Navigate to={`${target}${search}${hash}`} replace />
  }

  return <Navigate to="/dashboard" replace />
}
