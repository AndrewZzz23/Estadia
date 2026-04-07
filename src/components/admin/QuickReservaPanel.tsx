import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import type { Propiedad } from '../../types/database'
import { X } from 'lucide-react'
import { navyGlassStyle } from '../../lib/styles'

type QuickForm = {
  propiedad_id: string
  cliente_nombre: string
  cliente_tel: string
  fecha_inicio: string
  fecha_fin: string
  monto_total: string
  estado: string
  notas: string
}

function nextDay(d: string) {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  dt.setDate(dt.getDate() + 1)
  return dt.toISOString().slice(0, 10)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

interface Props {
  open: boolean
  onClose: () => void
  fechaInicio?: string
  propiedadDefault?: string
  onCreated: () => void
}

export default function QuickReservaPanel({ open, onClose, fechaInicio, propiedadDefault = '', onCreated }: Props) {
  const { tenant } = useTenant()
  const [propiedades, setPropiedades] = useState<Pick<Propiedad, 'id' | 'nombre'>[]>([])
  const [form, setForm]           = useState<QuickForm>(emptyForm())
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')

  function emptyForm(): QuickForm {
    const inicio = fechaInicio || today()
    return {
      propiedad_id:   propiedadDefault,
      cliente_nombre: '',
      cliente_tel:    '',
      fecha_inicio:   inicio,
      fecha_fin:      nextDay(inicio),
      monto_total:    '',
      estado:         'confirmada',
      notas:          '',
    }
  }

  // Cargar propiedades al montar
  useEffect(() => {
    if (!tenant) return
    supabase.from('propiedades').select('id, nombre').eq('tenant_id', tenant.id).eq('activa', true).order('nombre')
      .then(({ data }) => setPropiedades((data as Pick<Propiedad, 'id' | 'nombre'>[]) ?? []))
  }, [tenant])

  // Reset form al abrir
  useEffect(() => {
    if (open) {
      setForm(emptyForm())
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fechaInicio, propiedadDefault])

  function set(field: keyof QuickForm, val: string) {
    setForm(prev => {
      const next = { ...prev, [field]: val }
      if (field === 'fecha_inicio' && val && next.fecha_fin && next.fecha_fin <= val) {
        const d = new Date(val + 'T00:00:00')
        d.setDate(d.getDate() + 1)
        next.fecha_fin = d.toISOString().slice(0, 10)
      }
      return next
    })
  }

  const noches = form.fecha_inicio && form.fecha_fin
    ? Math.max(0, (new Date(form.fecha_fin).getTime() - new Date(form.fecha_inicio).getTime()) / 86400000)
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.propiedad_id)          { setError('Selecciona una propiedad'); return }
    if (!form.cliente_nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.cliente_tel.trim())    { setError('El teléfono es obligatorio'); return }
    if (!form.fecha_inicio || !form.fecha_fin) { setError('Las fechas son obligatorias'); return }
    if (form.fecha_fin <= form.fecha_inicio)   { setError('La salida debe ser posterior a la entrada'); return }

    setGuardando(true); setError('')
    const { error: err } = await supabase.from('reservas').insert({
      propiedad_id:   form.propiedad_id,
      cliente_nombre: form.cliente_nombre.trim(),
      cliente_tel:    form.cliente_tel.trim(),
      cliente_email:  null,
      fecha_inicio:   form.fecha_inicio,
      fecha_fin:      form.fecha_fin,
      monto_total:    form.monto_total ? parseFloat(form.monto_total) : null,
      estado:         form.estado,
      notas:          form.notas.trim() || null,
    } as never)
    setGuardando(false)
    if (err) { setError('Error al guardar'); return }
    onCreated()
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#2A7A68]/30 bg-white'
  const fechaLabel = (fechaInicio || today())
    ? new Date((fechaInicio || today()) + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  return (
    <div className={`fixed z-50 bg-white shadow-2xl ease-out
      bottom-0 left-0 right-0 rounded-t-3xl max-h-[92vh] overflow-y-auto overflow-x-hidden
      sm:top-0 sm:bottom-0 sm:left-auto sm:right-0 sm:w-[400px] sm:rounded-none sm:rounded-l-2xl sm:max-h-full
      ${open ? 'translate-y-0 sm:translate-x-0 transition-transform duration-300' : 'translate-y-full sm:translate-y-0 sm:translate-x-full pointer-events-none'}`}
    >
      {/* Drag handle — solo móvil */}
      <div className="sm:hidden flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-gray-200 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-[#1E3E50]">Nueva reserva</h2>
          {fechaLabel && <p className="text-xs text-gray-400 capitalize mt-0.5">{fechaLabel}</p>}
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500 p-1 -mt-0.5 -mr-1 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Propiedad *</label>
          <select value={form.propiedad_id} onChange={e => set('propiedad_id', e.target.value)} className={inp}>
            <option value="">Selecciona...</option>
            {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entrada *</label>
            <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)}
              className={inp} style={{ maxWidth: '100%' }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Salida *</label>
            <input type="date" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)}
              min={form.fecha_inicio || undefined}
              style={{ maxWidth: '100%' }}
              className={`${inp} ${form.fecha_fin && form.fecha_inicio && form.fecha_fin <= form.fecha_inicio ? 'border-red-300 ring-1 ring-red-200' : ''}`} />
          </div>
        </div>
        {noches > 0 && <p className="text-xs text-gray-400 -mt-1">{noches} noche{noches !== 1 ? 's' : ''}</p>}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del cliente *</label>
          <input value={form.cliente_nombre} onChange={e => set('cliente_nombre', e.target.value)}
            className={inp} placeholder="Juan Pérez" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono *</label>
          <input value={form.cliente_tel} onChange={e => set('cliente_tel', e.target.value)}
            className={inp} placeholder="3001234567" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Monto total</label>
            <input type="text" inputMode="numeric"
              value={form.monto_total ? Number(form.monto_total).toLocaleString('es-CO') : ''}
              onChange={e => set('monto_total', e.target.value.replace(/\D/g, ''))}
              className={inp} placeholder="350.000" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select value={form.estado} onChange={e => set('estado', e.target.value)} className={inp}>
              <option value="confirmada">Confirmada</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Notas</label>
          <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
            rows={2} className={inp} placeholder="Ej: Llegan tarde, necesitan cuna..." />
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-2 pt-1 pb-safe">
          <button type="submit" disabled={guardando}
            className="flex-1 py-3 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            style={navyGlassStyle}>
            {guardando ? 'Guardando...' : 'Crear reserva'}
          </button>
        </div>
      </form>
    </div>
  )
}
