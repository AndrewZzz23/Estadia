import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import type { Bloqueo, Propiedad, Reserva } from '../../types/database'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getFestivos } from '../../lib/festivos'

const COLORES = [
  { bg: 'bg-[#2A7A68]',  text: 'text-white' },
  { bg: 'bg-[#C4693A]',  text: 'text-white' },
  { bg: 'bg-[#1E3E50]',  text: 'text-white' },
  { bg: 'bg-violet-500', text: 'text-white' },
  { bg: 'bg-amber-400',  text: 'text-amber-900' },
]

const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function ymd(d: Date) { return d.toISOString().slice(0, 10) }
function toDate(s: string) { return new Date(s + 'T00:00:00') }

interface Evento {
  id: string
  tipo: 'reserva' | 'bloqueo'
  propiedad_id: string
  fecha_inicio: string
  fecha_fin: string
  label: string
  colorIdx: number
}

export default function Calendario() {
  const { tenant } = useTenant()
  const hoy = new Date()
  const [year,  setYear]  = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth())
  const [propiedades, setPropiedades] = useState<Pick<Propiedad, 'id' | 'nombre'>[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [filtroProp, setFiltroProp] = useState('todas')
  const [loading, setLoading] = useState(true)       // solo carga inicial
  const [loadingMes, setLoadingMes] = useState(false) // navegación de mes
  const [popup, setPopup] = useState<Evento | null>(null)
  const inicializado = propiedades.length > 0 || !loading

  useEffect(() => { cargar() }, [tenant, year, month])

  async function cargar() {
    if (!tenant) return
    const esPrimeraCarga = !inicializado
    if (esPrimeraCarga) setLoading(true)
    else setLoadingMes(true)

    const primerDia = new Date(year, month, 1)
    const ultimoDia = new Date(year, month + 1, 0)
    const inicio = new Date(primerDia); inicio.setDate(inicio.getDate() - inicio.getDay())
    const fin    = new Date(ultimoDia); fin.setDate(fin.getDate() + (6 - fin.getDay()))

    const { data: props } = await supabase
      .from('propiedades').select('id, nombre')
      .eq('tenant_id', tenant.id).order('orden')

    const lista = (props as Pick<Propiedad,'id'|'nombre'>[] ?? [])
    setPropiedades(lista)
    const ids = lista.map(p => p.id)
    if (!ids.length) { setLoading(false); setLoadingMes(false); return }

    const colorMap: Record<string, number> = {}
    lista.forEach((p, i) => { colorMap[p.id] = i % COLORES.length })

    const desde = ymd(inicio)
    const hasta = ymd(fin)

    const [{ data: reservas }, { data: bloqueos }] = await Promise.all([
      supabase.from('reservas')
        .select('id, propiedad_id, fecha_inicio, fecha_fin, cliente_nombre')
        .in('propiedad_id', ids).neq('estado','cancelada')
        .lte('fecha_inicio', hasta).gte('fecha_fin', desde),
      supabase.from('bloqueos')
        .select('id, propiedad_id, fecha_inicio, fecha_fin, motivo')
        .in('propiedad_id', ids)
        .lte('fecha_inicio', hasta).gte('fecha_fin', desde),
    ])

    setEventos([
      ...((reservas as (Reserva & {cliente_nombre:string})[]) ?? []).map(r => ({
        id: r.id, tipo: 'reserva' as const,
        propiedad_id: r.propiedad_id,
        fecha_inicio: r.fecha_inicio, fecha_fin: r.fecha_fin,
        label: r.cliente_nombre, colorIdx: colorMap[r.propiedad_id] ?? 0,
      })),
      ...((bloqueos as Bloqueo[]) ?? []).map(b => ({
        id: b.id, tipo: 'bloqueo' as const,
        propiedad_id: b.propiedad_id,
        fecha_inicio: b.fecha_inicio, fecha_fin: b.fecha_fin,
        label: b.motivo ?? 'Bloqueado', colorIdx: colorMap[b.propiedad_id] ?? 0,
      })),
    ])
    setLoading(false)
    setLoadingMes(false)
  }

  const primerDiaMes = new Date(year, month, 1)
  const inicioGrid   = new Date(primerDiaMes)
  inicioGrid.setDate(inicioGrid.getDate() - inicioGrid.getDay())

  const dias: Date[] = []
  const cur = new Date(inicioGrid)
  while (dias.length < 35 || cur.getMonth() === month) {
    dias.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
    if (dias.length >= 42) break
  }
  while (dias.length % 7 !== 0) { dias.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }

  function eventosDelDia(dia: Date) {
    const d = ymd(dia)
    return eventos.filter(ev => {
      if (filtroProp !== 'todas' && ev.propiedad_id !== filtroProp) return false
      return ev.fecha_inicio <= d && ev.fecha_fin > d
    })
  }

  function navMes(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear()); setMonth(d.getMonth())
  }

  const hoyStr  = ymd(hoy)
  const festivos = getFestivos(year)

  return (
    <div className="p-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navMes(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 w-48 text-center">
            {MESES[month]} {year}
          </h1>
          <button onClick={() => navMes(1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight size={18} className="text-gray-500" />
          </button>
          <button
            onClick={() => { setYear(hoy.getFullYear()); setMonth(hoy.getMonth()) }}
            className="text-xs text-brand-500 hover:text-brand-700 px-2.5 py-1 rounded-lg hover:bg-brand-50 transition-colors"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filtroProp}
            onChange={e => setFiltroProp(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          >
            <option value="todas">Todas las propiedades</option>
            {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <Link
            to="/admin/reservas/nueva"
            className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            + Reserva
          </Link>
        </div>
      </div>

      <div className="flex gap-4 mb-3 flex-wrap">
        {propiedades.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`w-2.5 h-2.5 rounded-full ${COLORES[i % COLORES.length].bg}`} />
            {p.nombre}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          Bloqueo
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          Festivo
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 mt-4">Cargando...</p>
      ) : (
        <div className="flex gap-6 flex-1 overflow-hidden">

          {/* ── Calendario ── */}
          <div className="flex-1 overflow-auto min-w-0 relative">
            {loadingMes && (
              <div className="absolute inset-0 bg-white/60 z-10 rounded-xl flex items-center justify-center">
                <span className="text-xs text-gray-400">Cargando...</span>
              </div>
            )}
            <div className="grid grid-cols-7 mb-1">
              {DIAS.map(d => (
                <div key={d} className="text-xs font-semibold text-gray-400 text-center py-1 uppercase tracking-wide">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
              {dias.map((dia, i) => {
                const esMes   = dia.getMonth() === month
                const esHoy   = ymd(dia) === hoyStr
                const dStr    = ymd(dia)
                const festivo = festivos.get(dStr)
                const evs     = eventosDelDia(dia)

                return (
                  <div key={i} className={`p-1.5 min-h-[88px] ${!esMes ? 'bg-gray-50' : festivo ? 'bg-amber-50' : 'bg-white'}`}>
                    <div
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1
                      ${esHoy ? 'bg-brand-500 text-white' : festivo ? 'text-amber-700 font-semibold' : esMes ? 'text-gray-700' : 'text-gray-300'}`}
                      title={festivo}
                    >
                      {dia.getDate()}
                    </div>

                    <div className="space-y-0.5">
                      {evs.slice(0, 3).map(ev => {
                        const color    = COLORES[ev.colorIdx]
                        const esInicio = ymd(dia) === ev.fecha_inicio
                        return (
                          <button
                            key={ev.id}
                            onClick={() => setPopup(ev)}
                            className={`w-full text-left text-[10px] px-1.5 py-px rounded truncate leading-4
                              ${ev.tipo === 'bloqueo' ? 'bg-gray-200 text-gray-600' : `${color.bg} ${color.text}`}`}
                            title={ev.label}
                          >
                            {esInicio ? ev.label : <span className="opacity-0">·</span>}
                          </button>
                        )
                      })}
                      {evs.length > 3 && (
                        <p className="text-[10px] text-gray-400 px-1">+{evs.length - 3}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Sidebar: próximos festivos ── */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Próximos festivos</h2>
              <div className="space-y-2">
                {(() => {
                  const hoyStr2 = ymd(hoy)
                  // Recopilar festivos de este año y el siguiente
                  const todos = [
                    ...Array.from(getFestivos(year).entries()),
                    ...Array.from(getFestivos(year + 1).entries()),
                  ]
                    .filter(([d]) => d >= hoyStr2)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(0, 8)

                  if (todos.length === 0) return <p className="text-xs text-gray-400">Sin festivos próximos</p>

                  return todos.map(([d, nombre]) => {
                    const fecha = toDate(d)
                    return (
                      <div key={d} className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 bg-amber-100 rounded-lg px-2 py-1 text-center min-w-[36px]">
                          <p className="text-[10px] text-amber-600 font-medium uppercase leading-none">
                            {fecha.toLocaleDateString('es-CO', { month: 'short' })}
                          </p>
                          <p className="text-sm font-bold text-amber-700 leading-tight">{fecha.getDate()}</p>
                        </div>
                        <p className="text-xs text-gray-600 leading-tight pt-0.5">{nombre}</p>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>

        </div>
      )}

      {popup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPopup(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium
                  ${popup.tipo === 'bloqueo' ? 'bg-gray-100 text-gray-600' : 'bg-brand-50 text-brand-600'}`}>
                  {popup.tipo === 'bloqueo' ? 'Bloqueo' : 'Reserva'}
                </span>
                <p className="font-semibold text-gray-900 mt-2">{popup.label}</p>
              </div>
              <button onClick={() => setPopup(null)} className="text-gray-300 hover:text-gray-500 text-xl leading-none">✕</button>
            </div>

            <div className="space-y-1.5 text-sm text-gray-600 mb-5">
              <p><span className="text-gray-400">Propiedad: </span>{propiedades.find(p => p.id === popup.propiedad_id)?.nombre ?? '—'}</p>
              <p><span className="text-gray-400">Entrada: </span>{toDate(popup.fecha_inicio).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}</p>
              <p><span className="text-gray-400">Salida: </span>{toDate(popup.fecha_fin).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}</p>
            </div>

            {popup.tipo === 'reserva' && (
              <Link
                to={`/admin/reservas/${popup.id}/editar`}
                onClick={() => setPopup(null)}
                className="block text-center bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                Ver / editar reserva
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}