import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Tenant } from '../types/database'

interface TenantContextValue {
  tenant: Tenant | null
  loading: boolean
  login: (codigo: string) => Promise<{ error: string | null }>
  logout: () => void
  setTenant: (t: Tenant) => void
}

const TenantContext = createContext<TenantContextValue | null>(null)

const STORAGE_KEY = 'estadia_tenant'

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTenant(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  async function login(codigo: string): Promise<{ error: string | null }> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('codigo_acceso', codigo.trim().toUpperCase())
      .eq('activa', true)
      .maybeSingle()

    if (error) return { error: 'Error de conexión, intenta de nuevo.' }
    if (!data)  return { error: 'Código incorrecto o cuenta inactiva.' }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setTenant(data)
    return { error: null }
  }

  function updateTenant(t: Tenant) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
    setTenant(t)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setTenant(null)
  }

  return (
    <TenantContext.Provider value={{ tenant, loading, login, logout, setTenant: updateTenant }}>
      {children}
    </TenantContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant debe usarse dentro de TenantProvider')
  return ctx
}
