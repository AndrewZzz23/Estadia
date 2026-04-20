import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../../components/Logo'
import {
  Globe, Smartphone, CalendarDays, TrendingUp, ArrowRight,
  MessageCircle, Receipt, CheckCircle2, ChevronDown, Star,
} from 'lucide-react'

import screenshotDash from '../../assets/screenshots/dashboard.png'
import screenshotRes  from '../../assets/screenshots/reservas.png'
import screenshotCal  from '../../assets/screenshots/calendario.png'

const SCREENSHOTS = {
  dashboard:  screenshotDash as string,
  reservas:   screenshotRes  as string,
  calendario: screenshotCal  as string,
}

function PhoneMockup({ src, label, color = '#1E3E50' }: { src: string | null; label: string; color?: string }) {
  return (
    <div className="relative flex-shrink-0 w-[240px] sm:w-[280px]">
      <div
        className="relative rounded-[32px] overflow-hidden shadow-2xl"
        style={{
          background: '#0D1F2D',
          border: '6px solid #1a2e3d',
          boxShadow: `0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06), 0 -4px 0 ${color}40 inset`,
          aspectRatio: '9/19',
        }}
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full z-10"
          style={{ background: '#0D1F2D' }} />
        {src ? (
          <img src={src} alt={label} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4"
            style={{ background: 'linear-gradient(160deg, #1E3E50 0%, #2A7A68 100%)' }}>
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Smartphone size={18} className="text-white/50" />
            </div>
            <p className="text-[10px] text-white/30 text-center leading-tight">{label}</p>
          </div>
        )}
      </div>
      <div className="absolute inset-0 rounded-[32px] pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)' }} />
    </div>
  )
}

// ── DATA ──────────────────────────────────────────────────────────────────────

const HERO_AVATARS = [
  { initials: 'MR', color: '#2A7A68' },
  { initials: 'CM', color: '#1E3E50' },
  { initials: 'AL', color: '#7C3AED' },
  { initials: 'JP', color: '#C4693A' },
  { initials: 'SL', color: '#16A34A' },
]

const STATS = [
  { value: '50+',    label: 'Propietarios activos'  },
  { value: '1.200+', label: 'Reservas gestionadas'  },
  { value: '5 min',  label: 'Para configurar todo'  },
  { value: '0%',     label: 'Comisión por reserva'  },
]

const BENTO = [
  {
    icon: Globe,
    title: 'Página web incluida',
    desc: 'Tus propiedades con fotos, precios y disponibilidad. Lista para compartir en segundos.',
    color: '#2A7A68',
    size: 'large' as const,
  },
  {
    icon: Smartphone,
    title: 'App en tu celular',
    desc: 'Instala el panel admin en tu teléfono como una app nativa. Sin descargas.',
    color: '#1E3E50',
    size: 'normal' as const,
  },
  {
    icon: CalendarDays,
    title: 'Calendario visual',
    desc: 'Todas tus propiedades en un calendario. Bloqueos, reservas y festivos.',
    color: '#7C3AED',
    size: 'normal' as const,
  },
  {
    icon: TrendingUp,
    title: 'Control financiero',
    desc: 'Ingresos, gastos y balance neto. Por mes, por propiedad.',
    color: '#C4693A',
    size: 'normal' as const,
  },
  {
    icon: Receipt,
    title: 'Registro de gastos',
    desc: 'Aseo, mantenimiento, servicios. Todo categorizado y con historial.',
    color: '#B45309',
    size: 'normal' as const,
  },
  {
    icon: MessageCircle,
    title: 'Flujo por WhatsApp',
    desc: 'Sin pagos online. El cliente consulta, tú confirmas en segundos.',
    color: '#16A34A',
    size: 'wide' as const,
  },
]

