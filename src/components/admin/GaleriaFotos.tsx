import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { FotoPropiedad } from '../../types/database'
import { ImagePlus, Star, Trash2, Loader2 } from 'lucide-react'
import ConfirmModal from './ConfirmModal'

interface Props {
  propiedadId: string
}

export default function GaleriaFotos({ propiedadId }: Props) {
  const [fotos, setFotos]       = useState<FotoPropiedad[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [confirmFoto, setConfirmFoto] = useState<FotoPropiedad | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { cargarFotos() }, [propiedadId])

  async function cargarFotos() {
    const { data } = await supabase
      .from('fotos_propiedades').select('*')
      .eq('propiedad_id', propiedadId).order('orden')
    setFotos((data as FotoPropiedad[]) ?? [])
  }

  async function subirFotos(files: FileList) {
    setSubiendo(true)
    const nuevas: FotoPropiedad[] = []

    for (const file of Array.from(files)) {
      const ext  = file.name.split('.').pop()
      const path = `${propiedadId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('fotos-propiedades').upload(path, file, { contentType: file.type })
      if (uploadError) continue

      const { data: urlData } = supabase.storage.from('fotos-propiedades').getPublicUrl(path)
      const esPrimera = fotos.length === 0 && nuevas.length === 0

      const { data: fotoData } = await supabase.from('fotos_propiedades').insert({
        propiedad_id: propiedadId,
        url:          urlData.publicUrl,
        storage_path: path,
        orden:        fotos.length + nuevas.length,
        es_principal: esPrimera,
      } as never).select().single()

      if (fotoData) nuevas.push(fotoData as FotoPropiedad)
    }

    setFotos(prev => [...prev, ...nuevas])
    setSubiendo(false)
  }

  async function marcarPrincipal(id: string) {
    await supabase.from('fotos_propiedades').update({ es_principal: false } as never).eq('propiedad_id', propiedadId)
    await supabase.from('fotos_propiedades').update({ es_principal: true } as never).eq('id', id)
    setFotos(prev => prev.map(f => ({ ...f, es_principal: f.id === id })))
  }

  async function eliminarFoto(foto: FotoPropiedad) {
    await supabase.storage.from('fotos-propiedades').remove([foto.storage_path])
    await supabase.from('fotos_propiedades').delete().eq('id', foto.id)
    const restantes = fotos.filter(f => f.id !== foto.id)
    if (foto.es_principal && restantes.length > 0) {
      await supabase.from('fotos_propiedades').update({ es_principal: true } as never).eq('id', restantes[0].id)
      restantes[0].es_principal = true
    }
    setFotos(restantes)
    setConfirmFoto(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files.length) subirFotos(e.dataTransfer.files)
  }

  return (
    <>
    <div className="space-y-4">

      {/* ── Zona de subida ── */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false) }}
        onClick={() => !subiendo && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-all cursor-pointer
          py-7 sm:py-6
          ${dragging  ? 'border-[#2A7A68] bg-[#2A7A68]/5 scale-[1.01]' : ''}
          ${subiendo  ? 'border-gray-200 bg-gray-50 cursor-default' : ''}
          ${!dragging && !subiendo ? 'border-gray-200 hover:border-[#2A7A68]/50 hover:bg-[#2A7A68]/5' : ''}
        `}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => e.target.files && subirFotos(e.target.files)} />

        {subiendo ? (
          <>
            <Loader2 size={28} className="text-[#2A7A68] animate-spin" />
            <p className="text-sm font-medium text-[#2A7A68]">Subiendo fotos...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-[#2A7A68]/10 flex items-center justify-center">
              <ImagePlus size={22} className="text-[#2A7A68]" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-medium text-gray-700">
                <span className="sm:hidden">Toca para agregar fotos</span>
                <span className="hidden sm:inline">Arrastra fotos o haz clic para seleccionar</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · varias a la vez</p>
            </div>
          </>
        )}
      </div>

      {/* ── Galería ── */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fotos.map(foto => (
            <div key={foto.id} className="relative group rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
              <img src={foto.url} alt="" className="w-full h-full object-cover" />

              {/* Badge portada */}
              {foto.es_principal && (
                <span className="absolute top-2 left-2 flex items-center gap-1 bg-[#2A7A68] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <Star size={9} fill="white" /> Portada
                </span>
              )}

              {/* Acciones — siempre visibles en móvil, hover en desktop */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-1.5 px-2 py-2
                bg-gradient-to-t from-black/60 to-transparent
                opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">

                {!foto.es_principal && (
                  <button
                    onClick={() => marcarPrincipal(foto.id)}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/20 hover:bg-[#2A7A68] backdrop-blur-sm text-white transition-all"
                    title="Marcar como portada"
                  >
                    <Star size={14} />
                  </button>
                )}

                <button
                  onClick={() => setConfirmFoto(foto)}
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/20 hover:bg-red-500 backdrop-blur-sm text-white transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <ConfirmModal
      open={!!confirmFoto}
      titulo="¿Eliminar foto?"
      mensaje="Esta acción no se puede deshacer."
      onConfirm={() => confirmFoto && eliminarFoto(confirmFoto)}
      onCancel={() => setConfirmFoto(null)}
    />
    </>
  )
}
