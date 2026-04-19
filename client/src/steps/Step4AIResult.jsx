import { useState, useEffect } from 'react'

const SEV_CONFIG = {
  1: { label: 'Low',      color: 'text-green-700 dark:text-green-400',  bar: 'bg-green-500',  bg: 'bg-green-500/10  border-green-500/30' },
  2: { label: 'Minor',    color: 'text-lime-700 dark:text-lime-400',    bar: 'bg-lime-500',   bg: 'bg-lime-500/10   border-lime-500/30' },
  3: { label: 'Moderate', color: 'text-amber-700 dark:text-amber-400',  bar: 'bg-amber-500',  bg: 'bg-amber-500/10  border-amber-500/30' },
  4: { label: 'High',     color: 'text-orange-700 dark:text-orange-400',bar: 'bg-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
  5: { label: 'Critical', color: 'text-red-700 dark:text-red-400',      bar: 'bg-red-500',    bg: 'bg-red-500/10    border-red-500/30' },
}

function haversineMetres(a, b) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const c = sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))
}

function SeverityBar({ severity }) {
  const cfg = SEV_CONFIG[severity] ?? SEV_CONFIG[3]
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-600 dark:text-zinc-400 font-medium">Severity</span>
        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label} ({severity}/5)</span>
      </div>
      <div className="flex gap-1">
        {[1,2,3,4,5].map((n) => (
          <div key={n} className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${n <= severity ? cfg.bar : 'bg-gray-200 dark:bg-zinc-700'}`} />
        ))}
      </div>
    </div>
  )
}

function ConfidenceMeter({ confidence }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-600 dark:text-zinc-400 font-medium">AI Confidence</span>
        <span className="text-xs font-bold text-gray-800 dark:text-zinc-300">{confidence}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700" style={{ width: `${confidence}%` }} />
      </div>
    </div>
  )
}

function AIThinking() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 animate-fade-in">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
        <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        <div className="absolute inset-3 rounded-full bg-amber-500/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-900 dark:text-white font-semibold">Analysing with AI…</p>
        <p className="text-gray-500 dark:text-zinc-500 text-sm mt-1">Claude Vision is reviewing your photo</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {[{ label: 'Detecting objects', delay: 0 }, { label: 'Classifying damage', delay: 0.4 }, { label: 'Estimating severity', delay: 0.8 }].map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-zinc-400" style={{ animationDelay: `${s.delay}s` }}>
            <svg className="w-4 h-4 text-amber-500 animate-spin-slow flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
            </svg>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Step4AIResult({ report, onNext }) {
  const [loading, setLoading] = useState(true)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)

  // GPS verification
  const locationFlag = (() => {
    if (!report.captureGps || !report.location) return null
    const dist = haversineMetres(report.captureGps, { lat: report.location.lat, lng: report.location.lng })
    if (dist > 1000) return 'location_mismatch'
    return null
  })()

  useEffect(() => {
    async function classify() {
      try {
        const res = await fetch('/api/classify', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueType: report.issueType }),
        })
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        const data = await res.json()
        setResult(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    classify()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sev = result ? SEV_CONFIG[result.severity] ?? SEV_CONFIG[3] : null

  return (
    <div className="flex flex-col min-h-full p-5 gap-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Classification</h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">Our model has analysed your photo and issue details.</p>
      </div>

      {loading && <AIThinking />}

      {error && (
        <div className="card p-4 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p className="font-semibold text-red-700 dark:text-red-300 text-sm">Analysis failed</p>
            <p className="text-red-600 dark:text-red-400 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="flex flex-col gap-4 animate-slide-up">
          {/* Photo thumbnail */}
          <div className="relative rounded-2xl overflow-hidden aspect-video">
            {report.imagePreview ? (
              <img src={report.imagePreview} alt="Report" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-600 text-sm">No image</div>
            )}
            <div className={`absolute bottom-0 inset-x-0 px-3 py-2 flex items-center justify-between ${sev.bg} border-t ${sev.bg}`}>
              <span className="text-gray-900 dark:text-white font-bold text-sm">{result.issueType}</span>
              <span className={`text-xs font-bold ${sev.color} bg-black/40 px-2 py-0.5 rounded-full`}>{sev.label}</span>
            </div>
            {/* Live capture badge */}
            <div className="absolute top-3 left-3 bg-green-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              📸 Live Capture ✓
            </div>
          </div>

          {/* Location Mismatch Flag */}
          {locationFlag === 'location_mismatch' && (
            <div className="card p-4 border-orange-300 dark:border-orange-700/60 bg-orange-50 dark:bg-orange-900/20 flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm">Location Mismatch ⚠️</p>
                <p className="text-orange-700 dark:text-orange-400 text-xs mt-0.5">
                  Your camera GPS is more than 1 km from the selected report location. This report will be flagged for officer review.
                </p>
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="card p-4 flex flex-col gap-4">
            <SeverityBar severity={result.severity} />
            <ConfidenceMeter confidence={result.confidence} />
          </div>

          {/* AI description */}
          <div className="card p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1 font-medium uppercase tracking-wide">AI Assessment</p>
              <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">{result.description}</p>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2.5">
            <button
              className="btn-primary w-full"
              onClick={() => onNext({ classification: result, verificationFlag: locationFlag })}
            >
              Submit Report →
            </button>
            <p className="text-center text-xs text-gray-500 dark:text-zinc-600">
              {locationFlag ? 'Report will be flagged for officer review.' : 'This assessment is AI-generated. Field verification will follow.'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <button className="btn-ghost w-full mt-auto" onClick={() => { setError(null); setLoading(true) }}>
          Retry Analysis
        </button>
      )}
    </div>
  )
}
