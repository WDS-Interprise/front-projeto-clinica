import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/ThemeContext"
import type { Theme } from "@/lib/theme"

const options: { value: Theme; label: string; description: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Claro", description: "Fundo claro e alto contraste", Icon: Sun },
  { value: "dark", label: "Escuro", description: "Reduz brilho em ambientes com pouca luz", Icon: Moon },
]

export default function ThemeAppearanceCard() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Aparência</h2>
        <p className="text-sm text-text-secondary mt-1">
          Escolha o tema da interface. A preferência é salva neste navegador.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map(({ value, label, description, Icon }) => {
          const active = theme === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                active
                  ? "border-primary bg-primary-light/40 ring-1 ring-primary/30"
                  : "border-border bg-surface-alt hover:border-primary/30 hover:bg-surface"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  active ? "bg-primary text-white" : "bg-surface border border-border text-text-secondary"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-medium text-text">{label}</span>
                <span className="block text-xs text-text-secondary mt-0.5">{description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
