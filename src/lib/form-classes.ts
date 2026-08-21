/** Classes compartilhadas para campos. respeitam tema claro/escuro via tokens. */
export const fieldLabelClass = "block text-sm font-medium text-text"

const fieldControlBaseClass =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"

/** Inputs de texto, e-mail, senha, etc. */
export const fieldInputClass = `block ${fieldControlBaseClass}`

/** Botões/selects customizados que precisam alinhar ícone + texto */
export const fieldTriggerClass = `flex items-center ${fieldControlBaseClass}`

/** Select nativo (herda seta customizada do CSS global) */
export const fieldSelectClass = `block cursor-pointer ${fieldControlBaseClass} pr-10`

export const fieldInputWithIconClass = `${fieldInputClass} pr-10`

export const iconButtonMutedClass =
  "text-text-secondary hover:text-text transition-colors"
