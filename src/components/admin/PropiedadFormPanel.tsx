import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import type { Propiedad } from '../../types/database'
import GaleriaFotos from './GaleriaFotos'
import MapPicker from './MapPicker'
import { navyGlassStyle } from '../../lib/styles'
import type { LucideIcon } from 'lucide-react'
import {
  Wifi, Waves, Flame, Car, Wind, ChefHat, Shirt, Tv, Bath,
  Eye, Sun, Leaf, PawPrint, Sparkles, X, Check,
} from 'lucide-react'

// ── Constantes ────────────────────────────────────────────────

const AMENIDADES_OPCIONES = [
  'WiFi', 'Piscina', 'BBQ', 'Parqueadero', 'Aire acondicionado',
  'Cocina equipada', 'Lavadora', 'TV', 'Chimenea', 'Jacuzzi',
  'Vista al mar', 'Terraza', 'Jardín', 'Mascotas permitidas',
]
const AMENIDADES_ICONOS: Record<string, LucideIcon> = {
  'WiFi': Wifi, 'Piscina': Waves, 'BBQ': Flame, 'Parqueadero': Car,
  'Aire acondicionado': Wind, 'Cocina equipada': ChefHat, 'Lavadora': Shirt,
  'TV': Tv, 'Chimenea': Sparkles, 'Jacuzzi': Bath, 'Vista al mar': Eye,
  'Terraza': Sun, 'Jardín': Leaf, 'Mascotas permitidas': PawPrint,
}

type FormData = {
  nombre: string; descripcion: string; ubicacion: string
  latitud: number | null; longitud: number | null
  precio_noche: string; precio_semana: string; precio_mes: string
  capacidad: string; habitaciones: string; banos: string
  amenidades: string[]; activa: boolean; ical_url: string
}

const EMPTY: FormData = {
  nombre: '', descripcion: '', ubicacion: '', latitud: null, longitud: null,
  precio_noche: '', precio_semana: '', precio_mes: '',
  capacidad: '', habitaciones: '', banos: '', amenidades: [], activa: true, ical_url: '',
}

function numOrNull(v: string) {
  const n = parseFloat(v.replace(/\D/g, ''))
  return isNaN(n) ? null : n
}
function fmtPrecio(v: string) {
  if (!v) return ''
  const n = parseInt(v.replace(/\D/g, ''), 10)
  return isNaN(n) ? '' : n.toLocaleString('es-CO')
}

