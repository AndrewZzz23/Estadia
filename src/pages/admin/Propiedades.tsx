import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import type { PropiedadConFotos } from '../../types/database'

export default function Propiedades() {
  const { tenant } = useTenant()
  const [propiedades, setPropiedades] = useState<PropiedadConFotos[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargar()
  }, [tenant])

  async function cargar() {
    if (!tenant) return
    const { data } = await supabase
      .from('propiedades')
      .select('*, fotos_propiedades(*)')
      .eq('tenant_id', tenant.id)
      .order('orden')
    setPropiedades((data as PropiedadConFotos[]) ?? [])
    setLoading(false)
  }

  async function toggleActiva(id: string, activa: boolean) {
    await supabase.from('propiedades').update({ activa: !activa } as never).eq('id', id)
    setPropiedades(prev => prev.map(p => p.id === id ? { ...p, activa: !activa } : p))
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta propiedad? Esta acción no se puede deshacer.')) return
    await supabase.from('propiedades').delete().eq('id', id)
    setPropiedades(prev => prev.filter(p => p.id !== id))
  }

  const fotoPrincipal = (p: PropiedadConFotos) =>
    p.fotos_propiedades.find(f => f.es_principal)?.url ??
    p.fotos_propiedades[0]?.url ?? null

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Propiedades</h1>
        <Link
          to="/admin/propiedades/nueva"
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nueva propiedad
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : propiedades.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No tienes propiedades aún.</p>
          <Link to="/admin/propiedades/nueva" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            Crea tu primera propiedad
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {propiedades.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col">
              {/* Foto */}
              <div className="h-48 bg-gray-100 relative">
                {fotoPrincipal(p) ? (
                  <img src={fotoPrincipal(p)!} alt={p.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Sin foto</div>
                )}
                <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-medium ${p.activa ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {p.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              {/* Info */}
              <div className="p-5 flex-1 flex flex-col">
                <p className="font-semibold text-gray-900 text-base truncate">{p.nombre}</p>
                {p.ubicacion && <p className="text-sm text-gray-400 mt-0.5">{p.ubicacion}</p>}

                <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                  {p.capacidad   && <span>{p.capacidad} personas</span>}
                  {p.habitaciones && <span>· {p.habitaciones} hab.</span>}
                  {p.banos       && <span>· {p.banos} baños</span>}
                </div>

                {p.precio_noche && (
                  <p className="mt-2 text-brand-500 font-semibold">
                    ${p.precio_noche.toLocaleString('es-CO')}
                    <span className="text-gray-400 font-normal text-sm"> / noche</span>
                  </p>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => toggleActiva(p.id, p.activa)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.activa ? 'bg-brand-500' : 'bg-gray-200'}`}
                    title={p.activa ? 'Activa' : 'Inactiva'}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${p.activa ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>

                  <Link
                    to={`/admin/propiedades/${p.id}/editar`}
                    className="ml-auto text-sm text-gray-500 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                  >
                    Editar
                  </Link>

                  <button
                    onClick={() => eliminar(p.id)}
                    className="text-sm text-gray-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
