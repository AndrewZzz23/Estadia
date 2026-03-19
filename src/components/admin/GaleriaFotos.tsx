import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { FotoPropiedad } from '../../types/database'

interface Props {
  propiedadId: string
}

export default function GaleriaFotos({ propiedadId }: Props) {
  const [fotos, setFotos] = useState<FotoPropiedad[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    cargarFotos()
  }, [propiedadId])

  async function cargarFotos() {
    const { data } = await supabase
      .from('fotos_propiedades')
      .select('*')
      .eq('propiedad_id', propiedadId)
      .order('orden')
    setFotos((data as FotoPropiedad[]) ?? [])
  }

  async function subirFotos(files: FileList) {
    setSubiendo(true)
    const nuevas: FotoPropiedad[] = []

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${propiedadId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('fotos-propiedades')
        .upload(path, file, { contentType: file.type })

      if (uploadError) continue

      const { data: urlData } = supabase.storage
        .from('fotos-propiedades')
        .getPublicUrl(path)

      const esPrimera = fotos.length === 0 && nuevas.length === 0

      const { data: fotoData } = await supabase
        .from('fotos_propiedades')
        .insert({
          propiedad_id: propiedadId,
          url: urlData.publicUrl,
          storage_path: path,
          orden: fotos.length + nuevas.length,
          es_principal: esPrimera,
        } as never)
        .select()
        .single()

      if (fotoData) nuevas.push(fotoData as FotoPropiedad)
    }

    setFotos(prev => [...prev, ...nuevas])
    setSubiendo(false)
  }

  async function marcarPrincipal(id: string) {
    // Desmarcar todas
    await supabase.from('fotos_propiedades')
      .update({ es_principal: false } as never)
      .eq('propiedad_id', propiedadId)
    // Marcar la seleccionada
    await supabase.from('fotos_propiedades')
      .update({ es_principal: true } as never)
      .eq('id', id)
    setFotos(prev => prev.map(f => ({ ...f, es_principal: f.id === id })))
  }

  async function eliminarFoto(foto: FotoPropiedad) {
    await supabase.storage.from('fotos-propiedades').remove([foto.storage_path])
    await supabase.from('fotos_propiedades').delete().eq('id', foto.id)

    const restantes = fotos.filter(f => f.id !== foto.id)

    // Si era la principal y quedan fotos, la primera pasa a ser principal
    if (foto.es_principal && restantes.length > 0) {
      await supabase.from('fotos_propiedades')
        .update({ es_principal: true } as never)
        .eq('id', restantes[0].id)
      restantes[0].es_principal = true
    }

    setFotos(restantes)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) subirFotos(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
  }

  return (
    <div className="space-y-4">
      {/* Zona de subida */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !subiendo && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors duration-150 ${
          dragging
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : subiendo
            ? 'border-blue-300 bg-blue-50 cursor-default'
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && subirFotos(e.target.files)}
        />
        {subiendo ? (
          <p className="text-sm text-blue-600 font-medium">Subiendo fotos...</p>
        ) : dragging ? (
          <>
            <p className="text-sm text-blue-600 font-medium">Suelta para agregar</p>
            <p className="text-xs text-blue-400 mt-1">Las fotos se subirán automáticamente</p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">Arrastra fotos aquí o haz clic para seleccionar</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — puedes subir varias a la vez</p>
          </>
        )}
      </div>

      {/* Galería */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {fotos.map(foto => (
            <div key={foto.id} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-video">
              <img src={foto.url} alt="" className="w-full h-full object-cover" />

              {/* Badge principal */}
              {foto.es_principal && (
                <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  Portada
                </span>
              )}

              {/* Acciones al hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!foto.es_principal && (
                  <button
                    onClick={() => marcarPrincipal(foto.id)}
                    className="bg-white text-gray-800 text-xs px-2 py-1 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    Portada
                  </button>
                )}
                <button
                  onClick={() => eliminarFoto(foto)}
                  className="bg-white text-gray-800 text-xs px-2 py-1 rounded-md hover:bg-red-600 hover:text-white transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
