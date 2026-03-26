import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import type { CategoriaGasto, Propiedad } from '../../types/database'
import { X } from 'lucide-react'
import { navyGlassStyle } from '../../lib/styles'

const CATEGORIAS: { value: CategoriaGasto; label: string; emoji: string }[] = [
  { value: 'aseo',          label: 'Aseo',           emoji: '🧹' },
  { value: 'mantenimiento', label: 'Mantenimiento',  emoji: '🔧' },
  { value: 'reparacion',    label: 'Reparación',     emoji: '🪛' },
  { value: 'servicios',     label: 'Servicios',      emoji: '💡' },
  { value: 'impuestos',     label: 'Impuestos',      emoji: '📋' },
  { value: 'otro',          label: 'Otro',           emoji: '📦' },
]

function today() { return new Date().toISOString().slice(0, 10) }

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function GastoPanel({ open, onClose, onCreated }: Props) {
  const { tenant } = useTenant()
  const [propiedades, setPropiedades] = useState<Pick<Propiedad, 'id' | 'nombre'>[]>([])
  const [categoria,    setCategoria]   = useState<CategoriaGasto>('aseo')
  const [monto,        setMonto]       = useState('')
  const [fecha,        setFecha]       = useState(today())
  const [propiedadId,  setPropiedadId] = useState('')
  const [nota,         setNota]        = useState('')
  const [guardando,    setGuardando]   = useState(false)
  const [error,        setError]       = useState('')

  useEffect(() => {
    if (!tenant) return
    supabase.from('propiedades').select('id, nombre').eq('tenant_id', tenant.id).eq('activa', true).order('nombre')
      .then(({ data }) => setPropiedades((data as Pick<Propiedad, 'id' | 'nombre'>[]) ?? []))
  }, [tenant])

  useEffect(() => {
    if (open) {
      setCategoria('aseo'); setMonto(''); setFecha(today()); setPropiedadId(''); setNota(''); setError('')
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const montoNum = parseFloat(monto)
    if (!monto || isNaN(montoNum) || montoNum <= 0) { setError('Ingresa un monto válido'); return }

    setGuardando(true); setError('')
    const { error: err } = await supabase.from('gastos').insert({
      tenant_id:    tenant!.id,
      propiedad_id: propiedadId || null,
      categoria,
      monto:        montoNum,
      fecha,
      nota:         nota.trim() || null,
    } as never)
    setGuardando(false)
    if (err) { setError('Error al guardar'); return }
    onCreated()
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2A7A68]/30 bg-white'

  return (
    <div className={`fixed z-50 bg-white shadow-2xl ease-out
      bottom-0 left-0 right-0 rounded-t-3xl max-h-[92vh] overflow-y-auto
      sm:top-0 sm:bottom-0 sm:left-auto sm:right-0 sm:w-[400px] sm:rounded-none sm:rounded-l-2xl sm:max-h-full
      ${open
        ? 'translate-y-0 sm:translate-x-0 transition-transform duration-300'
        : 'translate-y-full sm:translate-y-0 sm:translate-x-full pointer-events-none'}`}
    >
      {/* Drag handle — solo móvil */}
      <div className="sm:hidden flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-gray-200 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-[#1E3E50]">Registrar gasto</h2>
          <p className="text-xs text-gray-400 mt-0.5">Costos operativos de la propiedad</p>
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500 p-1 -mt-0.5 -mr-1 transition-colors">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

        {/* Categoría — chips */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Categoría</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIAS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategoria(c.value)}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                  categoria === c.value
                    ? 'border-[#2A7A68] bg-[#2A7A68]/8 text-[#2A7A68]'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-lg leading-none">{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Monto *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={monto ? Number(monto).toLocaleString('es-CO') : ''}
              onChange={e => setMonto(e.target.value.replace(/\D/g, ''))}
              className={`${inp} pl-7`}
              placeholder="150.000"
            />
          </div>
        </div>

        {/* Fecha + Propiedad */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inp} />
          </div>
          {propiedades.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Propiedad</label>
              <select value={propiedadId} onChange={e => setPropiedadId(e.target.value)} className={inp}>
                <option value="">General</option>
                {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Nota */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nota (opcional)</label>
          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            rows={2}
            className={inp}
            placeholder="Ej: Fumigación mensual, cambio de cerradura..."
          />
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="pb-safe">
          <button
            type="submit"
            disabled={guardando}
            className="w-full py-3 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            style={navyGlassStyle}
          >
            {guardando ? 'Guardando...' : 'Registrar gasto'}
          </button>
        </div>
      </form>
    </div>
  )
}
