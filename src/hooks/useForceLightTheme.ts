import { useEffect } from "react"
import { applyThemeToDocument, resolveTheme } from "@/lib/theme"

/** Força light na página atual e restaura a preferência salva ao desmontar. */
export function useForceLightTheme() {
  useEffect(() => {
    applyThemeToDocument("light")

    return () => {
      applyThemeToDocument(resolveTheme())
    }
  }, [])
}
