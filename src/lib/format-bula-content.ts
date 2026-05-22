export type ContentBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }

const HEADING_PATTERNS: RegExp[] = [
  /^indica(?:ç|c)(?:ã|a)o(?:es)?$/i,
  /^contraindica(?:ç|c)(?:õ|o)es?$/i,
  /^posologia$/i,
  /^como usar/i,
  /^modo de usar/i,
  /^dura(?:ç|c)(?:ã|a)o(?: do tratamento)?$/i,
  /^dosagem$/i,
  /^farmacocin(?:é|e)tica$/i,
  /^efeitos colaterais$/i,
  /^rea(?:ç|c)(?:õ|o)es adversas$/i,
  /^advert(?:ê|e)ncias/i,
  /^intera(?:ç|c)(?:õ|o)es/i,
  /^superdosagem$/i,
  /^composi(?:ç|c)(?:ã|a)o$/i,
  /^apresenta(?:ç|c)(?:õ|o)es?$/i,
  /^armazenamento$/i,
  /^creme$/i,
  /^solu(?:ç|c)(?:ã|a)o dermatol(?:ó|o)gica$/i,
  /^solu(?:ç|c)(?:ã|a)o oral$/i,
  /^gotas$/i,
  /^xarope$/i,
  /^injet(?:á|a)vel$/i,
  /^suposit(?:ó|o)rio$/i,
  /^comprimido/i,
  /^c(?:á|a)psula/i,
  /^adultos/i,
  /^crian(?:ç|c)as/i,
  /^idosos$/i,
  /^gestantes?$/i,
  /^lactantes?$/i,
  /^casos especiais$/i,
  /^sintomas$/i,
  /^tratamento$/i,
]

const FORM_NAMES_EXACT =
  /^(Creme|Pomada|Gel|Gotas|Xarope|Solu(?:ç|c)(?:ã|a)o dermatol(?:ó|o)gica|Solu(?:ç|c)(?:ã|a)o oral|Solu(?:ç|c)(?:ã|a)o injet(?:á|a)vel|Suposit(?:ó|o)rio|Comprimido)$/i

/** Quebras de parágrafo naturais (indicação e demais seções) */
const PARAGRAPH_START =
  /\s+(?=Isso pode ocorrer|Exclusivo creme:|Adicionalmente|Além disso|Siga corretamente|Em caso de d(?:ú|u)vidas|N(?:ã|a)o use este medicamento|Aten(?:ç|c)(?:ã|a)o:|Importante:)/gi

/** Nova forma farmacêutica só após ponto (ex.: "...semanas. Solução dermatológica Deve-se") */
const FORM_AFTER_PERIOD =
  /\.\s+(?=(?:Solu(?:ç|c)(?:ã|a)o dermatol(?:ó|o)gica|Solu(?:ç|c)(?:ã|a)o oral|Gotas|Xarope|Solu(?:ç|c)(?:ã|a)o injet(?:á|a)vel|Suposit(?:ó|o)rio|Comprimido)\s+Deve-se\b)/gi

const INLINE_SECTION_BREAK =
  /\s+(?=(?:Adultos e|Adultos:|Crian(?:ç|c)as e|Crian(?:ç|c)as:|Idosos|Gestantes|Lactantes|Posologia para casos|Doses maiores)\b)/gi

const INLINE_CONDITION_BREAK =
  /\s+(?=(?:Micoses|Tinea|Infec(?:ç|c)(?:õ|o)es|Dermatite|Herpes|Psoríase|Acne|Candidíase|Onicomicose|Impetigo)\b)/gi

function normalizeLine(line: string) {
  return line.replace(/\s+/g, " ").trim()
}

