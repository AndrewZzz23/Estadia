import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import type { EstadoReserva, Propiedad, Reserva } from '../../types/database'

interface ReservaConPropiedad extends Reserva {
  propiedades: Pick<Propiedad, 'id' | 'nombre'>
}

const ESTADOS: { value: EstadoReserva | 'todas'; label: string }[] = [
  { value: 'todas',      label: 'Todas'     },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'completada', label: 'Completadas' },
  { value: 'cancelada',  label: 'Canceladas'  },
]

const BADGE: Record<EstadoReserva, string> = {
  confirmada: 'bg-emerald-50 text-emerald-700',
  completada: 'bg-gray-100 text-gray-600',
  cancelada:  'bg-red-50 text-red-600',
}

function fmt(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function Reservas() {
  const { tenant } = useTenant()
  const [reservas, setReservas] = useState<ReservaConPropiedad[]>([])
  const [propiedades, setPropiedades] = useState<Pick<Propiedad, 'id' | 'nombre'>[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<EstadoReserva | 'todas'>('todas')
  const [filtroPropiedad, setFiltroPropiedad] = useState<string>('todas')

  useEffect(() => { cargar() }, [tenant])

  async function cargar() {
    if (!tenant) return

    const { data: props } = await supabase
      .from('propiedades')
      .select('id, nombre')
      .eq('tenant_id', tenant.id)
      .order('nombre')

    const ids = (props as Pick<Propiedad, 'id' | 'nombre'>[] ?? []).map(p => p.id)
    setPropiedades(props as Pick<Propiedad, 'id' | 'nombre'>[] ?? [])

    if (ids.length === 0) { setLoading(false); return }

    const { data } = await supabase
      .from('reservas')
      .select('*, propiedades(id, nombre)')
      .in('propiedad_id', ids)
      .order('fecha_inicio', { ascending: false })

    setReservas((data as ReservaConPropiedad[]) ?? [])
    setLoading(false)
  }

  async function cambiarEstado(id: string, estado: EstadoReserva) {
    await supabase.from('reservas').update({ estado } as never).eq('id', id)
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado } : r))
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta reserva?')) return
    await supabase.from('reservas').delete().eq('id', id)
    setReservas(prev => prev.filter(r => r.id !== id))
  }

  const filtradas = reservas.filter(r => {
    if (filtroEstado !== 'todas' && r.estado !== filtroEstado) return false
    if (filtroPropiedad !== 'todas' && r.propiedad_id !== filtroPropiedad) return false
    return true
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-brand-900">Reservas</h1>
        <Link
          to="/admin/reservas/nueva"
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nueva reserva
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value as EstadoReserva | 'todas')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
        >
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>

        <select
          value={filtroPropiedad}
          onChange={e => setFiltroPropiedad(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
        >
          <option value="todas">Todas las propiedades</option>
          {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>

        {filtradas.length > 0 && (
          <span className="text-xs text-gray-400 self-center">{filtradas.length} reserva{filtradas.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>No hay reservas{filtroEstado !== 'todas' ? ` ${filtroEstado}s` : ''}.</p>
          <Link to="/admin/reservas/nueva" className="text-brand-500 text-sm mt-2 inline-block hover:underline">
            Crear primera reserva
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map(r => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              {/* Fechas */}
              <div className="flex-shrink-0 text-center bg-cream rounded-lg px-3 py-2 min-w-[100px]">
                <p className="text-xs text-gray-400">Entrada</p>
                <p className="text-sm font-semibold text-brand-900">{fmt(r.fecha_inicio)}</p>
                <p className="text-xs text-gray-400 mt-1">{r.noches} noche{r.noches !== 1 ? 's' : ''}</p>
              </div>

              {/* Info cliente */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{r.cliente_nombre}</p>
                <p className="text-sm text-gray-400">{r.cliente_tel}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.propiedades?.nombre}</p>
              </div>

              {/* Monto */}
              {r.monto_total && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-brand-500">
                    ${r.monto_total.toLocaleString('es-CO')}
                  </p>
                </div>
              )}

              {/* Estado badge */}
              <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${BADGE[r.estado]}`}>
                {r.estado}
              </span>

              {/* Acciones */}
              <div className="flex-shrink-0 flex items-center gap-1">
                <Link
                  to={`/admin/reservas/${r.id}/editar`}
                  className="text-xs text-gray-400 hover:text-brand-600 px-2 py-1 rounded hover:bg-brand-50 transition-colors"
                >
                  Editar
                </Link>

                {r.estado === 'confirmada' && (
                  <button
                    onClick={() => cambiarEstado(r.id, 'completada')}
                    className="text-xs text-gray-400 hover:text-emerald-600 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                  >
                    Completar
                  </button>
                )}

                {r.estado === 'confirmada' && (
                  <button
                    onClick={() => cambiarEstado(r.id, 'cancelada')}
                    className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Cancelar
                  </button>
                )}

                <button
                  onClick={() => eliminar(r.id)}
                  className="text-xs text-gray-300 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
