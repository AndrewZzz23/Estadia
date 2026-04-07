import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Home, CalendarCheck, CalendarDays, LogOut, ChevronRight, Settings, User, Building2 } from 'lucide-react'
import { useTenant } from '../../contexts/TenantContext'
import Logo from '../Logo'
import logoIcon from '../../assets/estadia-icon.svg'

const navItems = [
  { to: '/admin/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/admin/propiedades', label: 'Propiedades',  icon: Home            },
  { to: '/admin/reservas',    label: 'Reservas',     icon: CalendarCheck   },
  { to: '/admin/calendario',  label: 'Calendario',   icon: CalendarDays    },
]

export default function AdminLayout() {
  const { tenant, logout } = useTenant()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  function handleLogout() {
    logout()
    navigate('/admin')
  }

  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div className="h-screen bg-[#EEF0F4] flex flex-col md:flex-row">

      {/* ── SIDEBAR — desktop ── */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 h-full overflow-hidden transition-all duration-200 ${collapsed ? 'w-[60px]' : 'w-56'}`}
        style={{ backgroundColor: '#1E3E50' }}
      >
        {/* Cabecera colapsada */}
        {collapsed ? (
          <div className="border-b border-white/10 flex flex-col items-center py-3 gap-2">
            <img src={logoIcon} alt="Estadia" className="w-8 h-8" />
            <button
              onClick={() => setCollapsed(false)}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
              title="Expandir"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="border-b border-white/10 px-4 pt-4 pb-4">
            <div className="flex items-center justify-between gap-2">
              <Logo dark size="sm" />
              <button
                onClick={() => setCollapsed(true)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                title="Comprimir"
              >
                <ChevronRight size={14} className="rotate-180" />
              </button>
            </div>
            <div className="border-t border-white/10 mt-3 mb-2.5 -mx-4" />
            <p className="text-xs font-medium text-white truncate">{tenant?.nombre}</p>
            <p className="text-[11px] mt-0.5" style={{ color: '#64B5A0' }}>Panel admin</p>
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 py-3 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-lg transition-all ${
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={`flex-shrink-0 ${isActive ? 'text-[#64B5A0]' : ''}`} />
                  {!collapsed && (
                    <span className={`text-sm truncate ${isActive ? 'font-medium' : ''}`}>{label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Empresa + Logout */}
        <div className={`border-t border-white/10 py-3 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
          <NavLink
            to="/admin/empresa"
            title={collapsed ? 'Mi empresa' : undefined}
            className={({ isActive }) =>
              `flex items-center w-full rounded-lg transition-all ${
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
              } ${isActive ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'}`
            }
          >
            {({ isActive }) => (
              <>
                <Building2 size={17} className={`flex-shrink-0 ${isActive ? 'text-[#64B5A0]' : ''}`} />
                {!collapsed && <span className="text-sm">Mi empresa</span>}
              </>
            )}
          </NavLink>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={`flex items-center w-full rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all ${
              collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
            }`}
          >
            <LogOut size={17} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── CONTENIDO MOBILE: contenedor relativo, bars absolutas sobre el scroll ── */}
      <div className="md:hidden flex-1 min-h-0 relative overflow-hidden" style={{ backgroundColor: '#101820' }}>

        {/* Scroll area — ocupa todo, padding para que el contenido no quede bajo las bars */}
        <main
          className="absolute inset-0 overflow-y-auto"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)',
            overscrollBehavior: 'none',
            backgroundColor: '#EEF0F4',
          }}
        >
          <Outlet />
        </main>

        {/* Top bar — absolute encima del scroll */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 pb-2"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
            background: 'rgba(16,24,32,0.55)',
            backdropFilter: 'saturate(180%) blur(24px)',
            WebkitBackdropFilter: 'saturate(180%) blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            touchAction: 'none',
          }}
        >
          <div ref={menuRef} className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="relative active:scale-95 transition-transform"
            >
              {tenant?.logo_url ? (
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20">
                  <img src={tenant.logo_url} alt={tenant.nombre} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{tenant?.nombre?.charAt(0)}</span>
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: '#2A7A68', boxShadow: '0 0 0 1.5px rgba(16,24,32,0.9)' }}>
                <Settings size={8} className="text-white" />
              </div>
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div
                className="absolute top-12 left-0 z-50 rounded-2xl overflow-hidden min-w-[180px]"
                style={{
                  background: 'rgba(16,24,32,0.92)',
                  backdropFilter: 'saturate(180%) blur(20px)',
                  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <Link
                  to="/admin/empresa"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm"
                >
                  <User size={15} />
                  Perfil y configuración
                </Link>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400/80 hover:text-red-400 hover:bg-white/10 transition-colors text-sm"
                >
                  <LogOut size={15} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">{tenant?.nombre}</p>
            <p className="text-[10px] font-medium" style={{ color: '#64B5A0' }}>Panel admin</p>
          </div>

          <img src={logoIcon} alt="Estadia" className="w-7 h-7 opacity-60 flex-shrink-0" />
        </div>

        {/* Bottom nav — absolute encima del scroll */}
        <nav
          className="absolute bottom-0 left-0 right-0 z-10 flex items-center rounded-t-3xl"
          style={{
            background: 'rgba(16,24,32,0.55)',
            backdropFilter: 'saturate(180%) blur(24px)',
            WebkitBackdropFilter: 'saturate(180%) blur(24px)',
            borderTop: '1px solid rgba(255,255,255,0.10)',
            paddingBottom: 'env(safe-area-inset-bottom, 4px)',
            touchAction: 'none',
          }}
        >
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 transition-all ${isActive ? 'text-white' : 'text-white/30'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                    style={isActive ? { background: 'rgba(100,181,160,0.22)' } : {}}>
                    <Icon size={18} style={{ color: isActive ? '#64B5A0' : 'rgba(255,255,255,0.30)' }} />
                  </div>
                  <span className="text-[9px] font-medium leading-none"
                    style={{ color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)' }}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── CONTENIDO DESKTOP ── */}
      <main className="hidden md:flex flex-1 min-h-0 overflow-y-auto">
        <div className="flex-1">
          <Outlet />
        </div>
      </main>

    </div>
  )
}
