import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { PropiedadConFotos, Tenant } from '../../types/database'
import { MapPin, Users, BedDouble, Bath, MessageCircle, ArrowRight } from 'lucide-react'

export default function TenantHome() {
  const { slug } = useParams<{ slug: string }>()
  const [tenant, setTenant]       = useState<Tenant | null | false>(null)
  const [propiedades, setPropiedades] = useState<PropiedadConFotos[]>([])
  const [loading, setLoading]     = useState(true)
  const [scrolled, setScrolled]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
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

  function waLink(p: PropiedadConFotos) {
    const num = p.whatsapp ?? t.telefono ?? ''
    const msg = encodeURIComponent(`Hola, me interesa la propiedad "${p.nombre}". ¿Está disponible?`)
    return `https://wa.me/${num.replace(/\D/g, '')}?text=${msg}`
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ── */}
      <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className={`font-semibold text-lg tracking-tight transition-colors ${
            scrolled ? 'text-[#1E3E50]' : 'text-white'
          }`}>
            {t.nombre}
          </span>
          {t.telefono && (
            <a
              href={`https://wa.me/${t.telefono.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quiero más información sobre sus propiedades.')}`}
              target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
                scrolled
                  ? 'border-[#1E3E50] text-[#1E3E50] hover:bg-[#1E3E50] hover:text-white'
                  : 'border-white/60 text-white hover:bg-white hover:text-[#1E3E50]'
              }`}
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      {(t.foto_portada || (propiedades.length > 0 && fotoPrincipal(propiedades[0]))) ? (
        <div className="relative h-[90vh] min-h-[560px] overflow-hidden">
          {/* Video o imagen de portada del tenant, si no: foto de la primera propiedad */}
          {t.foto_portada && (t.foto_portada.includes('.mp4') || t.foto_portada.includes('.webm') || t.foto_portada.includes('.mov')) ? (
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
          <div className="absolute inset-0 flex flex-col justify-end px-8 pb-16 max-w-6xl mx-auto left-0 right-0">
            <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-3">
              {t.nombre}
            </p>
            <h1 className="text-white text-5xl sm:text-6xl font-bold leading-tight max-w-2xl">
              {propiedades[0].nombre}
            </h1>
            {propiedades[0].ubicacion && (
              <div className="flex items-center gap-1.5 text-white/70 mt-3">
                <MapPin size={14} />
                <span className="text-sm">{propiedades[0].ubicacion}</span>
              </div>
            )}
            <div className="flex items-center gap-4 mt-6">
              <Link
                to={`/${slug}/casa/${propiedades[0].id}`}
                className="bg-white text-[#1E3E50] font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#F5F3EF] transition-colors inline-flex items-center gap-2"
              >
                Ver propiedad <ArrowRight size={16} />
              </Link>
              {(propiedades[0].whatsapp ?? t.telefono) && (
                <a
                  href={waLink(propiedades[0])}
                  target="_blank" rel="noopener noreferrer"
                  className="border border-white/50 text-white font-medium px-6 py-3 rounded-full text-sm hover:bg-white/10 transition-colors inline-flex items-center gap-2"
                >
                  <MessageCircle size={14} />
                  Consultar
                </a>
              )}
            </div>
          </div>
          {propiedades[0].precio_noche && (
            <div className="absolute top-24 right-8 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl px-4 py-3 text-right">
              <p className="text-xs text-white/60 mb-0.5">Desde</p>
              <p className="text-2xl font-bold">${propiedades[0].precio_noche.toLocaleString('es-CO')}</p>
              <p className="text-xs text-white/60">por noche</p>
            </div>
          )}
        </div>
      ) : (
        <div className="h-32 bg-[#1E3E50]" />
      )}

      {/* ── DESCRIPCIÓN EMPRESA ── */}
      {t.descripcion && (
        <section className="max-w-6xl mx-auto px-6 py-16 border-b border-gray-100">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2A7A68] mb-4">Quiénes somos</p>
            <p className="text-gray-600 text-lg leading-relaxed">{t.descripcion}</p>
          </div>
        </section>
      )}

      {/* ── PROPIEDADES ── */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {propiedades.length === 0 ? (
          <p className="text-center text-gray-400 py-20">No hay propiedades disponibles.</p>
        ) : (
          <>
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#2A7A68] mb-2">Propiedades</p>
                <h2 className="text-3xl font-bold text-[#1E3E50]">Nuestros espacios</h2>
              </div>
            </div>

            {/* Grid: primera grande + resto normales */}
            <div className="space-y-6">
              {/* Card destacada (primera propiedad — skip si ya está en el hero) */}
              {propiedades.length > 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {propiedades.slice(1, 3).map(p => (
                    <CardGrande key={p.id} p={p} slug={slug!} t={t} foto={fotoPrincipal(p)} waLink={waLink(p)} />
                  ))}
                </div>
              )}

              {/* Grid resto */}
              {propiedades.length > 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {propiedades.slice(3).map(p => (
                    <CardNormal key={p.id} p={p} slug={slug!} t={t} foto={fotoPrincipal(p)} waLink={waLink(p)} />
                  ))}
                </div>
              )}

              {/* Si solo hay 1 prop: mostrar como card grande debajo */}
              {propiedades.length === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CardGrande p={propiedades[0]} slug={slug!} t={t} foto={fotoPrincipal(propiedades[0])} waLink={waLink(propiedades[0])} />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1E3E50] text-white/60 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">{t.nombre}</p>
            {t.email && <p className="text-xs mt-0.5">{t.email}</p>}
          </div>
          {t.telefono && (
            <a
              href={`https://wa.me/${t.telefono.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quiero más información.')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bc5a] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
            >
              <MessageCircle size={14} />
              Escríbenos por WhatsApp
            </a>
          )}
        </div>
      </footer>
    </div>
  )
}

