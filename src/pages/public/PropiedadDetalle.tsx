import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Bloqueo, FotoPropiedad, PropiedadConFotos, Reserva, Tenant } from '../../types/database'
import {
  MapPin, Users, BedDouble, Bath, MessageCircle, ArrowLeft,
  ChevronLeft, ChevronRight, X, Check, Wifi,
} from 'lucide-react'
import { getFestivos } from '../../lib/festivos'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS  = ['D','L','M','M','J','V','S']

function ymd(d: Date) { return d.toISOString().slice(0, 10) }

export default function PropiedadDetalle() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const [tenant, setTenant]       = useState<Tenant | null | false>(null)
  const [propiedad, setPropiedad] = useState<PropiedadConFotos | null | false>(null)
  const [fotoIdx, setFotoIdx]     = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [scrolled, setScrolled]   = useState(false)

  const hoy = new Date()
  const [calYear,  setCalYear]  = useState(hoy.getFullYear())
  const [calMonth, setCalMonth] = useState(hoy.getMonth())
  const [ocupados, setOcupados] = useState<Set<string>>(new Set())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    async function cargar() {
      const { data: t } = await supabase
        .from('tenants').select('*').eq('slug', slug!).eq('activa', true).maybeSingle()
      if (!t) { setTenant(false); setLoading(false); return }
      setTenant(t as Tenant)

      const { data: p } = await supabase
        .from('propiedades').select('*, fotos_propiedades(*)')
        .eq('id', id!).eq('activa', true).maybeSingle()
      if (!p) { setPropiedad(false); setLoading(false); return }

      const prop = p as PropiedadConFotos
      prop.fotos_propiedades.sort((a, b) => {
        if (a.es_principal) return -1
        if (b.es_principal) return 1
        return a.orden - b.orden
      })
      setPropiedad(prop)
      setLoading(false)
    }
    cargar()
  }, [slug, id])

  useEffect(() => {
    if (!id) return
    cargarOcupados()
  }, [id, calYear, calMonth])

  async function cargarOcupados() {
    const desde = ymd(new Date(calYear, calMonth, 1))
    const hasta = ymd(new Date(calYear, calMonth + 1, 0))
    const [{ data: reservas }, { data: bloqueos }] = await Promise.all([
      supabase.from('reservas').select('fecha_inicio, fecha_fin')
        .eq('propiedad_id', id!).neq('estado', 'cancelada')
        .lte('fecha_inicio', hasta).gte('fecha_fin', desde),
      supabase.from('bloqueos').select('fecha_inicio, fecha_fin')
        .eq('propiedad_id', id!)
        .lte('fecha_inicio', hasta).gte('fecha_fin', desde),
    ])
    const set = new Set<string>()
    const rangos = [
      ...((reservas as Pick<Reserva,'fecha_inicio'|'fecha_fin'>[]) ?? []),
      ...((bloqueos as Pick<Bloqueo,'fecha_inicio'|'fecha_fin'>[]) ?? []),
    ]
    rangos.forEach(r => {
      const cur = new Date(r.fecha_inicio + 'T00:00:00')
      const fin = new Date(r.fecha_fin    + 'T00:00:00')
      while (cur < fin) { set.add(ymd(cur)); cur.setDate(cur.getDate() + 1) }
    })
    setOcupados(set)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-[#2A7A68] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (tenant === false || propiedad === false) return <Navigate to={`/${slug}`} replace />

  const t = tenant as Tenant
  const p = propiedad as PropiedadConFotos
  const fotos: FotoPropiedad[] = p.fotos_propiedades

  const waNum = (p.whatsapp ?? t.telefono ?? '').replace(/\D/g, '')
  const waMsg = encodeURIComponent(`Hola, me interesa la propiedad "${p.nombre}". ¿Está disponible?`)
  const waLink = `https://wa.me/${waNum}?text=${waMsg}`

  // Calendar grid
  const primerDia = new Date(calYear, calMonth, 1)
  const inicioGrid = new Date(primerDia)
  inicioGrid.setDate(inicioGrid.getDate() - inicioGrid.getDay())
  const dias: Date[] = []
  const cur = new Date(inicioGrid)
  while (dias.length < 35 || cur.getMonth() === calMonth) {
    dias.push(new Date(cur)); cur.setDate(cur.getDate() + 1)
    if (dias.length >= 42) break
  }
  while (dias.length % 7 !== 0) { dias.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }

  function navCal(delta: number) {
    const d = new Date(calYear, calMonth + delta, 1)
    setCalYear(d.getFullYear()); setCalMonth(d.getMonth())
  }

  const hoyStr  = ymd(hoy)
  const festivos = getFestivos(calYear)

  return (
    <div className="min-h-screen bg-white">

      {/* ── HEADER ── */}
      <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to={`/${slug}`}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              scrolled ? 'text-[#1E3E50] hover:text-[#2A7A68]' : 'text-white hover:text-white/80'
            }`}
          >
            <ArrowLeft size={16} />
            {t.nombre}
          </Link>
          {waNum && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className={`hidden sm:flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
                scrolled
                  ? 'border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white'
                  : 'border-white/50 text-white hover:bg-white hover:text-[#1E3E50]'
              }`}
            >
              <MessageCircle size={14} />
              Consultar
            </a>
          )}
        </div>
      </header>

      {/* ── GALERÍA MOSAICO ── */}
      {fotos.length > 0 && (
        <div className="relative h-[75vh] min-h-[480px] overflow-hidden">
          <img
            src={fotos[fotoIdx].url}
            alt={p.nombre}
            className="w-full h-full object-cover cursor-zoom-in transition-opacity duration-300"
            onClick={() => setLightboxOpen(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

          {fotos.length > 1 && (
            <>
              <button
                onClick={() => setFotoIdx(i => (i - 1 + fotos.length) % fotos.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/20 text-white rounded-full transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setFotoIdx(i => (i + 1) % fotos.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/20 text-white rounded-full transition-all"
              >
                <ChevronRight size={20} />
              </button>

              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
                {fotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFotoIdx(i)}
                    className={`rounded-full transition-all ${
                      fotoIdx === i ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <div className="absolute top-20 right-4 bg-black/30 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {fotoIdx + 1} / {fotos.length}
              </div>
            </>
          )}

          <div className="absolute bottom-6 left-6 right-6 max-w-6xl mx-auto pointer-events-none">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">{t.nombre}</p>
            <h1 className="text-white text-4xl sm:text-5xl font-bold drop-shadow-lg leading-tight">{p.nombre}</h1>
            {p.ubicacion && (
              <div className="flex items-center gap-1.5 text-white/80 mt-2 text-sm">
                <MapPin size={13} />{p.ubicacion}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONTENIDO ── */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-10">

            {/* Info si no hay fotos */}
            {fotos.length === 0 && (
              <div>
                <h1 className="text-4xl font-bold text-[#1E3E50]">{p.nombre}</h1>
                {p.ubicacion && (
                  <div className="flex items-center gap-1.5 text-gray-400 mt-2 text-sm">
                    <MapPin size={13} />{p.ubicacion}
                  </div>
                )}
              </div>
            )}

            {/* Capacidades */}
            <div className="flex flex-wrap gap-6 py-6 border-y border-gray-100">
              {p.capacidad    && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#2A7A68]/10 flex items-center justify-center">
                    <Users size={18} className="text-[#2A7A68]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Capacidad</p>
                    <p className="font-semibold text-gray-800 text-sm">{p.capacidad} personas</p>
                  </div>
                </div>
              )}
              {p.habitaciones && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#2A7A68]/10 flex items-center justify-center">
                    <BedDouble size={18} className="text-[#2A7A68]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Habitaciones</p>
                    <p className="font-semibold text-gray-800 text-sm">{p.habitaciones}</p>
                  </div>
                </div>
              )}
              {p.banos && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#2A7A68]/10 flex items-center justify-center">
                    <Bath size={18} className="text-[#2A7A68]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Baños</p>
                    <p className="font-semibold text-gray-800 text-sm">{p.banos}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Descripción */}
            {p.descripcion && (
              <div>
                <h2 className="text-xl font-bold text-[#1E3E50] mb-4">Acerca de este espacio</h2>
                <p className="text-gray-600 leading-relaxed text-base">{p.descripcion}</p>
              </div>
            )}

            {/* Amenidades */}
            {p.amenidades?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#1E3E50] mb-5">Comodidades</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(p.amenidades as string[]).map(a => (
                    <div key={a} className="flex items-center gap-2.5 text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5">
                      <Check size={14} className="text-[#2A7A68] flex-shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendario */}
            <div>
              <h2 className="text-xl font-bold text-[#1E3E50] mb-6">Disponibilidad</h2>

              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => navCal(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white border border-gray-200 transition-colors">
                    <ChevronLeft size={16} className="text-gray-500" />
                  </button>
                  <span className="font-semibold text-gray-800">{MESES[calMonth]} {calYear}</span>
                  <button onClick={() => navCal(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white border border-gray-200 transition-colors">
                    <ChevronRight size={16} className="text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-7 mb-2">
                  {DIAS.map((d, i) => (
                    <div key={i} className="text-xs font-medium text-gray-400 text-center py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {dias.map((dia, i) => {
                    const d       = ymd(dia)
                    const esMes   = dia.getMonth() === calMonth
                    const esHoy   = d === hoyStr
                    const pasado  = d < hoyStr
                    const ocupado = ocupados.has(d)
                    const festivo = festivos.get(d)

                    return (
                      <div key={i} title={festivo}
                        className={`h-9 flex items-center justify-center rounded-xl text-xs transition-colors
                          ${!esMes ? 'opacity-20' : ''}
                          ${ocupado ? 'bg-red-100 text-red-500 line-through' : ''}
                          ${festivo && !ocupado ? 'bg-amber-100 text-amber-700 font-semibold' : ''}
                          ${pasado && !esHoy && !festivo && !ocupado ? 'text-gray-300' : ''}
                          ${!ocupado && !pasado && !esHoy && !festivo && esMes ? 'text-gray-700 hover:bg-white' : ''}`}>
                        {esHoy ? (
                          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2A7A68] text-white font-bold text-xs">
                            {dia.getDate()}
                          </span>
                        ) : dia.getDate()}
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-5 mt-5 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5 text-red-500">
                    <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
                    Ocupado
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-700">
                    <span className="w-3 h-3 rounded bg-amber-100 inline-block" />
                    Festivo
                  </div>
                  <div className="flex items-center gap-1.5 text-[#2A7A68]">
                    <span className="w-3 h-3 rounded-full bg-[#2A7A68] inline-block" />
                    Hoy
                  </div>
                </div>
              </div>
            </div>

            {/* Sobre la empresa */}
            {t.descripcion && (
              <div className="border-t border-gray-100 pt-10">
                <h2 className="text-xl font-bold text-[#1E3E50] mb-4">Sobre {t.nombre}</h2>
                <p className="text-gray-600 leading-relaxed">{t.descripcion}</p>
                {t.telefono && (
                  <a
                    href={`https://wa.me/${t.telefono.replace(/\D/g,'')}?text=${encodeURIComponent('Hola, tengo una consulta.')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#2A7A68] hover:underline"
                  >
                    <MessageCircle size={14} />
                    Contactar directamente
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div>
            <div className="sticky top-20 space-y-4">
              <div className="border border-gray-200 rounded-3xl p-6 shadow-xl shadow-gray-100">

                {/* Precios */}
                {(p.precio_noche || p.precio_semana || p.precio_mes) && (
                  <div className="space-y-3 pb-5 border-b border-gray-100 mb-5">
                    {p.precio_noche && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Por noche</span>
                        <span className="font-bold text-gray-900 text-lg">${p.precio_noche.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    {p.precio_semana && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Por semana</span>
                        <span className="font-semibold text-gray-800">${p.precio_semana.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    {p.precio_mes && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Por mes</span>
                        <span className="font-semibold text-gray-800">${p.precio_mes.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                  </div>
                )}

                {waNum ? (
                  <a
                    href={waLink}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#20bc5a] text-white font-semibold py-4 rounded-2xl transition-colors text-sm"
                  >
                    <MessageCircle size={18} />
                    Consultar disponibilidad
                  </a>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-400 font-medium py-4 rounded-2xl text-sm text-center">
                    Sin contacto disponible
                  </div>
                )}

                <p className="text-xs text-gray-400 text-center mt-3">
                  Respuesta rápida · Sin compromiso
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── LIGHTBOX ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
          >
            <X size={24} />
          </button>
          {fotos.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setFotoIdx(i => (i - 1 + fotos.length) % fotos.length) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setFotoIdx(i => (i + 1) % fotos.length) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
          <img
            src={fotos[fotoIdx].url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
            {fotoIdx + 1} / {fotos.length}
          </p>
        </div>
      )}

      {/* ── WHATSAPP FLOTANTE (móvil) ── */}
      {waNum && (
        <a
          href={waLink}
          target="_blank" rel="noopener noreferrer"
          className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bc5a] text-white font-semibold px-5 py-3.5 rounded-full shadow-lg shadow-[#25D366]/40 transition-all"
        >
          <MessageCircle size={20} />
          <span className="text-sm">Consultar</span>
        </a>
      )}
    </div>
  )
}
