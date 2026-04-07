import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import type { CategoriaGasto } from '../../types/database'
import { X, Trash2, Receipt, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSheetDrag } from '../../hooks/useSheetDrag'

const CATEGORIAS: Record<CategoriaGasto, { label: string; emoji: string }> = {
  aseo:          { label: 'Aseo',          emoji: '🧹' },
  mantenimiento: { label: 'Mantenimiento', emoji: '🔧' },
  reparacion:    { label: 'Reparación',    emoji: '🪛' },
  servicios:     { label: 'Servicios',     emoji: '💡' },
  impuestos:     { label: 'Impuestos',     emoji: '📋' },
  otro:          { label: 'Otro',          emoji: '📦' },
}

const CARD_GRADIENT = 'linear-gradient(135deg, rgba(220,38,38,0.92), rgba(239,68,68,0.80))'
const CARD_SHADOW   = '0 8px 32px rgba(220,38,38,0.35), inset 0 1px 0 rgba(255,255,255,0.18)'

interface Gasto {
  id: string
  categoria: CategoriaGasto
  monto: number
  fecha: string
  nota: string | null
  propiedad_id: string | null
  propiedades?: { nombre: string } | null
}

interface Props {
  open: boolean
  onClose: () => void
}

function infoMes(year: number, month: number) {
  const inicio = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const fin    = new Date(year, month + 1, 0).toISOString().slice(0, 10)
  const label  = new Date(year, month, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  return { inicio, fin, label }
}

export default function GastosHistorialPanel({ open, onClose }: Props) {
  const { tenant } = useTenant()
  const { handleProps, sheetStyle } = useSheetDrag(open, onClose)
  const hoy = new Date()
  const [year, setYear]   = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth())
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)

  const { inicio, fin, label } = infoMes(year, month)
  const esHoy = year === hoy.getFullYear() && month === hoy.getMonth()

  function navMes(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('gastos')
      .select('*, propiedades(nombre)')
      .eq('tenant_id', tenant!.id)
      .gte('fecha', inicio)
      .lte('fecha', fin)
      .order('fecha', { ascending: false })
    setGastos((data as Gasto[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!open || !tenant) return
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenant, year, month])

  async function eliminar(id: string) {
    setEliminando(id)
    await supabase.from('gastos').delete().eq('id', id)
    setGastos(prev => prev.filter(g => g.id !== id))
    setEliminando(null)
  }

  const total = gastos.reduce((sum, g) => sum + g.monto, 0)

  return (
    <div className={`fixed z-50 shadow-2xl ease-out flex flex-col overflow-hidden
      bottom-0 left-0 right-0 rounded-t-3xl max-h-[92vh]
      sm:top-0 sm:bottom-0 sm:left-auto sm:right-0 sm:w-[400px] sm:rounded-none sm:rounded-l-2xl sm:max-h-full
      ${open ? 'translate-y-0 sm:translate-x-0 transition-transform duration-300' : 'translate-y-full sm:translate-y-0 sm:translate-x-full pointer-events-none'}`}
      style={{ background: '#fff', ...sheetStyle }}
    >
      {/* ── Hero header — mismo estilo que la card ── */}
      <div
        className="flex-shrink-0 px-5 pt-5 pb-6"
        style={{ background: CARD_GRADIENT, boxShadow: CARD_SHADOW }}
      >
        {/* Drag handle blanco — solo móvil */}
        <div className="sm:hidden flex justify-center mb-4 -mt-2 cursor-grab active:cursor-grabbing" {...handleProps}>
          <div className="w-10 h-1 rounded-full bg-white/40" />
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Receipt size={18} className="text-white" />
            </div>
            <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Gastos</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1 -mt-0.5 -mr-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Selector de mes */}
        <div className="flex items-center justify-between mt-4 mb-1">
          <button
            onClick={() => navMes(-1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors active:scale-90"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-white capitalize">{label}</p>
            {esHoy && <p className="text-[10px] text-white/50">mes actual</p>}
          </div>
          <button
            onClick={() => navMes(1)}
            disabled={esHoy}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors active:scale-90 disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>

        {/* Total grande — igual que el valor en la card */}
        <div className="mt-4">
          <p className="text-4xl font-bold text-white leading-none">
            ${total.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-white/60 mt-1">
            {gastos.length} gasto{gastos.length !== 1 ? 's' : ''} registrado{gastos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Lista ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : gastos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-4xl">📭</span>
            <p className="text-sm text-gray-400">Sin gastos este mes</p>
          </div>
        ) : (
          gastos.map(g => {
            const cat = CATEGORIAS[g.categoria]
            return (
              <div
                key={g.id}
                className="flex items-center gap-3 p-3 rounded-2xl border transition-colors"
                style={{ background: 'rgba(220,38,38,0.04)', borderColor: 'rgba(220,38,38,0.10)' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'rgba(220,38,38,0.10)' }}
                >
                  {cat.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(220,38,38,0.12)', color: 'rgba(185,28,28,1)' }}
                    >
                      {cat.label}
                    </span>
                    {g.propiedades?.nombre && (
                      <span className="text-[10px] text-gray-400 truncate">{g.propiedades.nombre}</span>
                    )}
                  </div>
                  {g.nota && <p className="text-xs text-gray-500 mt-0.5 truncate">{g.nota}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: 'rgb(185,28,28)' }}>
                    ${g.monto.toLocaleString('es-CO')}
                  </p>
                  <button
                    onClick={() => eliminar(g.id)}
                    disabled={eliminando === g.id}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'rgba(220,38,38,0.35)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgb(220,38,38)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(220,38,38,0.35)')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
