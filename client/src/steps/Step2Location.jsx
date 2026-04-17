import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { normalizeCity } from '../utils/cityNorm'

const CHENNAI = { lat: 13.0827, lng: 80.2707 }

// Custom amber marker icon
const ORANGE_ICON = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48">
      <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/></filter>
      <path d="M16 2C9.373 2 4 7.373 4 14c0 9 12 32 12 32S28 23 28 14C28 7.373 22.627 2 16 2z"
        fill="#f59e0b" filter="url(#shadow)"/>
      <circle cx="16" cy="14" r="5" fill="white" opacity="0.95"/>
    </svg>`),
  iconSize:   [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48],
})

// Moves the map centre when coords change
function MapFlyTo({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1 })
  }, [lat, lng, map])
  return null
}

// Draggable marker — reports new position after drag end
function DraggableMarker({ position, onChange }) {
  const markerRef = useRef(null)
  const handlers  = useMemo(() => ({
    dragend() {
      const m = markerRef.current
      if (m) {
        const { lat, lng } = m.getLatLng()
        onChange({ lat, lng })
      }
    },
  }), [onChange])

  return (
    <Marker
      draggable
      ref={markerRef}
      position={[position.lat, position.lng]}
      icon={ORANGE_ICON}
      eventHandlers={handlers}
    />
  )
}

export default function Step2Location({ onNext }) {
  const [coords,      setCoords]      = useState(CHENNAI)
  const [status,      setStatus]      = useState('idle')  // idle | locating | done | error
  const [error,       setError]       = useState(null)
  const [address,     setAddress]     = useState(null)
  const [geoCity,     setGeoCity]     = useState(null)
  const [geoArea,     setGeoArea]     = useState(null)

  // Address search
  const [searchQuery,   setSearchQuery]   = useState('')
  const [suggestions,   setSuggestions]   = useState([])
  const [searching,     setSearching]     = useState(false)
  const searchInputRef = useRef(null)

  const handleChange = useCallback((c) => {
    setCoords(c)
    setAddress(null)
    setGeoCity(null)
    setGeoArea(null)
    setSuggestions([])
  }, [])

  async function detectLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      searchInputRef.current?.focus()
      return
    }
    setStatus('locating')
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        const loc = { lat: c.latitude, lng: c.longitude }
        setCoords(loc)
        setStatus('done')
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await r.json()
          const addr = data.address ?? {}
          setAddress(data.display_name?.split(',').slice(0, 3).join(', ') ?? null)
          setGeoCity(normalizeCity(addr.city ?? addr.town ?? addr.county ?? null))
          setGeoArea(addr.suburb ?? addr.neighbourhood ?? addr.village ?? null)
        } catch {
          // Ignore — address is optional
        }
      },
      (err) => {
        setStatus('error')
        if (err.code === 1) setError('Location access denied. Type your address below or pin manually.')
        else               setError('Could not determine location. Type your address or pin manually.')
        setTimeout(() => searchInputRef.current?.focus(), 100)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function searchAddress() {
    const q = searchQuery.trim()
    if (!q) return
    setSearching(true)
    setSuggestions([])
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(q)}&countrycodes=in&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await r.json()
      setSuggestions(data)
    } catch {
      // Ignore
    } finally {
      setSearching(false)
    }
  }

  function selectSuggestion(s) {
    const loc = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) }
    setCoords(loc)
    setAddress(s.display_name.split(',').slice(0, 3).join(', '))
    const addr = s.address ?? {}
    setGeoCity(normalizeCity(addr.city ?? addr.town ?? addr.county ?? null))
    setGeoArea(addr.suburb ?? addr.neighbourhood ?? addr.village ?? null)
    setSuggestions([])
    setSearchQuery('')
  }

  // Auto-detect on mount
  useEffect(() => { detectLocation() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Address search bar */}
      <div className="bg-white dark:bg-slate-950 px-4 pt-3 pb-2 border-b border-gray-200/70 dark:border-slate-800 relative z-[500] shadow-sm">
        <div className="flex gap-2">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSuggestions([]) }}
            onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
            placeholder="Or type your address, e.g. 45 Salai Road, Srirangam, Trichy"
            className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-50 text-xs rounded-lg px-3 py-2 outline-none focus:border-amber-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
          <button
            onClick={searchAddress}
            disabled={searching || !searchQuery.trim()}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors flex-shrink-0"
          >
            {searching ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M12 2a10 10 0 0110 10" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
              </svg>
            )}
            Search
          </button>
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[600]">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-4 py-2.5 text-xs text-gray-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-500/10 border-b border-gray-100 dark:border-slate-800 last:border-0 transition-colors"
              >
                <span className="font-medium">{s.display_name.split(',')[0]}</span>
                <span className="text-gray-400 dark:text-slate-500 ml-1">{s.display_name.split(',').slice(1, 4).join(',')}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map (fills most of the screen) */}
      <div className="relative flex-1 min-h-0" style={{ minHeight: '45vh' }}>
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={16}
          zoomControl={false}
          className="h-full w-full"
          style={{ minHeight: '45vh' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <MapFlyTo lat={coords.lat} lng={coords.lng} />
          <DraggableMarker position={coords} onChange={handleChange} />
        </MapContainer>

        {/* Drag hint */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-xs text-gray-700 dark:text-zinc-300 px-3 py-1.5 rounded-full border border-gray-300 dark:border-zinc-700">
          Drag pin to adjust location
        </div>
      </div>

      {/* Bottom panel */}
      <div className="bg-white dark:bg-slate-950 px-5 py-4 flex flex-col gap-3 border-t border-gray-200/70 dark:border-slate-800 shadow-[0_-1px_4px_rgba(0,0,0,0.06)] dark:shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {status === 'locating' ? 'Detecting your location…' : 'Issue Location'}
            </p>
            {address && (
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{address}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-zinc-600 font-mono mt-0.5">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          </div>

          {/* Re-detect GPS button */}
          <button
            onClick={detectLocation}
            disabled={status === 'locating'}
            className="flex items-center gap-1.5 text-xs text-amber-500 border border-amber-500/40 px-3 py-2 rounded-lg hover:bg-amber-500/10 transition-colors touch-manipulation disabled:opacity-50 flex-shrink-0"
          >
            {status === 'locating' ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M12 2a10 10 0 0110 10" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            )}
            {status === 'locating' ? 'Locating…' : 'My Location'}
          </button>
        </div>

        {error && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            {error}
          </p>
        )}

        <button
          className="btn-primary w-full"
          onClick={() => onNext({ location: coords, address: address ?? null, city: geoCity, area: geoArea })}
        >
          Confirm Location →
        </button>
      </div>
    </div>
  )
}
