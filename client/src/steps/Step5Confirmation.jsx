import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function pad4(n) {
  return String(n).padStart(4, '0')
}

function generateTrackingId(isCustom) {
  const num = pad4(Math.floor(Math.random() * 9000) + 1000)
  return isCustom ? `CL-M-${num}` : `CL-${num}`
}

const SEV_LABEL = { 1: 'Low', 2: 'Minor', 3: 'Moderate', 4: 'High', 5: 'Critical' }

// ── Haversine distance in metres ──────────────────────────────────────────────
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

function timeAgo(isoString) {
  const ms = Date.now() - new Date(isoString).getTime()
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(ms / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(ms / 86400000)}d ago`
}

// Map standard issue type names to internal type keys
const ISSUE_TYPE_MAP = {
  'Pothole': 'pothole',
  'Broken Streetlight': 'streetlight',
  'Clogged Drain': 'drain',
  'Open Manhole': 'manhole',
  'Solid Waste': 'waste',
  'Road Flooding': 'flood',
  'Other / Custom Issue': 'other',
}

// ── Duplicate Check Modal ─────────────────────────────────────────────────────
function DuplicateModal({ duplicates, trackingId, onLink, onSubmitNew }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xl">🔍</span>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Similar issue already reported</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Found {duplicates.length} open report{duplicates.length > 1 ? 's' : ''} within 50m:
          </p>
        </div>

        {/* Duplicate list */}
        <div className="px-5 py-3 flex flex-col gap-2 max-h-48 overflow-y-auto">
          {duplicates.map((r) => (
            <div key={r.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{r.id}</span>
                  <span className="text-xs text-gray-600 dark:text-slate-300 capitalize">
                    {r.isCustom ? (r.customTitle ?? r.customType ?? 'Custom') : r.type}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  {r.street} · {timeAgo(r.reportedAt)}
                </p>
                {r.confirmedBy > 1 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">{r.confirmedBy} citizens confirmed</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-5 pt-3 flex flex-col gap-2.5">
          <button
            onClick={() => onLink(duplicates[0])}
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-900 font-semibold rounded-lg px-4 py-3 text-sm transition-colors"
          >
            Link to existing · Get ID {duplicates[0].id}
          </button>
          <button
            onClick={onSubmitNew}
            className="w-full border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            Submit as new anyway
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Step5Confirmation({ report }) {
  const navigate = useNavigate()
  const [trackingId] = useState(() => generateTrackingId(report.skipAI))

  // ── Duplicate detection state ─────────────────────────────────────────────
  const [dupChecked,    setDupChecked]    = useState(false)
  const [duplicates,    setDuplicates]    = useState([])
  const [showDupModal,  setShowDupModal]  = useState(false)
  const [linkedReport,  setLinkedReport]  = useState(null)  // if user chose "Link"
  const [submitting,    setSubmitting]    = useState(false)

  // ── Check duplicates on mount (fetch live reports from server) ───────────
  useEffect(() => {
    if (!report.location) { setDupChecked(true); return }

    const userLat  = report.location.lat
    const userLng  = report.location.lng
    const userType = ISSUE_TYPE_MAP[report.issueType] ?? report.issueType

    fetch('/api/reports')
      .then((r) => r.ok ? r.json() : { data: [] })
      .catch(() => ({ data: [] }))
      .then(({ data = [] }) => {
        const nearby = data.filter((r) => {
          if (r.status === 'resolved') return false
          if (!r.lat || !r.lng) return false
          const dist = haversineMetres({ lat: userLat, lng: userLng }, { lat: r.lat, lng: r.lng })
          if (dist > 50) return false
          if (report.skipAI) return true
          return r.type === userType
        })
        setDuplicates(nearby)
        if (nearby.length > 0) setShowDupModal(true)
        setDupChecked(true)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist to localStorage + POST to server once duplicate check resolves ─
  useEffect(() => {
    if (!dupChecked) return
    if (showDupModal) return  // wait for user decision
    if (linkedReport) return  // already handled

    const now = new Date().toISOString()

    // localStorage (for TrackReport offline fallback)
    const stored = JSON.parse(localStorage.getItem('civiclens_reports') ?? '[]')
    stored.unshift({
      trackingId,
      issueType:   report.issueType,
      customType:  report.customType ?? null,
      customDesc:  report.customDesc ?? null,
      severity:    report.classification?.severity,
      description: report.classification?.description,
      location:    report.location,
      address:     report.address,
      city:        report.city ?? report.location?.city ?? null,
      area:        report.area ?? report.location?.area ?? null,
      ts:          now,
    })
    localStorage.setItem('civiclens_reports', JSON.stringify(stored.slice(0, 20)))

    // POST to server so dashboard picks it up on next poll
    const userType = ISSUE_TYPE_MAP[report.issueType] ?? 'other'
    fetch('/api/reports', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:                 trackingId,
        type:               userType,
        isCustom:           !!report.skipAI,
        customTitle:        report.customType ?? null,
        customDescription:  report.customDesc ?? null,
        severity:           report.classification?.severity ?? 3,
        lat:                report.location?.lat,
        lng:                report.location?.lng,
        ward:               report.area ?? report.location?.area ?? report.city ?? 'Unknown',
        street:             report.address ?? '',
        city:               report.city ?? report.location?.city ?? 'Chennai',
        area:               report.area ?? report.location?.area ?? null,
        status:             'reported',
        reportedAt:         now,
        confirmedBy:        1,
        beforePhotoData:    report.imagePreview ?? null,
      }),
    }).catch(() => { /* server offline — localStorage already saved */ })
  }, [dupChecked, showDupModal]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle duplicate modal choices ────────────────────────────────────────
  function handleLink(existingReport) {
    // Increment confirmedBy on server (best-effort)
    fetch(`/api/reports/${existingReport.id}/confirm`, { method: 'PATCH' })
      .catch(() => {})

    // Also persist override locally for offline resilience
    const key = 'civiclens_confirmed_by'
    const overrides = JSON.parse(localStorage.getItem(key) ?? '{}')
    overrides[existingReport.id] = (overrides[existingReport.id] ?? (existingReport.confirmedBy ?? 1)) + 1
    localStorage.setItem(key, JSON.stringify(overrides))

    setLinkedReport(existingReport)
    setShowDupModal(false)
  }

  function handleSubmitNew() {
    setShowDupModal(false)
    // The useEffect above will now fire and save to localStorage
    setSubmitting(true)
  }

  // If user linked → show linked confirmation
  if (linkedReport) {
    return (
      <div className="flex flex-col min-h-full p-5 gap-5 animate-slide-up">
        <div className="flex flex-col items-center pt-4 pb-2 gap-3">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
            <span className="text-3xl">🔗</span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Linked to Existing Report</h2>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
              Your confirmation has been added. Use the existing tracking ID below.
            </p>
          </div>
        </div>
        <div className="card p-5 flex flex-col items-center gap-2 border-blue-400/50 bg-gradient-to-b from-blue-50 dark:from-blue-500/10 to-transparent shadow-md">
          <p className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-widest font-medium">Tracking ID</p>
          <p className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-widest">{linkedReport.id}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500">+1 citizen confirmation added to this report</p>
        </div>
        <div className="flex flex-col gap-3 mt-auto pb-2">
          <button className="btn-primary w-full" onClick={() => navigate(`/track/${linkedReport.id}`)}>
            Track This Report
          </button>
          <button className="btn-ghost w-full" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    )
  }

  // Show loading while waiting for duplicate check + user decision
  if (!dupChecked || showDupModal) {
    return (
      <>
        {/* Show duplicate modal on top of a blurred placeholder */}
        <div className="flex flex-col min-h-full p-5 gap-5 opacity-30 pointer-events-none">
          <div className="flex flex-col items-center pt-4 pb-2 gap-3">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
            <div className="w-40 h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
        {showDupModal && (
          <DuplicateModal
            duplicates={duplicates}
            trackingId={trackingId}
            onLink={handleLink}
            onSubmitNew={handleSubmitNew}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col min-h-full p-5 gap-5 animate-slide-up">
      {/* Success icon */}
      <div className="flex flex-col items-center pt-4 pb-2 gap-3">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report Submitted!</h2>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
            Your issue has been logged and will be routed to the ward office.
          </p>
        </div>
      </div>

      {/* Tracking ID card */}
      <div className="card p-5 flex flex-col items-center gap-2 border-amber-400/50 bg-gradient-to-b from-amber-50 dark:from-amber-500/10 to-transparent shadow-md">
        <p className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-widest font-medium">Tracking ID</p>
        <p className="text-4xl font-black text-amber-600 dark:text-amber-500 tracking-widest">{trackingId}</p>
        <p className="text-xs text-gray-500 dark:text-zinc-500">Save this ID to check your report status</p>
      </div>

      {/* Report summary */}
      <div className="card p-4 flex flex-col gap-3">
        <p className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wide font-medium">Report Summary</p>

        <Row label="Issue Type"  value={report.issueType} />
        {report.customType && (
          <Row label="Custom Category" value={report.customType} />
        )}
        {report.customDesc && (
          <Row label="Description" value={report.customDesc} truncate />
        )}
        {report.classification && (
          <Row
            label="Severity"
            value={`${SEV_LABEL[report.classification.severity] ?? '—'} (${report.classification.severity}/5)`}
          />
        )}
        {report.classification && (
          <Row label="AI Confidence" value={`${report.classification.confidence}%`} />
        )}
        {report.skipAI && (
          <Row label="Review" value="Field officer within 48 hrs" />
        )}
        {report.address && (
          <Row label="Location" value={report.address} truncate />
        )}
        {report.location && !report.address && (
          <Row
            label="Coordinates"
            value={`${report.location.lat.toFixed(5)}, ${report.location.lng.toFixed(5)}`}
          />
        )}
        <Row label="Submitted" value={new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} />
      </div>

      {/* What happens next */}
      <div className="card p-4 flex flex-col gap-2.5">
        <p className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wide font-medium">What happens next</p>
        {[
          'Field officer verifies the issue within 24 hrs',
          'Assigned to the relevant ward maintenance team',
          'You\'ll be notified when work begins',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-zinc-400">
            <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-500 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            {step}
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 mt-auto pb-2">
        <button
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={() => navigate(`/track/${trackingId}`)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          Track This Report
        </button>
        <button
          className="btn-ghost w-full"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, truncate }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-500 dark:text-zinc-500 flex-shrink-0">{label}</span>
      <span className={`text-xs text-gray-800 dark:text-zinc-200 text-right font-medium ${truncate ? 'truncate max-w-[180px]' : ''}`}>
        {value}
      </span>
    </div>
  )
}
