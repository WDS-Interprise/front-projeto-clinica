import { Link } from "react-router-dom"
import { Lock } from "lucide-react"
import type { PlanFeature } from "@/lib/plan-features"
import { PLAN_FEATURE_LABELS } from "@/lib/plan-features"
import { usePlanFeatures } from "@/context/PlanFeatureContext"
import { Card, CardContent } from "@/components/ui/card"

export default function PlanFeatureRoute({
  feature,
  children,
}: {
  feature: PlanFeature
  children: React.ReactNode
}) {
  const { hasFeature, loading, isActive } = usePlanFeatures()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-text-secondary text-sm">
        Carregando...
      </div>
    )
  }

  if (!hasFeature(feature)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-text">
              {isActive ? "Recurso não incluído no plano" : "Pagamento necessário"}
            </h1>
            <p className="text-sm text-text-secondary">
              {isActive
                ? `${PLAN_FEATURE_LABELS[feature]} não faz parte do plano atual da sua clínica.`
                : "Pague o plano da clínica para liberar agenda, pacientes e os demais recursos."}
            </p>
            <Link
              to="/configuracoes/plano"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
            >
              {isActive ? "Ver planos" : "Pagar agora"}
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
