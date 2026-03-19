import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Home, CalendarCheck, CalendarDays, LogOut, Building2 } from 'lucide-react'
import { useTenant } from '../../contexts/TenantContext'
import Logo from '../Logo'

const navItems = [
  { to: '/admin/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/admin/propiedades', label: 'Propiedades',  icon: Home            },
  { to: '/admin/reservas',    label: 'Reservas',     icon: CalendarCheck   },
  { to: '/admin/calendario',  label: 'Calendario',   icon: CalendarDays    },
  { to: '/admin/empresa',     label: 'Mi empresa',   icon: Building2       },
]

export default function AdminLayout() {
  const { tenant, logout } = useTenant()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar oscuro */}
      <aside className="w-64 flex flex-col" style={{ backgroundColor: '#1E3E50' }}>

        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="mb-4">
            <Logo dark size="sm" />
          </div>
          <p className="text-sm font-medium text-white truncate">{tenant?.nombre}</p>
          <p className="text-xs mt-0.5" style={{ color: '#64B5A0' }}>Panel admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-[#64B5A0]' : 'text-white/50'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 py-5 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
