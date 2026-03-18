import { BrowserRouter, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<div className="p-8 text-2xl font-bold">Casas Web</div>} />

        {/* Rutas admin */}
        <Route path="/admin/*" element={<div className="p-8 text-2xl font-bold">Admin Panel</div>} />
      </Routes>
    </BrowserRouter>
  )
}