const PASOS = [
  {
    num: '01',
    title: 'Crea tu cuenta',
    desc: 'Regístrate con un código de acceso único para tu negocio. Sin tarjetas, sin contratos.',
  },
  {
    num: '02',
    title: 'Agrega tus propiedades',
    desc: 'Sube fotos, define precios, capacidad y disponibilidad. Tu página queda lista al instante.',
  },
  {
    num: '03',
    title: 'Gestiona desde el celular',
    desc: 'Instala el admin como app, recibe consultas por WhatsApp y confirma reservas en segundos.',
  },
]

const TIPOS = [
  { emoji: '🏡', label: 'Fincas vacacionales'    },
  { emoji: '🏢', label: 'Apartamentos turísticos' },
  { emoji: '🌲', label: 'Cabañas y glamping'      },
  { emoji: '🏠', label: 'Casas de campo'          },
  { emoji: '🏖️', label: 'Casas de playa'          },
  { emoji: '🏨', label: 'Hostales pequeños'       },
  { emoji: '🌄', label: 'Posadas rurales'         },
  { emoji: '🛖',  label: 'Ecocabañas'              },
]

const TESTIMONIALS = [
  {
    name: 'María Rodríguez',
    property: 'Finca El Descanso · Eje Cafetero',
    quote: 'Antes manejaba todo en libretas y WhatsApp desordenado. Ahora tengo el calendario claro, sé exactamente cuánto gano cada mes y mis clientes ven disponibilidad en tiempo real.',
    initials: 'MR',
    color: '#2A7A68',
    rating: 5,
  },
  {
    name: 'Carlos Mejía',
    property: 'Apartamentos Bocagrande · Cartagena',
    quote: 'Tengo 3 apartamentos y antes era un caos. Con Estadia los manejo todos desde el celular. La página que me generó se ve muy profesional y mis clientes confían más.',
    initials: 'CM',
    color: '#1E3E50',
    rating: 5,
  },
  {
    name: 'Ana López',
    property: 'Cabaña Los Pinos · Villa de Leyva',
    quote: 'En menos de una hora tenía todo listo y mi primera reserva llegó ese mismo día por WhatsApp.',
    initials: 'AL',
    color: '#7C3AED',
    rating: 5,
  },
]

const PRICING_FEATURES = [
  'Página web de propiedades',
  'Panel admin instalable en celular (PWA)',
  'Calendario visual de disponibilidad',
  'Gestión de reservas y bloqueos',
  'Control de ingresos y gastos',
  'Propiedades ilimitadas',
  'Soporte por WhatsApp',
  'Sin comisiones por reserva',
]

