import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Home, CalendarCheck, CalendarDays, LogOut, ChevronRight } from 'lucide-react'
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
    <div className="h-screen bg-[#EEF0F4] flex overflow-hidden">

      {/* ── SIDEBAR — desktop ── */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 h-full transition-all duration-200 ${collapsed ? 'w-[60px]' : 'w-56'}`}
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
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 flex flex-col">

        {/* Top bar — solo móvil */}
        <Link to="/admin/empresa" className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#1E3E50] flex-shrink-0 active:bg-white/5 transition-colors">
          {tenant?.logo_url ? (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-white/10 flex-shrink-0">
              <img src={tenant.logo_url} alt={tenant.nombre} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{tenant?.nombre?.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{tenant?.nombre}</p>
            <p className="text-[11px]" style={{ color: '#64B5A0' }}>Panel admin</p>
          </div>
          <img src={logoIcon} alt="Estadia" className="w-6 h-6 opacity-40" />
        </Link>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* ── BOTTOM NAV — mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#1E3E50] border-t border-white/10 flex">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all ${
                isActive ? 'text-white' : 'text-white/35 hover:text-white/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-white/15' : ''}`}>
                  <Icon size={18} className={isActive ? 'text-[#64B5A0]' : ''} />
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
