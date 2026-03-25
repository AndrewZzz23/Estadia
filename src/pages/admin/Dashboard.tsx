import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import { Home, CalendarCheck, CalendarClock, TrendingUp, ArrowRight, Users } from 'lucide-react'
import { navyGlassStyle } from '../../lib/styles'
import QuickReservaPanel from '../../components/admin/QuickReservaPanel'
import type { CSSProperties } from 'react'

const cardStyles: CSSProperties[] = [
  // Ingresos — navy/teal oscuro
  navyGlassStyle,
  // Reservas vigentes — teal/esmeralda
  {
    background: 'linear-gradient(135deg, rgba(42,122,104,0.82), rgba(16,185,129,0.65))',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 8px 32px rgba(42,122,104,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    color: 'white', fontWeight: 600,
  },
  // Reservas este mes — azul índigo
  {
    background: 'linear-gradient(135deg, rgba(59,130,246,0.78), rgba(99,102,241,0.65))',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 8px 32px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
    color: 'white', fontWeight: 600,
  },
  // Propiedades — ámbar/cobre
  {
    background: 'linear-gradient(135deg, rgba(180,83,9,0.78), rgba(234,179,8,0.62))',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 8px 32px rgba(180,83,9,0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
    color: 'white', fontWeight: 600,
  },
]

interface Metricas {
  propiedades: number
  reservasActivas: number
  reservasMes: number
  ingresosMes: number
}

interface ProximaReserva {
  id: string
  cliente_nombre: string
  fecha_inicio: string
  fecha_fin: string
  noches: number
  monto_total: number | null
  propiedad_nombre: string
}

async function getPropiedadIds(tenantId: string) {
  const { data } = await supabase.from('propiedades').select('id, nombre').eq('tenant_id', tenantId)
  return (data as { id: string; nombre: string }[] | null) ?? []
}

export default function Dashboard() {
  const { tenant } = useTenant()
  const [metricas, setMetricas]   = useState<Metricas>({ propiedades: 0, reservasActivas: 0, reservasMes: 0, ingresosMes: 0 })
  const [proximas, setProximas]   = useState<ProximaReserva[]>([])
  const [loading, setLoading]     = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    if (!tenant) return
    async function cargar() {
      const hoy      = new Date().toISOString().split('T')[0]
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      const props = await getPropiedadIds(tenant!.id)
      const ids   = props.map(p => p.id)

      if (ids.length === 0) { setLoading(false); return }

      const nombreProp = (id: string) => props.find(p => p.id === id)?.nombre ?? '—'

      const [
        { count: propiedades },
        { count: reservasActivas },
        { data: reservasMesData },
        { data: proximasData },
      ] = await Promise.all([
        supabase.from('propiedades').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant!.id).eq('activa', true),
        supabase.from('reservas').select('*', { count: 'exact', head: true }).in('propiedad_id', ids).eq('estado', 'confirmada').gte('fecha_fin', hoy),
        supabase.from('reservas').select('monto_total').in('propiedad_id', ids).eq('estado', 'confirmada').gte('created_at', inicioMes),
        supabase.from('reservas').select('id, cliente_nombre, fecha_inicio, fecha_fin, noches, monto_total, propiedad_id')
          .in('propiedad_id', ids).eq('estado', 'confirmada').gte('fecha_fin', hoy)
          .order('fecha_inicio').limit(5),
      ])

      const ingresosMes = (reservasMesData as { monto_total: number | null }[] | null)
        ?.reduce((sum, r) => sum + (r.monto_total ?? 0), 0) ?? 0

      setMetricas({
        propiedades:     propiedades ?? 0,
        reservasActivas: reservasActivas ?? 0,
        reservasMes:     reservasMesData?.length ?? 0,
        ingresosMes,
      })

      setProximas(
        (proximasData as (ProximaReserva & { propiedad_id: string })[] | null)
          ?.map(r => ({ ...r, propiedad_nombre: nombreProp(r.propiedad_id) })) ?? []
      )
      setLoading(false)
    }
    cargar()
  }, [tenant])

  const hora    = new Date().getHours()
  const saludo  = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  const cards = [
    { label: 'Ingresos este mes',   value: `$${metricas.ingresosMes.toLocaleString('es-CO')}`, icon: TrendingUp    },
    { label: 'Reservas vigentes',   value: metricas.reservasActivas,                           icon: CalendarCheck },
    { label: 'Reservas este mes',   value: metricas.reservasMes,                               icon: CalendarClock },
    { label: 'Propiedades activas', value: metricas.propiedades,                               icon: Home          },
  ]

  function fmtFecha(iso: string) {
    const [, m, d] = iso.split('-')
    return `${d}/${m}`
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">

      {/* Saludo */}
      <div className="mb-6">
        <p className="text-sm text-gray-400">{saludo},</p>
        <h1 className="text-2xl font-bold text-[#1E3E50] leading-tight">{tenant?.nombre}</h1>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <>
          {/* ── Métricas ── */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {cards.map(({ label, value, icon: Icon }, i) => (
              <div
                key={label}
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={cardStyles[i]}
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-white/70">{label}</p>
                  <p className="text-2xl font-bold leading-tight text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Próximas reservas ── */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">Próximas reservas</p>
              <Link to="/admin/reservas" className="flex items-center gap-1 text-xs text-[#2A7A68] hover:underline">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>

            {proximas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-2">
                <CalendarCheck size={28} />
                <p className="text-sm">Sin reservas próximas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {proximas.map(r => (
                  <Link
                    key={r.id}
                    to={`/admin/reservas/${r.id}/editar`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar inicial */}
                    <div className="w-8 h-8 rounded-xl bg-[#2A7A68]/10 flex items-center justify-center flex-shrink-0">
                      <Users size={14} className="text-[#2A7A68]" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.cliente_nombre}</p>
                      <p className="text-xs text-gray-400 truncate">{r.propiedad_nombre}</p>
                    </div>

                    {/* Fechas + monto */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-600">{fmtFecha(r.fecha_inicio)} → {fmtFecha(r.fecha_fin)}</p>
                      {r.monto_total != null && (
                        <p className="text-xs text-[#2A7A68] font-semibold">${r.monto_total.toLocaleString('es-CO')}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Accesos rápidos ── */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPanelOpen(true)}
              className="flex flex-col items-center gap-2 bg-white rounded-2xl py-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-9 h-9 rounded-xl bg-[#2A7A68]/10 flex items-center justify-center">
                <CalendarCheck size={16} className="text-[#2A7A68]" />
              </div>
              <span className="text-[11px] font-medium text-gray-500 text-center leading-tight">Nueva reserva</span>
            </button>
            {[
              { label: 'Calendario',  to: '/admin/calendario',  icon: CalendarClock },
              { label: 'Propiedades', to: '/admin/propiedades', icon: Home          },
            ].map(({ label, to, icon: Icon }) => (
              <Link key={to} to={to}
                className="flex flex-col items-center gap-2 bg-white rounded-2xl py-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-9 h-9 rounded-xl bg-[#2A7A68]/10 flex items-center justify-center">
                  <Icon size={16} className="text-[#2A7A68]" />
                </div>
                <span className="text-[11px] font-medium text-gray-500 text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>

          {/* Backdrop + Panel */}
          {panelOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setPanelOpen(false)} />}
          <QuickReservaPanel
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            onCreated={() => { setPanelOpen(false); }}
          />
        </>
      )}
    </div>
  )
}
