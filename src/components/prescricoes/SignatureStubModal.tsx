import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function SignatureStubModal({ open, onClose, onConfirm }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Demonstração de assinatura"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>Registrar fluxo demo</Button>
        </div>
      }
    >
      <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        Sem validade jurídica. Isto não é assinatura ICP-Brasil.
      </div>
      <p className="text-sm text-text-secondary mb-4">
        Integração com certificado A1, A3, nuvem ou BirdID fica para uma versão futura. Hoje o PDF
        sai marcado como simulação.
      </p>
      <ul className="text-sm space-y-2 text-text">
        <li>• Certificado A1 (arquivo): futuro</li>
        <li>• Certificado A3 (token): futuro</li>
        <li>• Assinatura em nuvem: futuro</li>
        <li>• BirdID: futuro</li>
      </ul>
    </Modal>
  )
}
