export const THEME_STORAGE_KEY = "clinichub_theme"

export type Theme = "light" | "dark"

export function getStoredTheme(): Theme | null {
  const v = localStorage.getItem(THEME_STORAGE_KEY)
  return v === "light" || v === "dark" ? v : null
}

export function resolveTheme(): Theme {
  return getStoredTheme() ?? "light"
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function initTheme() {
  applyTheme(resolveTheme())
}

export function toggleTheme(current: Theme): Theme {
  const next: Theme = current === "light" ? "dark" : "light"
  applyTheme(next)
  return next
}