// ── Sub-componentes de tarjetas ──

function CardGrande({ p, slug, t, foto, waLink }: {
  p: PropiedadConFotos; slug: string; t: Tenant; foto: string | null; waLink: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-gray-100 aspect-[4/3]">
      {foto ? (
        <img src={foto} alt={p.nombre} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      ) : (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">Sin foto</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {p.precio_noche && (
        <div className="absolute top-4 right-4 bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          ${p.precio_noche.toLocaleString('es-CO')} / noche
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-white font-bold text-xl leading-tight">{p.nombre}</p>
            {p.ubicacion && (
              <div className="flex items-center gap-1 text-white/60 mt-1 text-xs">
                <MapPin size={11} />{p.ubicacion}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2 text-white/70 text-xs">
              {p.capacidad    && <span className="flex items-center gap-1"><Users size={11}/>{p.capacidad} pers.</span>}
              {p.habitaciones && <span className="flex items-center gap-1"><BedDouble size={11}/>{p.habitaciones} hab.</span>}
              {p.banos        && <span className="flex items-center gap-1"><Bath size={11}/>{p.banos} baños</span>}
            </div>
          </div>
          <Link
            to={`/${slug}/casa/${p.id}`}
            className="flex-shrink-0 bg-white text-[#1E3E50] font-semibold text-xs px-4 py-2 rounded-full hover:bg-[#F5F3EF] transition-colors"
          >
            Ver más
          </Link>
        </div>
      </div>
    </div>
  )
}

function CardNormal({ p, slug, t, foto, waLink }: {
  p: PropiedadConFotos; slug: string; t: Tenant; foto: string | null; waLink: string
}) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100">
      <Link to={`/${slug}/casa/${p.id}`} className="block relative overflow-hidden aspect-[3/2] bg-gray-100">
        {foto ? (
          <img src={foto} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Sin foto</div>
        )}
        {p.precio_noche && (
          <div className="absolute bottom-3 left-3 bg-[#1E3E50]/80 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            ${p.precio_noche.toLocaleString('es-CO')} / noche
          </div>
        )}
      </Link>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-base">{p.nombre}</h3>
        {p.ubicacion && (
          <div className="flex items-center gap-1 text-gray-400 mt-1 text-xs">
            <MapPin size={11} />{p.ubicacion}
          </div>
        )}
        <div className="flex items-center gap-3 mt-2 text-gray-500 text-xs">
          {p.capacidad    && <span className="flex items-center gap-1"><Users size={11}/>{p.capacidad}</span>}
          {p.habitaciones && <span className="flex items-center gap-1"><BedDouble size={11}/>{p.habitaciones}</span>}
          {p.banos        && <span className="flex items-center gap-1"><Bath size={11}/>{p.banos}</span>}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <Link to={`/${slug}/casa/${p.id}`} className="text-xs font-semibold text-[#2A7A68] hover:underline inline-flex items-center gap-1">
            Ver detalles <ArrowRight size={12} />
          </Link>
          {(p.whatsapp ?? t.telefono) && (
            <a
              href={waLink}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-all"
            >
              <MessageCircle size={12} />
              Consultar
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
