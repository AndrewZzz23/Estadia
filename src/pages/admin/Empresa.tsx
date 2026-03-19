import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import { ImagePlus, X, Upload } from 'lucide-react'

type FormData = {
  nombre: string
  descripcion: string
  telefono: string
  email: string
}

export default function Empresa() {
  const { tenant, setTenant } = useTenant()
  const [form, setForm] = useState<FormData>({
    nombre: '', descripcion: '', telefono: '', email: '',
  })
  const [portada, setPortada]         = useState<string | null>(null)
  const [subiendo, setSubiendo]       = useState(false)
  const [errorPortada, setErrorPortada] = useState('')
  const [guardando, setGuardando]     = useState(false)
  const [ok, setOk]                   = useState(false)
  const [error, setError]             = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tenant) return
    supabase.from('tenants').select('*').eq('id', tenant.id).single()
      .then(({ data }) => {
        if (!data) return
        setTenant(data)
        setPortada(data.foto_portada ?? null)
        setForm({
          nombre:      data.nombre      ?? '',
          descripcion: data.descripcion ?? '',
          telefono:    data.telefono    ?? '',
          email:       data.email       ?? '',
        })
      })
  }, [tenant?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setOk(false)
  }

  async function handlePortada(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !tenant) return

    // Validar tipo y tamaño (50 MB max)
    const esImagen = file.type.startsWith('image/')
    const esVideo  = file.type.startsWith('video/')
    if (!esImagen && !esVideo) { setErrorPortada('Solo se permiten imágenes o videos.'); return }
    if (file.size > 50 * 1024 * 1024) { setErrorPortada('El archivo no debe superar 50 MB.'); return }

    setSubiendo(true)
    setErrorPortada('')

    const ext  = file.name.split('.').pop()
    const path = `${tenant.id}/portada.${ext}`

    const { error: upErr } = await supabase.storage
      .from('portadas')
      .upload(path, file, { upsert: true })

    if (upErr) { setErrorPortada('Error al subir. ' + upErr.message); setSubiendo(false); return }

    const { data: { publicUrl } } = supabase.storage.from('portadas').getPublicUrl(path)

    const { error: dbErr } = await supabase
      .from('tenants').update({ foto_portada: publicUrl } as never).eq('id', tenant.id)

    if (dbErr) { setErrorPortada('Error al guardar URL. ' + dbErr.message); setSubiendo(false); return }

    setPortada(publicUrl)
    setTenant({ ...tenant, foto_portada: publicUrl })
    setSubiendo(false)
  }

  async function quitarPortada() {
    if (!tenant) return
    await supabase.from('tenants').update({ foto_portada: null } as never).eq('id', tenant.id)
    setPortada(null)
    setTenant({ ...tenant, foto_portada: null })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!tenant) return
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }

    setGuardando(true)
    setError('')

    const payload = {
      nombre:      form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      telefono:    form.telefono.trim()    || null,
      email:       form.email.trim()       || null,
    }

    const { error: err } = await supabase
      .from('tenants').update(payload as never).eq('id', tenant.id)

    if (err) {
      setError(`Error: ${err.message} (${err.code})`)
    } else {
      setTenant({ ...tenant, ...payload })
      setOk(true)
    }
    setGuardando(false)
  }

  const esVideo = portada && (portada.includes('.mp4') || portada.includes('.webm') || portada.includes('.mov'))

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Mi empresa</h1>
      <p className="text-sm text-gray-400 mb-8">Esta información aparece en tu página pública.</p>

      <div className="space-y-5">

        {/* ── FOTO / VIDEO PORTADA ── */}
        <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-sm font-semibold text-gray-700">Imagen o video de portada</h2>
            <p className="text-xs text-gray-400 mt-0.5">Aparece como hero en tu página pública. Acepta imágenes o videos (máx. 50 MB).</p>
          </div>

          {portada ? (
            <div className="relative mx-5 mb-5 rounded-xl overflow-hidden bg-gray-100 aspect-video">
              {esVideo ? (
                <video src={portada} className="w-full h-full object-cover" muted loop autoPlay playsInline />
              ) : (
                <img src={portada} alt="Portada" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors group flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="bg-white text-gray-800 font-medium text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-gray-100"
                  >
                    <Upload size={13} /> Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={quitarPortada}
                    className="bg-red-500 text-white font-medium text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-red-600"
                  >
                    <X size={13} /> Quitar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="mx-5 mb-5 border-2 border-dashed border-gray-200 hover:border-brand-400 rounded-xl aspect-video flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors group"
            >
              {subiendo ? (
                <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 group-hover:bg-brand-50 flex items-center justify-center transition-colors">
                    <ImagePlus size={22} className="text-gray-400 group-hover:text-brand-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Subir imagen o video</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP, MP4, MOV · máx. 50 MB</p>
                  </div>
                </>
              )}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handlePortada}
          />

          {errorPortada && (
            <p className="text-xs text-red-600 bg-red-50 px-5 py-2 mb-3">{errorPortada}</p>
          )}
        </section>

        {/* ── FORMULARIO ── */}
        <form onSubmit={handleSubmit} className="space-y-5">

          <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Información general</h2>

            <Field label="Nombre del negocio *">
              <input
                value={form.nombre}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set('nombre', e.target.value)}
                className={inputCls()}
                placeholder="Cabañas El Río"
              />
            </Field>

            <Field label="Descripción">
              <textarea
                value={form.descripcion}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set('descripcion', e.target.value)}
                rows={4}
                className={inputCls()}
                placeholder="Cuéntale a tus clientes quiénes son, qué ofrecen y qué hace especiales sus propiedades..."
              />
              <p className="text-xs text-gray-400 mt-1">Aparece en la parte superior de tu página pública.</p>
            </Field>
          </section>

          <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Contacto</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono / WhatsApp">
                <input
                  value={form.telefono}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => set('telefono', e.target.value)}
                  className={inputCls()}
                  placeholder="573001234567"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => set('email', e.target.value)}
                  className={inputCls()}
                  placeholder="hola@micasa.com"
                />
              </Field>
            </div>
          </section>

          <div className="bg-brand-50 border border-brand-500/20 rounded-xl px-5 py-4">
            <p className="text-xs text-gray-500 mb-0.5">Tu página pública</p>
            <p className="text-sm font-medium text-brand-600">
              {window.location.origin}/{tenant?.slug}
            </p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {ok    && <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">Cambios guardados correctamente.</p>}

          <button
            type="submit"
            disabled={guardando}
            className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-200 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function inputCls() {
  return 'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white'
}
