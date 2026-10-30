import { useEffect } from "react"
import { pushForcedLightTheme } from "@/lib/theme"

/** Força light na página atual e restaura a preferência salva ao desmontar. */
export function useForceLightTheme() {
  useEffect(() => pushForcedLightTheme(), [])
}
