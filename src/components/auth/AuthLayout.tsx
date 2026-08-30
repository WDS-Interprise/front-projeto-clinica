import { Link } from "react-router-dom"
import { useEffect } from "react"
import AppLogo from "@/components/brand/AppLogo"
import { cn } from "@/lib/utils"

export const authInputClass =
  "flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#00A86B] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20"

export const authInputCompactClass =
  "flex h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#00A86B] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20"

export const authInputWithIconClass = `${authInputClass} pr-11`

export const authInputWithLeadingIconClass = `${authInputClass} pl-11`

export const authInputWithBothIconsClass = `${authInputClass} pl-11 pr-11`

export const authInputCompactWithIconClass = `${authInputCompactClass} pr-10`

export const authLabelClass = "block text-[13px] font-semibold text-slate-900"

export const authSubmitClass =
  "flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#00A86B] text-[13px] font-semibold text-white shadow-sm shadow-[#00A86B]/25 transition-colors hover:bg-[#00915c] disabled:cursor-not-allowed disabled:opacity-60"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.7 12.55c.03-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.63-1.71-3.2-1.73-1.36-.14-2.66.8-3.35.8-.69 0-1.76-.78-2.9-.76-1.49.02-2.87.87-3.64 2.2-1.55 2.69-.4 6.67 1.12 8.85.74 1.07 1.62 2.26 2.78 2.22 1.12-.05 1.54-.72 2.89-.72 1.35 0 1.73.72 2.91.7 1.2-.02 1.97-1.09 2.7-2.16.85-1.24 1.2-2.44 1.22-2.5-.03-.01-2.33-.89-2.36-3.59ZM14.9 6.4c.62-.75 1.03-1.79.92-2.83-.89.04-1.97.59-2.61 1.34-.57.66-1.07 1.72-.94 2.73 1 .08 2.02-.51 2.63-1.24Z" />
    </svg>
  )
}

function SocialButton({
  icon,
  label,
  ariaLabel,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  ariaLabel: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={ariaLabel}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function AuthHeroPair({
  children,
  footer,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex h-full w-full items-center justify-center px-4">
      <div className={cn("w-full max-w-[20.5rem]")}>
        {children}
        {footer}
      </div>
    </div>
  )
}

export function AuthPageShell({
  children,
  footer,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    document.documentElement.classList.add("auth-ui-scale")
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.documentElement.classList.remove("auth-ui-scale")
      document.body.style.overflow = prevOverflow || "hidden"
    }
  }, [])

  return (
    <div className="auth-page relative min-h-dvh h-dvh w-full overflow-x-hidden overflow-y-hidden bg-[#f4f6f8]">
      <AuthHeroPair footer={footer}>
        {children}
      </AuthHeroPair>
    </div>
  )
}

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-[min(36.5rem,86vh)] w-full flex-col overflow-visible rounded-2xl bg-white px-5 pb-6 pt-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)] sm:px-6 sm:pb-6 sm:pt-4",
        className
      )}
    >
      {children}
    </div>
  )
}

export function AuthLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="Ir para a página inicial do ClinMax"
      className={cn(
        "mx-auto mb-3 flex w-full max-w-[12.5rem] shrink-0 items-center justify-center overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A86B] focus-visible:ring-offset-2",
        compact ? "h-12" : "h-[4.25rem]"
      )}
    >
      <AppLogo
        size={compact ? "md" : "lg"}
        className={cn(
          "origin-center object-contain object-center",
          compact ? "scale-110" : "scale-[1.45]"
        )}
      />
    </Link>
  )
}

export function AuthSocialButtons({
  onGoogleClick,
  googleLoading,
}: {
  onGoogleClick?: () => void
  googleLoading?: boolean
} = {}) {
  return (
    <div className="space-y-2">
      <SocialButton
        icon={<GoogleIcon className="h-4 w-4 shrink-0" />}
        label={googleLoading ? "Redirecionando..." : "Continuar com Google"}
        ariaLabel="Iniciar sessão com o Google"
        onClick={onGoogleClick}
        disabled={googleLoading}
      />
      <SocialButton
        icon={<AppleIcon className="h-4 w-4 shrink-0" />}
        label="Continuar com Apple"
        ariaLabel="Iniciar sessão com a Apple"
      />
    </div>
  )
}

export function AuthDivider({ text }: { text: string }) {
  return (
    <div className="my-3 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="shrink-0 text-xs text-slate-400">{text}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

export function AuthError({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-600">
      {message}
    </p>
  )
}

export function AuthBackofficeLink() {
  return (
    <p className="mt-4 text-center text-[11px] text-slate-500">
      <Link to="/backoffice/login" className="transition-colors hover:text-slate-700">
        Acesso dono da plataforma (backoffice)
      </Link>
    </p>
  )
}
