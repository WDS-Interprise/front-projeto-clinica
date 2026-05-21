export type TemplateVars = {
  nome?: string
  data?: string
  hora?: string
  medico?: string
  clinica?: string
  procedimento?: string
}

export function renderMessageTemplate(body: string, vars: TemplateVars): string {
  const map: Record<string, string> = {
    nome: vars.nome ?? "",
    data: vars.data ?? "",
    hora: vars.hora ?? "",
    medico: vars.medico ?? "",
    clinica: vars.clinica ?? "",
    procedimento: vars.procedimento ?? "",
  }
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => map[key] ?? "")
}
