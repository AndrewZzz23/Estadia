import { Link } from 'react-router-dom'
import Logo from '../../components/Logo'
import { Globe, Smartphone, CalendarDays, TrendingUp, ArrowRight, MessageCircle, Receipt } from 'lucide-react'

import screenshotDash  from '../../assets/screenshots/dashboard.png'
import screenshotRes   from '../../assets/screenshots/reservas.png'
import screenshotCal   from '../../assets/screenshots/calendario.png'

const SCREENSHOTS = {
  dashboard:  screenshotDash  as string,
  reservas:   screenshotRes   as string,
  calendario: screenshotCal   as string,
  gastos:     null as string | null,
}

function PhoneMockup({ src, label, color = '#1E3E50' }: { src: string | null; label: string; color?: string }) {
  return (
    <div className="relative flex-shrink-0 w-[240px] sm:w-[280px]">
      {/* Marco del teléfono */}
      <div
        className="relative rounded-[32px] overflow-hidden shadow-2xl"
        style={{
          background: '#0D1F2D',
          border: '6px solid #1a2e3d',
          boxShadow: `0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06), 0 -4px 0 ${color}40 inset`,
          aspectRatio: '9/19',
        }}
      >
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full z-10"
          style={{ background: '#0D1F2D' }} />

        {/* Pantalla */}
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
      {/* Reflejo */}
      <div className="absolute inset-0 rounded-[32px] pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)' }} />
    </div>
  )
}

const FEATURES = [
  {
    icon: Globe,
    title: 'Página web incluida',
    desc: 'Tus propiedades con fotos, precios y disponibilidad. Lista para compartir.',
    color: '#2A7A68',
  },
  {
    icon: Smartphone,
    title: 'App en tu celular',
    desc: 'Instala el panel admin en tu teléfono como una app nativa. Sin descargas.',
    color: '#1E3E50',
  },
  {
    icon: CalendarDays,
    title: 'Calendario visual',
    desc: 'Todas tus propiedades en un calendario. Bloqueos, reservas y festivos.',
    color: '#7C3AED',
  },
  {
    icon: TrendingUp,
    title: 'Control financiero',
    desc: 'Ingresos, gastos y balance neto. Por mes, por propiedad.',
    color: '#C4693A',
  },
  {
    icon: Receipt,
    title: 'Registro de gastos',
    desc: 'Aseo, mantenimiento, servicios. Todo categorizado y con historial.',
    color: '#B45309',
  },
  {
    icon: MessageCircle,
    title: 'Flujo por WhatsApp',
    desc: 'Sin pagos online. El cliente consulta, tú confirmas. Simple.',
    color: '#16A34A',
  },
]

const PASOS = [
  {
    num: '01',
    title: 'Crea tu cuenta',
    desc: 'Regístrate con un código de acceso único para tu negocio. Sin tarjetas, sin contratos.',
    screenshot: SCREENSHOTS.dashboard,
    screenshotLabel: 'Vista del Dashboard',
  },
  {
    num: '02',
    title: 'Agrega tus propiedades',
    desc: 'Sube fotos, define precios, capacidad y disponibilidad. Tu página queda lista al instante.',
    screenshot: SCREENSHOTS.reservas,
    screenshotLabel: 'Vista de Reservas',
  },
  {
    num: '03',
    title: 'Gestiona desde el celular',
    desc: 'Instala el admin como app, recibe consultas por WhatsApp y confirma reservas en segundos.',
    screenshot: SCREENSHOTS.calendario,
    screenshotLabel: 'Vista del Calendario',
  },
]

