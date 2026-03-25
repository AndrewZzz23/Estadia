import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import type { PropiedadConFotos } from '../../types/database'
import { LayoutGrid, List, Pencil, Trash2, ExternalLink, Images } from 'lucide-react'
import ConfirmModal from '../../components/admin/ConfirmModal'
import PropiedadFormPanel from '../../components/admin/PropiedadFormPanel'
import { navyGlassStyle } from '../../lib/styles'

type Vista = 'grid' | 'lista'

export default function Propiedades() {
  const { tenant } = useTenant()
  const [propiedades, setPropiedades] = useState<PropiedadConFotos[]>([])
  const [loading, setLoading]         = useState(true)
  const [vista, setVista]             = useState<Vista>('grid')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen]   = useState(false)
  const [panelId, setPanelId]       = useState<string | null>(null)

  function abrirPanel(id: string | null) { setPanelId(id); setPanelOpen(true) }
  function cerrarPanel() { setPanelOpen(false) }

  useEffect(() => { cargar() }, [tenant])

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

  async function eliminar() {
    if (!confirmId) return
    await supabase.from('propiedades').delete().eq('id', confirmId)
    setPropiedades(prev => prev.filter(p => p.id !== confirmId))
    setConfirmId(null)
  }

  const fotoPrincipal = (p: PropiedadConFotos) =>
    p.fotos_propiedades.find(f => f.es_principal)?.url ??
    p.fotos_propiedades[0]?.url ?? null

  const slug = tenant?.slug ?? ''

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Propiedades</h1>
        <div className="flex items-center gap-2">
          {/* Toggle vista */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setVista('grid')}
              className={`p-1.5 rounded-md transition-all ${vista === 'grid' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
              title="Vista cuadrícula"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setVista('lista')}
              className={`p-1.5 rounded-md transition-all ${vista === 'lista' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
              title="Vista lista"
            >
              <List size={15} />
            </button>
          </div>

          <button
            onClick={() => abrirPanel(null)}
            className="text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:scale-[1.03] active:scale-95"
            style={navyGlassStyle}
          >
            + Nueva
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : propiedades.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No tienes propiedades aún.</p>
          <button onClick={() => abrirPanel(null)} className="text-[#2A7A68] text-sm mt-2 inline-block hover:underline">
            Crea tu primera propiedad
          </button>
        </div>
      ) : vista === 'grid' ? (

        /* ── Vista Grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {propiedades.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">

              {/* Foto */}
              <div className="h-44 bg-gray-100 relative">
                {fotoPrincipal(p) ? (
                  <img src={fotoPrincipal(p)!} alt={p.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Sin foto</div>
                )}

                {/* Badge estado */}
                <span className={`absolute top-2.5 left-2.5 text-xs px-2 py-0.5 rounded-full font-medium ${p.activa ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {p.activa ? 'Activa' : 'Inactiva'}
                </span>

                {/* Badge fotos */}
                <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                  <Images size={10} />
                  {p.fotos_propiedades.length}
                </span>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col">
                <p className="font-semibold text-gray-900 text-base truncate">{p.nombre}</p>
                {p.ubicacion && <p className="text-xs text-gray-400 mt-0.5 truncate">{p.ubicacion}</p>}

                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  {p.capacidad    && <span>{p.capacidad} pers.</span>}
                  {p.habitaciones && <span>· {p.habitaciones} hab.</span>}
                  {p.banos        && <span>· {p.banos} baños</span>}
                </div>

                {p.precio_noche && (
                  <p className="mt-2 text-[#2A7A68] font-semibold text-sm">
                    ${p.precio_noche.toLocaleString('es-CO')}
                    <span className="text-gray-400 font-normal"> / noche</span>
                  </p>
                )}

                {/* Acciones */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                  {/* Toggle activa */}
                  <button
                    onClick={() => toggleActiva(p.id, p.activa)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${p.activa ? 'bg-[#2A7A68]' : 'bg-gray-200'}`}
                    title={p.activa ? 'Desactivar' : 'Activar'}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${p.activa ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>

                  <div className="flex items-center gap-1 ml-auto">
                    {/* Ver en público */}
                    <a
                      href={`/${slug}/casa/${p.id}`}
                      target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#2A7A68] hover:bg-[#2A7A68]/10 transition-colors"
                      title="Ver página pública"
                    >
                      <ExternalLink size={14} />
                    </a>

                    {/* Editar */}
                    <button
                      onClick={() => abrirPanel(p.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#1E3E50] hover:bg-gray-100 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => setConfirmId(p.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      ) : (

        /* ── Vista Lista ── */
        <div className="flex flex-col gap-3">
          {propiedades.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

              {/* Bloque 1 — info */}
              <div className="flex items-center gap-3 px-4 py-3">

                {/* Foto miniatura */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {fotoPrincipal(p) ? (
                    <img src={fotoPrincipal(p)!} alt={p.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">—</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{p.nombre}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${p.activa ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {p.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                    {p.precio_noche && (
                      <span className="text-[#2A7A68] font-medium">${p.precio_noche.toLocaleString('es-CO')}/noche</span>
                    )}
                    <span className="flex items-center gap-0.5"><Images size={10} />{p.fotos_propiedades.length}</span>
                    {p.ubicacion && <span className="hidden sm:inline truncate">{p.ubicacion}</span>}
                  </div>
                </div>

                {/* Acciones — desktop */}
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleActiva(p.id, p.activa)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.activa ? 'bg-[#2A7A68]' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${p.activa ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                  <a href={`/${slug}/casa/${p.id}`} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#2A7A68] hover:bg-[#2A7A68]/10 transition-colors">
                    <ExternalLink size={14} />
                  </a>
                  <button onClick={() => abrirPanel(p.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#1E3E50] hover:bg-gray-100 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmId(p.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Bloque 2 — acciones móvil */}
              <div className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                <button onClick={() => toggleActiva(p.id, p.activa)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.activa ? 'bg-[#2A7A68]' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${p.activa ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs text-gray-400">{p.activa ? 'Activa' : 'Inactiva'}</span>

                <div className="flex items-center gap-1 ml-auto">
                  <a href={`/${slug}/casa/${p.id}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-xl text-gray-400 hover:text-[#2A7A68] hover:bg-[#2A7A68]/10 transition-colors">
                    <ExternalLink size={15} />
                  </a>
                  <button onClick={() => abrirPanel(p.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-[#1E3E50] hover:bg-gray-100 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setConfirmId(p.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    <ConfirmModal
      open={!!confirmId}
      titulo="¿Eliminar propiedad?"
      mensaje="Se eliminarán también todas sus fotos. Esta acción no se puede deshacer."
      onConfirm={eliminar}
      onCancel={() => setConfirmId(null)}
    />

    <PropiedadFormPanel
      open={panelOpen}
      propiedadId={panelId}
      onClose={cerrarPanel}
      onSaved={() => { cerrarPanel(); cargar() }}
    />
    </div>
  )
}