const inp = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2A7A68]/30 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
function Sec({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">{children}</p>
}

// ── Componente ────────────────────────────────────────────────

interface Props {
  open: boolean
  propiedadId: string | null   // null = nueva propiedad
  onClose: () => void
  onSaved: () => void
}

export default function PropiedadFormPanel({ open, propiedadId, onClose, onSaved }: Props) {
  const { tenant } = useTenant()
  const [form, setForm]           = useState<FormData>(EMPTY)
  const [loading, setLoading]     = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')
  const [savedId, setSavedId]     = useState<string | null>(null)  // ID tras crear

  const editId    = savedId ?? propiedadId
  const esEdicion = !!propiedadId

  // Cargar datos al abrir
  useEffect(() => {
    if (!open) return
    setError('')
    setSavedId(null)

    if (propiedadId) {
      setLoading(true)
      supabase.from('propiedades').select('*').eq('id', propiedadId).maybeSingle()
        .then(({ data }) => {
          if (data) {
            const p = data as Propiedad
            setForm({
              nombre:        p.nombre,
              descripcion:   p.descripcion ?? '',
              ubicacion:     p.ubicacion ?? '',
              latitud:       p.latitud ?? null,
              longitud:      p.longitud ?? null,
              precio_noche:  p.precio_noche?.toString() ?? '',
              precio_semana: p.precio_semana?.toString() ?? '',
              precio_mes:    p.precio_mes?.toString() ?? '',
              capacidad:     p.capacidad?.toString() ?? '',
              habitaciones:  p.habitaciones?.toString() ?? '',
              banos:         p.banos?.toString() ?? '',
              amenidades:    p.amenidades ?? [],
              activa:        p.activa,
              ical_url:      p.ical_url ?? '',
            })
          }
          setLoading(false)
        })
    } else {
      setForm(EMPTY)
    }
  }, [open, propiedadId])

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!tenant) return
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setGuardando(true); setError('')

    const payload = {
      nombre:        form.nombre.trim(),
      descripcion:   form.descripcion.trim() || null,
      ubicacion:     form.ubicacion.trim() || null,
      latitud:       form.latitud,
      longitud:      form.longitud,
      precio_noche:  numOrNull(form.precio_noche),
      precio_semana: numOrNull(form.precio_semana),
      precio_mes:    numOrNull(form.precio_mes),
      capacidad:     numOrNull(form.capacidad),
      habitaciones:  numOrNull(form.habitaciones),
      banos:         numOrNull(form.banos),
      amenidades:    form.amenidades,
      activa:        form.activa,
      ical_url:      form.ical_url.trim() || null,
    }

    if (esEdicion) {
      const { error: err } = await supabase.from('propiedades').update(payload as never).eq('id', propiedadId!)
      if (err) { setError('Error al guardar.'); setGuardando(false); return }
      onSaved()
    } else {
      const { data, error: err } = await supabase
        .from('propiedades').insert({ ...payload, tenant_id: tenant.id } as never)
        .select().single()
      if (err || !data) { setError('Error al crear.'); setGuardando(false); return }
      setSavedId((data as Propiedad).id)  // cambia a modo edición para mostrar fotos
      onSaved()
    }
    setGuardando(false)
  }

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />}

      {/* Panel */}
      <div className={`fixed z-50 bg-[#EEF0F4] shadow-2xl ease-out flex flex-col
        bottom-0 left-0 right-0 rounded-t-3xl max-h-[95vh]
        sm:top-0 sm:bottom-0 sm:left-auto sm:right-0 sm:w-[560px] sm:rounded-none sm:rounded-l-2xl sm:max-h-full
        ${open ? 'translate-y-0 sm:translate-x-0 transition-transform duration-300' : 'translate-y-full sm:translate-y-0 sm:translate-x-full pointer-events-none'}`}
      >
        {/* Drag handle — móvil */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-black/5 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
              {esEdicion ? 'Editar propiedad' : 'Nueva propiedad'}
            </p>
            <h2 className="text-base font-bold text-[#1E3E50] truncate leading-tight">
              {form.nombre || (esEdicion ? '—' : 'Sin nombre')}
            </h2>
          </div>
          {/* Toggle activa */}
          <button
            type="button"
            onClick={() => set('activa', !form.activa)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${form.activa ? 'bg-[#2A7A68]' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${form.activa ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Cargando...</div>
          ) : (
            <form id="prop-panel-form" onSubmit={handleSubmit} className="p-4 space-y-4">

              {/* Info básica */}
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                <Sec>Información básica</Sec>
                <Field label="Nombre *">
                  <input value={form.nombre}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => set('nombre', e.target.value)}
                    className={inp} placeholder="Casa El Lago" />
                </Field>
                <Field label="Descripción">
                  <textarea value={form.descripcion}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set('descripcion', e.target.value)}
                    rows={4} className={inp} placeholder="Descríbela brevemente..." />
                </Field>
              </div>

              {/* Capacidad + Precios */}
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
                <div>
                  <Sec>Capacidad</Sec>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Personas">
                      <input type="number" min="1" value={form.capacidad}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => set('capacidad', e.target.value)}
                        className={inp} placeholder="8" />
                    </Field>
                    <Field label="Habitaciones">
                      <input type="number" min="1" value={form.habitaciones}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => set('habitaciones', e.target.value)}
                        className={inp} placeholder="3" />
                    </Field>
                    <Field label="Baños">
                      <input type="number" min="1" value={form.banos}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => set('banos', e.target.value)}
                        className={inp} placeholder="2" />
                    </Field>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <Sec>Precios</Sec>
                  <div className="grid grid-cols-3 gap-2">
                    {([['precio_noche','Noche','350.000'],['precio_semana','Semana','2.000.000'],['precio_mes','Mes','6.000.000']] as const).map(([field, label, ph]) => (
                      <Field key={field} label={label}>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input type="text" inputMode="numeric"
                            value={fmtPrecio(form[field])}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => set(field, e.target.value.replace(/\D/g, ''))}
                            className={`${inp} pl-6 text-xs`} placeholder={ph} />
                        </div>
                      </Field>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <Sec>Ubicación</Sec>
                <MapPicker
                  lat={form.latitud} lng={form.longitud} ubicacion={form.ubicacion}
                  onChange={(lat, lng, ubicacion) => setForm(prev => ({ ...prev, latitud: lat, longitud: lng, ubicacion }))}
                />
              </div>

              {/* Amenidades */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <Sec>Amenidades</Sec>
                <div className="flex flex-wrap gap-2">
                  {AMENIDADES_OPCIONES.map(a => {
                    const Icon     = AMENIDADES_ICONOS[a]
                    const selected = form.amenidades.includes(a)
                    return (
                      <button key={a} type="button" onClick={() => toggleAmenidad(a)}
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                          selected ? 'bg-[#2A7A68] border-[#2A7A68] text-white' : 'border-gray-200 text-gray-500 hover:border-[#2A7A68]/40'
                        }`}>
                        {selected ? <Check size={11} /> : Icon && <Icon size={11} />}
                        {a}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Fotos */}
              {editId && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <Sec>Fotos</Sec>
                  <GaleriaFotos propiedadId={editId} />
                </div>
              )}
              {!editId && !esEdicion && (
                <p className="text-xs text-gray-400 px-1">Podrás subir fotos después de guardar.</p>
              )}

              {/* Integraciones iCal */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <Sec>Integraciones</Sec>
                <Field label="URL iCal de Airbnb / Booking">
                  <input
                    className={inp}
                    type="url"
                    placeholder="https://www.airbnb.com/calendar/ical/..."
                    value={form.ical_url}
                    onChange={e => set('ical_url', e.target.value)}
                  />
                </Field>
                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                  En Airbnb: Calendario → Disponibilidad → Exportar calendario. Pega la URL aquí para sincronizar bloqueos automáticamente.
                </p>
              </div>

              {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

              {/* Espacio para el botón sticky */}
              <div className="h-2" />
            </form>
          )}
        </div>

        {/* Botón guardar — sticky al fondo */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-black/5 bg-[#EEF0F4]">
          <button
            type="submit" form="prop-panel-form" disabled={guardando || loading}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            style={navyGlassStyle}
          >
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear propiedad'}
          </button>
        </div>
      </div>
    </>
  )
}
