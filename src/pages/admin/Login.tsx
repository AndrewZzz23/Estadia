import { useState } from 'react'
import Logo from '../../components/Logo'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../../contexts/TenantContext'


export default function AdminLogin() {
  const { login } = useTenant()
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!codigo.trim()) return
    setLoading(true)
    setError('')

    const { error } = await login(codigo)
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      navigate('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-gray-400 text-sm mt-3">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Código de acceso
            </label>
            <input
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              placeholder="CASA-XXXX"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 font-mono tracking-widest"
              autoFocus
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !codigo.trim()}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-200 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
