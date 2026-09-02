import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { EstadoReserva, Propiedad, Reserva } from '../../types/database'
import { X, Pencil, Phone, Mail, Home, ArrowRight } from 'lucide-react'
import WhatsAppIcon from '../WhatsAppIcon'
import { navyGlassStyle, waGlassStyle } from '../../lib/styles'
import { useSheetDrag } from '../../hooks/useSheetDrag'

interface ReservaConPropiedad extends Reserva {
  propiedades: Pick<Propiedad, 'id' | 'nombre'> | null
}

const BADGE: Record<EstadoReserva, string> = {
  confirmada: 'bg-emerald-100 text-emerald-700',
  completada: 'bg-teal-600 text-white',
  cancelada:  'bg-red-500 text-white',
}

const BADGE_LABEL: Record<EstadoReserva, string> = {
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada:  'Cancelada',
}

function cop(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

function diaSemana(f: string) {
  return new Date(f + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long' })
}

function diaMes(f: string) {
  return new Date(f + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')
}

function anio(f: string) {
  return new Date(f + 'T00:00:00').getFullYear()
}

// El teléfono se guarda sin indicativo; wa.me lo necesita.
function waLink(tel: string) {
  const num = tel.replace(/\D/g, '')
  return `https://wa.me/${num.length === 10 ? '57' + num : num}`
}

interface Props {
  open: boolean
  reservaId: string | null
  onClose: () => void
  /** Abre el sheet de edición sin salir de la vista actual. */
  onEditar: (id: string) => void
}

export default function ReservaDetallePanel({ open, reservaId, onClose, onEditar }: Props) {
  const { handleProps, sheetStyle } = useSheetDrag(open, onClose)
  // Se guarda junto al id pedido para no mostrar los datos de la reserva anterior.
  const [cargado, setCargado] = useState<{ id: string; reserva: ReservaConPropiedad | null } | null>(null)

  useEffect(() => {
    if (!open || !reservaId) return
    let vigente = true
    supabase
      .from('reservas')
      .select('*, propiedades(id, nombre)')
      .eq('id', reservaId)
      .single()
      .then(({ data }) => {
        if (!vigente) return
        setCargado({ id: reservaId, reserva: (data as unknown as ReservaConPropiedad) ?? null })
      })
    return () => { vigente = false }
  }, [open, reservaId])

  const reserva  = cargado?.id === reservaId ? cargado.reserva : null
  const cargando = !!reservaId && cargado?.id !== reservaId

  const porNoche = reserva && reserva.monto_total && reserva.noches > 0
    ? reserva.monto_total / reserva.noches
    : null

  return (
    <div className={`fixed z-50 bg-white shadow-2xl ease-out
      bottom-0 left-0 right-0 rounded-t-3xl max-h-[92vh] overflow-y-auto overflow-x-hidden
      sm:top-0 sm:bottom-0 sm:left-auto sm:right-0 sm:w-[400px] sm:rounded-none sm:rounded-l-2xl sm:max-h-full
      ${open ? 'translate-y-0 sm:translate-x-0 transition-transform duration-300' : 'translate-y-full sm:translate-y-0 sm:translate-x-full pointer-events-none'}`}
      style={sheetStyle}
    >
      {/* Drag zone — handle + header */}
      <div className="flex-shrink-0 cursor-grab active:cursor-grabbing sm:cursor-default" {...handleProps}>
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Reserva</p>
            <h2 className="text-base font-bold text-[#1E3E50] truncate">
              {reserva?.cliente_nombre ?? (cargando ? 'Cargando…' : 'Sin datos')}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 p-1 -mt-0.5 -mr-1 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>
      </div>

      {!reserva ? (
        <p className="px-5 py-8 text-sm text-gray-400">
          {cargando ? 'Cargando reserva…' : 'No se pudo cargar la reserva.'}
        </p>
      ) : (
        <div className="px-5 py-4 space-y-4">

          {/* ── Estancia: de qué fecha a qué fecha ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(30,62,80,0.12)' }}>
            <div className="flex items-stretch">
              <div className="flex-1 px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Entrada</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{diaMes(reserva.fecha_inicio)}</p>
                <p className="text-[11px] text-gray-500 capitalize">{diaSemana(reserva.fecha_inicio)}</p>
                <p className="text-[10px] text-gray-300">{anio(reserva.fecha_inicio)}</p>
              </div>
              <div className="flex items-center px-1 text-gray-300">
                <ArrowRight size={16} />
              </div>
              <div className="flex-1 px-4 py-3 text-right">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Salida</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{diaMes(reserva.fecha_fin)}</p>
                <p className="text-[11px] text-gray-500 capitalize">{diaSemana(reserva.fecha_fin)}</p>
                <p className="text-[10px] text-gray-300">{anio(reserva.fecha_fin)}</p>
              </div>
            </div>
            <div
              className="px-4 py-1.5 text-center text-[11px] font-medium text-[#1E3E50]"
              style={{ background: 'rgba(30,62,80,0.06)', borderTop: '1px solid rgba(30,62,80,0.08)' }}
            >
              {reserva.noches} noche{reserva.noches !== 1 ? 's' : ''} · sale el {diaMes(reserva.fecha_fin)}, ese día queda libre
            </div>
          </div>

          {/* ── Propiedad + estado ── */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Home size={14} className="text-gray-300 flex-shrink-0" />
              <p className="text-sm text-gray-700 truncate">{reserva.propiedades?.nombre ?? '—'}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${BADGE[reserva.estado]}`}>
              {BADGE_LABEL[reserva.estado]}
            </span>
          </div>

          {/* ── Dinero ── */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(42,122,104,0.07)', border: '1px solid rgba(42,122,104,0.15)' }}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Total</p>
              <p className="text-base font-bold text-[#2A7A68]">
                {reserva.monto_total != null ? cop(reserva.monto_total) : '—'}
              </p>
            </div>
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Por noche</p>
              <p className="text-base font-bold text-gray-700">
                {porNoche != null ? cop(porNoche) : '—'}
              </p>
            </div>
          </div>

          {/* ── Contacto ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-300 flex-shrink-0" />
              <a href={`tel:${reserva.cliente_tel}`} className="text-sm text-gray-700 hover:text-[#1E3E50] transition-colors">
                {reserva.cliente_tel || '—'}
              </a>
            </div>
            {reserva.cliente_email && (
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-300 flex-shrink-0" />
                <a href={`mailto:${reserva.cliente_email}`} className="text-sm text-gray-700 truncate hover:text-[#1E3E50] transition-colors">
                  {reserva.cliente_email}
                </a>
              </div>
            )}
          </div>

          {/* ── Notas ── */}
          {reserva.notas && (
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-1">Notas</p>
              <p className="text-xs text-gray-600 whitespace-pre-line">{reserva.notas}</p>
            </div>
          )}

          <p className="text-[10px] text-gray-300">
            Creada el {new Date(reserva.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {/* ── Acciones ── */}
          <div className="flex gap-2 pt-1 pb-safe">
            {reserva.cliente_tel && (
              <a
                href={waLink(reserva.cliente_tel)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                style={waGlassStyle}
              >
                <WhatsAppIcon size={16} />
                WhatsApp
              </a>
            )}
            <button
              onClick={() => onEditar(reserva.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-95"
              style={navyGlassStyle}
            >
              <Pencil size={14} />
              Editar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
