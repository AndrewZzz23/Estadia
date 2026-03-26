import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Home, CalendarCheck, CalendarDays, LogOut, ChevronRight, Settings } from 'lucide-react'
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

  function handleLogout() {
    logout()
    navigate('/admin')
  }

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

        {/* Logout */}
        <div className={`border-t border-white/10 py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
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

      {/* ── CONTENIDO ── */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">

          {/* Top bar — sticky dentro del scroll, el contenido pasa detrás */}
          <div
            className="md:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
            style={{
              background: 'rgba(16,24,32,0.55)',
              backdropFilter: 'saturate(180%) blur(24px)',
              WebkitBackdropFilter: 'saturate(180%) blur(24px)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Avatar — único elemento clickable */}
            <Link to="/admin/empresa" className="relative flex-shrink-0 active:scale-95 transition-transform">
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
            </Link>

            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight truncate">{tenant?.nombre}</p>
              <p className="text-[10px] font-medium" style={{ color: '#64B5A0' }}>Panel admin</p>
            </div>

            <img src={logoIcon} alt="Estadia" className="w-5 h-5 opacity-30 flex-shrink-0" />
          </div>

          <Outlet />
          <div className="md:hidden h-24" />
        </div>
      </main>

      {/* ── BOTTOM NAV — overlapping el scroll desde abajo ── */}
      <nav
        className="md:hidden flex-shrink-0 flex items-center rounded-t-3xl relative z-10"
        style={{
          marginTop: '-80px',
          background: 'rgba(16,24,32,0.55)',
          backdropFilter: 'saturate(180%) blur(24px)',
          WebkitBackdropFilter: 'saturate(180%) blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}
      >
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 pt-3 pb-2 transition-all ${isActive ? 'text-white' : 'text-white/30'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all"
                  style={isActive ? { background: 'rgba(100,181,160,0.22)' } : {}}>
                  <Icon size={22} style={{ color: isActive ? '#64B5A0' : 'rgba(255,255,255,0.30)' }} />
                </div>
                <span className="text-[10px] font-medium leading-none"
                  style={{ color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)' }}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
