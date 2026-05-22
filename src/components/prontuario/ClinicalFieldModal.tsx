import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onClose: () => void
  title: string
  value: string
  readOnly?: boolean
  emptyLabel?: string
  onSave?: (value: string) => Promise<void>
}

export function ClinicalFieldModal({
  open,
  onClose,
  title,
  value,
  readOnly = false,
  emptyLabel = "Nenhum registro",
  onSave,
}: Props) {
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(draft.trim())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        readOnly ? (
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Fechar
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )
      }
    >
      {readOnly ? (
        <p className="text-sm text-text whitespace-pre-wrap">
          {value.trim() || emptyLabel}
        </p>
      ) : (
        <textarea
          rows={8}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Descreva ${title.toLowerCase()}...`}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-y focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-surface text-text"
        />
      )}
    </Modal>
  )
}
