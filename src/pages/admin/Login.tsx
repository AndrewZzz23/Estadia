import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../../contexts/TenantContext'
import Logo from '../../components/Logo'

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
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#101820' }}
    >
      {/* Glow de fondo */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(30,62,80,0.6) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Logo size="lg" dark />
          <p className="text-white/40 text-sm mt-3 tracking-wide">Panel de administración</p>
        </div>

        {/* Card glass */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs font-medium mb-2 tracking-wider uppercase">
                Código de acceso
              </label>
              <input
                type="text"
                value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                placeholder="CASA-XXXX"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-4 rounded-2xl text-white text-center text-xl font-mono tracking-widest focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  caretColor: 'rgba(255,255,255,0.8)',
                }}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-2xl text-sm text-center"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !codigo.trim()}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-95"
              style={{
                background: loading || !codigo.trim()
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(30,62,80,0.9)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: loading || !codigo.trim() ? 'rgba(255,255,255,0.3)' : 'white',
              }}
            >
              {loading ? 'Verificando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
