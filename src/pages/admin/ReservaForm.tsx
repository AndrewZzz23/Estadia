import { useEffect, useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import type { EstadoReserva, Propiedad, Reserva } from '../../types/database'
import { navyGlassStyle } from '../../lib/styles'

type FormData = {
  propiedad_id: string
  cliente_nombre: string
  cliente_tel: string
  cliente_email: string
  fecha_inicio: string
  fecha_fin: string
  monto_total: string
  estado: EstadoReserva
  notas: string
}

const EMPTY: FormData = {
  propiedad_id: '', cliente_nombre: '', cliente_tel: '',
  cliente_email: '', fecha_inicio: '', fecha_fin: '',
  monto_total: '', estado: 'confirmada', notas: '',
}

export default function ReservaForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const { tenant } = useTenant()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormData>(EMPTY)
  const [propiedades, setPropiedades] = useState<Pick<Propiedad, 'id' | 'nombre'>[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [disponible, setDisponible] = useState<boolean | null>(null)
  const [verificando, setVerificando] = useState(false)

  useEffect(() => {
    async function init() {
      if (!tenant) return

      const { data: props } = await supabase
        .from('propiedades')
        .select('id, nombre')
        .eq('tenant_id', tenant.id)
        .eq('activa', true)
        .order('nombre')
      setPropiedades(props as Pick<Propiedad, 'id' | 'nombre'>[] ?? [])

      if (esEdicion) {
        const { data } = await supabase.from('reservas').select('*').eq('id', id).maybeSingle()
        if (data) {
          const r = data as Reserva
          setForm({
            propiedad_id:   r.propiedad_id,
            cliente_nombre: r.cliente_nombre,
            cliente_tel:    r.cliente_tel,
            cliente_email:  r.cliente_email ?? '',
            fecha_inicio:   r.fecha_inicio,
            fecha_fin:      r.fecha_fin,
            monto_total:    r.monto_total?.toString() ?? '',
            estado:         r.estado,
            notas:          r.notas ?? '',
          })
        }
      }
      setLoading(false)
    }
    init()
  }, [tenant, id, esEdicion])

  function set(field: keyof FormData, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'fecha_inicio' && value && next.fecha_fin && next.fecha_fin <= value) {
        const d = new Date(value + 'T00:00:00')
        d.setDate(d.getDate() + 1)
        next.fecha_fin = d.toISOString().slice(0, 10)
      }
      return next
    })
    if (field === 'fecha_inicio' || field === 'fecha_fin' || field === 'propiedad_id') {
      setDisponible(null)
    }
  }

  async function verificarDisponibilidad() {
    if (!form.propiedad_id || !form.fecha_inicio || !form.fecha_fin) return
    setVerificando(true)
    const { data } = await (supabase.rpc as Function)('propiedad_disponible', {
      p_propiedad_id: form.propiedad_id,
      p_fecha_inicio: form.fecha_inicio,
      p_fecha_fin:    form.fecha_fin,
      p_excluir_reserva_id: esEdicion ? id : undefined,
    })
    setDisponible(data as unknown as boolean)
    setVerificando(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!tenant) return
    if (!form.propiedad_id) { setError('Selecciona una propiedad.'); return }
    if (!form.cliente_nombre.trim()) { setError('El nombre del cliente es obligatorio.'); return }
    if (!form.cliente_tel.trim()) { setError('El teléfono es obligatorio.'); return }
    if (!form.fecha_inicio || !form.fecha_fin) { setError('Las fechas son obligatorias.'); return }
    if (form.fecha_fin <= form.fecha_inicio) { setError('La fecha de salida debe ser posterior a la entrada.'); return }

    setGuardando(true)
    setError('')

    const payload = {
      propiedad_id:   form.propiedad_id,
      cliente_nombre: form.cliente_nombre.trim(),
      cliente_tel:    form.cliente_tel.trim(),
      cliente_email:  form.cliente_email.trim() || null,
      fecha_inicio:   form.fecha_inicio,
      fecha_fin:      form.fecha_fin,
      monto_total:    form.monto_total ? parseFloat(form.monto_total) : null,
      estado:         form.estado,
      notas:          form.notas.trim() || null,
    }

    if (esEdicion) {
      const { error } = await supabase.from('reservas').update(payload as never).eq('id', id!)
      if (error) { setError('Error al guardar.'); setGuardando(false); return }
    } else {
      const { error } = await supabase.from('reservas').insert(payload as never)
      if (error) { setError('Error al crear.'); setGuardando(false); return }
    }

    navigate('/admin/reservas')
  }

  const noches = form.fecha_inicio && form.fecha_fin
    ? Math.max(0, (new Date(form.fecha_fin).getTime() - new Date(form.fecha_inicio).getTime()) / 86400000)
    : 0

  if (loading) return <div className="p-8 text-gray-400 text-sm">Cargando...</div>

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-[#1E3E50] mb-6">
        {esEdicion ? 'Editar reserva' : 'Nueva reserva'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Propiedad */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Propiedad y fechas</h2>

          <Field label="Propiedad *">
            <select
              value={form.propiedad_id}
              onChange={e => set('propiedad_id', e.target.value)}
              className={input()}
            >
              <option value="">Selecciona una propiedad</option>
              {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Entrada *">
              <input type="date" value={form.fecha_inicio}
                onChange={e => set('fecha_inicio', e.target.value)} className={input()} />
            </Field>
            <Field label="Salida *">
              <input type="date" value={form.fecha_fin}
                onChange={e => set('fecha_fin', e.target.value)}
                min={form.fecha_inicio || undefined}
                className={`${input()} ${form.fecha_fin && form.fecha_inicio && form.fecha_fin <= form.fecha_inicio ? 'border-red-300 ring-1 ring-red-200' : ''}`} />
            </Field>
          </div>

          {/* Noches + disponibilidad */}
          <div className="flex items-center gap-3">
            {noches > 0 && (
              <span className="text-sm text-gray-500">{noches} noche{noches !== 1 ? 's' : ''}</span>
            )}
            {form.propiedad_id && form.fecha_inicio && form.fecha_fin && noches > 0 && (
              <button
                type="button"
                onClick={verificarDisponibilidad}
                disabled={verificando}
                className="text-xs text-[#2A7A68] hover:text-[#1E3E50] underline"
              >
                {verificando ? 'Verificando...' : 'Verificar disponibilidad'}
              </button>
            )}
            {disponible === true && (
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Disponible</span>
            )}
            {disponible === false && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">No disponible en esas fechas</span>
            )}
          </div>
        </section>

        {/* Cliente */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Datos del cliente</h2>

          <Field label="Nombre *">
            <input value={form.cliente_nombre}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set('cliente_nombre', e.target.value)}
              className={input()} placeholder="Juan Pérez" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono *">
              <input value={form.cliente_tel}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set('cliente_tel', e.target.value)}
                className={input()} placeholder="3001234567" />
            </Field>
            <Field label="Email">
              <input type="email" value={form.cliente_email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set('cliente_email', e.target.value)}
                className={input()} placeholder="juan@email.com" />
            </Field>
          </div>
        </section>

        {/* Pago y estado */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Pago y estado</h2>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto total">
              <input type="text" inputMode="numeric"
                value={form.monto_total ? Number(form.monto_total).toLocaleString('es-CO') : ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set('monto_total', e.target.value.replace(/\D/g, ''))}
                className={input()} placeholder="350.000" />
            </Field>
            <Field label="Estado">
              <select value={form.estado}
                onChange={e => set('estado', e.target.value)}
                className={input()}>
                <option value="confirmada">Confirmada</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </Field>
          </div>

          <Field label="Notas internas">
            <textarea value={form.notas}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set('notas', e.target.value)}
              rows={2} className={input()} placeholder="Ej: Llegan tarde, necesitan cuna..." />
          </Field>
        </section>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit" disabled={guardando}
            className="px-6 py-2.5 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            style={navyGlassStyle}
          >
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear reserva'}
          </button>
          <button
            type="button" onClick={() => navigate('/admin/reservas')}
            className="text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-colors"
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
  return 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2A7A68]/30 bg-white'
}
