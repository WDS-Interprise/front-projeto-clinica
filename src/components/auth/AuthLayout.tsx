import { Link } from "react-router-dom"
import { useEffect } from "react"
import {
  CalendarClock,
  FileText,
  HeartPulse,
  MessageCircle,
  Pill,
  Stethoscope,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { APP_NAME, APP_TAGLINE } from "@/lib/brand"

export const authInputClass =
  "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"

export const authInputCompactClass =
  "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"

export const authInputWithIconClass = `${authInputClass} pr-11`

export const authInputCompactWithIconClass = `${authInputCompactClass} pr-10`

export const authLabelClass = "block text-sm font-medium text-slate-900"

export const authSubmitClass =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#256993] text-sm font-semibold text-white transition-colors hover:bg-[#1a4f6e] disabled:cursor-not-allowed disabled:opacity-60"

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

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  )
}

function SocialButton({
  icon,
  label,
  ariaLabel,
}: {
  icon: React.ReactNode
  label: string
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      className="flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
      aria-label={ariaLabel}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}

const features = [
  { icon: CalendarClock, label: "Agenda inteligente", desc: "Horários, confirmações e fila do dia" },
  { icon: FileText, label: "Prontuário digital", desc: "Histórico clínico sempre à mão" },
  { icon: Pill, label: "Prescrições", desc: "Medicamentos, exames e vacinas" },
  { icon: MessageCircle, label: "WhatsApp", desc: "Lembretes automáticos para pacientes" },
]

function AuthMeshBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.25) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-[#256993]/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#3d8fc4]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl" />
    </>
  )
}

const floatingShowcaseIcons: {
  Icon: LucideIcon
  left: string
  bottom: string
  delay: string
  duration: string
  size: "sm" | "md" | "lg"
  tint: string
}[] = [
  { Icon: Stethoscope, left: "6%", bottom: "32%", delay: "0s", duration: "5.5s", size: "lg", tint: "from-[#256993]/15 to-white" },
  { Icon: Pill, left: "78%", bottom: "40%", delay: "1.4s", duration: "6s", size: "md", tint: "from-sky-100 to-white" },
  { Icon: CalendarClock, left: "58%", bottom: "26%", delay: "2.8s", duration: "5.2s", size: "sm", tint: "from-[#256993]/10 to-white" },
  { Icon: HeartPulse, left: "28%", bottom: "38%", delay: "0.9s", duration: "6.2s", size: "md", tint: "from-teal-50 to-white" },
  { Icon: MessageCircle, left: "88%", bottom: "55%", delay: "3.6s", duration: "5.8s", size: "sm", tint: "from-[#3d8fc4]/15 to-white" },
  { Icon: FileText, left: "12%", bottom: "58%", delay: "2.1s", duration: "5.4s", size: "sm", tint: "from-slate-50 to-white" },
]

const floatSizeClass = {
  sm: "h-11 w-11 [&_svg]:h-4 [&_svg]:w-4",
  md: "h-14 w-14 [&_svg]:h-5 [&_svg]:w-5",
  lg: "h-[4.25rem] w-[4.25rem] [&_svg]:h-6 [&_svg]:w-6",
} as const

function AuthFloatingIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block" aria-hidden>
      {floatingShowcaseIcons.map(({ Icon, left, bottom, delay, duration, size, tint }, i) => (
        <div
          key={i}
          className="auth-float-icon absolute"
          style={{
            left,
            bottom,
            animationDelay: delay,
            animationDuration: duration,
          }}
        >
          <div
            className={cn(
              "auth-float-icon-3d flex items-center justify-center rounded-2xl bg-gradient-to-br text-[#256993]",
              floatSizeClass[size],
              tint
            )}
          >
            <Icon strokeWidth={1.75} />
          </div>
        </div>
      ))}
    </div>
  )
}

function AuthClinicShowcase() {
  return (
    <div className="relative flex min-h-[280px] flex-1 flex-col justify-between overflow-hidden lg:min-h-screen lg:border-r lg:border-slate-200/80">
      <AuthFloatingIcons />
      <div className="relative z-10 flex flex-1 flex-col justify-start px-6 py-8 sm:px-10 lg:px-12 lg:pt-14 lg:pb-10 xl:px-16 xl:pt-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#256993] to-[#1a4f6e] text-sm font-bold text-white shadow-lg shadow-[#256993]/20 ring-1 ring-[#256993]/15">
            cl
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-900">{APP_NAME}</p>
            <p className="text-xs text-slate-500">{APP_TAGLINE}</p>
          </div>
        </div>

        <div className="max-w-lg">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
            Gestão completa para clínica geral
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            Agenda, prontuário, prescrições e comunicação com pacientes — um fluxo
            organizado para médicos, enfermagem e recepção.
          </p>

          <ul className="mt-8 space-y-2.5">
            {features.map(({ icon: Icon, label, desc }) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-xl border border-slate-200/90 bg-white/70 px-3.5 py-3 shadow-sm shadow-slate-200/40 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#256993]/10 text-[#256993] ring-1 ring-[#256993]/15">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="relative z-10 hidden px-10 pb-8 text-[11px] text-slate-400 lg:block lg:px-12 xl:px-16">
        Desenvolvido para clínicas gerais, consultórios e equipes multiprofissionais no Brasil.
      </p>
    </div>
  )
}

export function AuthPageShell({
  children,
  footer,
  wide = false,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    document.documentElement.classList.add("auth-ui-scale")
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "auto"
    return () => {
      document.documentElement.classList.remove("auth-ui-scale")
      document.body.style.overflow = prevOverflow || "hidden"
    }
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-white via-[#f5fafd] to-[#e9f3f9] lg:flex-row">
      <AuthMeshBackground />

      <AuthClinicShowcase />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:min-h-screen">
        <div className={cn("w-full", wide ? "max-w-[28.75rem]" : "max-w-[26.25rem]")}>
          {children}
          {footer}
        </div>
      </div>
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
        "rounded-3xl bg-white px-7 py-9 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/80 sm:px-9 sm:py-10",
        className
      )}
    >
      {children}
    </div>
  )
}

export function AuthLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto flex items-center justify-center rounded-full bg-[#256993] font-semibold tracking-tight text-white shadow-md shadow-[#256993]/25",
        compact ? "mb-3 h-9 w-9 text-xs" : "mb-5 h-11 w-11 text-sm"
      )}
    >
      cl
    </div>
  )
}

export function AuthSocialButtons() {
  return (
    <div className="mb-6 grid min-w-0 grid-cols-2 gap-2.5">
      <SocialButton
        icon={<GoogleIcon className="h-4 w-4 shrink-0" />}
        label="Google"
        ariaLabel="Iniciar sessão com o Google"
      />
      <SocialButton
        icon={<MicrosoftIcon className="h-4 w-4 shrink-0" />}
        label="Microsoft"
        ariaLabel="Iniciar sessão com a Microsoft"
      />
    </div>
  )
}

export function AuthDivider({ text }: { text: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
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
    <p className="mt-6 text-center text-xs text-slate-500">
      <Link to="/backoffice/login" className="transition-colors hover:text-slate-700">
        Acesso dono da plataforma (backoffice)
      </Link>
    </p>
  )
}
