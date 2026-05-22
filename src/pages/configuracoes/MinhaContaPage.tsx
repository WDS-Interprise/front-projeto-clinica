import { useEffect, useMemo, useState } from "react"
import { UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/services/api"
import { toastMessageFromApiError } from "@/lib/api-errors"
import {
  maskPhoneInput,
  sanitizePersonName,
  validateEmail,
  validateName,
  validatePhoneOptional,
} from "@/lib/form-validation"
import ProfileAvatarUpload from "@/components/user/ProfileAvatarUpload"
import { useUserAvatar } from "@/hooks/useUserAvatar"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  DOCTOR: "Profissional de saúde",
  RECEPTION: "Recepcionista",
}

export default function MinhaContaPage() {
  const { toast } = useToast()
  const { refresh, user } = useAuth()
  const { imageUrl: avatarUrl, setPreviewUrl, refreshAvatar } = useUserAvatar()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "F" as "M" | "F" | "O",
    role: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    api.auth
      .me()
      .then((me) => {
        setForm((prev) => ({
          ...prev,
          name: me.name,
          email: me.email,
          phone: me.phone ?? "",
          gender: me.gender ?? "F",
          role: me.role,
        }))
      })
      .catch((err: unknown) => {
        toast(toastMessageFromApiError(err, "Erro ao carregar sua conta"), "error")
      })
      .finally(() => setLoading(false))
  }, [toast])

  const nameValid = validateName(form.name).ok
  const emailValid = validateEmail(form.email).ok
  const phoneValid = validatePhoneOptional(form.phone).ok
  const changingPassword = Boolean(form.password || form.currentPassword || form.confirmPassword)
  const passwordMatch = !changingPassword || form.password === form.confirmPassword
  const canSave =
    !loading &&
    !saving &&
    nameValid &&
    emailValid &&
    phoneValid &&
    passwordMatch &&
    (!changingPassword || (form.currentPassword.length > 0 && form.password.length >= 8))

  const roleLabel = useMemo(
    () => ROLE_LABELS[form.role] ?? form.role,
    [form.role]
  )

  const handleAvatarUpload = async (file: File) => {
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setUploadingAvatar(true)
    try {
      const result = await api.auth.uploadAvatar(file)
      await refreshAvatar(result.imageUrl)
      URL.revokeObjectURL(preview)
      toast("Foto de perfil atualizada!")
    } catch (err: unknown) {
      URL.revokeObjectURL(preview)
      await refreshAvatar()
      toast(toastMessageFromApiError(err, "Erro ao enviar foto"), "error")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (changingPassword && form.password !== form.confirmPassword) {
      toast("As senhas não conferem", "error")
      return
    }

    setSaving(true)
    try {
      await api.auth.updateMe({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        ...(changingPassword
          ? { currentPassword: form.currentPassword, password: form.password }
          : {}),
      })
      await refresh()
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        password: "",
        confirmPassword: "",
      }))
      toast("Conta atualizada com sucesso!")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao salvar conta"), "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsLayout className="max-w-2xl">
      <SettingsPageHeader
        icon={<UserCircle className="h-7 w-7 text-primary" />}
        title="Minha conta"
        description="Atualize seus dados pessoais e credenciais de acesso."
      />

      {loading ? (
        <p className="text-sm text-text-secondary">Carregando...</p>
      ) : (
        <div className="space-y-8">
          <section className="flex flex-col items-center rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:gap-6">
            <ProfileAvatarUpload
              name={form.name || user?.name || "Usuário"}
              imageUrl={avatarUrl}
              uploading={uploadingAvatar}
              disabled={loading}
              onSelectFile={handleAvatarUpload}
            />
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-text">{form.name || "—"}</p>
              <p className="text-xs text-text-secondary mt-0.5">{form.email || user?.email}</p>
              <p className="text-xs text-text-secondary mt-1">{roleLabel}</p>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold uppercase text-text-secondary">Dados pessoais</h2>
            <Input
              label="Nome completo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: sanitizePersonName(e.target.value) })}
            />
            <Input
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
            />
            <Input
              label="Telefone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: maskPhoneInput(e.target.value) })}
              placeholder="(00) 00000-0000"
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-text">Gênero</label>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm({ ...form, gender: e.target.value as "M" | "F" | "O" })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
              >
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="O">Outro</option>
              </select>
            </div>
            <Input label="Perfil no sistema" value={roleLabel} readOnly />
            {user?.email && (
              <p className="text-xs text-text-secondary">
                Logado como <span className="font-medium text-text">{user.email}</span>
              </p>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold uppercase text-text-secondary">Alterar senha</h2>
            <p className="text-xs text-text-secondary">
              Deixe em branco se não quiser trocar a senha agora.
            </p>
            <Input
              label="Senha atual"
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              autoComplete="current-password"
            />
            <Input
              label="Nova senha"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              autoComplete="new-password"
            />
            <p className="text-xs text-text-secondary">
              Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.
            </p>
          </section>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!canSave}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      )}
    </SettingsLayout>
  )
}
