import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TenantProvider } from './contexts/TenantContext'

// Páginas públicas
import Home from './pages/public/Home'
import TenantHome from './pages/public/TenantHome'
import PropiedadDetalle from './pages/public/PropiedadDetalle'

// Admin
import AdminLogin from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Propiedades from './pages/admin/Propiedades'
import Reservas from './pages/admin/Reservas'
import ReservaForm from './pages/admin/ReservaForm'
import Calendario from './pages/admin/Calendario'
import Empresa from './pages/admin/Empresa'
import AdminLayout from './components/admin/AdminLayout'
import RequireAuth from './components/admin/RequireAuth'

export default function App() {
  return (
    <TenantProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Público ── */}
          <Route path="/" element={<Home />} />
          <Route path="/:slug" element={<TenantHome />} />
          <Route path="/:slug/casa/:id" element={<PropiedadDetalle />} />

          {/* ── Admin: login ── */}
          <Route path="/admin" element={<AdminLogin />} />

          {/* ── Admin: rutas protegidas ── */}
          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard"   element={<Dashboard />} />
              <Route path="/admin/propiedades" element={<Propiedades />} />
              <Route path="/admin/reservas"              element={<Reservas />} />
              <Route path="/admin/reservas/nueva"        element={<ReservaForm />} />
              <Route path="/admin/reservas/:id/editar"   element={<ReservaForm />} />
              <Route path="/admin/calendario"  element={<Calendario />} />
              <Route path="/admin/empresa"     element={<Empresa />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TenantProvider>
  )
}