/** Insere quebras de linha em textos que chegam colados num bloco só */
export function normalizeBulaText(text: string, posology = false): string {
  let t = text.replace(/\r\n/g, "\n").trim()
  const singleBlob = !t.includes("\n")
  if (singleBlob) t = t.replace(/\s+/g, " ")

  t = t.replace(PARAGRAPH_START, "\n\n")
  t = t.replace(/\)\.\s+/g, ").\n\n")

  if (singleBlob || posology) {
    t = t.replace(FORM_AFTER_PERIOD, ".\n\n")
    t = t.replace(INLINE_SECTION_BREAK, "\n\n")
    t = t.replace(/(?:^|\.\s+)(Creme)\s+(Deve-se\b)/gi, ".\n\n$1 $2")
    t = t.replace(/^\.\s+/, "")

    if (posology) {
      t = t.replace(
        /\bIndica(?:ç|c)(?:ã|a)o\s+Como usar\s+Dura(?:ç|c)(?:ã|a)o(?: do tratamento)?\s+/gi,
        "Indicação\nComo usar\nDuração do tratamento\n\n"
      )
      t = t.replace(INLINE_CONDITION_BREAK, "\n")
    }

    if (singleBlob) {
      t = t.replace(/\.\s+(?=[A-ZÁÉÍÓÚÀÃÕÇ0-9(])/g, ".\n\n")
    }
  }

  return t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function isHeadingLine(line: string, posologyMode = false) {
  const t = normalizeLine(line)
  if (!t || t.length > 120) return false
  const withoutColon = t.replace(/:$/, "").trim()
  if (posologyMode && FORM_NAMES_EXACT.test(withoutColon)) return false
  if (HEADING_PATTERNS.some((p) => p.test(withoutColon))) {
    if (posologyMode && /^(creme|pomada|gel|gotas|xarope|solu|injet|suposit|comprimido)/i.test(withoutColon)) {
      return false
    }
    return true
  }
  if (posologyMode && FORM_NAMES_EXACT.test(withoutColon)) return false
  if (t.endsWith(":") && t.length < 80 && !/\bdeve-se\b/i.test(t)) return true
  if (t === t.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÇ]/.test(t) && t.length < 70 && t.split(" ").length <= 6) {
    return true
  }
  return false
}

function isListLine(line: string) {
  return /^(\d+[\.\)]\s|[-•*–—]\s)/.test(line.trim())
}

function splitTableRow(line: string): string[] | null {
  if (line.includes("|")) {
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean)
    return cells.length >= 2 ? cells : null
  }
  const byMultiSpace = line.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean)
  if (byMultiSpace.length >= 3) return byMultiSpace
  return null
}

function isTableHeader(cells: string[]) {
  const joined = cells.join(" ").toLowerCase()
  return (
    (joined.includes("indica") && joined.includes("como usar")) ||
    (joined.includes("indica") && joined.includes("dura")) ||
    (joined.includes("uso") && joined.includes("dose"))
  )
}

function tryParseTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null
  const parsed = lines.map(splitTableRow).filter((r): r is string[] => Boolean(r))
  if (parsed.length < 2) return null
  if (parsed[0].length < 2) return null

  const first = parsed[0]
  if (isTableHeader(first) || first.length >= 3) {
    const headers =
      isTableHeader(first) && first.length >= 2
        ? first
        : ["Indicação", "Como usar", "Duração"].slice(0, first.length)
    const startIdx = isTableHeader(first) ? 1 : 0
    const rows = parsed.slice(startIdx).filter((r) => r.length >= 2)
    if (rows.length > 0) return { headers, rows }
  }
  return null
}

function splitIntoLines(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
}

