import { Trash2 } from 'lucide-react'

interface Props {
  open: boolean
  titulo?: string
  mensaje?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ open, titulo = '¿Eliminar?', mensaje, onConfirm, onCancel }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onCancel}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Ícono */}
        <div className="flex justify-center pt-7 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <Trash2 size={24} className="text-red-500" />
          </div>
        </div>

        {/* Texto */}
        <div className="text-center px-6 pb-6">
          <h2 className="text-base font-bold text-gray-900">{titulo}</h2>
          {mensaje && <p className="text-sm text-gray-400 mt-1.5 leading-snug">{mensaje}</p>}
        </div>

        {/* Botones */}
        <div className="grid grid-cols-2 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="py-4 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="py-4 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
