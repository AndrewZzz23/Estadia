import { useEffect, useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import type { Propiedad } from '../../types/database'
import GaleriaFotos from '../../components/admin/GaleriaFotos'
import MapPicker from '../../components/admin/MapPicker'
import type { LucideIcon } from 'lucide-react'
import { Wifi, Waves, Flame, Car, Wind, ChefHat, Shirt, Tv, Bath, Eye, Sun, Leaf, PawPrint, Sparkles } from 'lucide-react'

const AMENIDADES_OPCIONES = [
  'WiFi', 'Piscina', 'BBQ', 'Parqueadero', 'Aire acondicionado',
  'Cocina equipada', 'Lavadora', 'TV', 'Chimenea', 'Jacuzzi',
  'Vista al mar', 'Terraza', 'Jardín', 'Mascotas permitidas',
]

const AMENIDADES_ICONOS: Record<string, LucideIcon> = {
  'WiFi':               Wifi,
  'Piscina':            Waves,
  'BBQ':                Flame,
  'Parqueadero':        Car,
  'Aire acondicionado': Wind,
  'Cocina equipada':    ChefHat,
  'Lavadora':           Shirt,
  'TV':                 Tv,
  'Chimenea':           Sparkles,
  'Jacuzzi':            Bath,
  'Vista al mar':       Eye,
  'Terraza':            Sun,
  'Jardín':             Leaf,
  'Mascotas permitidas':PawPrint,
}

type FormData = {
  nombre: string
  descripcion: string
  ubicacion: string
  latitud: number | null
  longitud: number | null
  precio_noche: string
  precio_semana: string
  precio_mes: string
  capacidad: string
  habitaciones: string
  banos: string
  whatsapp: string
  amenidades: string[]
  activa: boolean
}

const EMPTY: FormData = {
  nombre: '', descripcion: '', ubicacion: '', latitud: null, longitud: null,
  precio_noche: '', precio_semana: '', precio_mes: '',
  capacidad: '', habitaciones: '', banos: '',
  whatsapp: '', amenidades: [], activa: true,
}

export default function PropiedadForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const { tenant } = useTenant()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormData>(EMPTY)
  const [loading, setLoading] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!esEdicion) return
    async function cargar() {
      const { data } = await supabase.from('propiedades').select('*').eq('id', id!).maybeSingle()
      if (data) {
        const p = data as Propiedad
        setForm({
          nombre:       p.nombre,
          descripcion:  p.descripcion ?? '',
          ubicacion:    p.ubicacion ?? '',
          latitud:      p.latitud ?? null,
          longitud:     p.longitud ?? null,
          precio_noche: p.precio_noche?.toString() ?? '',
          precio_semana:p.precio_semana?.toString() ?? '',
          precio_mes:   p.precio_mes?.toString() ?? '',
          capacidad:    p.capacidad?.toString() ?? '',
          habitaciones: p.habitaciones?.toString() ?? '',
          banos:        p.banos?.toString() ?? '',
          whatsapp:     p.whatsapp ?? '',
          amenidades:   p.amenidades ?? [],
          activa:       p.activa,
        })
      }
      setLoading(false)
    }
    cargar()
  }, [id, esEdicion])

  function set(field: keyof FormData, value: string | boolean | string[]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleAmenidad(a: string) {
    setForm(prev => ({
      ...prev,
      amenidades: prev.amenidades.includes(a)
        ? prev.amenidades.filter(x => x !== a)
        : [...prev.amenidades, a],
    }))
  }

  function numOrNull(v: string) {
    const n = parseFloat(v)
    return isNaN(n) ? null : n
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!tenant) return
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }

    setGuardando(true)
    setError('')

    const payload = {
      nombre:       form.nombre.trim(),
      descripcion:  form.descripcion.trim() || null,
      ubicacion:    form.ubicacion.trim() || null,
      latitud:      form.latitud,
      longitud:     form.longitud,
      precio_noche: numOrNull(form.precio_noche),
      precio_semana:numOrNull(form.precio_semana),
      precio_mes:   numOrNull(form.precio_mes),
      capacidad:    numOrNull(form.capacidad),
      habitaciones: numOrNull(form.habitaciones),
      banos:        numOrNull(form.banos),
      whatsapp:     form.whatsapp.trim() || null,
      amenidades:   form.amenidades,
      activa:       form.activa,
    }

    if (esEdicion) {
      const { error } = await supabase.from('propiedades').update(payload as never).eq('id', id!)
      if (error) { setError('Error al guardar.'); setGuardando(false); return }
    } else {
      const { error } = await supabase.from('propiedades').insert({ ...payload, tenant_id: tenant.id } as never)
      if (error) { setError('Error al crear.'); setGuardando(false); return }
    }

    navigate('/admin/propiedades')
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Cargando...</div>

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        {esEdicion ? 'Editar propiedad' : 'Nueva propiedad'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info básica */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Información básica</h2>

          <Field label="Nombre *">
            <input value={form.nombre} onChange={(e: ChangeEvent<HTMLInputElement>) => set('nombre', e.target.value)}
              className={input()} placeholder="Casa El Lago" />
          </Field>

          <Field label="Descripción">
            <textarea value={form.descripcion} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set('descripcion', e.target.value)}
              rows={3} className={input()} placeholder="Descríbela brevemente..." />
          </Field>

          <Field label="Ubicación">
            <MapPicker
              lat={form.latitud}
              lng={form.longitud}
              ubicacion={form.ubicacion}
              onChange={(lat, lng, ubicacion) => setForm(prev => ({ ...prev, latitud: lat, longitud: lng, ubicacion }))}
            />
          </Field>

          <Field label="WhatsApp">
            <input value={form.whatsapp} onChange={(e: ChangeEvent<HTMLInputElement>) => set('whatsapp', e.target.value)}
              className={input()} placeholder="573001234567" />
          </Field>
        </section>

        {/* Capacidad */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Capacidad</h2>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Personas">
              <input type="number" min="1" value={form.capacidad} onChange={(e: ChangeEvent<HTMLInputElement>) => set('capacidad', e.target.value)}
                className={input()} placeholder="8" />
            </Field>
            <Field label="Habitaciones">
              <input type="number" min="1" value={form.habitaciones} onChange={(e: ChangeEvent<HTMLInputElement>) => set('habitaciones', e.target.value)}
                className={input()} placeholder="3" />
            </Field>
            <Field label="Baños">
              <input type="number" min="1" value={form.banos} onChange={(e: ChangeEvent<HTMLInputElement>) => set('banos', e.target.value)}
                className={input()} placeholder="2" />
            </Field>
          </div>
        </section>

        {/* Precios */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Precios</h2>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Por noche">
              <input type="number" min="0" value={form.precio_noche} onChange={(e: ChangeEvent<HTMLInputElement>) => set('precio_noche', e.target.value)}
                className={input()} placeholder="350000" />
            </Field>
            <Field label="Por semana">
              <input type="number" min="0" value={form.precio_semana} onChange={(e: ChangeEvent<HTMLInputElement>) => set('precio_semana', e.target.value)}
                className={input()} placeholder="2000000" />
            </Field>
            <Field label="Por mes">
              <input type="number" min="0" value={form.precio_mes} onChange={(e: ChangeEvent<HTMLInputElement>) => set('precio_mes', e.target.value)}
                className={input()} placeholder="6000000" />
            </Field>
          </div>
        </section>

        {/* Amenidades */}
        <section className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Amenidades</h2>
          <div className="flex flex-wrap gap-2">
            {AMENIDADES_OPCIONES.map(a => {
              const Icon = AMENIDADES_ICONOS[a]
              return (
                <button
                  key={a} type="button" onClick={() => toggleAmenidad(a)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.amenidades.includes(a)
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300'
                  }`}
                >
                  {Icon && <Icon size={12} />}
                  {a}
                </button>
              )
            })}
          </div>
        </section>

        {/* Estado */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('activa', !form.activa)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.activa ? 'bg-brand-500' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form.activa ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-gray-600">{form.activa ? 'Activa (visible en la web)' : 'Inactiva (oculta)'}</span>
        </div>

        {/* Fotos — solo en edición */}
        {esEdicion && (
          <section className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Fotos</h2>
            <GaleriaFotos propiedadId={id!} />
          </section>
        )}

        {!esEdicion && (
          <p className="text-xs text-gray-400">Podrás subir fotos después de crear la propiedad.</p>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit" disabled={guardando}
            className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-200 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear propiedad'}
          </button>
          <button
            type="button" onClick={() => navigate('/admin/propiedades')}
            className="text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
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

function input() {
  return 'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'
}
