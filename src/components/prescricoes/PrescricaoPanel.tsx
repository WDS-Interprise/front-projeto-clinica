import { useCallback, useEffect, useState } from "react"
import { api } from "@/services/api"
import { isResolvableEntityId } from "@/lib/route-ids"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { PrescricaoHub } from "@/components/prescricoes/PrescricaoHub"
import { PrescricaoStepPrescrever } from "@/components/prescricoes/PrescricaoStepPrescrever"
import { PrescricaoStepAssinar } from "@/components/prescricoes/PrescricaoStepAssinar"
import { PrescricaoStepFinalizada } from "@/components/prescricoes/PrescricaoStepFinalizada"
import { latestWhatsAppShare } from "@/components/prescricoes/prescription-ui"
import type {
  MedicationFormValues,
  ExamFormValues,
  VaccineFormValues,
  Prescription,
  PrescriptionContext,
  PrescriptionItemType,
  PrescriptionTemplate,
} from "@/types/prescription"

type ViewMode = "hub" | "flow" | "done"

type Props = {
  patientId: string
  appointmentId?: string | null
  patientName?: string
  patientPhone?: string
  embedded?: boolean
}

export function PrescricaoPanel({
  patientId,
  appointmentId,
  patientName: patientNameProp,
  patientPhone: patientPhoneProp,
  embedded = false,
}: Props) {
  const { toast } = useToast()

  const [view, setView] = useState<ViewMode>("hub")
  const [flowStep, setFlowStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ctx, setCtx] = useState<PrescriptionContext | null>(null)
  const [patientName, setPatientName] = useState(patientNameProp ?? "")
  const [patientPhone, setPatientPhone] = useState(patientPhoneProp ?? "")
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([])
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [resending, setResending] = useState(false)
  const [showDate, setShowDate] = useState(true)
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString())

  const contextKey = appointmentId ?? patientId

  const loadContext = useCallback(() => {
    if (!isResolvableEntityId(contextKey)) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      api.prescriptions.resolveContext(contextKey),
      api.prescriptions.listTemplates().catch(() => ({ data: [] as PrescriptionTemplate[] })),
    ])
      .then(([context, tpl]) => {
        setCtx(context)
        setTemplates(tpl.data)
        if (!patientNameProp) {
          const name = context.recentPrescriptions[0]?.patient?.name ?? ""
          setPatientName(name)
          if (context.recentPrescriptions[0]?.patient) {
            const p = context.recentPrescriptions[0].patient
            setPatientPhone(p.whatsapp?.trim() || p.phone?.trim() || "")
          } else {
            api.patients.getById(context.patientId).then((p) => {
              setPatientName(p.name)
              setPatientPhone(p.whatsapp?.trim() || p.phone?.trim() || "")
            }).catch(() => {})
          }
        }
      })
      .catch((err: unknown) => {
        toast(toastMessageFromApiError(err, "Erro ao carregar prescrições"), "error")
      })
      .finally(() => setLoading(false))
  }, [contextKey, patientNameProp, toast])

  useEffect(() => {
    if (patientNameProp) setPatientName(patientNameProp)
  }, [patientNameProp])

  useEffect(() => {
    if (patientPhoneProp) setPatientPhone(patientPhoneProp)
  }, [patientPhoneProp])

  useEffect(() => {
    loadContext()
  }, [loadContext])

  const startDraft = async (fromRenewId?: string) => {
    const resolvedPatientId = ctx?.patientId ?? patientId
    const resolvedAppointmentId = ctx?.appointmentId ?? appointmentId ?? undefined
    if (!resolvedPatientId) return
    setSaving(true)
    try {
      let rx: Prescription
      if (fromRenewId) {
        rx = await api.prescriptions.renew(fromRenewId)
      } else {
        rx = await api.prescriptions.create({
          patientId: resolvedPatientId,
          appointmentId: resolvedAppointmentId,
          prescriptionDate,
          showDate,
        })
      }
      setPrescription(rx)
      setPatientName(rx.patient?.name ?? patientName)
      setView("flow")
      setFlowStep(0)
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao criar prescrição"), "error")
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = async (
    type: PrescriptionItemType,
    payload: MedicationFormValues | ExamFormValues | VaccineFormValues | { name: string; instructions?: string }
  ) => {
    if (!prescription) return
    setSaving(true)
    try {
      let body
      if (type === "MEDICATION") {
        const med = payload as MedicationFormValues
        const instructions = [med.instructions, med.observations?.trim()]
          .filter(Boolean)
          .join("\n")
        body = {
          type,
          name: med.name,
          presentation: med.presentation,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          quantity: med.quantity,
          instructions,
          continuousUse: med.continuousUse,
        }
      } else if (type === "EXAM") {
        const exam = payload as ExamFormValues
        const displayName =
          exam.showTussCode && exam.tussCode
            ? `${exam.tussCode} - ${exam.name}`
            : exam.name
        body = {
          type,
          name: displayName,
          presentation:
            exam.showTussCode && exam.tussCode ? `TUSS ${exam.tussCode}` : undefined,
          extraJson: JSON.stringify({
            tussCode: exam.tussCode || null,
            showTussCode: exam.showTussCode,
            generateSadtGuide: exam.generateSadtGuide,
          }),
        }
      } else if (type === "VACCINE") {
        const vac = payload as VaccineFormValues
        const instructionParts = [
          vac.instructions.trim(),
          vac.observations?.trim(),
          vac.boosterRequired && vac.boosterInterval.trim()
            ? `Reforço: ${vac.boosterInterval.trim()}`
            : vac.boosterRequired
              ? "Reforço necessário"
              : "",
          vac.recommendedDate ? `Data recomendada: ${vac.recommendedDate}` : "",
        ].filter(Boolean)
        body = {
          type,
          name: vac.displayName || vac.name,
          presentation: vac.route || undefined,
          dosage: vac.dose || undefined,
          quantity: vac.quantity || undefined,
          instructions: instructionParts.join("\n"),
          extraJson: JSON.stringify({
            rxcuis: vac.rxcuis,
            batch: vac.batch || null,
            manufacturer: vac.manufacturer || null,
            boosterRequired: vac.boosterRequired,
            boosterInterval: vac.boosterInterval || null,
            recommendedDate: vac.recommendedDate || null,
            source: "RxTerms / ClinicalTables",
          }),
        }
      } else if (type === "FREE_TEXT") {
        const free = payload as { name: string; instructions?: string }
        body = {
          type,
          name: free.name || "Texto livre",
          instructions: free.instructions ?? free.name,
        }
      } else {
        const simple = payload as { name: string; instructions?: string }
        body = {
          type,
          name: simple.name,
          instructions: simple.instructions,
        }
      }
      const { prescription: updated } = await api.prescriptions.addItem(prescription.id, body)
      setPrescription(updated)
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao adicionar item"), "error")
    } finally {
      setSaving(false)
    }
  }

  const handleImportFromHistory = async (sourceId: string) => {
    if (!prescription) return
    setSaving(true)
    try {
      const source = await api.prescriptions.getById(sourceId)
      let updated = prescription
      for (const item of source.items) {
        const res = await api.prescriptions.addItem(prescription.id, {
          type: item.type,
          name: item.name,
          presentation: item.presentation ?? undefined,
          dosage: item.dosage ?? undefined,
          frequency: item.frequency ?? undefined,
          duration: item.duration ?? undefined,
          quantity: item.quantity ?? undefined,
          instructions: item.instructions ?? undefined,
          continuousUse: item.continuousUse,
        })
        updated = res.prescription
      }
      setPrescription(updated)
      toast("Itens importados do histórico.")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao importar histórico"), "error")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!prescription) return
    setSaving(true)
    try {
      const updated = await api.prescriptions.removeItem(prescription.id, itemId)
      setPrescription(updated)
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao remover item"), "error")
    } finally {
      setSaving(false)
    }
  }

  const handleFinalize = async (opts: {
    shareWhatsApp: boolean
    sharePhone?: string
    signDigital: boolean
  }) => {
    if (!prescription) return
    setSaving(true)
    try {
      if (showDate !== prescription.showDate || prescriptionDate !== prescription.prescriptionDate) {
        await api.prescriptions.update(prescription.id, {
          showDate,
          prescriptionDate,
        })
      }
      const finalized = await api.prescriptions.finalize(prescription.id, opts)
      setPrescription(finalized)
      setView("done")
      setFlowStep(2)
      loadContext()
      toast("Prescrição finalizada com sucesso!")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao finalizar prescrição"), "error")
    } finally {
      setSaving(false)
    }
  }

  const handleResendWhatsApp = async () => {
    if (!prescription) return
    setResending(true)
    try {
      const updated = await api.prescriptions.resendWhatsapp(prescription.id)
      setPrescription(updated)
      const share = latestWhatsAppShare(updated)
      if (share?.status === "SENT") {
        toast("Prescrição reenviada por WhatsApp.")
      } else {
        toast(share?.errorMessage ?? "Não foi possível enviar por WhatsApp.", "error")
      }
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao reenviar WhatsApp"), "error")
    } finally {
      setResending(false)
    }
  }

  const openPdf = async (download: boolean) => {
    if (!prescription) return
    try {
      const token = localStorage.getItem("token")
      const url = api.prescriptions.pdfUrl(prescription.id).split("?")[0]
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || "Erro ao carregar PDF")
      }
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = disposition.match(/filename="([^"]+)"/)
      const filename = match?.[1] ?? `prescricao-clinmax-${prescription.id}.pdf`
      const blobUrl = URL.createObjectURL(blob)
      if (download) {
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = filename
        a.click()
        URL.revokeObjectURL(blobUrl)
        toast("PDF salvo com sucesso.")
      } else {
        const w = window.open(blobUrl, "_blank")
        if (w) {
          w.onload = () => w.print()
        } else {
          toast("Permita pop-ups para imprimir.", "error")
        }
      }
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao abrir PDF"), "error")
    }
  }

  const backToHub = () => {
    setView("hub")
    setFlowStep(0)
    setPrescription(null)
    loadContext()
  }

  if (!isResolvableEntityId(patientId)) {
    return <p className="text-sm text-text-secondary">Paciente inválido.</p>
  }

  return (
    <div className={embedded ? "min-w-0" : "p-6 lg:p-8 max-w-5xl mx-auto"}>
      {view === "hub" && (
        <PrescricaoHub
          patientName={patientName || "Paciente"}
          showDate={showDate}
          onShowDateChange={setShowDate}
          prescriptionDate={prescriptionDate}
          onDateChange={setPrescriptionDate}
          recent={ctx?.recentPrescriptions ?? []}
          templates={templates}
          loading={loading}
          embedded={embedded}
          onCreateBlank={() => startDraft()}
          onRenew={(id) => startDraft(id)}
        />
      )}

      {view === "flow" && prescription && flowStep === 0 && (
        <PrescricaoStepPrescrever
          prescription={prescription}
          saving={saving}
          recentPrescriptions={ctx?.recentPrescriptions ?? []}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onRenewFromHistory={handleImportFromHistory}
          onBack={backToHub}
          onAdvance={() => setFlowStep(1)}
        />
      )}

      {view === "flow" && prescription && flowStep === 1 && (
        <PrescricaoStepAssinar
          prescription={prescription}
          patientPhone={patientPhone}
          saving={saving}
          onBack={() => setFlowStep(0)}
          onFinalize={handleFinalize}
        />
      )}

      {view === "done" && prescription && (
        <PrescricaoStepFinalizada
          prescription={prescription}
          resending={resending}
          onSavePdf={() => openPdf(true)}
          onPrintPdf={() => openPdf(false)}
          onNewPrescription={backToHub}
          onResendWhatsApp={handleResendWhatsApp}
        />
      )}
    </div>
  )
}
