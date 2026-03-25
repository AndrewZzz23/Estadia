import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const hoy = new Date()
  const [year,  setYear]  = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth())
  const [propiedades, setPropiedades] = useState<Pick<Propiedad, 'id' | 'nombre'>[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [filtroProp, setFiltroProp] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [loadingMes, setLoadingMes] = useState(false)
  const [festivoActivo, setFestivoActivo] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ day: string; x: number; y: number } | null>(null)
  const [dayModal, setDayModal] = useState<string | null>(null)
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

  function irAFestivo(dateStr: string) {
    const d = toDate(dateStr)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
    setFestivoActivo(dateStr)
    setTimeout(() => setFestivoActivo(null), 2000)
  }

  const hoyStr  = ymd(hoy)
  const festivos = getFestivos(year)

  const festivosList = (() => {
    const hoyStr2 = ymd(hoy)
    return [
      ...Array.from(getFestivos(year).entries()),
      ...Array.from(getFestivos(year + 1).entries()),
    ]
      .filter(([d]) => d >= hoyStr2)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 8)
  })()

  const AMBER = { r: 245, g: 158, b: 11 }

  const festivoGlass = {
    background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.08) 100%)',
    border: '1px solid rgba(245,158,11,0.35)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 10px rgba(245,158,11,0.15)',
  }

  const festivoDivider = 'rgba(245,158,11,0.35)'
  const festivoAccent  = `rgb(${AMBER.r},${AMBER.g},${AMBER.b})`

  // Panel vertical — desktop sidebar
  function renderFestivosSidebar() {
    return (
      <div className="rounded-2xl overflow-hidden w-full flex flex-col" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,1)' }}>
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Próximos festivos</p>
        </div>
        {festivosList.length === 0 ? (
          <p className="text-xs text-gray-300 px-4 pb-4">Sin festivos próximos</p>
        ) : (
          <ul className="px-3 pb-3 space-y-1.5">
            {festivosList.map(([d, nombre]) => {
              const fecha  = toDate(d)
              const mes    = fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.','')
              const activo = festivoActivo === d
              return (
                <li
                  key={d}
                  onClick={() => irAFestivo(d)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02] select-none"
                  style={{
                    ...festivoGlass,
                    ...(activo ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 0 0 2px rgba(245,158,11,0.6), 0 2px 10px rgba(245,158,11,0.3)' } : {}),
                  }}
                >
                  <div className="flex-shrink-0 w-8 text-center">
                    <p className="text-[9px] font-bold uppercase leading-none tracking-wider" style={{ color: festivoAccent }}>{mes}</p>
                    <p className="text-base font-bold text-gray-800 leading-tight">{fecha.getDate()}</p>
                  </div>
                  <div className="w-px h-6 flex-shrink-0" style={{ background: festivoDivider }} />
                  <p className="text-[11px] text-gray-600 leading-snug">{nombre}</p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  // Lista horizontal — mobile (debajo del calendario)
  function renderFestivosMobile() {
    return (
      <div className="rounded-2xl px-4 pt-4 pb-4" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,1)' }}>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Próximos festivos</p>
        {festivosList.length === 0 ? (
          <p className="text-xs text-gray-300">Sin festivos próximos</p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 py-2 -my-2">
            <div className="flex gap-2" style={{ width: 'max-content' }}>
              {festivosList.map(([d, nombre]) => {
                const fecha  = toDate(d)
                const mes    = fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.','')
                const activo = festivoActivo === d
                return (
                  <div
                    key={d}
                    onClick={() => irAFestivo(d)}
                    className="flex-shrink-0 rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] select-none"
                    style={{
                      ...festivoGlass,
                      ...(activo ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 0 0 2px rgba(245,158,11,0.6), 0 2px 10px rgba(245,158,11,0.3)' } : {}),
                    }}
                  >
                    <div className="text-center flex-shrink-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider leading-none" style={{ color: festivoAccent }}>{mes}</p>
                      <p className="text-lg font-bold text-gray-800 leading-tight">{fecha.getDate()}</p>
                    </div>
                    <div className="w-px h-6 flex-shrink-0" style={{ background: festivoDivider }} />
                    <p className="text-[11px] text-gray-600 leading-snug max-w-[88px]">{nombre}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 flex flex-col overflow-y-auto">

      {/* ── Filtros y acciones ── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select
          value={filtroProp}
          onChange={e => setFiltroProp(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white max-w-[140px] sm:max-w-none"
        >
          <option value="todas">Todas las propiedades</option>
          {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <p className="ml-auto text-xs text-gray-400 flex items-center gap-1.5">
          <span className="text-base leading-none">👆</span>
          Toca un día libre para crear una reserva
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 mt-4">Cargando...</p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">

          {/* ── Grilla del mes ── */}
          <div className="flex-1 relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {loadingMes && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* ── Header mes ── */}
            <div
              className="flex items-center justify-between px-3 py-2.5"
              style={{
                backgroundColor: '#1E3E50',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              {/* Navegación centrada pegada al nombre */}
              <div className="flex-1 flex justify-center items-center gap-0.5">
                <button
                  onClick={() => navMes(-1)}
                  className="p-1.5 rounded-lg transition-all hover:brightness-125"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  <ChevronLeft size={16} className="text-white/70" />
                </button>
                <h1 className="text-base font-bold text-white px-2 tracking-wide">
                  {MESES[month]} {year}
                </h1>
                <button
                  onClick={() => navMes(1)}
                  className="p-1.5 rounded-lg transition-all hover:brightness-125"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  <ChevronRight size={16} className="text-white/70" />
                </button>
              </div>
              {/* Hoy a la derecha */}
              <button
                onClick={() => { setYear(hoy.getFullYear()); setMonth(hoy.getMonth()) }}
                className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                Hoy
              </button>
            </div>

            {/* Cabecera días */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {DIAS.map((d, i) => (
                <div
                  key={d}
                  className={`py-2 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest
                    ${i === 0 || i === 6 ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
              {dias.map((dia, i) => {
                const esMes   = dia.getMonth() === month
                const esHoy   = ymd(dia) === hoyStr
                const esFinde = dia.getDay() === 0 || dia.getDay() === 6
                const dStr    = ymd(dia)
                const festivo = festivos.get(dStr)
                const evs     = eventosDelDia(dia)

                const esFestivoActivo = festivoActivo === dStr
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (evs.length > 0) { setTooltip(null); setDayModal(dStr) }
                      else navigate(`/admin/reservas/nueva?fecha=${dStr}`)
                    }}
                    onMouseEnter={evs.length > 0 ? (e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      setTooltip({ day: dStr, x: rect.left, y: rect.top })
                    } : undefined}
                    onMouseLeave={evs.length > 0 ? () => setTooltip(null) : undefined}
                    className={`p-1.5 sm:p-2 min-h-[60px] sm:min-h-[90px] transition-all duration-300 cursor-pointer
                      ${esFestivoActivo ? 'bg-amber-100' : !esMes ? 'bg-gray-50/60' : esFinde && !festivo ? 'bg-gray-50/40' : !festivo ? 'bg-white' : ''}`}
                    style={
                      esFestivoActivo
                        ? { boxShadow: 'inset 0 0 0 2px rgba(245,158,11,0.5)' }
                        : esHoy
                        ? { background: 'linear-gradient(135deg, rgba(30,62,80,0.1) 0%, rgba(30,62,80,0.05) 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(30,62,80,0.2)' }
                        : festivo
                        ? { background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.08) 100%)' }
                        : {}
                    }
                  >
                    {/* Número del día */}
                    <div className="flex justify-end mb-1">
                      {esHoy ? (
                        <span
                          className="text-[11px] sm:text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                          style={{
                            background: 'linear-gradient(135deg, rgba(30,62,80,0.90), rgba(30,62,80,0.65))',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px rgba(30,62,80,0.45)',
                            border: '1px solid rgba(30,62,80,0.4)',
                            color: 'white',
                          }}
                        >
                          {dia.getDate()}
                        </span>
                      ) : festivo ? (
                        <span
                          className="text-[11px] sm:text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full text-amber-800"
                          title={festivo}
                          style={{
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.85), rgba(251,191,36,0.65))',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), 0 2px 6px rgba(245,158,11,0.4)',
                            border: '1px solid rgba(245,158,11,0.45)',
                          }}
                        >
                          {dia.getDate()}
                        </span>
                      ) : (
                        <span
                          className={`text-[11px] sm:text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                            ${esMes ? esFinde ? 'text-gray-500' : 'text-gray-800' : 'text-gray-400'}`}
                        >
                          {dia.getDate()}
                        </span>
                      )}
                    </div>

                    {/* Eventos */}
                    <div className="space-y-0.5">
                      {evs.slice(0, 2).map(ev => {
                        const color    = COLORES[ev.colorIdx]
                        const esInicio = ymd(dia) === ev.fecha_inicio
                        return (
                          <div
                            key={ev.id}
                            className={`w-full text-left text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium leading-4
                              ${ev.tipo === 'bloqueo'
                                ? 'bg-gray-100 text-gray-500'
                                : `${color.bg} ${color.text} opacity-90`}`}
                            title={ev.label}
                          >
                            {esInicio ? ev.label : <span className="opacity-0">·</span>}
                          </div>
                        )
                      })}
                      {evs.length > 2 && (
                        <span className="text-[9px] text-gray-400 px-1.5 font-medium">
                          +{evs.length - 2} más
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Leyenda */}
            {propiedades.length > 0 && (
              <div className="flex gap-3 px-3 py-2.5 border-t border-gray-100 flex-wrap">
                {propiedades.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${COLORES[i % COLORES.length].bg}`} />
                    {p.nombre}
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-gray-300" />Bloqueo
                </div>
              </div>
            )}
          </div>

          {/* ── Festivos lateral — solo desktop ── */}
          <div className="hidden lg:flex w-56 flex-shrink-0">
            {renderFestivosSidebar()}
          </div>

          {/* ── Festivos horizontal — solo mobile/tablet ── */}
          <div className="lg:hidden">
            {renderFestivosMobile()}
          </div>

        </div>
      )}

      {/* ── Modal día ocupado ── */}
      {dayModal && (() => {
        const evsDia = eventos.filter(ev => {
          if (filtroProp !== 'todas' && ev.propiedad_id !== filtroProp) return false
          return ev.fecha_inicio <= dayModal && ev.fecha_fin > dayModal
        })
        const fecha = toDate(dayModal)
        const fechaLabel = fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDayModal(null)}>
            <div
              className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4 flex items-start justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Día ocupado</p>
                  <h2 className="text-base font-bold text-gray-900 capitalize">{fechaLabel}</h2>
                </div>
                <button onClick={() => setDayModal(null)} className="text-gray-300 hover:text-gray-500 text-xl leading-none mt-0.5">✕</button>
              </div>

              {/* Eventos */}
              <div className="px-5 py-4 space-y-2.5 max-h-64 overflow-y-auto">
                {evsDia.map(ev => {
                  const color = COLORES[ev.colorIdx]
                  const prop  = propiedades.find(p => p.id === ev.propiedad_id)
                  return (
                    <div
                      key={ev.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{
                        background: 'rgba(0,0,0,0.03)',
                        border: '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ev.tipo === 'bloqueo' ? 'bg-gray-300' : color.bg}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{ev.label}</p>
                        <p className="text-xs text-gray-400">{prop?.nombre ?? '—'} · {ev.tipo === 'bloqueo' ? 'Bloqueo' : 'Reserva'}</p>
                      </div>
                      {ev.tipo === 'reserva' && (
                        <Link
                          to={`/admin/reservas/${ev.id}/editar`}
                          onClick={() => setDayModal(null)}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg flex-shrink-0 transition-colors hover:brightness-110"
                          style={{ backgroundColor: '#1E3E50', color: 'white' }}
                        >
                          Ver
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Footer — crear reserva */}
              <div className="px-5 pb-5 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <Link
                  to={`/admin/reservas/nueva?fecha=${dayModal}`}
                  onClick={() => setDayModal(null)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                  style={{
                    backgroundColor: '#1E3E50',
                    color: 'white',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(30,62,80,0.25)',
                  }}
                >
                  <span className="text-base leading-none">+</span>
                  Crear reserva para este día
                </Link>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Tooltip hover día ── */}
      {tooltip && (() => {
        const evsDia = eventos.filter(ev => {
          if (filtroProp !== 'todas' && ev.propiedad_id !== filtroProp) return false
          return ev.fecha_inicio <= tooltip.day && ev.fecha_fin > tooltip.day
        })
        if (!evsDia.length) return null
        return (
          <div
            className="fixed z-[60] pointer-events-none"
            style={{ top: tooltip.y - 8, left: tooltip.x, transform: 'translateY(-100%)' }}
          >
            <div
              className="rounded-xl px-3 py-2.5 min-w-[160px] max-w-[220px]"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1)',
              }}
            >
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                {toDate(tooltip.day).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
              </p>
              <div className="space-y-1">
                {evsDia.map(ev => {
                  const color = COLORES[ev.colorIdx]
                  return (
                    <div key={ev.id} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.tipo === 'bloqueo' ? 'bg-gray-300' : color.bg}`} />
                      <span className="text-[11px] text-gray-700 truncate">{ev.label}</span>
                      <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">
                        {propiedades.find(p => p.id === ev.propiedad_id)?.nombre?.split(' ')[0] ?? ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* flecha */}
            <div className="w-3 h-3 mx-3 rotate-45 -mt-1.5"
              style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.9)', borderTop: 'none', borderLeft: 'none' }}
            />
          </div>
        )
      })()}
    </div>
  )
}