import { useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import AppLogo from "@/components/brand/AppLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForceLightTheme } from "@/hooks/useForceLightTheme"
import { formatCompanyCopyright } from "@/lib/company-legal"
import { api } from "@/services/api"
import { toastMessageFromApiError } from "@/lib/api-errors"

type ValidateResult = Awaited<ReturnType<typeof api.prescriptions.validatePublic>>

export default function ValidarReceitaPage() {
  useForceLightTheme()
  const { code = "" } = useParams()
  const [params] = useSearchParams()
  const [accessCode, setAccessCode] = useState(params.get("code") ?? params.get("accessCode") ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<ValidateResult | null>(null)

  const runValidate = (nextAccess = accessCode) => {
    if (!code.trim()) {
      setError("Informe o código da receita.")
      return
    }
    setLoading(true)
    setError("")
    api.prescriptions
      .validatePublic(code.trim(), nextAccess.trim() || undefined)
      .then((res) => {
        setResult(res)
        if (!res.valid) setError("Receita não encontrada ou código de acesso inválido.")
      })
      .catch((err: unknown) => {
        setResult(null)
        setError(toastMessageFromApiError(err, "Não foi possível validar a receita."))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "auto"
    window.scrollTo(0, 0)
    if (code.trim() && accessCode.trim()) runValidate(accessCode)
    return () => {
      document.body.style.overflow = prevOverflow || "hidden"
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const doc = result?.valid ? result.document : null
  const signatureNote = doc?.signature.note ?? ""

  return (
    <div className="min-h-dvh overflow-y-auto bg-surface-alt text-text">
      <header className="border-b border-border/80 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="block h-10 w-[9.25rem] overflow-hidden rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <AppLogo
              size="sm"
              rounded={false}
              className="h-full w-full max-w-none scale-[1.08] object-cover object-[18%_center]"
            />
          </Link>
          <Link to="/" className="text-sm font-medium text-text-secondary hover:text-text">
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Validação pública</p>
        <h1 className="mt-2 text-3xl font-bold text-text">Validar receita</h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          Confira se a prescrição existe na ClinMax. Isto não substitui a conferência da farmácia
          nem prova assinatura ICP-Brasil.
        </p>

        <form
          className="mt-8 space-y-4 rounded-xl border border-border bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault()
            runValidate()
          }}
        >
          <p className="text-sm text-text">
            Código da receita: <strong>{code || "-"}</strong>
          </p>
          <Input
            label="Código de acesso"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Informe o código do PDF"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Validando..." : "Validar"}
          </Button>
        </form>

        {doc && (
          <section className="mt-6 space-y-3 rounded-xl border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-text">Documento localizado</h2>
            <p className="text-sm text-text-secondary">
              Tipo: <strong className="text-text">{doc.documentType}</strong>
            </p>
            <p className="text-sm text-text-secondary">
              Profissional: <strong className="text-text">{doc.professionalName}</strong>
            </p>
            <p className="text-sm text-text-secondary">
              Data:{" "}
              <strong className="text-text">
                {doc.date ? new Date(doc.date).toLocaleDateString("pt-BR") : "-"}
              </strong>
            </p>
            <p className="text-sm text-text-secondary">
              Itens: <strong className="text-text">{doc.itemCount}</strong>
            </p>
            <p className="text-sm text-text-secondary">
              Integridade:{" "}
              <strong className="text-text">
                {doc.integrity === "HASH_PRESENT" ? "Hash do conteúdo presente" : "Hash ausente"}
              </strong>
            </p>
            <div className="rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm">
              <p className="font-medium text-text">
                {doc.signature.status === "SIMULATED"
                  ? "Simulação de assinatura"
                  : doc.signature.status === "UNSIGNED"
                    ? "Não assinada digitalmente"
                    : "Assinatura registrada"}
              </p>
              <p className="mt-1 text-text-secondary">{signatureNote}</p>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border bg-surface px-4 py-6 text-center text-[11px] text-text-secondary">
        {formatCompanyCopyright()}
      </footer>
    </div>
  )
}
