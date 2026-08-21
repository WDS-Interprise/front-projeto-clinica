import { useEffect, useRef, useState } from "react"
import { Clock3, Pencil, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/services/api"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { maskCepInput, maskCnpjInput, maskPhoneInput } from "@/lib/form-validation"

const NOTES_MAX = 300

type ClinicForm = {
  id: string
  name: string
  phone: string
  email: string
  cnpj: string
  addressStreet: string
  cityState: string
  addressZip: string
  website: string
  notes: string
  logoUrl: string
  logoFileName: string
  documentHeader: string
}

const emptyForm = (): ClinicForm => ({
  id: "",
  name: "",
  phone: "",
  email: "",
  cnpj: "",
  addressStreet: "",
  cityState: "",
  addressZip: "",
  website: "",
  notes: "",
  logoUrl: "",
  logoFileName: "",
  documentHeader: "",
})

function splitCityState(city?: string | null, state?: string | null) {
  const c = city?.trim() ?? ""
  const s = state?.trim() ?? ""
  if (c && s) return `${c} - ${s}`
  return c || s
}

function parseCityState(value: string) {
  const parts = value.split("-").map((p) => p.trim())
  if (parts.length >= 2) {
    return { addressCity: parts.slice(0, -1).join(" - "), addressState: parts[parts.length - 1] ?? "" }
  }
  return { addressCity: value.trim(), addressState: "" }
}

function fromClinic(c: Record<string, unknown>): ClinicForm {
  return {
    id: String(c.id ?? ""),
    name: String(c.name ?? ""),
    phone: String(c.phone ?? ""),
    email: String(c.email ?? ""),
    cnpj: String(c.cnpj ?? ""),
    addressStreet: String(c.addressStreet ?? ""),
    cityState: splitCityState(c.addressCity as string, c.addressState as string),
    addressZip: String(c.addressZip ?? ""),
    website: String(c.website ?? ""),
    notes: String(c.notes ?? ""),
    logoUrl: String(c.logoUrl ?? ""),
    logoFileName: String(c.logoFileName ?? ""),
    documentHeader: String(c.documentHeader ?? ""),
  }
}

export default function ClinicasPage() {
  const { toast } = useToast()
  const { hasPermission, clinicId } = useAuth()
  const canManage = hasPermission("clinics:manage")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ClinicForm>(emptyForm)
  const [saved, setSaved] = useState<ClinicForm>(emptyForm)
  const [headerOpen, setHeaderOpen] = useState(false)
  const [headerDraft, setHeaderDraft] = useState("")
  const logoInputRef = useRef<HTMLInputElement>(null)

  const applyClinic = (c: Record<string, unknown>) => {
    const next = fromClinic(c)
    setForm(next)
    setSaved(next)
  }

  const load = () => {
    const loadId = clinicId
    if (!loadId) {
      api.clinics
        .list()
        .then((list) => {
          if (list[0]) applyClinic(list[0])
        })
        .catch((err: unknown) => toast(toastMessageFromApiError(err, "Erro ao carregar clínica"), "error"))
        .finally(() => setLoading(false))
      return
    }
    api.clinics
      .getById(loadId)
      .then((c) => applyClinic(c))
      .catch((err: unknown) => toast(toastMessageFromApiError(err, "Erro ao carregar clínica"), "error"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [clinicId])

  const patch = (partial: Partial<ClinicForm>) => setForm((prev) => ({ ...prev, ...partial }))

  const handleLogo = (file: File) => {
    if (file.size > 400_000) {
      toast("A logo deve ter no máximo 400 KB", "error")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      patch({ logoUrl: String(reader.result ?? ""), logoFileName: file.name })
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!canManage || !form.id) {
      toast("Sem permissão para alterar clínica", "error")
      return
    }
    setSaving(true)
    const { addressCity, addressState } = parseCityState(form.cityState)
    try {
      const updated = await api.clinics.update(form.id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        cnpj: form.cnpj || null,
        website: form.website || null,
        notes: form.notes || null,
        logoUrl: form.logoUrl || null,
        logoFileName: form.logoFileName || null,
        documentHeader: form.documentHeader || null,
        addressStreet: form.addressStreet || null,
        addressCity: addressCity || null,
        addressState: addressState || null,
        addressZip: form.addressZip || null,
      })
      localStorage.setItem("clinicName", form.name)
      applyClinic(updated)
      toast("Dados da clínica salvos!")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao salvar"), "error")
    } finally {
      setSaving(false)
    }
  }

  const card = "rounded-[14px] border border-[#E4EBE6] bg-white p-5"
  const outlineBtn =
    "inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5DED8] bg-white px-3.5 text-[13px] font-medium text-[#1B2E26] hover:bg-[#F4F7F5] disabled:opacity-40"
  const greenBtn =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#006B4D] px-4 text-[13px] font-semibold text-white hover:bg-[#005A41] disabled:opacity-50"

  if (loading) {
    return (
      <SettingsLayout>
        <p className="text-text-secondary">Carregando...</p>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout className="flex flex-col">
      <SettingsPageHeader
        title="Dados da clínica"
        description="Informações institucionais da sua clínica. Esses dados serão utilizados em documentos e comunicações."
        action={
          <button
            type="button"
            className={outlineBtn}
            onClick={() => toast("O histórico de alterações ainda não está disponível")}
          >
            <Clock3 className="h-4 w-4" />
            Ver histórico de alterações
          </button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 pb-2">
      <section className={card}>
        <h2 className="mb-4 text-[16px] font-semibold text-[#12261E]">Informações principais</h2>
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
          <Input
            label="Nome da clínica"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            readOnly={!canManage}
          />
          <Input
            label="Telefone"
            value={form.phone}
            onChange={(e) => patch({ phone: maskPhoneInput(e.target.value) })}
            readOnly={!canManage}
          />
          <Input
            label="E-mail institucional"
            type="email"
            value={form.email}
            onChange={(e) => patch({ email: e.target.value })}
            readOnly={!canManage}
          />
          <Input
            label="CNPJ"
            value={form.cnpj}
            onChange={(e) => patch({ cnpj: maskCnpjInput(e.target.value) })}
            readOnly={!canManage}
          />
          <Input
            label="Endereço"
            value={form.addressStreet}
            onChange={(e) => patch({ addressStreet: e.target.value })}
            readOnly={!canManage}
          />
          <Input
            label="Cidade / Estado"
            value={form.cityState}
            onChange={(e) => patch({ cityState: e.target.value })}
            placeholder="Goiânia - GO"
            readOnly={!canManage}
          />
          <Input
            label="CEP"
            value={form.addressZip}
            onChange={(e) => patch({ addressZip: maskCepInput(e.target.value) })}
            readOnly={!canManage}
          />
          <Input
            label="Site (opcional)"
            value={form.website}
            onChange={(e) => patch({ website: e.target.value })}
            placeholder="www.clinica.com.br"
            readOnly={!canManage}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 text-[16px] font-semibold text-[#12261E]">Logo da clínica</h2>
          <div className="flex h-[120px] items-center justify-center rounded-lg border border-[#E4EBE6] bg-[#F7FAF8]">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo da clínica" className="max-h-24 max-w-[220px] object-contain" />
            ) : (
              <p className="text-sm text-text-secondary">Nenhuma logo enviada</p>
            )}
          </div>
          <p className="mt-3 text-[13px] text-[#6B7C74]">
            Arquivo atual: {form.logoFileName || "-"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleLogo(file)
                e.target.value = ""
              }}
            />
            <button
              type="button"
              className={outlineBtn}
              disabled={!canManage}
              onClick={() => logoInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Alterar logo
            </button>
            <button
              type="button"
              disabled={!canManage || !form.logoUrl}
              onClick={() => patch({ logoUrl: "", logoFileName: "" })}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D5DED8] text-[#6B7C74] hover:bg-red-50 hover:text-[#DC2626] disabled:opacity-40"
              title="Remover logo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-3 text-[16px] font-semibold text-[#12261E]">Documento padrão</h2>
          <p className="text-[13.5px] leading-relaxed text-[#6B7C74]">
            Esse será o cabeçalho utilizado em receitas, atestados e outros documentos.
          </p>
          {form.documentHeader ? (
            <p className="mt-3 line-clamp-4 whitespace-pre-wrap rounded-lg border border-border bg-surface-alt p-3 text-sm text-text">
              {form.documentHeader}
            </p>
          ) : null}
          <button
            type="button"
            className={`${outlineBtn} mt-4`}
            disabled={!canManage}
            onClick={() => {
              setHeaderDraft(form.documentHeader)
              setHeaderOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
            Editar cabeçalho
          </button>
        </section>
      </div>

      <section className={card}>
        <h2 className="text-[16px] font-semibold text-[#12261E]">Observações</h2>
        <p className="mt-1 text-[13px] text-[#6B7C74]">Informações adicionais sobre a clínica (opcional).</p>
        <textarea
          value={form.notes}
          maxLength={NOTES_MAX}
          readOnly={!canManage}
          onChange={(e) => patch({ notes: e.target.value.slice(0, NOTES_MAX) })}
          placeholder="Digite aqui informações adicionais sobre a clínica..."
          className="mt-3 min-h-[120px] w-full resize-y rounded-lg border border-[#D5DED8] bg-white px-3 py-2 text-sm text-[#12261E] placeholder:text-[#8A9A90] focus:border-[#006B4D] focus:outline-none"
        />
        <p className="mt-1 text-right text-[12px] text-[#8A9A90]">
          {form.notes.length}/{NOTES_MAX}
        </p>
      </section>

      {canManage && (
        <div className="mt-auto flex justify-end gap-3 pt-2">
          <button type="button" className={outlineBtn} onClick={() => setForm(saved)}>
            Cancelar
          </button>
          <button type="button" className={greenBtn} onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      )}
      </div>

      <Modal
        open={headerOpen}
        onClose={() => setHeaderOpen(false)}
        title="Editar cabeçalho"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setHeaderOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                patch({ documentHeader: headerDraft })
                setHeaderOpen(false)
              }}
            >
              Aplicar
            </Button>
          </div>
        }
      >
        <textarea
          value={headerDraft}
          onChange={(e) => setHeaderDraft(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
          placeholder="Nome, endereço e dados que aparecem no topo de receitas e atestados."
        />
      </Modal>
    </SettingsLayout>
  )
}
