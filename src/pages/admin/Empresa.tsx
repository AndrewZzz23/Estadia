import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import { ImagePlus, X, Upload, Copy, Check, Link } from 'lucide-react'
import { youtubeEmbed, esVideoDirecto } from '../../lib/media'

type FormData = {
  nombre: string
  slogan: string
  descripcion: string
  telefono: string
  email: string
  instagram_url: string
  facebook_url: string
  tiktok_url: string
  mostrar_instagram: boolean
  mostrar_facebook: boolean
  mostrar_tiktok: boolean
}

export default function Empresa() {
  const { tenant, setTenant } = useTenant()
  const [form, setForm] = useState<FormData>({
    nombre: '', slogan: '', descripcion: '', telefono: '', email: '',
    instagram_url: '', facebook_url: '', tiktok_url: '',
    mostrar_instagram: true, mostrar_facebook: true, mostrar_tiktok: true,
  })
  const [portada, setPortada]         = useState<string | null>(null)
  const [subiendo, setSubiendo]       = useState(false)
  const [errorPortada, setErrorPortada] = useState('')
  const [logo, setLogo]               = useState<string | null>(null)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [errorLogo, setErrorLogo]     = useState('')
  const logoRef = useRef<HTMLInputElement>(null)
  const [guardando, setGuardando]     = useState(false)
  const [ok, setOk]                   = useState(false)
  const [error, setError]             = useState('')
  const [copiado, setCopiado]         = useState(false)
  const [urlInput, setUrlInput]       = useState('')
  const [guardandoUrl, setGuardandoUrl] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tenant) return
    supabase.from('tenants').select('*').eq('id', tenant.id).single()
      .then(({ data }) => {
        if (!data) return
        setTenant(data as never)
        const d = data as Record<string, string | null>
        setPortada(d.foto_portada ?? null)
        setLogo(d.logo_url ?? null)
        setForm({
          nombre:        d.nombre        ?? '',
          slogan:        d.slogan        ?? '',
          descripcion:   d.descripcion   ?? '',
          telefono:      d.telefono      ?? '',
          email:         d.email         ?? '',
          instagram_url:     d.instagram_url ?? '',
          facebook_url:      d.facebook_url  ?? '',
          tiktok_url:        d.tiktok_url    ?? '',
          mostrar_instagram: (data as any).mostrar_instagram ?? true,
          mostrar_facebook:  (data as any).mostrar_facebook  ?? true,
          mostrar_tiktok:    (data as any).mostrar_tiktok    ?? true,
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
    if (file.size > 200 * 1024 * 1024) { setErrorPortada('El archivo no debe superar 200 MB.'); return }

    setSubiendo(true)
    setErrorPortada('')

    const ext  = file.name.split('.').pop()
    const path = `${tenant.id}/portada_${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('portadas')
      .upload(path, file, { upsert: false })

    if (upErr) { setErrorPortada('Error al subir. ' + upErr.message); setSubiendo(false); return }

    const { data: { publicUrl } } = supabase.storage.from('portadas').getPublicUrl(path)

    const { error: dbErr } = await supabase
      .from('tenants').update({ foto_portada: publicUrl } as never).eq('id', tenant.id)

    if (dbErr) { setErrorPortada('Error al guardar URL. ' + dbErr.message); setSubiendo(false); return }

    setPortada(publicUrl)
    setTenant({ ...tenant, foto_portada: publicUrl })
    setSubiendo(false)
  }

  async function guardarUrl() {
    if (!tenant || !urlInput.trim()) return
    setGuardandoUrl(true)
    const url = urlInput.trim()
    const { error: err } = await supabase
      .from('tenants').update({ foto_portada: url } as never).eq('id', tenant.id)
    if (!err) {
      setPortada(url)
      setTenant({ ...tenant, foto_portada: url })
      setUrlInput('')
    }
    setGuardandoUrl(false)
  }

  async function handleLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !tenant) return
    if (!file.type.startsWith('image/')) { setErrorLogo('Solo se permiten imágenes.'); return }
    setSubiendoLogo(true)
    setErrorLogo('')
    const ext  = file.name.split('.').pop()
    const path = `${tenant.id}/logo_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('logos').upload(path, file, { upsert: false })
    if (upErr) { setErrorLogo('Error al subir. ' + upErr.message); setSubiendoLogo(false); return }
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
    await supabase.from('tenants').update({ logo_url: publicUrl } as never).eq('id', tenant.id)
    setLogo(publicUrl)
    setTenant({ ...tenant, logo_url: publicUrl })
    setSubiendoLogo(false)
  }

  async function quitarLogo() {
    if (!tenant) return
    await supabase.from('tenants').update({ logo_url: null } as never).eq('id', tenant.id)
    setLogo(null)
    setTenant({ ...tenant, logo_url: null })
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
      nombre:        form.nombre.trim(),
      slogan:        form.slogan.trim()        || null,
      descripcion:   form.descripcion.trim()   || null,
      telefono:      form.telefono.trim()      || null,
      email:         form.email.trim()         || null,
      instagram_url:     form.instagram_url.trim() || null,
      facebook_url:      form.facebook_url.trim()  || null,
      tiktok_url:        form.tiktok_url.trim()    || null,
      mostrar_instagram: form.mostrar_instagram,
      mostrar_facebook:  form.mostrar_facebook,
      mostrar_tiktok:    form.mostrar_tiktok,
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

  const embedUrl = portada ? youtubeEmbed(portada) : null
  const esVideo  = portada ? esVideoDirecto(portada) : false

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Mi empresa</h1>
      <p className="text-sm text-gray-400 mb-8">Esta información aparece en tu página pública.</p>

      <div className="space-y-5">

        {/* ── FOTO / VIDEO PORTADA ── */}
        <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-sm font-semibold text-gray-700">Imagen o video de portada</h2>
            <p className="text-xs text-gray-400 mt-0.5">Aparece como hero en tu página pública. Acepta imágenes o videos (máx. 200 MB).</p>
          </div>

          {portada ? (
            <div className="relative mx-5 mb-5 rounded-xl overflow-hidden bg-gray-100 aspect-video">
              {embedUrl ? (
                <iframe src={embedUrl} className="absolute inset-0 w-full h-full" style={{ border: 'none', transform: 'scale(1.5)', transformOrigin: 'center' }} allow="autoplay; encrypted-media" />
              ) : esVideo ? (
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
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP, MP4, MOV · máx. 200 MB</p>
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

          {/* URL externa */}
          <div className="px-5 pb-5 border-t border-gray-50 pt-4">
            <p className="text-xs text-gray-400 mb-2">O pega un link de video (YouTube, Drive, Dropbox…)</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                type="button"
                onClick={guardarUrl}
                disabled={!urlInput.trim() || guardandoUrl}
                className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-200 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Link size={13} />
                {guardandoUrl ? 'Guardando…' : 'Usar URL'}
              </button>
            </div>
          </div>
        </section>

        {/* ── LOGO ── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Logo</h2>
          <p className="text-xs text-gray-400 mb-4">Solo imágenes · recomendado PNG transparente</p>
          <div className="flex items-center gap-4">
            {logo ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
                <button type="button" onClick={quitarLogo}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X size={10} />
                </button>
              </div>
            ) : (
              <div onClick={() => logoRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 flex items-center justify-center cursor-pointer transition-colors group">
                {subiendoLogo
                  ? <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  : <ImagePlus size={20} className="text-gray-300 group-hover:text-brand-400" />}
              </div>
            )}
            <button type="button" onClick={() => logoRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              <Upload size={13} />{logo ? 'Cambiar' : 'Subir logo'}
            </button>
          </div>
          {errorLogo && <p className="text-xs text-red-600 mt-2">{errorLogo}</p>}
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
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

            <Field label="Slogan">
              <input
                value={form.slogan}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set('slogan', e.target.value)}
                className={inputCls()}
                placeholder="Tu descanso en la naturaleza"
              />
              <p className="text-xs text-gray-400 mt-1">Frase corta que aparece bajo el nombre en tu página pública.</p>
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

          <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Redes sociales</h2>
            <Field label="Instagram">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm shrink-0">instagram.com/</span>
                <input
                  value={form.instagram_url}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => set('instagram_url', e.target.value.replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30))}
                  className={inputCls()}
                  placeholder="tucuenta"
                />
                {form.instagram_url && /^[a-zA-Z0-9]([a-zA-Z0-9._]{0,28}[a-zA-Z0-9])?$/.test(form.instagram_url) && (
                  <a href={`https://instagram.com/${form.instagram_url}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-brand-500 hover:underline shrink-0">
                    <Link size={10} /> Verificar
                  </a>
                )}
              </div>
              {form.instagram_url && !/^[a-zA-Z0-9]([a-zA-Z0-9._]{0,28}[a-zA-Z0-9])?$/.test(form.instagram_url) && (
                <p className="text-xs text-red-500 mt-1">Usuario inválido — solo letras, números, puntos y guiones bajos.</p>
              )}
              {form.instagram_url && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.mostrar_instagram}
                    onChange={e => setForm(p => ({ ...p, mostrar_instagram: e.target.checked }))}
                    className="accent-brand-500" />
                  <span className="text-xs text-gray-500">Mostrar acceso directo en página web</span>
                </label>
              )}
            </Field>
            <Field label="Facebook">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm shrink-0">facebook.com/</span>
                <input value={form.facebook_url}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => set('facebook_url', e.target.value)}
                  className={inputCls()} placeholder="tupagina" />
                {form.facebook_url && (
                  <a href={`https://facebook.com/${form.facebook_url}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-brand-500 hover:underline shrink-0">
                    <Link size={10} /> Verificar
                  </a>
                )}
              </div>
              {form.facebook_url && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.mostrar_facebook}
                    onChange={e => setForm(p => ({ ...p, mostrar_facebook: e.target.checked }))}
                    className="accent-brand-500" />
                  <span className="text-xs text-gray-500">Mostrar acceso directo en página web</span>
                </label>
              )}
            </Field>
            <Field label="TikTok">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm shrink-0">tiktok.com/@</span>
                <input value={form.tiktok_url}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => set('tiktok_url', e.target.value)}
                  className={inputCls()} placeholder="tucuenta" />
                {form.tiktok_url && (
                  <a href={`https://tiktok.com/@${form.tiktok_url}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-brand-500 hover:underline shrink-0">
                    <Link size={10} /> Verificar
                  </a>
                )}
              </div>
              {form.tiktok_url && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.mostrar_tiktok}
                    onChange={e => setForm(p => ({ ...p, mostrar_tiktok: e.target.checked }))}
                    className="accent-brand-500" />
                  <span className="text-xs text-gray-500">Mostrar acceso directo en página web</span>
                </label>
              )}
            </Field>
          </section>

          <div className="bg-brand-50 border border-brand-500/20 rounded-xl px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Tu página pública</p>
              <p className="text-sm font-medium text-brand-600 break-all">
                {window.location.origin}/{tenant?.slug}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/${tenant?.slug}`)
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              }}
              className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all
                         bg-white border-brand-200 text-brand-600 hover:bg-brand-100"
            >
              {copiado ? <><Check size={13} />Copiado</> : <><Copy size={13} />Copiar</>}
            </button>
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
