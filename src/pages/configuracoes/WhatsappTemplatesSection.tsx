import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, type WhatsappTemplate } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

export default function WhatsappTemplatesSection() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([])
  const [name, setName] = useState("")
  const [body, setBody] = useState("")
  const [category, setCategory] = useState("MANUAL")

  const load = () =>
    api.whatsapp
      .listTemplates()
      .then(setTemplates)
      .catch((e: unknown) =>
        toast(toastMessageFromApiError(e, "Erro ao carregar templates"), "error")
      )

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    if (!name.trim() || !body.trim()) {
      toast("Preencha nome e texto", "error")
      return
    }
    try {
      await api.whatsapp.createTemplate({ name: name.trim(), body, category })
      setName("")
      setBody("")
      setCategory("MANUAL")
      await load()
      toast("Template criado")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao criar"), "error")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.whatsapp.deleteTemplate(id)
      await load()
      toast("Template removido")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao remover"), "error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-text">Novo template</h2>
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-text">Categoria</label>
          <select
            className="mt-1 w-full h-10 rounded-lg border border-border px-3 text-sm bg-surface text-text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="MANUAL">Manual</option>
            <option value="APPOINTMENT_REMINDER">Lembrete de consulta</option>
            <option value="CONFIRMATION">Confirmação</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-text">Texto</label>
          <textarea
            className="mt-1 w-full min-h-[100px] rounded-lg border border-border px-3 py-2 text-sm bg-surface text-text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Olá {{nome}}, sua consulta é em {{data}} às {{hora}}..."
          />
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Categoria</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-3 font-medium text-text">{t.name}</td>
                <td className="p-3 text-text-secondary">{t.category}</td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    className="p-2 text-text-secondary hover:text-danger"
                    onClick={() => handleDelete(t.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
