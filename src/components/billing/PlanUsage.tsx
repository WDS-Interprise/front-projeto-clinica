import { PLAN_FEATURE_LABELS, PLAN_LIMIT_LABELS, type PlanFeature, type PlanLimitKey, type PlanUsageItem } from "@/lib/plan-features"
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
          <li key={feature} className="flex items-center gap-2 text-sm">
            <span className={cn("font-semibold", ok ? "text-[#006B4D]" : "text-[#8A9A90]")}>{ok ? "✓" : "○"}</span>
            <span className={ok ? "text-[#12261E]" : "text-[#6B7C74]"}>{PLAN_FEATURE_LABELS[feature]}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function PlanLimitProgress({ item }: { item: PlanUsageItem }) {
  const label = PLAN_LIMIT_LABELS[item.key as PlanLimitKey] ?? item.key
  if (item.max == null) {
    return (
      <div>
        <div className="flex justify-between text-sm">
          <span className="text-[#12261E]">{label}</span>
          <span className="text-[#6B7C74]">{item.current} (ilimitado)</span>
        </div>
      </div>
    )
  }

  const pct = item.max > 0 ? Math.min(100, Math.round((item.current / item.max) * 100)) : 0
  const warn = pct >= 90

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-[#12261E]">{label}</span>
        <span className={cn("text-[#6B7C74]", warn && "text-amber-700 font-medium")}>
          {item.current} de {item.max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#EEF2EF]">
        <div
          className={cn("h-full rounded-full transition-all", warn ? "bg-amber-500" : "bg-[#006B4D]")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function PlanUsagePanel({ usage }: { usage: PlanUsageItem[] }) {
  const visible = usage.filter((u) => u.max !== 0)
  if (visible.length === 0) return null
  return (
    <div className="space-y-4">
      {visible.map((item) => (
        <PlanLimitProgress key={item.key} item={item} />
      ))}
    </div>
  )
}
