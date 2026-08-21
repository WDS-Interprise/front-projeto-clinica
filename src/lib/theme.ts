export const THEME_STORAGE_KEY = "clinichub_theme"

export type Theme = "light" | "dark"

export function getStoredTheme(): Theme | null {
  const v = localStorage.getItem(THEME_STORAGE_KEY)
  return v === "light" || v === "dark" ? v : null
}

export function resolveTheme(): Theme {
  return "light"
}

export function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
}

export function applyTheme(_theme: Theme) {
  applyThemeToDocument("light")
  localStorage.setItem(THEME_STORAGE_KEY, "light")
}

export function initTheme() {
  applyTheme("light")
}

export function toggleTheme(_current: Theme): Theme {
  applyTheme("light")
  return "light"
}
