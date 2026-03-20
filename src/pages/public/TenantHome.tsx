import { useEffect, useState, useRef } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { PropiedadConFotos, Tenant } from '../../types/database'
import { MapPin, Users, BedDouble, Bath, ChevronLeft, ChevronRight } from 'lucide-react'
import { youtubeEmbed, esVideoDirecto } from '../../lib/media'
import Logo from '../../components/Logo'
import WhatsAppIcon from '../../components/WhatsAppIcon'
import InstagramIcon from '../../components/InstagramIcon'
import FacebookIcon from '../../components/FacebookIcon'
import TikTokIcon from '../../components/TikTokIcon'
import { waGlassStyle, igGlassStyle, fbGlassStyle, ttGlassStyle } from '../../lib/styles'

export default function TenantHome() {
  const { slug } = useParams<{ slug: string }>()
  const [tenant, setTenant]       = useState<Tenant | null | false>(null)
  const [propiedades, setPropiedades] = useState<PropiedadConFotos[]>([])
  const [loading, setLoading]     = useState(true)
  const [scrolled, setScrolled]   = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!footerRef.current) return
    const obs = new IntersectionObserver(([e]) => setFooterVisible(e.isIntersecting), { threshold: 0 })
    obs.observe(footerRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    async function cargar() {
      const { data: t } = await supabase
        .from('tenants').select('*').eq('slug', slug!).eq('activa', true).maybeSingle()
      if (!t) { setTenant(false); setLoading(false); return }
      setTenant(t as Tenant)

      const { data: props } = await supabase
        .from('propiedades').select('*, fotos_propiedades(*)')
        .eq('tenant_id', (t as Tenant).id).eq('activa', true).order('orden')
      setPropiedades((props as PropiedadConFotos[]) ?? [])
      setLoading(false)
    }
    cargar()
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3EF]">
      <div className="w-8 h-8 border-2 border-[#2A7A68] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (tenant === false) return <Navigate to="/" replace />

  const t = tenant as Tenant

  function fotoPrincipal(p: PropiedadConFotos) {
    return p.fotos_propiedades.find(f => f.es_principal)?.url
      ?? p.fotos_propiedades[0]?.url ?? null
  }


  return (
    <div className="min-h-screen bg-[#E8E4DE]">

      {/* ── NAV ── */}
      <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        scrolled ? 'bg-[#1E3E50] shadow-md' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo / nombre */}
          <div className="flex items-center gap-2.5">
            {t.logo_url && (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-white/10 flex-shrink-0">
                <img src={t.logo_url} alt={t.nombre} className="w-full h-full object-cover" />
              </div>
            )}
            <span className="font-semibold text-base tracking-tight text-white">
              {t.nombre}
            </span>
          </div>

          {/* Links */}
          <nav className="hidden sm:flex items-center gap-6">
            {['Quiénes somos', 'Nuestras casas', 'Contacto'].map(label => {
              const href = label === 'Quiénes somos' ? '#quienes-somos'
                         : label === 'Nuestras casas' ? '#propiedades'
                         : '#contacto'
              return (
                <a key={label} href={href}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                  {label}
                </a>
              )
            })}
          </nav>
        </div>

        {/* Estadia badge — borde derecho */}
        <a href="/" title="Powered by Estadia"
          className="hidden sm:flex absolute top-1/2 right-4 -translate-y-1/2 items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/15 opacity-35 hover:opacity-75 transition-opacity"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.05)' }}>
          <span className="text-white text-[10px] tracking-widest uppercase font-medium">by</span>
          <span className="scale-75 origin-left"><Logo dark size="sm" /></span>
        </a>
      </header>

      {/* ── HERO ── */}
      {(t.foto_portada || (propiedades.length > 0 && fotoPrincipal(propiedades[0]))) ? (
        <div className="relative h-[90vh] min-h-[560px] overflow-hidden">
          {/* Video o imagen de portada del tenant, si no: foto de la primera propiedad */}
          {t.foto_portada && youtubeEmbed(t.foto_portada) ? (
            <iframe
              src={youtubeEmbed(t.foto_portada)!}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ border: 'none', transform: 'scale(1.5)', transformOrigin: 'center' }}
              allow="autoplay; encrypted-media"
              allowFullScreen={false}
            />
          ) : t.foto_portada && esVideoDirecto(t.foto_portada) ? (
            <video
              src={t.foto_portada}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay muted loop playsInline
            />
          ) : (
            <img
              src={t.foto_portada ?? fotoPrincipal(propiedades[0])!}
              alt={t.nombre}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/75" />
          <div className="absolute inset-0 flex flex-col justify-end pl-8 pb-8">
            <div
              className="inline-flex flex-col self-start px-6 py-4 rounded-2xl"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.3)' }}
            >
              <h1 className="text-white text-5xl sm:text-6xl font-bold leading-tight">
                {t.nombre}
              </h1>
              {(t as any).slogan && (
                <p className="text-white/65 text-sm font-normal mt-1">
                  {(t as any).slogan}
                </p>
              )}
            </div>
          </div>

          {/* Burbujas info */}
          <div className="absolute top-24 right-8 flex flex-col gap-3">
            {(() => {
              const minPrecio = Math.min(...propiedades.filter(p => p.precio_noche).map(p => p.precio_noche!))
              return isFinite(minPrecio) ? (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl px-4 py-3 text-right">
                  <p className="text-xs text-white/60 mb-0.5">Desde</p>
                  <p className="text-2xl font-bold">${minPrecio.toLocaleString('es-CO')}</p>
                  <p className="text-xs text-white/60">por noche</p>
                </div>
              ) : null
            })()}
            {propiedades.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl px-4 py-3 text-right">
                <p className="text-2xl font-bold">{propiedades.length}</p>
                <p className="text-xs text-white/60">{propiedades.length === 1 ? 'propiedad' : 'propiedades'}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-32 bg-[#1E3E50]" />
      )}

      {/* ── DESCRIPCIÓN EMPRESA ── */}

      {/* ── PROPIEDADES ── */}
      <main>
        {propiedades.length === 0 ? (
          <p className="text-center text-gray-400 py-20">No hay propiedades disponibles.</p>
        ) : (
          <>
            <div id="propiedades" className="max-w-6xl mx-auto px-6 pt-16 pb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2A7A68] mb-2">Propiedades</p>
              <h2 className="text-3xl font-bold text-[#1E3E50]">Nuestros espacios</h2>
            </div>

            <div className="max-w-5xl mx-auto px-6 pb-20 flex flex-col gap-5 mt-8">
              {propiedades.map((p, i) => (
                <CardIOS key={p.id} p={p} slug={slug!} invertida={i % 2 !== 0} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── QUIÉNES SOMOS ── */}
      <section id="quienes-somos" className="bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Texto */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2A7A68] mb-4">Quiénes somos</p>
            <h2 className="text-4xl font-bold text-[#1E3E50] leading-tight mb-6">{t.nombre}</h2>
            {t.descripcion && (
              <p className="text-gray-500 text-lg leading-relaxed whitespace-pre-wrap">{t.descripcion}</p>
            )}
            <div className="flex flex-wrap gap-8 mt-10">
              {propiedades.length > 0 && (
                <div>
                  <p className="text-3xl font-bold text-[#1E3E50]">{propiedades.length}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">{propiedades.length === 1 ? 'Propiedad' : 'Propiedades'}</p>
                </div>
              )}
              {t.telefono && (
                <div>
                  <p className="text-3xl font-bold text-[#1E3E50]">24/7</p>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">Disponibles</p>
                </div>
              )}
            </div>
            {t.telefono && (
              <a
                href={`https://wa.me/${t.telefono.replace(/\D/g,'')}?text=${encodeURIComponent('Hola, quiero más información.')}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 bg-[#1E3E50] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#162e3b] transition-colors"
              >
                <WhatsAppIcon size={16} />
                Escríbenos
              </a>
            )}
          </div>

          {/* Logo / visual */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Anillo decorativo */}
              <div className="absolute inset-0 rounded-full border-2 border-[#2A7A68]/20 scale-110" />
              <div className="absolute inset-0 rounded-full border border-[#2A7A68]/10 scale-125" />
              {t.logo_url ? (
                <div className="w-56 h-56 rounded-full bg-[#F5F3EF] flex items-center justify-center overflow-hidden shadow-xl shadow-[#1E3E50]/10">
                  <img src={t.logo_url} alt={t.nombre} className="w-3/4 h-3/4 object-contain" />
                </div>
              ) : (
                <div className="w-56 h-56 rounded-full bg-gradient-to-br from-[#1E3E50] to-[#2A7A68] flex items-center justify-center shadow-xl">
                  <span className="text-white text-5xl font-bold">{t.nombre.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER / CONTACTO ── */}
      <footer id="contacto" ref={footerRef} className="bg-[#1E3E50] text-white/60 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">{t.nombre}</p>
            {t.email && <p className="text-xs mt-0.5">{t.email}</p>}
            {t.telefono && <p className="text-xs mt-0.5">{t.telefono}</p>}
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-3 flex justify-center">
            <a href="/"
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all group"
            >
              <span className="text-white/35 text-[11px] tracking-widest uppercase group-hover:text-white/60 transition-colors">Servicio ofrecido por</span>
              <span className="opacity-50 group-hover:opacity-90 transition-opacity scale-75 origin-left">
                <Logo dark size="sm" />
              </span>
            </a>
          </div>
        </div>
      </footer>

      {/* ── FABs ── */}
      {!footerVisible && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {t.tiktok_url && t.mostrar_tiktok && (
            <a href={`https://tiktok.com/@${t.tiktok_url}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ ...ttGlassStyle, width: 48, height: 48 }}>
              <TikTokIcon size={21} />
            </a>
          )}
          {t.facebook_url && t.mostrar_facebook && (
            <a href={`https://facebook.com/${t.facebook_url}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ ...fbGlassStyle, width: 48, height: 48 }}>
              <FacebookIcon size={21} />
            </a>
          )}
          {t.instagram_url && t.mostrar_instagram && (
            <a href={`https://instagram.com/${t.instagram_url}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ ...igGlassStyle, width: 48, height: 48 }}>
              <InstagramIcon size={21} />
            </a>
          )}
          {t.telefono && (
            <a href={`https://wa.me/${t.telefono.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quiero más información sobre sus propiedades.')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-5 py-3.5 rounded-full transition-all hover:scale-105 active:scale-95"
              style={waGlassStyle}>
              <WhatsAppIcon size={20} />
              WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-componentes de tarjetas ──


function CardIOS({ p, slug, invertida }: {
  p: PropiedadConFotos; slug: string; invertida: boolean
}) {
  const fotos = [...p.fotos_propiedades].sort((a, b) => {
    if (a.es_principal) return -1
    if (b.es_principal) return 1
    return a.orden - b.orden
  })
  const [idx, setIdx] = useState(0)

  const prev = (e: React.MouseEvent) => { e.preventDefault(); setIdx(i => (i - 1 + fotos.length) % fotos.length) }
  const next = (e: React.MouseEvent) => { e.preventDefault(); setIdx(i => (i + 1) % fotos.length) }

  return (
    <div className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col sm:flex-row ${invertida ? 'sm:flex-row-reverse' : ''}`}>

      {/* Carrusel */}
      <div className="relative w-full sm:w-1/2 overflow-hidden bg-gray-100 aspect-[4/3] sm:aspect-auto sm:min-h-[360px]">
        {fotos.length > 0 ? (
          <>
            <Link to={`/${slug}/casa/${p.id}`} className="block absolute inset-0">
              <img
                src={fotos[idx].url}
                alt={p.nombre}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              />
            </Link>

            {fotos.length > 1 && (
              <>
                <button onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all z-10">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all z-10">
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {fotos.map((_, i) => (
                    <button key={i} onClick={e => { e.preventDefault(); setIdx(i) }}
                      className={`rounded-full transition-all ${i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">Sin foto</div>
        )}

        {p.precio_noche && (
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full z-10">
            ${p.precio_noche.toLocaleString('es-CO')} / noche
          </div>
        )}
      </div>

      {/* Info */}
      <div className="w-full sm:w-1/2 flex flex-col justify-center px-8 py-8">
        <h3 className="font-bold text-[#1E3E50] text-3xl leading-snug">{p.nombre}</h3>
        {p.ubicacion && (
          <div className="flex items-center gap-1 text-gray-400 text-sm mt-2">
            <MapPin size={12} />{p.ubicacion}
          </div>
        )}
        {p.descripcion && (
          <p className="text-gray-500 text-base mt-4 leading-relaxed whitespace-pre-wrap">{p.descripcion}</p>
        )}
        <div className="flex items-center gap-4 mt-4 text-gray-400 text-sm">
          {p.capacidad    && <span className="flex items-center gap-1"><Users size={12}/>{p.capacidad} pers.</span>}
          {p.habitaciones && <span className="flex items-center gap-1"><BedDouble size={12}/>{p.habitaciones} hab.</span>}
          {p.banos        && <span className="flex items-center gap-1"><Bath size={12}/>{p.banos} baños</span>}
        </div>
        <div className="mt-6">
          <Link
            to={`/${slug}/casa/${p.id}`}
            className="inline-block bg-[#1E3E50] text-white text-sm font-semibold px-6 py-2.5 rounded-2xl hover:bg-[#162e3b] transition-colors"
          >
            Ver detalles
          </Link>
        </div>
      </div>
    </div>
  )
}
