import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import type { EstadoReserva, Propiedad, Reserva } from '../../types/database'
import { Pencil, Trash2, CheckCircle, XCircle, CalendarClock, Users } from 'lucide-react'
import ConfirmModal from '../../components/admin/ConfirmModal'
import QuickReservaPanel from '../../components/admin/QuickReservaPanel'
import { navyGlassStyle } from '../../lib/styles'

interface ReservaConPropiedad extends Reserva {
  propiedades: Pick<Propiedad, 'id' | 'nombre'>
}

const BADGE: Record<EstadoReserva, string> = {
  confirmada: 'bg-emerald-100 text-emerald-700',
  completada: 'bg-gray-100 text-gray-500',
  cancelada:  'bg-red-50 text-red-500',
}

function fmt(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

type Tab = 'proximas' | 'historial'

export default function Reservas() {
  const { tenant } = useTenant()
  const [reservas, setReservas]       = useState<ReservaConPropiedad[]>([])
  const [propiedades, setPropiedades] = useState<Pick<Propiedad, 'id' | 'nombre'>[]>([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<Tab>('proximas')
  const [filtroPropiedad, setFiltroPropiedad] = useState('todas')
  const [confirmId, setConfirmId]     = useState<string | null>(null)
  const [panelOpen, setPanelOpen]     = useState(false)

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => { cargar() }, [tenant])

  async function cargar() {
    if (!tenant) return
    const { data: props } = await supabase
      .from('propiedades').select('id, nombre').eq('tenant_id', tenant.id).order('nombre')
    const ids = (props as Pick<Propiedad, 'id' | 'nombre'>[] ?? []).map(p => p.id)
    setPropiedades(props as Pick<Propiedad, 'id' | 'nombre'>[] ?? [])
    if (ids.length === 0) { setLoading(false); return }
    const { data } = await supabase
      .from('reservas').select('*, propiedades(id, nombre)')
      .in('propiedad_id', ids).order('fecha_inicio', { ascending: false })
    setReservas((data as ReservaConPropiedad[]) ?? [])
    setLoading(false)
  }

  async function cambiarEstado(id: string, estado: EstadoReserva) {
    await supabase.from('reservas').update({ estado } as never).eq('id', id)
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado } : r))
  }

  async function eliminar() {
    if (!confirmId) return
    await supabase.from('reservas').delete().eq('id', confirmId)
    setReservas(prev => prev.filter(r => r.id !== confirmId))
    setConfirmId(null)
  }

  const filtradas = reservas.filter(r => {
    if (filtroPropiedad !== 'todas' && r.propiedad_id !== filtroPropiedad) return false
    if (tab === 'proximas') return r.estado === 'confirmada' && r.fecha_fin >= hoy
    return r.estado !== 'confirmada' || r.fecha_fin < hoy
  })

  // Proximas ordenadas ASC, historial ya viene DESC
  const lista = tab === 'proximas' ? [...filtradas].reverse() : filtradas

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Reservas</h1>
        <button
          onClick={() => setPanelOpen(true)}
          className="text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:scale-[1.03] active:scale-95"
          style={navyGlassStyle}
        >
          + Nueva
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-4 w-fit">
        {(['proximas', 'historial'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {t === 'proximas' ? 'Próximas' : 'Historial'}
          </button>
        ))}
      </div>

      {/* Filtro propiedad */}
      {propiedades.length > 1 && (
        <div className="mb-4">
          <select value={filtroPropiedad} onChange={e => setFiltroPropiedad(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A7A68]/30 bg-white">
            <option value="todas">Todas las propiedades</option>
            {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-3">
          <CalendarClock size={36} />
          <p className="text-sm text-gray-400">
            {tab === 'proximas' ? 'No hay reservas próximas' : 'El historial está vacío'}
          </p>
          {tab === 'proximas' && (
            <button onClick={() => setPanelOpen(true)} className="text-[#2A7A68] text-sm hover:underline">
              Crear primera reserva
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map(r => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

              {/* Bloque info */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-[#2A7A68]/10 flex items-center justify-center flex-shrink-0">
                  <Users size={15} className="text-[#2A7A68]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800 truncate">{r.cliente_nombre}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${BADGE[r.estado]}`}>
                      {r.estado}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{r.propiedades?.nombre}</p>
                </div>

                {/* Fechas + monto — desktop */}
                <div className="hidden sm:flex flex-col items-end flex-shrink-0">
                  <p className="text-xs font-medium text-gray-600">
                    {fmt(r.fecha_inicio)} → {fmt(r.fecha_fin)}
                    <span className="text-gray-400"> · {r.noches}n</span>
                  </p>
                  {r.monto_total != null && (
                    <p className="text-xs font-semibold text-[#2A7A68]">${r.monto_total.toLocaleString('es-CO')}</p>
                  )}
                </div>

                {/* Acciones — desktop */}
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  {r.estado === 'confirmada' && (
                    <button onClick={() => cambiarEstado(r.id, 'completada')}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors" title="Completar">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  {r.estado === 'confirmada' && (
                    <button onClick={() => cambiarEstado(r.id, 'cancelada')}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-orange-400 hover:bg-orange-50 transition-colors" title="Cancelar">
                      <XCircle size={15} />
                    </button>
                  )}
                  <Link to={`/admin/reservas/${r.id}/editar`}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-[#1E3E50] hover:bg-gray-100 transition-colors" title="Editar">
                    <Pencil size={15} />
                  </Link>
                  <button onClick={() => setConfirmId(r.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Bloque fechas + acciones — móvil */}
              <div className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">
                    {fmt(r.fecha_inicio)} → {fmt(r.fecha_fin)} · {r.noches} noche{r.noches !== 1 ? 's' : ''}
                  </p>
                  {r.monto_total != null && (
                    <p className="text-xs font-semibold text-[#2A7A68]">${r.monto_total.toLocaleString('es-CO')}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {r.estado === 'confirmada' && (
                    <button onClick={() => cambiarEstado(r.id, 'completada')}
                      className="p-2 rounded-xl text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors">
                      <CheckCircle size={16} />
                    </button>
                  )}
                  {r.estado === 'confirmada' && (
                    <button onClick={() => cambiarEstado(r.id, 'cancelada')}
                      className="p-2 rounded-xl text-gray-300 hover:text-orange-400 hover:bg-orange-50 transition-colors">
                      <XCircle size={16} />
                    </button>
                  )}
                  <Link to={`/admin/reservas/${r.id}/editar`}
                    className="p-2 rounded-xl text-gray-300 hover:text-[#1E3E50] hover:bg-gray-100 transition-colors">
                    <Pencil size={16} />
                  </Link>
                  <button onClick={() => setConfirmId(r.id)}
                    className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmId}
        titulo="¿Eliminar reserva?"
        mensaje="Esta acción no se puede deshacer."
        onConfirm={eliminar}
        onCancel={() => setConfirmId(null)}
      />

      {panelOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setPanelOpen(false)} />}
      <QuickReservaPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCreated={() => { setPanelOpen(false); cargar() }}
      />
    </div>
  )
}
