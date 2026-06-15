import { Link, useLocation } from "react-router-dom"
import { Construction } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ModuleUnavailablePage() {
  const location = useLocation()

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <Construction className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-text">Página não encontrada</h1>
          <p className="text-sm text-text-secondary">
            A rota <code className="rounded bg-surface-alt px-1.5 py-0.5 text-xs">{location.pathname}</code>{" "}
            não existe ou ainda não foi configurada nesta versão do ClinMax.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-surface-alt px-4 text-sm font-medium text-text hover:bg-surface"
            >
              Ir ao painel
            </Link>
            <Link
              to="/agenda"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Abrir agenda
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
