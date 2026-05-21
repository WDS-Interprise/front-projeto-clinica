import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            active === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
