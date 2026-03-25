import { useEffect, useRef, useState } from 'react'
import type { Map, Marker } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  lat: number | null
  lng: number | null
  ubicacion: string
  onChange: (lat: number, lng: number, ubicacion: string) => void
}

export default function MapPicker({ lat, lng, ubicacion, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<Map | null>(null)
  const markerRef    = useRef<Marker | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false

    import('leaflet').then(L => {
      if (cancelled || !containerRef.current || mapRef.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const initialLat = lat ?? 6.2442
      const initialLng = lng ?? -75.5812

      const map = L.map(containerRef.current!).setView([initialLat, initialLng], lat ? 14 : 7)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      if (lat && lng) {
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
        markerRef.current = marker
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          reverseGeocode(pos.lat, pos.lng, L, marker, onChange)
        })
      }

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
          markerRef.current = marker
          marker.on('dragend', () => {
            const pos = marker.getLatLng()
            reverseGeocode(pos.lat, pos.lng, L, marker, onChange)
          })
        }
        reverseGeocode(lat, lng, L, markerRef.current!, onChange)
      })
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function buscar() {
    if (!busqueda.trim() || !mapRef.current) return
    setBuscando(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(busqueda)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data = await res.json()
      if (data.length === 0) return

      const { lat: sLat, lon: sLng } = data[0]
      const numLat = parseFloat(sLat)
      const numLng = parseFloat(sLng)

      import('leaflet').then(L => {
        mapRef.current!.setView([numLat, numLng], 14)
        if (markerRef.current) {
          markerRef.current.setLatLng([numLat, numLng])
        } else {
          const marker = L.marker([numLat, numLng], { draggable: true }).addTo(mapRef.current!)
          markerRef.current = marker
          marker.on('dragend', () => {
            const pos = marker.getLatLng()
            reverseGeocode(pos.lat, pos.lng, L, marker, onChange)
          })
        }
        reverseGeocode(numLat, numLng, L, markerRef.current!, onChange)
      })
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* Buscador */}
      <div className="flex gap-2">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscar())}
          placeholder="Buscar lugar (ej: Guatapé, Antioquia)…"
          className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          type="button"
          onClick={buscar}
          disabled={buscando}
          className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-200 text-white text-xs font-medium px-4 rounded-lg transition-colors"
        >
          {buscando ? '…' : 'Buscar'}
        </button>
      </div>

      {/* Mapa */}
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: 280 }} />

      {/* Ubicación seleccionada */}
      {ubicacion && (
        <p className="text-xs text-gray-500 truncate">
          <span className="text-gray-400">Ubicación:</span> {ubicacion}
        </p>
      )}
      {lat && lng && (
        <p className="text-xs text-gray-400">
          {lat.toFixed(5)}, {lng.toFixed(5)} — o haz clic en el mapa para mover el marcador
        </p>
      )}
      {!lat && (
        <p className="text-xs text-gray-400">Busca un lugar o haz clic en el mapa para marcarlo</p>
      )}
    </div>
  )
}

async function reverseGeocode(
  lat: number,
  lng: number,
  _L: typeof import('leaflet'),
  _marker: Marker,
  onChange: Props['onChange']
) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'es' } }
    )
    const data = await res.json()
    const addr = data.address ?? {}
    const ciudad = addr.city || addr.town || addr.village || addr.municipality || addr.county || ''
    const depto  = addr.state || ''
    const ubicacion = [ciudad, depto].filter(Boolean).join(', ') || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    onChange(lat, lng, ubicacion)
  } catch {
    onChange(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
  }
}
