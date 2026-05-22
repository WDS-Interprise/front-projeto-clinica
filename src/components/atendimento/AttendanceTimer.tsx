import { cn } from "@/lib/utils"

type Props = {
  elapsed: string
  compact?: boolean
  className?: string
}

function parseElapsed(elapsed: string) {
  const [h = "00", m = "00", s = "00"] = elapsed.split(":")
  return { h, m, s }
}

export function AttendanceTimer({ elapsed, compact = false, className }: Props) {
  const { h, m, s } = parseElapsed(elapsed)

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full border border-border bg-surface px-3.5 py-1.5 shadow-sm",
          className
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-sm font-medium tabular-nums tracking-tight text-text">
          {h}:{m}:{s}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          Em atendimento
        </span>
      </div>

      <div className="flex items-end justify-center gap-1">
        <TimeUnit value={h} label="h" />
        <span className="pb-4 text-lg font-light text-text-secondary/50">:</span>
        <TimeUnit value={m} label="min" />
        <span className="pb-4 text-lg font-light text-text-secondary/50">:</span>
        <TimeUnit value={s} label="seg" />
      </div>
    </div>
  )
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[2.75rem]">
      <span className="text-3xl font-semibold tabular-nums leading-none text-text tracking-tight">
        {value}
      </span>
      <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-text-secondary">
        {label}
      </span>
    </div>
  )
}