const TIPOS = [
  { emoji: '🏡', label: 'Fincas vacacionales' },
  { emoji: '🏢', label: 'Apartamentos turísticos' },
  { emoji: '🌲', label: 'Cabañas y glamping' },
  { emoji: '🏠', label: 'Casas de campo' },
  { emoji: '🏖️', label: 'Casas de playa' },
  { emoji: '🏨', label: 'Hostales pequeños' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: "'Sora', sans-serif" }}>

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
        style={{ background: 'linear-gradient(160deg, #0A1520 0%, #1E3E50 45%, #1a5c4a 100%)' }}
      >
        {/* Orbs decorativos */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(42,122,104,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(30,62,80,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative max-w-6xl mx-auto px-5">
          {/* Texto hero */}
          <div className="text-center pt-8 pb-14">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 tracking-wide uppercase"
              style={{ background: 'rgba(100,181,160,0.15)', border: '1px solid rgba(100,181,160,0.3)', color: '#64B5A0' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Plataforma para arriendos vacacionales
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold text-white leading-[1.1] mb-6 max-w-3xl mx-auto">
              Tu negocio de arriendos,{' '}
              <span style={{
                background: 'linear-gradient(90deg, #64B5A0, #2A7A68)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                sin complicaciones
              </span>
            </h1>

            <p className="text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Página web + panel admin instalable en tu celular.
              Reservas, ingresos y gastos en un solo lugar.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <Link
                to="/admin"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:scale-[1.03] active:scale-95 w-full sm:w-auto justify-center"
                style={{ background: 'white', color: '#1E3E50', boxShadow: '0 8px 32px rgba(255,255,255,0.15)' }}
              >
                Comenzar gratis
                <ArrowRight size={16} />
              </Link>
              <a
                href="#caracteristicas"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-medium transition-all w-full sm:w-auto justify-center"
                style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.06)' }}
              >
                Ver características
              </a>
            </div>

            {/* ── MOCKUPS HERO — 3 teléfonos ── */}
            <div className="flex items-end justify-center gap-4 sm:gap-6">
                <div className="hidden sm:block" style={{ transform: 'translateY(30px) rotate(-5deg)', transformOrigin: 'bottom center', opacity: 0.9 }}>
                <PhoneMockup src={SCREENSHOTS.reservas} label="Reservas" color="#2A7A68" />
              </div>
              <div style={{ transform: 'translateY(0px)', zIndex: 2 }}>
                <PhoneMockup src={SCREENSHOTS.dashboard} label="Dashboard" color="#64B5A0" />
              </div>
              <div className="hidden sm:block" style={{ transform: 'translateY(30px) rotate(5deg)', transformOrigin: 'bottom center', opacity: 0.9 }}>
                <PhoneMockup src={SCREENSHOTS.calendario} label="Calendario" color="#1E3E50" />
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%' }}>
            <path d="M0 80L1440 80L1440 30C1100 80 900 10 720 35C540 60 300 5 0 30L0 80Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="caracteristicas" className="max-w-6xl mx-auto px-5 py-24">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#2A7A68' }}>Características</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3E50]">Todo lo que necesitas</h2>
          <p className="text-gray-400 mt-3 text-lg">Sin herramientas complicadas. Sin costos ocultos.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-3xl p-6 border transition-all hover:shadow-lg hover:-translate-y-0.5 group"
              style={{ borderColor: `${color}20`, background: `${color}06` }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: `${color}15` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA — pasos con mockup ── */}
      <section id="como-funciona" className="py-24" style={{ background: '#F4F6F9' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#2A7A68' }}>Proceso</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3E50]">Cómo funciona</h2>
            <p className="text-gray-400 mt-3 text-lg">Tres pasos y listo</p>
          </div>

          <div className="flex flex-col gap-10">
            {PASOS.map(({ num, title, desc, screenshot, screenshotLabel }, i) => (
              <div
                key={num}
                className={`flex flex-col ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'} items-center gap-8 sm:gap-14`}
              >
                {/* Texto */}
                <div className="flex-1">
                  <div
                    className="text-xs font-black mb-4 w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #1E3E50, #2A7A68)', color: 'white', fontSize: '13px' }}
                  >
                    {num}
                  </div>
                  <h3 className="text-2xl font-bold text-[#1E3E50] mb-3">{title}</h3>
                  <p className="text-gray-500 leading-relaxed">{desc}</p>
                </div>

                {/* Mockup */}
                <div className="flex-shrink-0">
                  <PhoneMockup src={screenshot} label={screenshotLabel} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUIÉN ── */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#2A7A68' }}>Para quién</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3E50]">¿Es Estadia para ti?</h2>
          <p className="text-gray-400 mt-3 text-lg">Diseñado para propietarios independientes</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
          {TIPOS.map(({ emoji, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-sm hover:-translate-y-0.5 transition-all"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-semibold text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '💳', text: 'Sin pagos online — tú manejas el cobro como quieras' },
            { icon: '📄', text: 'Sin contratos — cancela en cualquier momento' },
            { icon: '🧑‍💻', text: 'Sin conocimientos técnicos — todo visual e intuitivo' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3 p-5 rounded-2xl" style={{ background: 'rgba(42,122,104,0.07)', border: '1px solid rgba(42,122,104,0.12)' }}>
              <span className="text-xl flex-shrink-0">{icon}</span>
              <p className="text-sm font-medium text-gray-700 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-5 pb-20">
        <div
          className="max-w-4xl mx-auto rounded-3xl px-8 py-20 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0D1F2D 0%, #1E3E50 50%, #2A7A68 100%)' }}
        >
          {/* Orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(100,181,160,0.15) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(30,62,80,0.4) 0%, transparent 70%)', transform: 'translate(-20%, 20%)' }} />

          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Empieza hoy mismo
            </h2>
            <p className="mb-10 text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Ten tu página de propiedades lista en minutos. Sin tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/admin"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:scale-[1.03] active:scale-95 w-full sm:w-auto justify-center"
                style={{ background: 'white', color: '#1E3E50', boxShadow: '0 8px 32px rgba(255,255,255,0.2)' }}
              >
                Crear mi cuenta gratis
                <ArrowRight size={16} />
              </Link>
              <a
                href="https://wa.me/573000000000"
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
