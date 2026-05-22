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
      title="Assinatura digital"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>Simular assinatura (demo)</Button>
        </div>
      }
    >
      <p className="text-sm text-text-secondary mb-4">
        Integração com certificado A1/A3, nuvem ou BirdID será habilitada em versão futura.
      </p>
      <ul className="text-sm space-y-2 text-text">
        <li>• Certificado A1 (arquivo)</li>
        <li>• Certificado A3 (token)</li>
        <li>• Assinatura em nuvem</li>
        <li>• BirdID</li>
      </ul>
    </Modal>
  )
}
