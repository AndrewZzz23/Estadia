import { Navigate, Outlet } from 'react-router-dom'
import { useTenant } from '../../contexts/TenantContext'

export default function RequireAuth() {
  const { tenant, loading } = useTenant()

  if (loading) return null
  if (!tenant) return <Navigate to="/admin" replace />
  return <Outlet />
}
