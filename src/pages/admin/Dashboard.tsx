import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'

interface Metricas {
  propiedades: number
  reservasActivas: number
  reservasMes: number
  ingresosMes: number
}

export default function Dashboard() {
  const { tenant } = useTenant()
  const [metricas, setMetricas] = useState<Metricas>({ propiedades: 0, reservasActivas: 0, reservasMes: 0, ingresosMes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) return
    async function cargar() {
      const hoy = new Date().toISOString().split('T')[0]
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      const [{ count: propiedades }, { count: reservasActivas }, { data: reservasMesData }] = await Promise.all([
        supabase.from('propiedades').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant!.id).eq('activa', true),
        supabase.from('reservas').select('*', { count: 'exact', head: true })
          .in('propiedad_id', await getPropiedadIds(tenant!.id))
          .eq('estado', 'confirmada')
          .gte('fecha_fin', hoy),
        supabase.from('reservas').select('monto_total')
          .in('propiedad_id', await getPropiedadIds(tenant!.id))
          .eq('estado', 'confirmada')
          .gte('created_at', inicioMes),
      ])

      const ingresosMes = (reservasMesData as { monto_total: number | null }[] | null)
        ?.reduce((sum, r) => sum + (r.monto_total ?? 0), 0) ?? 0

      setMetricas({
        propiedades: propiedades ?? 0,
        reservasActivas: reservasActivas ?? 0,
        reservasMes: reservasMesData?.length ?? 0,
        ingresosMes,
      })
      setLoading(false)
    }
    cargar()
  }, [tenant])

  async function getPropiedadIds(tenantId: string): Promise<string[]> {
    const { data } = await supabase.from('propiedades').select('id').eq('tenant_id', tenantId)
    return (data as { id: string }[] | null)?.map(p => p.id) ?? []
  }

  const cards = [
    { label: 'Propiedades activas', value: metricas.propiedades },
    { label: 'Reservas vigentes', value: metricas.reservasActivas },
    { label: 'Reservas este mes', value: metricas.reservasMes },
    { label: 'Ingresos este mes', value: `$${metricas.ingresosMes.toLocaleString('es-CO')}` },
  ]

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 max-w-2xl">
          {cards.map((card, i) => (
            <div key={card.label} className={`rounded-2xl border p-6 ${i === 0 ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-100'}`}>
              <p className={`text-sm ${i === 0 ? 'text-brand-100' : 'text-gray-500'}`}>{card.label}</p>
              <p className={`text-3xl font-bold mt-2 ${i === 0 ? 'text-white' : 'text-gray-900'}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