const FAQS = [
  {
    q: '¿Cómo reciben las reservas mis clientes?',
    a: 'Tus clientes visitan tu página, ven disponibilidad y te contactan por WhatsApp. Tú confirmas y cobras como prefieras — efectivo, transferencia, lo que uses hoy.',
  },
  {
    q: '¿Necesito instalar alguna aplicación?',
    a: 'No en el sentido tradicional. El panel admin es una app web que instalas desde el navegador de tu celular (PWA) en segundos. Sin app stores, sin descargas.',
  },
  {
    q: '¿Puedo manejar varias propiedades?',
    a: 'Sí. Puedes agregar todas las propiedades que necesites: fincas, apartamentos, cabañas. Todas aparecen en el mismo calendario y panel.',
  },
  {
    q: '¿Qué pasa si quiero cancelar?',
    a: 'Puedes dejar de usar la plataforma cuando quieras. Sin contratos, sin penalidades. Tu información queda guardada 30 días por si cambias de opinión.',
  },
  {
    q: '¿Funciona con Airbnb o Booking.com?',
    a: 'Sí. Puedes importar tus reservas de Airbnb descargándolas y registrándolas en Estadia para tener todo centralizado — calendario, ingresos y gastos — en un solo lugar.',
  },
]

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: "'Sora', sans-serif" }}>

      {/* ── Marquee CSS ── */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0) }
          to   { transform: translateX(-50%) }
        }
        .marquee-track { animation: marquee 30s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <Logo size="md" />
          <Link
            to="/admin"
            className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1E3E50, #2A7A68)', color: 'white' }}
          >
            Ingresar →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden pt-20 pb-0"
        style={{ background: 'linear-gradient(160deg, #061018 0%, #0f2535 30%, #1E3E50 60%, #1a5c4a 100%)' }}
      >
        {/* ── Mesh gradient orbs ── */}
        <div className="absolute pointer-events-none" style={{ top: '-10%', left: '-5%',    width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,122,104,0.28) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="absolute pointer-events-none" style={{ top: '10%',  right: '-8%',   width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,181,160,0.18) 0%, transparent 65%)', filter: 'blur(55px)' }} />
        <div className="absolute pointer-events-none" style={{ top: '40%',  left: '35%',    width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,62,80,0.35) 0%, transparent 65%)', filter: 'blur(50px)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: '0', right: '20%',   width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,122,104,0.22) 0%, transparent 65%)', filter: 'blur(55px)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: '20%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 65%)', filter: 'blur(45px)' }} />

        <div className="relative max-w-6xl mx-auto px-5">
          <div className="text-center pt-8 pb-14">

            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 tracking-wide uppercase"
              style={{ background: 'rgba(100,181,160,0.15)', border: '1px solid rgba(100,181,160,0.3)', color: '#64B5A0' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Plataforma para arriendos vacacionales
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold text-white leading-[1.1] mb-6 max-w-3xl mx-auto">
              Tu negocio de arriendos,{' '}
              <span style={{ background: 'linear-gradient(90deg, #64B5A0, #2A7A68)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                sin complicaciones
              </span>
            </h1>

            <p className="text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.58)' }}>
              Página web + panel admin instalable en tu celular.
              Reservas, ingresos y gastos en un solo lugar.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-7">
              <a
                href="https://wa.me/573228438554?text=Hola!%20Quiero%20comenzar%20con%20Estadia%20%F0%9F%8F%A1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:scale-[1.03] active:scale-95 w-full sm:w-auto justify-center"
                style={{ background: 'white', color: '#1E3E50', boxShadow: '0 8px 32px rgba(255,255,255,0.15)' }}
              >
                Comenzar gratis
                <ArrowRight size={16} />
              </a>
              <a
                href="#caracteristicas"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-medium transition-all w-full sm:w-auto justify-center"
                style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.06)' }}
              >
                Ver características
              </a>
            </div>

            {/* ── Social proof avatars ── */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex -space-x-2.5">
                {HERO_AVATARS.map(({ initials, color }) => (
                  <div
                    key={initials}
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: color, borderColor: '#0f2535' }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                50+ propietarios ya confían en Estadia
              </p>
            </div>

            {/* Trust micro-copy */}
            <p className="text-xs mb-12" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Sin tarjeta de crédito · Sin contratos · Listo en 5 minutos
            </p>

            {/* ── MOCKUPS + Floating notification ── */}
            <div className="relative">

              {/* ── Floating notification ── */}
              <div
                className="absolute hidden sm:flex items-center gap-3 rounded-2xl px-4 py-3 z-20"
                style={{
                  top: '8px',
                  right: '9%',
                  background: 'rgba(255,255,255,0.96)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                  border: '1px solid rgba(255,255,255,0.6)',
                }}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center">
                    <MessageCircle size={15} color="white" fill="white" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white animate-pulse" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-900 leading-tight">Nueva reserva confirmada ✅</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Finca El Descanso · hace 2 min</p>
                </div>
              </div>

              <div className="flex items-end justify-center gap-4 sm:gap-6">
                <div className="hidden sm:block" style={{ transform: 'translateY(30px) rotate(-5deg)', transformOrigin: 'bottom center', opacity: 0.88 }}>
                  <PhoneMockup src={SCREENSHOTS.reservas}   label="Reservas"   color="#2A7A68" />
                </div>
                <div style={{ zIndex: 2 }}>
                  <PhoneMockup src={SCREENSHOTS.dashboard}  label="Dashboard"  color="#64B5A0" />
                </div>
                <div className="hidden sm:block" style={{ transform: 'translateY(30px) rotate(5deg)', transformOrigin: 'bottom center', opacity: 0.88 }}>
                  <PhoneMockup src={SCREENSHOTS.calendario} label="Calendario" color="#1E3E50" />
                </div>
              </div>
            </div>

            {/* ── STATS — inside hero, dark bg ── */}
            <div className="relative mt-16 mb-0">
              {/* Divider */}
              <div className="w-full h-px mb-10" style={{ background: 'linear-gradient(to right, transparent, rgba(100,181,160,0.25), transparent)' }} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
                {STATS.map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <p
                      className="text-4xl sm:text-5xl font-black mb-1.5"
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #64B5A0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {value}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Wave */}
        <div className="mt-14" style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%' }}>
            <path d="M0 100L1440 100L1440 40C1200 95 950 15 720 45C490 75 240 5 0 40L0 100Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── FEATURES — Bento grid ── */}
      <section id="caracteristicas" className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#2A7A68' }}>Características</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3E50]">Todo lo que necesitas</h2>
          <p className="text-gray-400 mt-3 text-lg">Sin herramientas complicadas. Sin costos ocultos.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BENTO.map(({ icon: Icon, title, desc, color, size }) => {

            if (size === 'wide') return (
              <div
                key={title}
                className="sm:col-span-3 rounded-3xl p-7 border transition-all hover:shadow-lg cursor-default"
                style={{ borderColor: `${color}22`, background: `${color}06` }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                    <Icon size={26} style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
                    <p className="text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                  {/* Decorative chat bubbles */}
                  <div className="hidden sm:flex flex-col gap-2 flex-shrink-0 w-72">
                    <div className="text-xs text-white px-4 py-2.5 rounded-2xl rounded-bl-sm leading-relaxed" style={{ background: '#25D366' }}>
                      Hola! ¿La finca está disponible este fin de semana? 🏡
                    </div>
                    <div className="text-xs px-4 py-2.5 rounded-2xl rounded-br-sm self-end leading-relaxed" style={{ background: 'rgba(42,122,104,0.12)', color: '#1a5038' }}>
                      ✅ Confirmado! Te espero el sábado. Aquí la info de llegada 👇
                    </div>
                  </div>
                </div>
              </div>
            )

            return (
              <div
                key={title}
                className={`rounded-3xl border transition-all hover:shadow-lg hover:-translate-y-1 cursor-default ${size === 'large' ? 'sm:col-span-2 p-8' : 'p-6'}`}
                style={{ borderColor: `${color}22`, background: `${color}06` }}
              >
                <div
                  className={`rounded-2xl flex items-center justify-center mb-5 ${size === 'large' ? 'w-14 h-14' : 'w-11 h-11'}`}
                  style={{ background: `${color}18` }}
                >
                  <Icon size={size === 'large' ? 26 : 20} style={{ color }} />
                </div>
                <h3 className={`font-bold text-gray-900 mb-2 ${size === 'large' ? 'text-xl' : 'text-base'}`}>{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                {size === 'large' && (
                  <div
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono"
                    style={{ background: 'rgba(42,122,104,0.1)', color: '#2A7A68' }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#2A7A68]" />
                    estadia.app/tu-propiedad
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA — Timeline ── */}
      <section id="como-funciona" className="py-24" style={{ background: '#F4F6F9' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#2A7A68' }}>Proceso</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3E50]">Cómo funciona</h2>
            <p className="text-gray-400 mt-3 text-lg">Tres pasos y listo</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-12 sm:gap-20 items-center">

            {/* Left: vertical timeline */}
            <div className="relative">
              {/* Dashed connecting line */}
              <div
                className="absolute hidden sm:block"
                style={{
                  left: 19,
                  top: 44,
                  bottom: 44,
                  width: 2,
                  background: 'repeating-linear-gradient(to bottom, rgba(42,122,104,0.35) 0px, rgba(42,122,104,0.35) 6px, transparent 6px, transparent 14px)',
                }}
              />
              {PASOS.map(({ num, title, desc }, i) => (
                <div key={num} className={`flex gap-5 ${i < PASOS.length - 1 ? 'mb-14' : ''}`}>
                  <div
                    className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black text-white flex-shrink-0 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #1E3E50, #2A7A68)', fontSize: 13 }}
                  >
                    {num}
                  </div>
                  <div className="pt-1.5">
                    <h3 className="text-xl font-bold text-[#1E3E50] mb-2">{title}</h3>
                    <p className="text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: phone + badge */}
            <div className="hidden sm:flex justify-center">
              <div className="relative">
                <PhoneMockup src={SCREENSHOTS.dashboard} label="Dashboard" color="#64B5A0" />
                <div
                  className="absolute -bottom-5 -right-6 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl border"
                  style={{ background: 'white', color: '#1E3E50', borderColor: 'rgba(42,122,104,0.15)' }}
                >
                  ✅ Listo para recibir reservas
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS — Featured ── */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#2A7A68' }}>Testimonios</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3E50]">Lo que dicen los propietarios</h2>
          <p className="text-gray-400 mt-3 text-lg">Propietarios reales, resultados reales</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-5">

          {/* Featured large */}
          <div
            className="sm:col-span-3 rounded-3xl p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between"
            style={{ background: 'linear-gradient(135deg, #0A1520 0%, #1E3E50 55%, #2A7A68 100%)', minHeight: 340 }}
          >
            <div className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(100,181,160,0.2), transparent 70%)', transform: 'translate(25%, -25%)' }} />
            <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(42,122,104,0.15), transparent 70%)', transform: 'translate(-20%, 20%)' }} />
            <div className="relative">
              <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />)}
              </div>
              <p className="text-xl sm:text-2xl font-medium leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.92)' }}>
                "{TESTIMONIALS[0].quote}"
              </p>
            </div>
            <div className="relative flex items-center gap-4 mt-8">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                {TESTIMONIALS[0].initials}
              </div>
              <div>
                <p className="font-semibold text-white">{TESTIMONIALS[0].name}</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.48)' }}>{TESTIMONIALS[0].property}</p>
              </div>
            </div>
          </div>

          {/* Two smaller stacked */}
          <div className="sm:col-span-2 flex flex-col gap-5">
            {TESTIMONIALS.slice(1).map(({ name, property, quote, initials, color, rating }) => (
              <div
                key={name}
                className="rounded-3xl p-7 border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: rating }).map((_, i) => <Star key={i} size={13} fill="#F59E0B" color="#F59E0B" />)}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-5">"{quote}"</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: color }}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-400">{property}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUIÉN ── */}
      <section className="py-24" style={{ background: '#F4F6F9' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#2A7A68' }}>Para quién</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3E50]">¿Es Estadia para ti?</h2>
            <p className="text-gray-400 mt-3 text-lg">Diseñado para propietarios independientes</p>
          </div>

          {/* ── Marquee de tipos ── */}
          <div className="relative overflow-hidden mb-12">
            <div className="absolute left-0 inset-y-0 w-24 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to right, #F4F6F9, transparent)' }} />
            <div className="absolute right-0 inset-y-0 w-24 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to left, #F4F6F9, transparent)' }} />
            <div className="marquee-track flex gap-4" style={{ width: 'max-content' }}>
              {[...TIPOS, ...TIPOS].map(({ emoji, label }, i) => (
                <div
                  key={`${label}-${i}`}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-gray-200 bg-white flex-shrink-0 shadow-sm"
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '💳', text: 'Sin pagos online — tú manejas el cobro como quieras' },
              { icon: '📄', text: 'Sin contratos — cancela en cualquier momento'          },
              { icon: '🧑‍💻', text: 'Sin conocimientos técnicos — todo visual e intuitivo'  },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-3 p-5 rounded-2xl" style={{ background: 'rgba(42,122,104,0.07)', border: '1px solid rgba(42,122,104,0.12)' }}>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <p className="text-sm font-medium text-gray-700 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#2A7A68' }}>Precio</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3E50]">Simple y transparente</h2>
          <p className="text-gray-400 mt-3 text-lg">Un solo plan. Todo incluido. Sin sorpresas.</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="rounded-3xl p-8 border-2 relative" style={{ borderColor: '#2A7A68' }}>
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-bold text-white whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #1E3E50, #2A7A68)' }}
            >
              Acceso beta gratuito
            </div>

            <div className="text-center mb-8 mt-2">
              <div className="flex items-end justify-center gap-1">
                <span className="text-6xl font-black" style={{ color: '#1E3E50' }}>$0</span>
                <span className="text-gray-400 mb-2">/mes</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">Sin tarjeta de crédito requerida</p>
            </div>

            <ul className="space-y-3 mb-8">
              {PRICING_FEATURES.map((feat) => (
                <li key={feat} className="flex items-center gap-3">
                  <CheckCircle2 size={16} style={{ color: '#2A7A68', flexShrink: 0 }} />
                  <span className="text-sm text-gray-700">{feat}</span>
                </li>
              ))}
            </ul>

            <a
              href="https://wa.me/573228438554?text=Hola!%20Quiero%20comenzar%20con%20Estadia%20%F0%9F%8F%A1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-base font-bold transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1E3E50, #2A7A68)', color: 'white' }}
            >
              Crear mi cuenta gratis
              <ArrowRight size={16} />
            </a>
          </div>

          {/* ── Trust badges ── */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6">
            {[
              { icon: '🔒', label: 'Datos seguros'      },
              { icon: '⚡', label: 'Setup en 5 min'     },
              { icon: '🇨🇴', label: 'Hecho en Colombia'  },
            ].map(({ icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>{icon}</span>{label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24" style={{ background: '#F4F6F9' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#2A7A68' }}>FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3E50]">Preguntas frecuentes</h2>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map(({ q, a }, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold text-gray-900">{q}</span>
                  <ChevronDown
                    size={16}
                    className="flex-shrink-0 transition-transform duration-200"
                    style={{ color: '#2A7A68', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-5 py-20">
        <div
          className="max-w-4xl mx-auto rounded-3xl px-8 py-20 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #061018 0%, #1E3E50 50%, #2A7A68 100%)' }}
        >
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(100,181,160,0.18), transparent 70%)', transform: 'translate(20%, -20%)' }} />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(42,122,104,0.2), transparent 70%)', transform: 'translate(-20%, 20%)' }} />

          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">Empieza hoy mismo</h2>
            <p className="mb-10 text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.58)' }}>
              Ten tu página de propiedades lista en minutos. Sin tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://wa.me/573228438554?text=Hola!%20Quiero%20comenzar%20con%20Estadia%20%F0%9F%8F%A1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:scale-[1.03] active:scale-95 w-full sm:w-auto justify-center"
                style={{ background: 'white', color: '#1E3E50', boxShadow: '0 8px 32px rgba(255,255,255,0.2)' }}
              >
                Crear mi cuenta gratis
                <ArrowRight size={16} />
              </a>
              <a
                href="https://wa.me/573228438554"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:bg-white/10 w-full sm:w-auto justify-center"
                style={{ border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.07)' }}
              >
                <MessageCircle size={16} />
                Hablar con nosotros
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-gray-400 text-center">
            © {new Date().getFullYear()} Estadia · Plataforma para negocios de arriendo vacacional
          </p>
          <Link to="/admin" className="text-sm font-semibold hover:underline" style={{ color: '#2A7A68' }}>
            Ingresar al panel →
          </Link>
        </div>
      </footer>

    </div>
  )
}
