import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-border/80", className)}
      aria-hidden
    />
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}
