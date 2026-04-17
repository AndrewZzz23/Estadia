import { useEffect, useState, useRef } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Bloqueo, FotoPropiedad, PropiedadConFotos, Reserva, Tenant } from '../../types/database'
import {
  MapPin, Users, BedDouble, Bath, MessageCircle, ArrowLeft,
  ChevronLeft, ChevronRight, X, Check,
  Wifi, Waves, Flame, Car, Wind, ChefHat, Shirt, Tv, Eye, Sun, Leaf, PawPrint, Sparkles,
} from 'lucide-react'
import { getFestivos } from '../../lib/festivos'
import WhatsAppIcon from '../../components/WhatsAppIcon'
import { waGlassStyle } from '../../lib/styles'
import type { LucideIcon } from 'lucide-react'
import airbnbLogo from '../../assets/airbnb.png'

const AMENIDADES_ICONOS: Record<string, LucideIcon> = {
  'WiFi':               Wifi,
  'Piscina':            Waves,
  'BBQ':                Flame,
  'Parqueadero':        Car,
  'Aire acondicionado': Wind,
  'Cocina equipada':    ChefHat,
  'Lavadora':           Shirt,
  'TV':                 Tv,
  'Chimenea':           Sparkles,
  'Jacuzzi':            Bath,
  'Vista al mar':       Eye,
  'Terraza':            Sun,
  'Jardín':             Leaf,
  'Mascotas permitidas':PawPrint,
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS  = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']

function ymd(d: Date) { return d.toISOString().slice(0, 10) }

export default function PropiedadDetalle() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const [tenant, setTenant]       = useState<Tenant | null | false>(null)
  const [propiedad, setPropiedad] = useState<PropiedadConFotos | null | false>(null)
  const [fotoIdx, setFotoIdx]     = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [scrolled, setScrolled]   = useState(false)

  const touchHeroX  = useRef<number>(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollTimer   = useRef<ReturnType<typeof setTimeout>>()
  const ctaRef        = useRef<HTMLDivElement>(null)
  const [ctaVisible, setCtaVisible] = useState(false)

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

  useEffect(() => {
    if (!id) return
    cargarOcupados()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, calYear, calMonth])

  // Scroll-reveal: añade/quita in-view para que la animación se repita al bajar y subir
  useEffect(() => {
    if (!propiedad) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in-view')
        else e.target.classList.remove('in-view')
      }),
      { threshold: 0.18, rootMargin: '0px 0px -80px 0px' }
    )
    document.querySelectorAll('[data-scroll]').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [propiedad])

  // Oculta la barra fija cuando el CTA inferior es visible
  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => setCtaVisible(entries[0].isIntersecting),
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [propiedad])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-[#2A7A68] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (tenant === false || propiedad === false) return <Navigate to={`/${slug}`} replace />

  const t = tenant as Tenant
  const p = propiedad as PropiedadConFotos
  const fotos: FotoPropiedad[] = p.fotos_propiedades

  const waNum = (t.telefono ?? '').replace(/\D/g, '')
  const waMsg = encodeURIComponent(`Hola, me interesa la propiedad "${p.nombre}". ¿Está disponible?`)
  const waLink = `https://wa.me/${waNum}?text=${waMsg}`

  // Extrae el ID de listing de Airbnb desde la URL de iCal
  const airbnbListingUrl = (() => {
    if (!p.ical_url) return null
    const m = p.ical_url.match(/airbnb\.[a-z.]+\/calendar\/ical\/(\d+)\.ics/)
    return m ? `https://www.airbnb.com/rooms/${m[1]}` : null
  })()

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

  function scrollToFoto(i: number) {
    if (!carouselRef.current) return
    carouselRef.current.scrollTo({ left: i * carouselRef.current.clientWidth, behavior: 'smooth' })
  }

  function onCarouselScroll() {
    clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      if (!carouselRef.current) return
      const i = Math.round(carouselRef.current.scrollLeft / carouselRef.current.clientWidth)
      setFotoIdx(Math.max(0, Math.min(i, fotos.length - 1)))
    }, 50)
  }

  return (
    <div className="min-h-screen bg-[#E8E4DE]">
      <style>{`
        [data-scroll]{opacity:0;transform:translateY(40px);transition:opacity 1s cubic-bezier(.16,1,.3,1),transform 1s cubic-bezier(.16,1,.3,1)}
        [data-scroll].in-view{opacity:1;transform:translateY(0)}
        [data-scroll][data-d="1"]{transition-delay:.15s}
        [data-scroll][data-d="2"]{transition-delay:.3s}
        [data-scroll][data-d="3"]{transition-delay:.45s}
        [data-scroll][data-d="4"]{transition-delay:.6s}
      `}</style>

      {/* ── HEADER glass ── */}
      <header
        className="fixed top-0 left-0 right-0 z-30 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(16,24,32,0.60)' : 'transparent',
          backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to={`/${slug}`}
            className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            {t.nombre}
          </Link>
          {waNum && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
            >
              <MessageCircle size={14} />
              Consultar
            </a>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {fotos.length > 0 ? (
          <>
            {/* Mobile: carrusel con scroll-snap nativo */}
            <div className="sm:hidden relative overflow-hidden" style={{ height: '85vh' }}>
              <div
                ref={carouselRef}
                className="flex h-full overflow-x-scroll snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
                onScroll={onCarouselScroll}
              >
                {fotos.map((f, i) => (
                  <div key={i} className="flex-shrink-0 w-full h-full snap-center"
                    onClick={() => { setFotoIdx(i); setLightboxOpen(true) }}>
                    <img src={f.url} alt={p.nombre} className="w-full h-full object-cover pointer-events-none" />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/75 pointer-events-none" />
              {fotos.length > 1 && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-auto">
                  {fotos.map((_, i) => (
                    <button key={i} onClick={() => scrollToFoto(i)}
                      className={`rounded-full transition-all ${i === fotoIdx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: mosaico */}
            <div
              className="hidden sm:grid"
              style={{ gridTemplateColumns: fotos.length > 1 ? '1fr clamp(260px, 28%, 400px)' : '1fr', gap: '3px', height: '440px' }}
            >
              {/* Foto principal */}
              <div className="relative overflow-hidden cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
                <img src={fotos[0].url} alt={p.nombre} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/75 pointer-events-none" />
              </div>
              {/* Columna lateral */}
              {fotos.length > 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {fotos.slice(1, 3).map((f, i) => (
                    <div key={i} className="flex-1 relative overflow-hidden cursor-zoom-in"
                      onClick={() => { setFotoIdx(i + 1); setLightboxOpen(true) }}>
                      <img src={f.url} alt="" className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-500" />
                      {i === 1 && fotos.length > 3 && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">+{fotos.length - 3}</span>
                          <span className="text-white/70 text-sm ml-1">fotos</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {fotos.length === 1 && <div className="flex-1 bg-black/10" />}
                </div>
              )}
            </div>

            {/* Botón ver todas */}
            {fotos.length > 1 && (
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute top-20 right-4 sm:right-5 flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
                {fotos.length} fotos
              </button>
            )}
          </>
        ) : (
          <div className="h-36" style={{ background: 'linear-gradient(135deg, #1E3E50, #2A7A68)' }} />
        )}

        {/* Overlay info */}
        <div className="absolute bottom-0 inset-x-0 pointer-events-none">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 pb-6 sm:pb-8 pointer-events-auto">
            <div
              className="inline-flex flex-col rounded-2xl px-5 py-4 max-w-lg"
              style={{
                background: 'rgba(0,0,0,0.40)',
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#64B5A0' }}>{t.nombre}</span>
              <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight">{p.nombre}</h1>
              {p.ubicacion && (
                <div className="flex items-center gap-1 text-white/65 text-xs mt-1.5">
                  <MapPin size={11} />{p.ubicacion}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── COLUMNA PRINCIPAL ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Sin fotos: encabezado aquí */}
            {fotos.length === 0 && (
              <div className="bg-white rounded-3xl p-7 shadow-sm">
                <h1 className="text-3xl font-bold text-[#1E3E50]">{p.nombre}</h1>
                {p.ubicacion && (
                  <div className="flex items-center gap-1.5 text-gray-400 mt-2 text-sm">
                    <MapPin size={12} />{p.ubicacion}
                  </div>
                )}
              </div>
            )}

            {/* Capacidad / habitaciones / baños */}
            {(p.capacidad || p.habitaciones || p.banos) && (
              <div data-scroll className="bg-white rounded-3xl px-6 py-5 shadow-sm">
                <div className="flex divide-x divide-gray-100">
                  {p.capacidad && (
                    <div className="flex-1 flex flex-col items-center gap-1 px-3 first:pl-0 last:pr-0">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(42,122,104,0.10)' }}>
                        <Users size={16} className="text-[#2A7A68]" />
                      </div>
                      <p className="text-xl font-bold text-[#1E3E50] leading-none">{p.capacidad}</p>
                      <p className="text-[11px] text-gray-400">personas</p>
                    </div>
                  )}
                  {p.habitaciones && (
                    <div className="flex-1 flex flex-col items-center gap-1 px-3 first:pl-0 last:pr-0">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(42,122,104,0.10)' }}>
                        <BedDouble size={16} className="text-[#2A7A68]" />
                      </div>
                      <p className="text-xl font-bold text-[#1E3E50] leading-none">{p.habitaciones}</p>
                      <p className="text-[11px] text-gray-400">habitaciones</p>
                    </div>
                  )}
                  {p.banos && (
                    <div className="flex-1 flex flex-col items-center gap-1 px-3 first:pl-0 last:pr-0">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(42,122,104,0.10)' }}>
                        <Bath size={16} className="text-[#2A7A68]" />
                      </div>
                      <p className="text-xl font-bold text-[#1E3E50] leading-none">{p.banos}</p>
                      <p className="text-[11px] text-gray-400">baños</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Descripción */}
            {p.descripcion && (
              <div data-scroll className="bg-white rounded-3xl p-7 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A7A68] mb-0.5">Acerca de</p>
                <h2 className="text-xl font-bold text-[#1E3E50] mb-4">este espacio</h2>
                <p className="text-gray-600 leading-relaxed text-[15px] whitespace-pre-wrap">{p.descripcion}</p>
              </div>
            )}

            {/* Amenidades */}
            {p.amenidades?.length > 0 && (
              <div data-scroll data-d="1" className="bg-white rounded-3xl p-7 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A7A68] mb-0.5">Lo que</p>
                <h2 className="text-xl font-bold text-[#1E3E50] mb-5">ofrecemos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(p.amenidades as string[]).map(a => {
                    const Icon = AMENIDADES_ICONOS[a] ?? Check
                    return (
                      <div key={a}
                        className="flex items-center gap-2.5 px-3 py-3 rounded-2xl text-sm font-medium text-gray-700 transition-colors"
                        style={{ background: 'linear-gradient(135deg, rgba(30,62,80,0.04), rgba(42,122,104,0.03))', border: '1px solid rgba(30,62,80,0.07)' }}>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(42,122,104,0.12)' }}>
                          <Icon size={14} className="text-[#2A7A68]" />
                        </div>
                        {a}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Mapa */}
            {p.latitud && p.longitud && (
              <div data-scroll data-d="2" className="bg-white rounded-3xl overflow-hidden shadow-sm">
                <div className="px-7 pt-6 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A7A68] mb-0.5">Dónde</p>
                  <h2 className="text-xl font-bold text-[#1E3E50]">encontrarnos</h2>
                </div>
                <iframe
                  title="Ubicación"
                  src={`https://maps.google.com/maps?q=${p.latitud},${p.longitud}&z=15&t=k&output=embed`}
                  className="w-full"
                  style={{ height: 280, border: 'none' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="px-5 py-4">
                  <a href={`https://www.google.com/maps?q=${p.latitud},${p.longitud}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.18)' }}>
                    {/* Google Maps logo SVG */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 1.63.5 3.14 1.36 4.38L12 2z" fill="#B31412"/>
                      <circle cx="12" cy="9" r="2.5" fill="white"/>
                    </svg>
                    <span className="text-sm font-semibold" style={{ color: '#4285F4' }}>Abrir en Google Maps</span>
                    <svg width="12" height="12" fill="none" stroke="#4285F4" strokeWidth={2} strokeOpacity={0.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </a>
                </div>
              </div>
            )}

            {/* Calendario */}
            <div data-scroll data-d="3" className="rounded-3xl overflow-hidden shadow-sm bg-white">
              {/* Header limpio */}
              <div className="px-6 pt-5 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A7A68] mb-0.5">Disponibilidad</p>
                    <h2 className="text-base font-bold text-[#1E3E50]">{MESES[calMonth]} {calYear}</h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => navCal(-1)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-[#1E3E50] hover:bg-gray-100 transition-colors">
                      <ChevronLeft size={15} />
                    </button>
                    <button onClick={() => navCal(1)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-[#1E3E50] hover:bg-gray-100 transition-colors">
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Días semana */}
              <div className="grid grid-cols-7 px-4 pt-4 mb-1">
                {DIAS.map((d, i) => (
                  <div key={i} className="text-[10px] font-bold text-gray-300 text-center py-1 tracking-widest uppercase">{d}</div>
                ))}
              </div>

              {/* Celdas */}
              <div className="grid grid-cols-7 gap-0.5 px-4 pb-5">
                {dias.map((dia, i) => {
                  const d       = ymd(dia)
                  const esMes   = dia.getMonth() === calMonth
                  const esHoy   = d === hoyStr
                  const pasado  = d < hoyStr
                  const ocupado = ocupados.has(d)
                  const festivo = festivos.get(d)
                  const esDom      = dia.getDay() === 0
                  const disponible = esMes && !ocupado && (!pasado || esHoy) && !!waNum
                  const fechaLabel = dia.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  const waMsgDia   = encodeURIComponent(`Hola, me interesa reservar "${p.nombre}" para el ${fechaLabel}. ¿Está disponible?`)
                  return (
                    <div key={i} title={festivo}
                      onClick={disponible ? () => window.open(`https://wa.me/${waNum}?text=${waMsgDia}`, '_blank') : undefined}
                      className={`h-10 flex items-center justify-center rounded-xl text-xs font-medium transition-all
                        ${disponible ? 'cursor-pointer active:scale-90' : ''}
                        ${!esMes ? 'opacity-20' : ''}
                        ${ocupado && esMes ? 'bg-red-100 text-red-500 font-semibold' : ''}
                        ${festivo && !ocupado && esMes ? 'bg-amber-100 text-amber-500 font-bold' : ''}
                        ${pasado && !esHoy && !ocupado && !festivo && esMes ? 'text-gray-300' : ''}
                        ${!ocupado && !pasado && !esHoy && !festivo && esMes ? `${esDom ? 'text-red-400' : 'text-gray-700'} hover:bg-[#2A7A68]/10 hover:text-[#2A7A68]` : ''}
                      `}>
                      {esHoy ? (
                        <span className="w-8 h-8 flex items-center justify-center rounded-full text-white font-bold text-xs"
                          style={{ background: 'linear-gradient(135deg, #2A7A68, #1fa085)', boxShadow: '0 4px 10px rgba(42,122,104,0.35)' }}>
                          {dia.getDate()}
                        </span>
                      ) : ocupado && esMes ? (
                        <span className="line-through opacity-50">{dia.getDate()}</span>
                      ) : dia.getDate()}
                    </div>
                  )
                })}
              </div>

              {/* Leyenda */}
              <div className="flex gap-4 px-6 py-3 border-t border-gray-100 flex-wrap items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2A7A68]" />
                  <span className="text-gray-400 text-xs">Hoy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-red-100 border border-red-300" />
                  <span className="text-gray-400 text-xs">Ocupado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-amber-100 border border-amber-300" />
                  <span className="text-gray-400 text-xs">Festivo</span>
                </div>
                {waNum && <p className="text-[10px] text-[#2A7A68]/70 ml-auto">Toca un día libre para consultar</p>}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR (solo desktop) ── */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">

              {/* Precio + CTA */}
              <div className="rounded-3xl overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(30,62,80,0.25)' }}>
                {/* Header precio navy */}
                <div
                  className="px-6 pt-6 pb-5"
                  style={{ background: 'linear-gradient(135deg, #1E3E50 0%, #1a4a3e 100%)' }}
                >
                  {p.precio_noche ? (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">Desde</p>
                      <div className="flex items-end gap-1.5">
                        <span className="text-white text-4xl font-bold leading-none">${p.precio_noche.toLocaleString('es-CO')}</span>
                        <span className="text-white/45 text-sm mb-0.5">/ noche</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-white/60 text-sm font-medium">Consultar precio</p>
                  )}
                  {(p.precio_semana || p.precio_mes || p.precio_persona_extra) && (
                    <div className="flex gap-5 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      {p.precio_semana && (
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-white/30">Semana</p>
                          <p className="text-white/75 font-semibold text-sm">${p.precio_semana.toLocaleString('es-CO')}</p>
                        </div>
                      )}
                      {p.precio_mes && (
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-white/30">Mes</p>
                          <p className="text-white/75 font-semibold text-sm">${p.precio_mes.toLocaleString('es-CO')}</p>
                        </div>
                      )}
                      {p.precio_persona_extra && (
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-white/30">Persona extra</p>
                          <p className="text-white/75 font-semibold text-sm">${p.precio_persona_extra.toLocaleString('es-CO')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="bg-white p-5 space-y-3">
                  {waNum ? (
                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full text-white font-semibold py-4 rounded-2xl text-sm transition-all hover:scale-[1.02] active:scale-95"
                      style={waGlassStyle}>
                      <WhatsAppIcon size={18} />
                      Consultar disponibilidad
                    </a>
                  ) : (
                    <div className="w-full bg-gray-100 text-gray-400 font-medium py-4 rounded-2xl text-sm text-center">
                      Sin contacto disponible
                    </div>
                  )}
                  {airbnbListingUrl && (
                    <a href={airbnbListingUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: 'rgba(255,90,95,0.06)', borderColor: 'rgba(255,90,95,0.2)' }}>
                      <img src={airbnbLogo} alt="Airbnb" className="w-5 h-5 object-contain flex-shrink-0" />
                      <span className="text-sm font-medium flex-1" style={{ color: '#e0484d' }}>Ver en Airbnb</span>
                      <svg className="w-3.5 h-3.5 opacity-40" style={{ color: '#e0484d' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  <p className="text-[11px] text-gray-400 text-center pt-1">Respuesta rápida · Sin compromiso</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── CTA FINAL expandido ── */}
        <div ref={ctaRef} data-scroll className="mt-5 rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1E3E50 0%, #162e3b 60%, #0f2028 100%)', boxShadow: '0 24px 64px rgba(30,62,80,0.35)' }}>
          <div className="relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #2A7A68, transparent)' }} />
            <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #64B5A0, transparent)' }} />
            <div className="relative px-7 py-10 sm:py-12">
              <div className="max-w-2xl mx-auto text-center">
                {/* Precio grande */}
                {p.precio_noche ? (
                  <div className="mb-8" data-scroll data-d="1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 mb-2">Desde</p>
                    <div className="flex items-end justify-center gap-2">
                      <span className="text-5xl sm:text-6xl font-bold text-white leading-none">
                        ${p.precio_noche.toLocaleString('es-CO')}
                      </span>
                      <span className="text-white/40 text-base mb-1.5">/ noche</span>
                    </div>
                    {(p.precio_semana || p.precio_mes || p.precio_persona_extra) && (
                      <div className="flex justify-center gap-8 mt-4 pt-4"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        {p.precio_semana && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/30">Semana</p>
                            <p className="text-white/70 font-semibold">${p.precio_semana.toLocaleString('es-CO')}</p>
                          </div>
                        )}
                        {p.precio_mes && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/30">Mes</p>
                            <p className="text-white/70 font-semibold">${p.precio_mes.toLocaleString('es-CO')}</p>
                          </div>
                        )}
                        {p.precio_persona_extra && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/30">Persona extra</p>
                            <p className="text-white/70 font-semibold">${p.precio_persona_extra.toLocaleString('es-CO')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-white/60 text-lg font-medium mb-8" data-scroll data-d="1">Consulta disponibilidad y precios</p>
                )}

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center" data-scroll data-d="2">
                  {waNum && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full sm:w-auto sm:min-w-[220px] text-white font-semibold py-4 px-8 rounded-2xl text-base transition-all hover:scale-[1.02] active:scale-95"
                      style={waGlassStyle}>
                      <WhatsAppIcon size={20} />
                      Consultar disponibilidad
                    </a>
                  )}
                  {airbnbListingUrl && (
                    <a href={airbnbListingUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full sm:w-auto px-6 py-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)' }}>
                      <img src={airbnbLogo} alt="Airbnb" className="w-5 h-5 object-contain flex-shrink-0" />
                      <span className="text-sm font-medium text-white/80">Ver en Airbnb</span>
                    </a>
                  )}
                </div>
                <p className="text-white/25 text-xs mt-5" data-scroll data-d="3">Respuesta rápida · Sin compromiso</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── BARRA FIJA inferior (mobile) ── */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-transform duration-300 ${scrolled && !ctaVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="px-4 pb-5 pt-3" style={{ background: 'linear-gradient(to top, rgba(15,26,34,0.72) 0%, transparent 100%)', backdropFilter: 'blur(4px)' }}>
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-2xl"
            style={{ boxShadow: '0 8px 32px rgba(30,62,80,0.22)' }}>
            <div className="flex-1 min-w-0">
              {p.precio_noche ? (
                <>
                  <p className="text-[10px] text-gray-400 leading-none mb-0.5">Desde</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-[#1E3E50] leading-none">${p.precio_noche.toLocaleString('es-CO')}</span>
                    <span className="text-[11px] text-gray-400">/ noche</span>
                  </div>
                </>
              ) : (
                <p className="text-sm font-semibold text-[#1E3E50]">Consultar precio</p>
              )}
            </div>
            {waNum && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-xl text-sm flex-shrink-0 transition-all hover:scale-[1.03] active:scale-95"
                style={waGlassStyle}>
                <WhatsAppIcon size={16} />
                Reservar
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX con thumbnails ── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.96)' }} onClick={() => setLightboxOpen(false)}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <span className="text-white/50 text-sm font-medium">{fotoIdx + 1} / {fotos.length}</span>
            <button onClick={() => setLightboxOpen(false)}
              className="text-white/70 hover:text-white p-2 rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <X size={20} />
            </button>
          </div>

          {/* Imagen principal */}
          <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden px-12"
            onTouchStart={e => { touchHeroX.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              const dx = touchHeroX.current - e.changedTouches[0].clientX
              if (Math.abs(dx) < 50) return
              e.stopPropagation()
              if (dx > 0) setFotoIdx(i => (i + 1) % fotos.length)
              else setFotoIdx(i => (i - 1 + fotos.length) % fotos.length)
            }}
          >
            {fotos.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setFotoIdx(i => (i - 1 + fotos.length) % fotos.length) }}
                  className="absolute left-2 sm:left-4 w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white transition-colors z-10"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <ChevronLeft size={22} />
                </button>
                <button onClick={e => { e.stopPropagation(); setFotoIdx(i => (i + 1) % fotos.length) }}
                  className="absolute right-2 sm:right-4 w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white transition-colors z-10"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <ChevronRight size={22} />
                </button>
              </>
            )}
            <img src={fotos[fotoIdx].url} alt=""
              className="w-full h-full object-contain" />
          </div>

          {/* Strip de thumbnails */}
          {fotos.length > 1 && (
            <div className="flex-shrink-0 flex gap-2 px-4 py-3 overflow-x-auto justify-center"
              onClick={e => e.stopPropagation()}>
              {fotos.map((f, i) => (
                <button key={i} onClick={() => setFotoIdx(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                    i === fotoIdx ? 'border-white scale-110' : 'border-transparent opacity-45 hover:opacity-75'
                  }`}>
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}


    </div>
  )
}
