import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { ThemeToggle, useTheme } from '../context/ThemeContext'

const CHENNAI = [13.0827, 80.2707]

const MOCK_PINS = [
  { id: 'CL-4821', pos: [13.0878, 80.2785], type: 'Pothole',           severity: 3 },
  { id: 'CL-3310', pos: [13.0712, 80.2648], type: 'Open Manhole',      severity: 5 },
  { id: 'CL-5504', pos: [13.0950, 80.2840], type: 'Broken Streetlight', severity: 2 },
  { id: 'CL-2217', pos: [13.0789, 80.2612], type: 'Clogged Drain',     severity: 4 },
  { id: 'CL-6633', pos: [13.0659, 80.2730], type: 'Solid Waste',       severity: 2 },
  { id: 'CL-7745', pos: [13.1012, 80.2699], type: 'Road Flooding',     severity: 3 },
]

const SEV_COLOR = { 1: '#4ade80', 2: '#a3e635', 3: '#fb923c', 4: '#f97316', 5: '#ef4444' }

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
    ),
    step: '01',
    title: 'Snap a Photo',
    desc: 'Use your camera or upload from gallery. Our AI works on any image quality.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    step: '02',
    title: 'Pin the Location',
    desc: 'GPS auto-detects. Drag the map marker to fine-tune the exact spot.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    step: '03',
    title: 'AI Classification',
    desc: 'Claude Vision assesses severity, type, and routes it to the right ward office.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
      </svg>
    ),
    step: '04',
    title: 'Track & Resolve',
    desc: 'Get a tracking ID instantly. Follow real-time status from report to resolution.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { dark } = useTheme()

  const tileUrl = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f4] dark:bg-slate-950">
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="absolute top-0 inset-x-0 z-[500] flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/70 dark:border-slate-700 rounded-lg px-3 py-1.5">
          <div className="w-6 h-6 rounded-md bg-slate-900 dark:bg-amber-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" /><path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
            </svg>
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-slate-50">CivicLens</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/70 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-50 rounded-lg px-3 py-1.5 transition-colors"
          >
            Dashboard
          </button>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/70 dark:border-slate-700 rounded-lg">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Map Hero ──────────────────────────────────────────────────────── */}
      <div className="relative h-[60vh] min-h-[320px]">
        <MapContainer
          center={CHENNAI}
          zoom={13}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer url={tileUrl} attribution='&copy; CartoDB &copy; OpenStreetMap' />
          {MOCK_PINS.map((pin) => (
            <CircleMarker
              key={pin.id}
              center={pin.pos}
              radius={8}
              pathOptions={{ fillColor: SEV_COLOR[pin.severity], fillOpacity: 0.9, color: '#000', weight: 1 }}
            >
              <Popup>
                <div className="text-xs font-mono text-amber-600">{pin.id}</div>
                <div className="font-semibold text-sm">{pin.type}</div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-stone-50 dark:from-slate-950 to-transparent pointer-events-none z-[400]" />

        {/* Live badge */}
        <div className="absolute top-16 left-3 z-[400] flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/70 dark:border-slate-700 rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Live · Chennai</span>
        </div>
      </div>

      {/* ── Hero content ──────────────────────────────────────────────────── */}
      <div className="bg-[#f8f7f4] dark:bg-slate-950 px-5 pt-2 pb-6 flex flex-col gap-4 max-w-md mx-auto w-full animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-900/20 dark:shadow-amber-500/20">
            <svg className="w-5 h-5 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.3-6.7-1.4 1.4M6.7 17.3l-1.4 1.4m0-12.7 1.4 1.4m10.6 10.6 1.4 1.4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-50 leading-tight">CivicLens</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Report. Track. Resolve.</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-50 leading-tight">
          Fix your city<br />
          <span className="text-amber-500">in seconds.</span>
        </h2>

        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Snap a photo of a civic issue — potholes, broken lights, blocked drains — and our AI
          instantly classifies it and routes it to the right ward office.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Reports Today', value: '47' },
            { label: 'Resolved',      value: '312' },
            { label: 'Avg. Response', value: '2.4d' },
          ].map((s) => (
            <div key={s.label} className="card py-3 px-2 text-center">
              <div className="text-lg font-bold text-amber-700 dark:text-amber-500">{s.value}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <button
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={() => navigate('/report')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Report an Issue
        </button>
        <button
          className="btn-ghost w-full flex items-center justify-center gap-2"
          onClick={() => navigate('/track')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          Track My Report
        </button>
      </div>

      {/* ── 4-step feature section ─────────────────────────────────────────── */}
      <div className="bg-[#f1f0ec] dark:bg-slate-900 border-t border-gray-200/70 dark:border-slate-800 px-5 py-8">
        <div className="max-w-md mx-auto">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-6">
            How it works
          </p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.step} className="card p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    {f.icon}
                  </div>
                  <span className="text-[11px] font-black text-slate-300 dark:text-slate-700">{f.step}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{f.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => navigate('/about')}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              About the project
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              Municipal dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
