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

export function validateCPF(cpf: string): ValidationResult {
  const digits = cpf.replace(/\D/g, "")
  if (digits.length !== 11) return { ok: false, msg: "Deve ter 11 digitos" }
  return { ok: true, msg: "" }
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
