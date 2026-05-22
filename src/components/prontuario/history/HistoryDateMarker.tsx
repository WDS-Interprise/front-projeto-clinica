type Props = {
  day: number
  month: string
  year: number
  primary?: boolean
}

export function HistoryDateMarker({ day, month, year, primary = true }: Props) {
  return (
    <div
      className={`shrink-0 w-12 text-center rounded-sm py-2 ${
        primary
          ? "bg-primary text-white"
          : "bg-surface-alt text-text-secondary border border-border"
      }`}
    >
      <div className="text-lg font-bold leading-none">{day}</div>
      <div className="text-[10px] font-semibold tracking-wide mt-1">{month}</div>
      <div className="text-[10px] opacity-80 mt-0.5">{year}</div>
    </div>
  )
}
