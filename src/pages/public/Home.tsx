import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { PropiedadConFotos } from '../../types/database'

export default function Home() {
  const [propiedades, setPropiedades] = useState<PropiedadConFotos[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('propiedades')
        .select('*, fotos_propiedades(*)')
        .eq('activa', true)
        .order('orden')

      setPropiedades((data as PropiedadConFotos[]) ?? [])
      setLoading(false)
    }
    cargar()
  }, [])

  const fotoPrincipal = (p: PropiedadConFotos) =>
    p.fotos_propiedades.find(f => f.es_principal)?.url ??
    p.fotos_propiedades[0]?.url ??
    null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Estadia</h1>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white py-16 text-center border-b border-gray-100">
        <h2 className="text-4xl font-bold text-gray-900">Encuentra tu lugar ideal</h2>
        <p className="text-gray-500 mt-3 text-lg">Propiedades vacacionales para descansar como mereces</p>
      </section>

      {/* Propiedades */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-52 bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : propiedades.length === 0 ? (
          <p className="text-center text-gray-400 py-20">No hay propiedades disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {propiedades.map(p => (
              <Link key={p.id} to={`/casa/${p.id}`} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                {/* Foto */}
                <div className="h-52 bg-gray-100 overflow-hidden">
                  {fotoPrincipal(p) ? (
                    <img
                      src={fotoPrincipal(p)!}
                      alt={p.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Sin foto</div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{p.nombre}</h3>
                  {p.ubicacion && <p className="text-sm text-gray-400 mt-0.5">{p.ubicacion}</p>}

                  <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                    {p.capacidad && <span>{p.capacidad} personas</span>}
                    {p.habitaciones && <span>{p.habitaciones} hab.</span>}
                    {p.banos && <span>{p.banos} baños</span>}
                  </div>

                  {p.precio_noche && (
                    <p className="mt-3 text-blue-600 font-semibold">
                      ${p.precio_noche.toLocaleString('es-CO')}
                      <span className="text-gray-400 font-normal"> / noche</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
