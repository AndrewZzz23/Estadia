import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import { CalendarCheck, CalendarClock, TrendingUp, ArrowRight, Receipt } from 'lucide-react'
import { getFestivos } from '../../lib/festivos'
import { navyGlassStyle } from '../../lib/styles'
import QuickReservaPanel from '../../components/admin/QuickReservaPanel'
import GastoPanel from '../../components/admin/GastoPanel'
import GastosHistorialPanel from '../../components/admin/GastosHistorialPanel'
import IngresosHistorialPanel from '../../components/admin/IngresosHistorialPanel'
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
  // Gastos — coral/rojo
  {
    background: 'linear-gradient(135deg, rgba(220,38,38,0.75), rgba(239,68,68,0.60))',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 8px 32px rgba(220,38,38,0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
    color: 'white', fontWeight: 600,
  },
]

interface Metricas {
  propiedades: number
  reservasActivas: number
  reservasMes: number
  ingresosMes: number
  gastosMes: number
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
  const [metricas, setMetricas]   = useState<Metricas>({ propiedades: 0, reservasActivas: 0, reservasMes: 0, ingresosMes: 0, gastosMes: 0 })
  const [, setProximas]         = useState<ProximaReserva[]>([])
  const [semanaProps, setSemanaProps]   = useState<{ id: string; nombre: string }[]>([])
  const [semanaRes, setSemanaRes]       = useState<{ propiedad_id: string; fecha_inicio: string; fecha_fin: string; cliente_nombre: string }[]>([])
  const [loading, setLoading]           = useState(true)
  const [panelOpen, setPanelOpen]       = useState(false)
  const [gastoOpen, setGastoOpen]             = useState(false)
  const [gastosHistorialOpen, setGastosHistorialOpen]     = useState(false)
  const [ingresosHistorialOpen, setIngresosHistorialOpen] = useState(false)

