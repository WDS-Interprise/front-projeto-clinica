export type ValidationResult = { ok: boolean; msg: string }

export function formatCPFInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export function maskPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function sanitizePersonName(value: string) {
  return value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
}

export function validateName(name: string): ValidationResult {
  if (name.trim().length < 5) return { ok: false, msg: "Minimo de 5 caracteres" }
  if (/[^a-zA-ZÀ-ÿ\s]/.test(name)) return { ok: false, msg: "Caracteres especiais nao permitidos" }
  return { ok: true, msg: "" }
}

export function validateEmail(email: string): ValidationResult {
  if (/\s/.test(email)) return { ok: false, msg: "Nao pode conter espacos" }
  if (email.includes("@")) {
    const afterAt = email.split("@")[1]
    if (afterAt && /[^a-zA-Z0-9.\-]/.test(afterAt)) {
      return { ok: false, msg: "Caracteres especiais nao permitidos apos @" }
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, msg: "E-mail invalido" }
  return { ok: true, msg: "" }
}

export function validateEmailOptional(email: string): ValidationResult {
  if (!email.trim()) return { ok: true, msg: "" }
  return validateEmail(email)
}

function allSameDigit(digits: string) {
  return /^(\d)\1+$/.test(digits)
}

function cpfChecksumOk(digits: string) {
  if (digits.length !== 11 || allSameDigit(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i)
  let d1 = (sum * 10) % 11
  if (d1 === 10) d1 = 0
  if (d1 !== Number(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i)
  let d2 = (sum * 10) % 11
  if (d2 === 10) d2 = 0
  return d2 === Number(digits[10])
}

function cnpjChecksumOk(digits: string) {
  if (digits.length !== 14 || allSameDigit(digits)) return false
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const digit = (slice: string, weights: number[]) => {
    const sum = slice.split("").reduce((acc, n, i) => acc + Number(n) * weights[i], 0)
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }
  if (digit(digits.slice(0, 12), w1) !== Number(digits[12])) return false
  return digit(digits.slice(0, 13), w2) === Number(digits[13])
}

export function validateCPF(cpf: string): ValidationResult {
  const digits = cpf.replace(/\D/g, "")
  if (digits.length !== 11) return { ok: false, msg: "Deve ter 11 dígitos" }
  if (!cpfChecksumOk(digits)) return { ok: false, msg: "CPF inválido" }
  return { ok: true, msg: "" }
}

export function validateCNPJ(cnpj: string): ValidationResult {
  const digits = cnpj.replace(/\D/g, "")
  if (digits.length !== 14) return { ok: false, msg: "Deve ter 14 dígitos" }
  if (!cnpjChecksumOk(digits)) return { ok: false, msg: "CNPJ inválido" }
  return { ok: true, msg: "" }
}

export function maskCpfOrCnpjInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  if (digits.length <= 11) return formatCPFInput(digits)
  return maskCnpjInput(digits)
}

export function validateCpfOrCnpj(value: string): ValidationResult {
  const digits = value.replace(/\D/g, "")
  if (!digits) return { ok: false, msg: "Informe o CPF ou CNPJ" }
  if (digits.length <= 11) {
    if (digits.length < 11) return { ok: false, msg: "CPF deve ter 11 dígitos" }
    return validateCPF(value)
  }
  if (digits.length < 14) return { ok: false, msg: "CNPJ deve ter 14 dígitos" }
  return validateCNPJ(value)
}

export type PixKeyKind = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP"

export function detectPixKeyKind(raw: string): PixKeyKind | null {
  const key = raw.trim()
  if (!key) return null
  if (key.includes("@")) return validateEmail(key).ok ? "EMAIL" : null
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return "EVP"
  const digits = key.replace(/\D/g, "")
  if (key.startsWith("+") || key.startsWith("(")) {
    let phone = digits
    if (phone.startsWith("55") && phone.length >= 12) phone = phone.slice(2)
    if (phone.length === 10 || phone.length === 11) return "PHONE"
    return null
  }
  if (digits.length === 14) return "CNPJ"
  if (digits.length === 11) return "CPF"
  if (digits.length === 10) return "PHONE"
  return null
}

export function maskPixKeyInput(value: string) {
  const raw = value.slice(0, 120)
  if (raw.includes("@")) return raw.replace(/\s/g, "").toLowerCase().slice(0, 120)
  if (raw.startsWith("+")) {
    const digits = raw.replace(/\D/g, "").slice(0, 13)
    return digits ? `+${digits}` : "+"
  }
  if (raw.startsWith("(")) return maskPhoneInput(raw)
  if (/[a-zA-Z]/.test(raw)) {
    const compact = raw.replace(/\s/g, "").toLowerCase()
    if (compact.includes("-") || /^[0-9a-f-]+$/i.test(compact)) {
      return compact.replace(/[^0-9a-f-]/g, "").slice(0, 36)
    }
    return compact.slice(0, 120)
  }
  const digits = raw.replace(/\D/g, "")
  if (digits.length <= 11) return formatCPFInput(digits)
  return maskCnpjInput(digits)
}

export function validatePixKey(value: string): ValidationResult {
  const key = value.trim()
  if (!key) return { ok: false, msg: "Informe a chave Pix" }
  const kind = detectPixKeyKind(key)
  if (!kind) {
    return { ok: false, msg: "Use CPF, CNPJ, e-mail, telefone ou chave aleatória" }
  }
  if (kind === "CPF") return validateCPF(key)
  if (kind === "CNPJ") return validateCNPJ(key)
  if (kind === "EMAIL") return validateEmail(key)
  if (kind === "PHONE") return { ok: true, msg: "" }
  return { ok: true, msg: "" }
}

export const PIX_KEY_KIND_LABEL: Record<PixKeyKind, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  EVP: "Chave aleatória",
}

export function validatePhone(phone: string): ValidationResult {
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 10) return { ok: false, msg: "Telefone invalido" }
  if (digits.length > 11) return { ok: false, msg: "Telefone invalido" }
  return { ok: true, msg: "" }
}

export function validatePhoneOptional(phone: string): ValidationResult {
  if (!phone.trim()) return { ok: true, msg: "" }
  return validatePhone(phone)
}

export function validateBirthDate(birthDate: string): ValidationResult {
  if (!birthDate) return { ok: false, msg: "Informe a data de nascimento" }
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return { ok: false, msg: "Data invalida" }
  if (date > new Date()) return { ok: false, msg: "Data nao pode ser futura" }
  return { ok: true, msg: "" }
}

export function cpfDigits(cpf: string) {
  return cpf.replace(/\D/g, "")
}

export function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "")
}

export function maskCnpjInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

export function maskCepInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}
