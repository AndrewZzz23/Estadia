import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import { X, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSheetDrag } from '../../hooks/useSheetDrag'

const CARD_GRADIENT = 'linear-gradient(135deg, rgba(30,62,80,0.95), rgba(42,122,104,0.85))'
const CARD_SHADOW   = '0 8px 32px rgba(30,62,80,0.45), inset 0 1px 0 rgba(255,255,255,0.2)'

interface ReservaIngreso {
  id: string
  cliente_nombre: string
  monto_total: number | null
  fecha_inicio: string
  fecha_fin: string
  estado: string
  propiedades?: { nombre: string } | null
}

interface Props {
  open: boolean
  onClose: () => void
}

function infoMes(year: number, month: number) {
  const m     = String(month + 1).padStart(2, '0')
  const inicio = `${year}-${m}-01`
  const fin    = new Date(year, month + 1, 0).toISOString().slice(0, 10)
  const label  = new Date(year, month, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  return { inicio, fin, label }
}

function fmt(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export default function IngresosHistorialPanel({ open, onClose }: Props) {
  const { tenant } = useTenant()
  const { handleProps, sheetStyle } = useSheetDrag(open, onClose)
  const hoy = new Date()
  const [year, setYear]   = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth())
  const [reservas, setReservas] = useState<ReservaIngreso[]>([])
  const [loading, setLoading]   = useState(false)

  const { inicio, fin, label } = infoMes(year, month)
  const esHoy = year === hoy.getFullYear() && month === hoy.getMonth()

  function navMes(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  async function cargar() {
    setLoading(true)
    const { data: props } = await supabase
      .from('propiedades').select('id').eq('tenant_id', tenant!.id)
    const ids = (props as { id: string }[] ?? []).map(p => p.id)
    if (!ids.length) { setReservas([]); setLoading(false); return }

    const { data } = await supabase
      .from('reservas')
      .select('id, cliente_nombre, monto_total, fecha_inicio, fecha_fin, estado, propiedades(nombre)')
      .in('propiedad_id', ids)
      .in('estado', ['confirmada', 'completada'])
      .gte('fecha_inicio', inicio)
      .lte('fecha_inicio', fin)
      .order('fecha_inicio', { ascending: false })
    setReservas((data as ReservaIngreso[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!open || !tenant) return
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenant, year, month])

  const total = reservas.reduce((sum, r) => sum + (r.monto_total ?? 0), 0)

  const ESTADO_STYLE: Record<string, string> = {
    confirmada: 'bg-emerald-100 text-emerald-700',
    completada: 'bg-teal-600 text-white',
  }

  return (
    <div className={`fixed z-50 shadow-2xl ease-out flex flex-col overflow-hidden
      bottom-0 left-0 right-0 rounded-t-3xl max-h-[92vh]
      sm:top-0 sm:bottom-0 sm:left-auto sm:right-0 sm:w-[400px] sm:rounded-none sm:rounded-l-2xl sm:max-h-full
      ${open ? 'translate-y-0 sm:translate-x-0 transition-transform duration-300' : 'translate-y-full sm:translate-y-0 sm:translate-x-full pointer-events-none'}`}
      style={{ background: '#fff', ...sheetStyle }}
    >
      {/* ── Hero header ── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-6" style={{ background: CARD_GRADIENT, boxShadow: CARD_SHADOW }}>

        {/* Drag handle — solo móvil */}
        <div className="sm:hidden flex justify-center mb-4 -mt-2 cursor-grab active:cursor-grabbing" {...handleProps}>
          <div className="w-10 h-1 rounded-full bg-white/40" />
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Ingresos</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1 -mt-0.5 -mr-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Selector de mes */}
        <div className="flex items-center justify-between mt-4 mb-3">
          <button
            onClick={() => navMes(-1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
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
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>

        {/* Total */}
        <p className="text-4xl font-bold text-white leading-none">
          ${total.toLocaleString('es-CO')}
        </p>
        <p className="text-xs text-white/60 mt-1">
          {reservas.length} reserva{reservas.length !== 1 ? 's' : ''} con ingreso
        </p>
      </div>

      {/* ── Lista ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'rgba(30,62,80,0.3)', borderTopColor: 'transparent' }} />
          </div>
        ) : reservas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-4xl">📭</span>
            <p className="text-sm text-gray-400">Sin ingresos este mes</p>
          </div>
        ) : (
          reservas.map(r => (
            <div
              key={r.id}
              className="flex items-center gap-3 p-3 rounded-2xl border"
              style={{ background: 'rgba(30,62,80,0.04)', borderColor: 'rgba(30,62,80,0.10)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{ background: 'rgba(30,62,80,0.10)', color: '#1E3E50' }}
              >
                {r.cliente_nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.cliente_nombre}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ESTADO_STYLE[r.estado] ?? ''}`}>
                    {r.estado}
                  </span>
                </div>
                {r.propiedades?.nombre && (
                  <p className="text-xs text-gray-400 truncate">{r.propiedades.nombre}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {fmt(r.fecha_inicio)} → {fmt(r.fecha_fin)}
                </p>
              </div>
              <p className="text-sm font-bold flex-shrink-0" style={{ color: '#2A7A68' }}>
                {r.monto_total != null ? `$${r.monto_total.toLocaleString('es-CO')}` : '—'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
