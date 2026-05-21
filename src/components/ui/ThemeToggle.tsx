import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/ThemeContext"

type Props = {
  className?: string
  /** Variante compacta só com ícone (navbar principal). */
  compact?: boolean
}

export default function ThemeToggle({ className, compact = false }: Props) {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
        "border-border bg-surface-alt text-text-secondary",
        "hover:text-text hover:bg-surface hover:border-primary/30",
        compact ? "p-2" : "px-3 py-1.5 text-xs",
        className
      )}
    >
      {isDark ? (
        <Moon className={cn("text-primary", compact ? "w-4 h-4" : "w-3.5 h-3.5")} />
      ) : (
        <Sun className={cn("text-warning", compact ? "w-4 h-4" : "w-3.5 h-3.5")} />
      )}
      {!compact && (
        <span className="hidden sm:inline">{theme === "dark" ? "Escuro" : "Claro"}</span>
      )}
    </button>
  )
}