  useEffect(() => {
    if (!tenant) return
    async function cargar() {
      const hoy      = new Date().toISOString().split('T')[0]
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      const props = await getPropiedadIds(tenant!.id)
      const ids   = props.map(p => p.id)

      if (ids.length === 0) { setLoading(false); return }

      const nombreProp = (id: string) => props.find(p => p.id === id)?.nombre ?? '—'
      setSemanaProps(props)

      const semanaFin = new Date(hoy)
      semanaFin.setDate(semanaFin.getDate() + 6)
      const semanaFinStr = semanaFin.toISOString().slice(0, 10)

      const [
        { count: propiedades },
        { count: reservasActivas },
        { data: reservasMesData },
        { data: proximasData },
        { data: gastosMesData },
        { data: semanaData },
      ] = await Promise.all([
        supabase.from('propiedades').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant!.id).eq('activa', true),
        supabase.from('reservas').select('*', { count: 'exact', head: true }).in('propiedad_id', ids).eq('estado', 'confirmada').gte('fecha_fin', hoy),
        supabase.from('reservas').select('monto_total').in('propiedad_id', ids).in('estado', ['confirmada', 'completada']).gte('created_at', inicioMes),
        supabase.from('reservas').select('id, cliente_nombre, fecha_inicio, fecha_fin, noches, monto_total, propiedad_id')
          .in('propiedad_id', ids).eq('estado', 'confirmada').gte('fecha_fin', hoy)
          .order('fecha_inicio').limit(5),
        supabase.from('gastos').select('monto').eq('tenant_id', tenant!.id).gte('fecha', inicioMes),
        supabase.from('reservas').select('propiedad_id, fecha_inicio, fecha_fin, cliente_nombre')
          .in('propiedad_id', ids).neq('estado', 'cancelada')
          .lte('fecha_inicio', semanaFinStr).gte('fecha_fin', hoy),
      ])

      const ingresosMes = (reservasMesData as { monto_total: number | null }[] | null)
        ?.reduce((sum, r) => sum + (r.monto_total ?? 0), 0) ?? 0
      const gastosMes = (gastosMesData as { monto: number }[] | null)
        ?.reduce((sum, g) => sum + g.monto, 0) ?? 0

      setMetricas({
        propiedades:     propiedades ?? 0,
        reservasActivas: reservasActivas ?? 0,
        reservasMes:     reservasMesData?.length ?? 0,
        ingresosMes,
        gastosMes,
      })

      setProximas(
        (proximasData as (ProximaReserva & { propiedad_id: string })[] | null)
          ?.map(r => ({ ...r, propiedad_nombre: nombreProp(r.propiedad_id) })) ?? []
      )
      setSemanaRes((semanaData as { propiedad_id: string; fecha_inicio: string; fecha_fin: string; cliente_nombre: string }[]) ?? [])
      setLoading(false)
    }
    cargar()
  }, [tenant])

  const hora    = new Date().getHours()
  const saludo  = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  const cards = [
    { label: 'Ingresos este mes',   value: `$${metricas.ingresosMes.toLocaleString('es-CO')}`, icon: TrendingUp,    styleIdx: 0 },
    { label: 'Gastos este mes',     value: `$${metricas.gastosMes.toLocaleString('es-CO')}`,   icon: Receipt,       styleIdx: 4 },
    { label: 'Reservas vigentes',   value: metricas.reservasActivas,                           icon: CalendarCheck, styleIdx: 1 },
    { label: 'Reservas este mes',   value: metricas.reservasMes,                               icon: CalendarClock, styleIdx: 2 },
  ]

  const balance = metricas.ingresosMes - metricas.gastosMes

  const TIMELINE_COLORS = ['#2A7A68', '#C4693A', '#1E3E50', '#7C3AED', '#D97706']
  const DIAS_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  const festivosMap = getFestivos(new Date().getFullYear())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const ymd = d.toISOString().slice(0, 10)
    return {
      ymd,
      short:    DIAS_SHORT[d.getDay()],
      num:      d.getDate(),
      isToday:  i === 0,
      festivo:  festivosMap.get(ymd) ?? null,
    }
  })


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
          {/* Balance neto */}
          <div className="mb-3 px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">Balance neto del mes</p>
            <p className={`text-base font-bold ${balance >= 0 ? 'text-[#2A7A68]' : 'text-red-500'}`}>
              {balance >= 0 ? '+' : ''}${balance.toLocaleString('es-CO')}
            </p>
          </div>

          {/* ── Métricas ── */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {cards.map(({ label, value, icon: Icon, styleIdx }) => {
              const onClick =
                label === 'Gastos este mes'   ? () => setGastosHistorialOpen(true) :
                label === 'Ingresos este mes' ? () => setIngresosHistorialOpen(true) : null

              return onClick ? (
                <button
                  key={label}
                  onClick={onClick}
                  className="rounded-2xl p-4 flex flex-col gap-3 text-left active:scale-95 transition-transform"
                  style={cardStyles[styleIdx]}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                      <Icon size={15} className="text-white" />
                    </div>
                    <span className="text-[10px] text-white/60 font-medium">Ver historial →</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-white/70">{label}</p>
                    <p className="text-2xl font-bold leading-tight text-white">{value}</p>
                  </div>
                </button>
              ) : (
                <div key={label} className="rounded-2xl p-4 flex flex-col gap-3" style={cardStyles[styleIdx]}>
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Icon size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-white/70">{label}</p>
                    <p className="text-2xl font-bold leading-tight text-white">{value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Mini semana ── */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">Esta semana</p>
              <Link to="/admin/calendario" className="flex items-center gap-1 text-xs text-[#2A7A68] hover:underline">
                Ver calendario <ArrowRight size={12} />
              </Link>
            </div>
            <div className="px-3 pt-3 pb-4">
              {/* 7 chips de días */}
              <div className="grid grid-cols-7 gap-1.5 mb-3">
                {weekDays.map(d => {
                  const dots = semanaProps
                    .map((p, pi) => semanaRes.some(r => r.propiedad_id === p.id && r.fecha_inicio <= d.ymd && r.fecha_fin > d.ymd) ? pi : null)
                    .filter(pi => pi !== null) as number[]

                  return (
                    <div
                      key={d.ymd}
                      title={d.festivo ?? undefined}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                        d.isToday
                          ? 'bg-[#1E3E50]/8 ring-1 ring-[#1E3E50]/20'
                          : d.festivo
                          ? 'bg-amber-50 ring-1 ring-amber-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <p className={`text-[9px] font-semibold uppercase leading-none ${d.festivo ? 'text-amber-500' : 'text-gray-400'}`}>{d.short}</p>
                      <p className={`text-sm font-bold leading-tight ${d.isToday ? 'text-[#1E3E50]' : d.festivo ? 'text-amber-700' : 'text-gray-600'}`}>{d.num}</p>
                      {/* Puntos de ocupación */}
                      <div className="flex gap-0.5 min-h-[6px]">
                        {dots.length > 0
                          ? dots.map(pi => (
                              <span
                                key={pi}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: TIMELINE_COLORS[pi % TIMELINE_COLORS.length] }}
                              />
                            ))
                          : <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                        }
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Leyenda propiedades */}
              {semanaProps.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {semanaProps.map((p, pi) => (
                    <div key={p.id} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TIMELINE_COLORS[pi % TIMELINE_COLORS.length] }} />
                      <span className="text-[10px] text-gray-400">{p.nombre}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Accesos rápidos ── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-3 px-4 py-4 rounded-2xl active:scale-95 transition-transform text-left"
              style={{
                background: 'linear-gradient(135deg, #1E3E50 0%, #2A7A68 100%)',
                boxShadow: '0 4px 16px rgba(30,62,80,0.35)',
              }}
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <CalendarCheck size={18} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-white leading-tight">Nueva reserva</span>
            </button>

            <button
              onClick={() => setGastoOpen(true)}
              className="flex items-center gap-3 px-4 py-4 rounded-2xl active:scale-95 transition-transform text-left"
              style={{
                background: 'linear-gradient(135deg, #7C3A2A 0%, #C4693A 100%)',
                boxShadow: '0 4px 16px rgba(196,105,58,0.35)',
              }}
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Receipt size={18} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-white leading-tight">Registrar gasto</span>
            </button>
          </div>

          {/* Backdrop + Panels */}
          {(panelOpen || gastoOpen || gastosHistorialOpen || ingresosHistorialOpen) && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => { setPanelOpen(false); setGastoOpen(false); setGastosHistorialOpen(false); setIngresosHistorialOpen(false) }} />
          )}
          <QuickReservaPanel
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            onCreated={() => setPanelOpen(false)}
          />
          <GastoPanel
            open={gastoOpen}
            onClose={() => setGastoOpen(false)}
            onCreated={() => { setGastoOpen(false); }}
          />
          <GastosHistorialPanel
            open={gastosHistorialOpen}
            onClose={() => setGastosHistorialOpen(false)}
          />
          <IngresosHistorialPanel
            open={ingresosHistorialOpen}
            onClose={() => setIngresosHistorialOpen(false)}
          />
        </>
      )}
    </div>
  )
}