function splitLongParagraph(text: string, maxLen = 520): string[] {
  const trimmed = normalizeLine(text)
  if (trimmed.length <= maxLen) return [trimmed]

  const sentences = trimmed
    .split(/(?<=[.;!?])\s+(?=[A-ZÁÉÍÓÚÀÃÕÇ0-9(])/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (sentences.length <= 1) return [trimmed]

  const chunks: string[] = []
  let buf = ""
  for (const sentence of sentences) {
    if (buf && (buf + " " + sentence).length > maxLen) {
      chunks.push(buf.trim())
      buf = sentence
    } else {
      buf = buf ? `${buf} ${sentence}` : sentence
    }
  }
  if (buf.trim()) chunks.push(buf.trim())
  return chunks.length > 0 ? chunks : [trimmed]
}

export function parseBulaContent(text: string, options?: { posology?: boolean }): ContentBlock[] {
  const posologyMode = options?.posology ?? false
  const raw = normalizeBulaText(text.trim(), posologyMode)
  if (!raw) return []

  const lines = splitIntoLines(raw)
  const blocks: ContentBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (isHeadingLine(line, posologyMode)) {
      blocks.push({
        type: "heading",
        level: /^(creme|pomada|gel|gotas|xarope|solu|injet|suposit|comprimido)/i.test(line) ? 2 : 3,
        text: line.replace(/:$/, "").trim(),
      })
      i++
      continue
    }

    if (isListLine(line)) {
      const items: string[] = []
      while (i < lines.length && isListLine(lines[i])) {
        items.push(lines[i].replace(/^(\d+[\.\)]\s|[-•*–—]\s)/, "").trim())
        i++
      }
      blocks.push({ type: "list", items })
      continue
    }

    const tableCandidate: string[] = []
    let j = i
    while (j < lines.length) {
      const row = splitTableRow(lines[j])
      if (!row && tableCandidate.length > 0) break
      if (row) {
        tableCandidate.push(lines[j])
        j++
      } else if (tableCandidate.length === 0) {
        break
      } else {
        break
      }
    }

    if (tableCandidate.length >= 2) {
      const table = tryParseTable(tableCandidate)
      if (table) {
        blocks.push({ type: "table", headers: table.headers, rows: table.rows })
        i = j
        continue
      }
    }

    const paragraphLines: string[] = [line]
    i++
    while (i < lines.length) {
      const next = lines[i]
      if (isHeadingLine(next, posologyMode) || isListLine(next) || splitTableRow(next)) break
      paragraphLines.push(next)
      i++
    }

    const paragraph = paragraphLines.join(" ")
    if (paragraph.length > 0) {
      for (const chunk of splitLongParagraph(paragraph, posologyMode ? 520 : 600)) {
        blocks.push({ type: "paragraph", text: chunk })
      }
    }
  }

  if (blocks.length === 0) {
    for (const chunk of splitLongParagraph(raw.replace(/\s+/g, " "), 520)) {
      blocks.push({ type: "paragraph", text: chunk })
    }
  }

  return blocks
}

export function estimateContentLength(text: string) {
  return text.length
}

export const POSOLOGY_FORM_LABELS: Array<{ label: string; patterns: RegExp[] }> = [
  { label: "Creme", patterns: [/^creme\b/i, /^pomada\b/i, /^gel\b/i] },
  { label: "Solução dermatológica", patterns: [/^solu(?:ç|c)(?:ã|a)o dermatol/i] },
  { label: "Gotas", patterns: [/^gotas\b/i] },
  { label: "Xarope", patterns: [/^xarope\b/i, /^solu(?:ç|c)(?:ã|a)o oral(?!.*gotas)/i] },
  { label: "Injetável", patterns: [/^solu(?:ç|c)(?:ã|a)o injet/i, /^injet(?:á|a)vel\b/i] },
  { label: "Supositório", patterns: [/^suposit(?:ó|o)rio/i] },
  { label: "Comprimido / Cápsula", patterns: [/^comprimido/i, /^c(?:á|a)psula/i] },
]

/** @deprecated Prefer normalizeBulaText + FormattedBulaContent (sem sub-accordions) */
export function splitPosologyByForm(text: string): Array<{ label: string; content: string }> {
  return [{ label: "Geral", content: normalizeBulaText(text, true) }]
}
