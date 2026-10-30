export const THEME_STORAGE_KEY = "clinichub_theme"
const THEME_DEFAULT_FLAG = "clinichub_theme_default"

export type Theme = "light" | "dark"

export const DEFAULT_THEME: Theme = "dark"

export function getStoredTheme(): Theme | null {
  const v = localStorage.getItem(THEME_STORAGE_KEY)
  return v === "light" || v === "dark" ? v : null
}

/** O claro gravado antes era forçado. A primeira abertura depois disso volta para o escuro. */
function migrateDefaultTheme() {
  if (localStorage.getItem(THEME_DEFAULT_FLAG) === "dark") return
  localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME)
  localStorage.setItem(THEME_DEFAULT_FLAG, "dark")
}

export function resolveTheme(): Theme {
  migrateDefaultTheme()
  return getStoredTheme() ?? DEFAULT_THEME
}

let forcedLightCount = 0

export function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement
  const next: Theme = forcedLightCount > 0 ? "light" : theme
  root.classList.toggle("dark", next === "dark")
  root.style.colorScheme = next
}

/** Landing e páginas públicas travam o claro. O init do app não pode recolocar o escuro por cima. */
export function pushForcedLightTheme(): () => void {
  forcedLightCount += 1
  applyThemeToDocument("light")
  return () => {
    forcedLightCount = Math.max(0, forcedLightCount - 1)
    applyThemeToDocument(resolveTheme())
  }
}

export function applyTheme(theme: Theme) {
  applyThemeToDocument(theme)
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  localStorage.setItem(THEME_DEFAULT_FLAG, "dark")
}

export function initTheme() {
  if (forcedLightCount > 0) {
    applyThemeToDocument("light")
    return
  }
  applyTheme(resolveTheme())
}

export function toggleTheme(current: Theme): Theme {
  const next: Theme = current === "dark" ? "light" : "dark"
  applyTheme(next)
  return next
}
