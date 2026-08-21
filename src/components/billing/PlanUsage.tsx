import { PLAN_FEATURE_LABELS, PLAN_LIMIT_LABELS, PLAN_LIMIT_USAGE_HINT, type PlanFeature, type PlanLimitKey, type PlanUsageItem } from "@/lib/plan-features"
import { cn } from "@/lib/utils"

export function PlanFeatureList({
  included,
  allFeatures,
  className,
}: {
  included: PlanFeature[]
  allFeatures?: PlanFeature[]
  className?: string
}) {
  const catalog = allFeatures ?? (Object.keys(PLAN_FEATURE_LABELS) as PlanFeature[])
  const includedSet = new Set(included)

  return (
    <ul className={cn("space-y-2", className)}>
      {catalog.map((feature) => {
        const ok = includedSet.has(feature)
        return (
          <li key={feature} className="flex items-center justify-between gap-3 text-[13px]">
            <span className={ok ? "text-[#12261E]" : "text-[#6B7C74]"}>{PLAN_FEATURE_LABELS[feature]}</span>
            <span
              className={cn(
                "inline-flex min-w-[2.5rem] justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                ok ? "bg-[#E8F6EE] text-[#006B4D]" : "bg-[#F4F7F5] text-[#8A9A90]"
              )}
            >
              {ok ? "Sim" : "Não"}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function formatUsageLine(item: PlanUsageItem) {
  const hint = PLAN_LIMIT_USAGE_HINT[item.key as PlanLimitKey]
  const label = PLAN_LIMIT_LABELS[item.key as PlanLimitKey] ?? item.key
  if (item.max == null) {
    return { label, line: `${item.current} ${hint?.noun ?? ""}`.trim() }
  }
  if (item.key === "maxStorageMb") {
    return { label, line: `${item.current} de ${item.max} MB utilizados` }
  }
  return { label, line: `${item.current} de ${item.max} ${hint?.noun ?? "utilizados"}` }
}

export function PlanLimitProgress({ item }: { item: PlanUsageItem }) {
  const { label, line } = formatUsageLine(item)
  if (item.max == null) {
    return (
      <div>
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-[#12261E]">{label}</span>
          <span className="text-[#6B7C74]">{line}</span>
        </div>
      </div>
    )
  }

  const over = item.max > 0 && item.current > item.max
  const full = item.max > 0 && item.current >= item.max
  const zeroCap = item.max === 0
  const pct = zeroCap
    ? item.current > 0
      ? 100
      : 0
    : Math.min(100, Math.round((item.current / Math.max(item.max, 1)) * 100))
  const barClass = over || (zeroCap && item.current > 0)
    ? "bg-[#DC2626]"
    : full
      ? "bg-[#EA8A2A]"
      : zeroCap
        ? "bg-[#D5DED8]"
        : "bg-[#006B4D]"
  const textClass = over || (zeroCap && item.current > 0)
    ? "text-[#DC2626] font-medium"
    : full
      ? "text-[#C2410C] font-medium"
      : "text-[#6B7C74]"

  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-[13px]">
        <span className="text-[#12261E]">{label}</span>
        <span className={textClass}>{line}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF2EF]">
        <div className={cn("h-full rounded-full transition-all", barClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function PlanUsagePanel({ usage }: { usage: PlanUsageItem[] }) {
  if (usage.length === 0) return null
  return (
    <div className="space-y-4">
      {usage.map((item) => (
        <PlanLimitProgress key={item.key} item={item} />
      ))}
    </div>
  )
}
