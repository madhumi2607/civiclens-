import 'leaflet/dist/leaflet.css'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { dbscan } from '../utils/dbscan'
import { ThemeToggle, useTheme } from '../context/ThemeContext'
import { TEAMS, RESOLUTION_STEPS, SLA_DAYS } from '../data/teams'
import { autoAssign, loadWorkOrders, upsertWorkOrder } from '../utils/autoAssign'
import { initWorkOrders } from '../data/seedWorkOrders'

// ── Constants ────────────────────────────────────────────────────────────────
const CREDENTIALS = { username: 'admin', password: 'civiclens2026' }

const TYPE_COLOR = {
  pothole:     '#ef4444',
  streetlight: '#f59e0b',
  drain:       '#3b82f6',
  manhole:     '#dc2626',
  waste:       '#22c55e',
  flood:       '#6366f1',
  other:       '#9ca3af',
}

const TYPE_ICON = {
  pothole:     '🕳️',
  streetlight: '💡',
  drain:       '🚰',
  manhole:     '⚠️',
  waste:       '🗑️',
  flood:       '🌊',
  other:       '📋',
}

const WO_CLUSTER_COLOR = {
  assigned:    { fill: '#f97316', stroke: '#ea580c' },
  in_progress: { fill: '#eab308', stroke: '#ca8a04' },
  resolved:    { fill: '#22c55e', stroke: '#16a34a' },
  overdue:     { fill: '#ef4444', stroke: '#dc2626' },
  none:        { fill: '#fbbf24', stroke: '#f59e0b' },
}

const STANDARD_TYPES = [
  { value: 'pothole',     label: '🕳️ Pothole' },
  { value: 'streetlight', label: '💡 Broken Streetlight' },
  { value: 'drain',       label: '🚰 Clogged Drain' },
  { value: 'manhole',     label: '⚠️ Open Manhole' },
  { value: 'waste',       label: '🗑️ Solid Waste' },
  { value: 'flood',       label: '🌊 Road Flooding' },
]

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-up pointer-events-none">
      <span className="text-green-400">✓</span>
      {msg}
    </div>
  )
}

// ── Login ────────────────────────────────────────────────────────────────────
function LoginGate({ onLogin }) {
  const [user, setUser]   = useState('')
  const [pass, setPass]   = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (user === CREDENTIALS.username && pass === CREDENTIALS.password) {
      onLogin()
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-700 rounded-lg shadow-md p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-lg bg-slate-900 dark:bg-amber-500 flex items-center justify-center shadow-lg shadow-slate-900/20 dark:shadow-amber-500/20">
            <svg className="w-6 h-6 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.3-6.7-1.4 1.4M6.7 17.3l-1.4 1.4m0-12.7 1.4 1.4m10.6 10.6 1.4 1.4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-50">CivicLens</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Municipal Operations Dashboard</p>
          <ThemeToggle />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Username</label>
            <input type="text" value={user} onChange={(e) => { setUser(e.target.value); setError(false) }}
              placeholder="admin" autoComplete="username"
              className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:border-amber-500 text-gray-900 dark:text-slate-50 rounded-md px-4 py-3 text-sm outline-none transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Password</label>
            <input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError(false) }}
              placeholder="••••••••••••" autoComplete="current-password"
              className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:border-amber-500 text-gray-900 dark:text-slate-50 rounded-md px-4 py-3 text-sm outline-none transition-colors" />
          </div>
          {error && <p className="text-xs text-red-500 flex items-center gap-1.5">Invalid credentials. Try admin / civiclens2026</p>}
          <button type="submit"
            className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-900 font-semibold rounded-md px-6 py-3 text-sm transition-colors mt-1">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Map helpers ───────────────────────────────────────────────────────────────
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16, { duration: 1.2 })
  }, [target, map])
  return null
}

/** Auto-fit map bounds to visible reports. Fires when cityFilter changes. */
function FitBounds({ reports, cityFilter }) {
  const map = useMap()
  useEffect(() => {
    if (!reports.length) return
    const lats = reports.map((r) => r.lat)
    const lngs = reports.map((r) => r.lng)
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [30, 30], maxZoom: 15 }
    )
  }, [cityFilter]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200/70 dark:border-slate-700 rounded-lg p-3 flex flex-col gap-0.5 shadow-sm">
      <span className="text-[11px] text-gray-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
      <span className={`text-xl font-bold ${accent ? 'text-amber-700 dark:text-amber-500' : 'text-gray-800 dark:text-slate-50'}`}>{value}</span>
      {sub && <span className="text-[11px] text-gray-500 dark:text-slate-500">{sub}</span>}
    </div>
  )
}

// ── Area stats panel (F2 — dynamic by city/area) ──────────────────────────────
function AreaPanel({ reports }) {
  // Group by area
  const areas = useMemo(() => {
    const m = {}
    reports.forEach((r) => {
      const key = r.area ?? r.ward ?? 'Unknown'
      if (!m[key]) m[key] = []
      m[key].push(r)
    })
    return m
  }, [reports])

  const areaNames = Object.keys(areas).sort()

  return (
    <div className="flex flex-col gap-3">
      {areaNames.slice(0, 6).map((area) => {
        const wr      = areas[area]
        const open    = wr.filter((r) => r.status !== 'resolved').length
        const weekAgo = new Date(Date.now() - 7 * 86400000)
        const res     = wr.filter((r) => r.status === 'resolved' && new Date(r.reportedAt) >= weekAgo).length
        const total   = wr.length
        const avgRes  = wr.filter((r) => r.status === 'resolved').length
          ? (wr.filter((r) => r.status === 'resolved')
              .reduce((s, r) => s + Math.max(1, (Date.now() - new Date(r.reportedAt)) / 86400000), 0) /
              wr.filter((r) => r.status === 'resolved').length
            ).toFixed(1)
          : '—'
        const sla     = total ? Math.round((wr.filter((r) => r.status === 'resolved').length / total) * 100) : 0
        const critOpen = wr.filter((r) => r.status !== 'resolved' && r.severity >= 4).length
        const highOpen = wr.filter((r) => r.status !== 'resolved' && r.severity === 3).length
        const lowOpen  = wr.filter((r) => r.status !== 'resolved' && r.severity <= 2).length
        const health   = Math.max(0, 100 - critOpen * 15 - highOpen * 8 - lowOpen * 3)
        const healthColor = health >= 70 ? 'text-green-600 dark:text-green-400' : health >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
        const city    = wr[0]?.city ?? ''

        return (
          <div key={area} className="bg-white dark:bg-slate-800 border border-gray-200/70 dark:border-slate-700 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-50">{area}</span>
                {city && <span className="ml-1.5 text-[10px] text-gray-400 dark:text-slate-500">{city}</span>}
              </div>
              <span className={`text-lg font-black ${healthColor}`}>{health}</span>
            </div>
            <div className="text-[10px] text-gray-500 -mt-1 text-right">Health score</div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-2">
                <div className="text-[10px] text-gray-500 dark:text-slate-500">Open</div>
                <div className="text-sm font-bold text-amber-700 dark:text-amber-500">{open}</div>
              </div>
              <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-2">
                <div className="text-[10px] text-gray-500 dark:text-slate-500">Resolved (7d)</div>
                <div className="text-sm font-bold text-green-700 dark:text-green-400">{res}</div>
              </div>
              <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-2">
                <div className="text-[10px] text-gray-500 dark:text-slate-500">Avg Days</div>
                <div className="text-sm font-bold text-gray-900 dark:text-slate-50">{avgRes}</div>
              </div>
              <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-2">
                <div className="text-[10px] text-gray-500 dark:text-slate-500">SLA %</div>
                <div className="text-sm font-bold text-gray-900 dark:text-slate-50">{sla}%</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Countdown helper ──────────────────────────────────────────────────────────
function deadlineLabel(isoDate) {
  const ms = new Date(isoDate) - Date.now()
  if (ms <= 0) return { text: 'Overdue', cls: 'text-red-600 dark:text-red-400' }
  const h = Math.floor(ms / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return { text: `${d}d left`, cls: 'text-orange-600 dark:text-orange-400' }
  return { text: `${h}h left`, cls: 'text-orange-600 dark:text-orange-400' }
}

// ── Action brief card ─────────────────────────────────────────────────────────
function BriefCard({ cluster, workOrder, active, onClick }) {
  const team = workOrder ? TEAMS.find((t) => t.id === workOrder.teamId) : null
  const dl   = workOrder ? deadlineLabel(workOrder.deadline) : null

  const statusDot = workOrder ? {
    assigned:    'bg-orange-400',
    in_progress: 'bg-yellow-400',
    resolved:    'bg-green-500',
    overdue:     'bg-red-500',
  }[workOrder.status] ?? 'bg-gray-400' : null

  // Check if any member has extra confirmations
  const maxConfirmed = Math.max(...cluster.members.map((m) => m.confirmedBy ?? 1))

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        active
          ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500/60 shadow-sm'
          : 'bg-white dark:bg-slate-800 border-gray-200/70 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-base">{TYPE_ICON[cluster.dominantType]}</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-slate-50 capitalize">{cluster.dominantType}</span>
          {cluster.isRootCause && (
            <span className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30 px-1.5 py-0.5 rounded-full font-medium">
              Root Cause
            </span>
          )}
          {maxConfirmed > 1 && (
            <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 px-1.5 py-0.5 rounded-full font-medium">
              {maxConfirmed} confirmed
            </span>
          )}
        </div>
        <span className="text-xs font-black text-amber-700 dark:text-amber-500 flex-shrink-0">
          {cluster.priorityScore}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500 dark:text-slate-500">{cluster.id}</span>
        <span className="text-[11px] text-gray-500 dark:text-slate-400">{cluster.count} · sev {cluster.avgSeverity}</span>
      </div>
      <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-500">
        {cluster.members[0]?.city && cluster.members[0].city !== 'Chennai' ? cluster.members[0].city + ' · ' : ''}
        {cluster.members[0]?.ward} · {cluster.members[0]?.street}
      </div>
      {workOrder && team && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
            <span className="text-[11px] text-gray-600 dark:text-slate-400 font-medium">{team.name}</span>
          </div>
          <span className={`text-[10px] font-semibold ${dl.cls}`}>{dl.text}</span>
        </div>
      )}
      {!workOrder && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <span className="text-[10px] text-gray-400 dark:text-slate-600 italic">Click to auto-assign team →</span>
        </div>
      )}
    </button>
  )
}

// ── Right drawer ──────────────────────────────────────────────────────────────
function ClusterDrawer({ cluster, workOrder, rootCause, rcLoading, onClose, onReassign, onWorkOrderUpdate }) {
  const team = workOrder ? TEAMS.find((t) => t.id === workOrder.teamId) : null
  const [showReassign, setShowReassign] = useState(false)
  const steps = workOrder ? workOrder.steps : (RESOLUTION_STEPS[cluster.dominantType] ?? []).map((l, i) => ({ id: i, label: l, checked: false }))
  const dl    = workOrder ? deadlineLabel(workOrder.deadline) : null

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 flex flex-col bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 shadow-2xl z-[800] overflow-hidden animate-slide-right">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
        <button onClick={onClose} className="p-1 -ml-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <span>{TYPE_ICON[cluster.dominantType]}</span>
            <span className="capitalize">{cluster.dominantType} Cluster</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">{cluster.id}</p>
        </div>
        {workOrder && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            { assigned: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30',
              in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30',
              resolved:    'bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
              overdue:     'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
            }[workOrder.status] ?? ''
          }`}>
            {workOrder.status}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Cluster details */}
        <div className="bg-[#f8f7f4] dark:bg-slate-800 rounded-lg p-3 flex flex-col gap-2 border border-gray-200/60 dark:border-transparent">
          <p className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Cluster Details</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <Row label="Reports"      value={cluster.count} />
            <Row label="Avg Severity" value={`${cluster.avgSeverity}/5`} />
            <Row label="Priority"     value={cluster.priorityScore} />
            <Row label="Area"         value={cluster.members[0]?.area ?? cluster.members[0]?.ward ?? '—'} />
            {cluster.members[0]?.city && (
              <Row label="City" value={cluster.members[0].city} />
            )}
          </div>
          <div className="pt-1">
            <p className="text-[10px] text-gray-500 dark:text-slate-500 mb-1">Reports</p>
            <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto">
              {cluster.members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-[11px] flex-wrap">
                  <span className="font-mono text-amber-700 dark:text-amber-500">{m.id}</span>
                  <span className="text-gray-500 dark:text-slate-500 truncate">{m.street}</span>
                  <span className="text-gray-400 dark:text-slate-600 ml-auto flex-shrink-0">sev {m.severity}</span>
                  {m.reporterName && (
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 flex-shrink-0">
                      {m.reporterName}
                      {m.verificationStatus === 'auto_verified' && ' ✓'}
                    </span>
                  )}
                  {m.verificationFlag === 'location_mismatch' && (
                    <span className="text-[10px] text-orange-500 flex-shrink-0">⚠️</span>
                  )}
                  {(m.confirmedBy ?? 1) > 1 && (
                    <span className="text-[10px] text-blue-500 flex-shrink-0">{m.confirmedBy}✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Root cause */}
        {(rcLoading || rootCause) && (
          <div className="bg-[#f8f7f4] dark:bg-slate-800 rounded-lg p-3 border border-gray-200/60 dark:border-transparent">
            <p className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-2">Root Cause Analysis</p>
            {rcLoading ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M12 2a10 10 0 0110 10" />
                </svg>
                Analysing root cause…
              </p>
            ) : rootCause && (
              <div className="flex flex-col gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border self-start ${
                  rootCause.isRecurring
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30'
                    : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-500/30'
                }`}>
                  {rootCause.isRecurring ? `Recurring (${rootCause.recurringCount}x)` : 'First occurrence'}
                </span>
                <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">{rootCause.hypothesis}</p>
                <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-2">
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Recommended Action</p>
                  <p className="text-xs text-gray-900 dark:text-slate-50 leading-relaxed">{rootCause.recommendedAction}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assigned team */}
        {workOrder && team && (
          <div className="bg-[#f8f7f4] dark:bg-slate-800 rounded-lg p-3 flex flex-col gap-2 border border-gray-200/60 dark:border-transparent">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Assigned Team</p>
              <button onClick={() => setShowReassign((v) => !v)}
                className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline font-medium">
                Reassign
              </button>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{team.fullName}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{team.members.slice(0, 3).join(', ')}{team.members.length > 3 ? '…' : ''}</p>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 dark:text-slate-500">Deadline</span>
                <span className={`text-xs font-semibold ${dl.cls}`}>
                  {new Date(workOrder.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ({dl.text})
                </span>
              </div>
              <div className="flex flex-col ml-4">
                <span className="text-[10px] text-gray-500 dark:text-slate-500">Work Order</span>
                <span className="text-xs font-mono text-gray-700 dark:text-slate-300">{workOrder.id}</span>
              </div>
            </div>
            {showReassign && (
              <div className="mt-1 flex flex-col gap-1">
                {TEAMS.filter((t) => t.id !== team.id && t.specialty.includes(cluster.dominantType)).map((t) => (
                  <button key={t.id}
                    onClick={() => { onReassign(workOrder, t.id); setShowReassign(false) }}
                    className="text-left text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:border-amber-400 text-gray-700 dark:text-slate-300 transition-colors">
                    {t.fullName} — {t.available}/{t.capacity} avail.
                  </button>
                ))}
                {TEAMS.filter((t) => t.id !== team.id && t.specialty.includes(cluster.dominantType)).length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-slate-500">No other teams with matching specialty.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Resolution steps */}
        {steps.length > 0 && (
          <div className="bg-[#f8f7f4] dark:bg-slate-800 rounded-lg p-3 border border-gray-200/60 dark:border-transparent">
            <p className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-2">Resolution Steps</p>
            <div className="flex flex-col gap-1.5">
              {steps.map((step) => (
                <div key={step.id} className="flex items-start gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    step.checked ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-slate-600'
                  }`}>
                    {step.checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs leading-snug ${step.checked ? 'text-green-700 dark:text-green-400 line-through' : 'text-gray-600 dark:text-slate-300'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            {workOrder && (
              <a href={`/field/${workOrder.teamId}`} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-gray-900 dark:bg-amber-500 text-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-amber-400 transition-colors">
                Open Field View for {team?.name} →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-gray-500 dark:text-slate-500">{label}</span>
      <span className="text-[11px] font-semibold text-gray-800 dark:text-slate-200">{value}</span>
    </div>
  )
}

// ── Custom Reports Tab (F1) ───────────────────────────────────────────────────
function CustomReportsTab({ customReports, localOverrides, onCategorize, onAssignDirectly, onDismiss }) {
  const [expandedAction, setExpandedAction] = useState(null)  // reportId → 'categorize'|'assign'|'dismiss'
  const [categorizeType, setCategorizeType] = useState('')
  const [dismissReason,  setDismissReason]  = useState('')

  function handleCategorize(r) {
    if (!categorizeType) return
    onCategorize(r, categorizeType)
    setExpandedAction(null)
    setCategorizeType('')
  }

  function handleDismiss(r) {
    onDismiss(r, dismissReason)
    setExpandedAction(null)
    setDismissReason('')
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
          Custom Reports Queue
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Reports that don't fit standard categories — categorize, assign, or dismiss.
        </p>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-[11px] text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            <th className="text-left pb-3 font-semibold pr-4">ID</th>
            <th className="text-left pb-3 font-semibold pr-4">Title</th>
            <th className="text-left pb-3 font-semibold pr-4">Description</th>
            <th className="text-left pb-3 font-semibold pr-4">City</th>
            <th className="text-left pb-3 font-semibold pr-4">Date</th>
            <th className="text-left pb-3 font-semibold pr-4">Status</th>
            <th className="text-left pb-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customReports.map((r) => {
            const override = localOverrides[r.id]
            const status   = override?.status ?? r.status
            const isDismissed = override?.action === 'dismissed'
            const isCategorized = override?.action === 'categorized'

            return (
              <>
                <tr key={r.id} className={`border-t border-gray-100 dark:border-slate-800 ${
                  isDismissed ? 'opacity-40' : ''
                }`}>
                  <td className="py-2.5 pr-4 font-mono text-xs text-amber-600 dark:text-amber-400 align-top">{r.id}</td>
                  <td className="py-2.5 pr-4 align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">📋</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-slate-50 truncate max-w-[100px]">
                        {r.customTitle ?? r.customType ?? 'Custom Issue'}
                      </span>
                    </div>
                    {isCategorized && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400">→ {override.newType}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 align-top">
                    <span className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 max-w-[140px]">
                      {r.customDescription ?? r.customDesc ?? '—'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-gray-600 dark:text-slate-400 align-top">
                    {r.city ?? r.ward}
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-gray-500 dark:text-slate-400 align-top whitespace-nowrap">
                    {new Date(r.reportedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-2.5 pr-4 align-top">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isDismissed   ? 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600' :
                      isCategorized ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' :
                      status === 'verified' ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30' :
                      'bg-gray-100 text-gray-600 border-gray-300 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                    }`}>
                      {isDismissed ? 'dismissed' : isCategorized ? 'categorized' : status}
                    </span>
                  </td>
                  <td className="py-2.5 align-top">
                    {!isDismissed && !isCategorized && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setExpandedAction(expandedAction === `${r.id}:cat` ? null : `${r.id}:cat`)}
                          className="text-[10px] font-medium px-2 py-1 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
                        >
                          Categorize
                        </button>
                        <button
                          onClick={() => setExpandedAction(expandedAction === `${r.id}:asgn` ? null : `${r.id}:asgn`)}
                          className="text-[10px] font-medium px-2 py-1 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => setExpandedAction(expandedAction === `${r.id}:dis` ? null : `${r.id}:dis`)}
                          className="text-[10px] font-medium px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </td>
                </tr>

                {/* Categorize expand row */}
                {expandedAction === `${r.id}:cat` && (
                  <tr key={`${r.id}-cat`} className="border-t-0">
                    <td colSpan={7} className="pb-3 pt-1 pl-4 pr-4">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                        <span className="text-xs text-gray-600 dark:text-slate-400 flex-shrink-0">Categorize as:</span>
                        <select value={categorizeType} onChange={(e) => setCategorizeType(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-xs rounded px-2 py-1 outline-none text-gray-900 dark:text-slate-50">
                          <option value="">— select type —</option>
                          {STANDARD_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <button onClick={() => handleCategorize(r)} disabled={!categorizeType}
                          className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-white disabled:opacity-40 transition-colors">
                          Confirm
                        </button>
                        <button onClick={() => setExpandedAction(null)}
                          className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-slate-200">✕</button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Assign directly expand row */}
                {expandedAction === `${r.id}:asgn` && (
                  <tr key={`${r.id}-asgn`} className="border-t-0">
                    <td colSpan={7} className="pb-3 pt-1 pl-4 pr-4">
                      <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
                        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">Assign Directly to Team:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {TEAMS.map((t) => (
                            <button key={t.id}
                              onClick={() => { onAssignDirectly(r, t); setExpandedAction(null) }}
                              className="text-[10px] font-medium px-2 py-1 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:border-blue-400 text-gray-700 dark:text-slate-300 transition-colors">
                              {t.name} ({t.available}/{t.capacity})
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setExpandedAction(null)}
                          className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 self-end">Cancel ✕</button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Dismiss expand row */}
                {expandedAction === `${r.id}:dis` && (
                  <tr key={`${r.id}-dis`} className="border-t-0">
                    <td colSpan={7} className="pb-3 pt-1 pl-4 pr-4">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                        <input type="text" placeholder="Reason for dismissal (optional)"
                          value={dismissReason} onChange={(e) => setDismissReason(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-xs rounded px-2 py-1 outline-none text-gray-900 dark:text-slate-50" />
                        <button onClick={() => handleDismiss(r)}
                          className="text-xs font-semibold px-2.5 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                          Dismiss
                        </button>
                        <button onClick={() => setExpandedAction(null)}
                          className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-slate-200">✕</button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
          {customReports.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">No custom reports in queue.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Trust score color ─────────────────────────────────────────────────────────
function trustColor(score) {
  if (score > 80)  return 'text-green-600 dark:text-green-400'
  if (score >= 50) return 'text-blue-600 dark:text-blue-400'
  if (score >= 30) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}
function trustLabel(score) {
  if (score > 80)  return 'Trusted'
  if (score >= 50) return 'Standard'
  if (score >= 30) return 'Under Review'
  return 'Restricted'
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ reports, onNavigate }) {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.ok ? r.json() : { users: [] })
      .then(({ users: u }) => setUsers(u))
      .catch(() => {})
  }, [])

  if (selectedUser) {
    const userReports = reports.filter((r) => r.reportedBy === selectedUser.id)
    return (
      <div className="flex-1 overflow-auto p-4">
        <button onClick={() => setSelectedUser(null)} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Users
        </button>
        <div className="flex items-start gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedUser.name}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">{selectedUser.phone} · {selectedUser.area}</p>
            <span className={`text-sm font-bold ${trustColor(selectedUser.trustScore)}`}>
              Trust {selectedUser.trustScore}/100 · {trustLabel(selectedUser.trustScore)}
            </span>
          </div>
          <div className="ml-auto grid grid-cols-4 gap-2 text-center">
            {[['Reports', selectedUser.reportIds?.length ?? 0, ''], ['Verified', selectedUser.verifiedCount, 'text-blue-600 dark:text-blue-400'], ['Resolved', selectedUser.resolvedCount, 'text-green-600 dark:text-green-400'], ['Rejected', selectedUser.rejectedCount, 'text-red-600 dark:text-red-400']].map(([l,v,c]) => (
              <div key={l} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-2">
                <div className="text-[10px] text-gray-500 dark:text-slate-500">{l}</div>
                <div className={`text-sm font-bold ${c || 'text-gray-800 dark:text-slate-50'}`}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[11px] text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              <th className="text-left pb-2 font-semibold pr-3">ID</th>
              <th className="text-left pb-2 font-semibold pr-3">Type</th>
              <th className="text-left pb-2 font-semibold pr-3">Status</th>
              <th className="text-left pb-2 font-semibold pr-3">Flag</th>
              <th className="text-left pb-2 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {userReports.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 dark:border-slate-800">
                <td className="py-2 pr-3 font-mono text-xs text-amber-600 dark:text-amber-400">{r.id}</td>
                <td className="py-2 pr-3 text-xs text-gray-700 dark:text-slate-300 capitalize">{r.type}</td>
                <td className="py-2 pr-3">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400">
                    {r.status?.replace('_',' ')}
                  </span>
                </td>
                <td className="py-2 pr-3 text-xs">
                  {r.verificationFlag === 'location_mismatch' && <span className="text-orange-600">⚠️ Location</span>}
                  {r.verificationStatus === 'rejected' && <span className="text-red-600 dark:text-red-400">Rejected</span>}
                  {r.verificationStatus === 'auto_verified' && <span className="text-green-600 dark:text-green-400">✓ Auto</span>}
                </td>
                <td className="py-2 text-xs text-gray-500 dark:text-slate-400">
                  {new Date(r.reportedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
              </tr>
            ))}
            {userReports.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">No reports from this user.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">Registered Users</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Click a user to view their reports.</p>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-[11px] text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            <th className="text-left pb-3 font-semibold pr-4">Name</th>
            <th className="text-left pb-3 font-semibold pr-4">Phone</th>
            <th className="text-left pb-3 font-semibold pr-4">Area</th>
            <th className="text-left pb-3 font-semibold pr-4">Trust</th>
            <th className="text-left pb-3 font-semibold pr-4">Tier</th>
            <th className="text-left pb-3 font-semibold pr-4">Reports</th>
            <th className="text-left pb-3 font-semibold pr-4">Verified</th>
            <th className="text-left pb-3 font-semibold">Rejected</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50" onClick={() => setSelectedUser(u)}>
              <td className="py-2.5 pr-4 text-xs font-semibold text-gray-900 dark:text-slate-50">{u.name}</td>
              <td className="py-2.5 pr-4 text-xs font-mono text-gray-600 dark:text-slate-400">{u.phone}</td>
              <td className="py-2.5 pr-4 text-xs text-gray-600 dark:text-slate-400">{u.area}</td>
              <td className={`py-2.5 pr-4 text-xs font-bold ${trustColor(u.trustScore)}`}>{u.trustScore}</td>
              <td className="py-2.5 pr-4">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                  u.tier === 'trusted'    ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-500/30' :
                  u.tier === 'standard'  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30' :
                  u.tier === 'review'    ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-500/30' :
                  'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30'
                }`}>{trustLabel(u.trustScore)}</span>
              </td>
              <td className="py-2.5 pr-4 text-xs text-gray-700 dark:text-slate-300">{u.reportIds?.length ?? 0}</td>
              <td className="py-2.5 pr-4 text-xs text-blue-600 dark:text-blue-400">{u.verifiedCount}</td>
              <td className="py-2.5 text-xs text-red-600 dark:text-red-400">{u.rejectedCount}</td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">No registered users.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Flagged Reports Tab ───────────────────────────────────────────────────────
function FlaggedTab({ reports, onVerify, onReject }) {
  const [rejectingId, setRejectingId] = useState(null)
  const [reason, setReason] = useState('')

  const flagged = reports.filter((r) =>
    r.verificationFlag === 'location_mismatch' ||
    r.verificationStatus === 'pending' ||
    r.verificationStatus === 'under_review' ||
    r.verificationStatus === 'flagged'
  ).filter((r) => r.verificationStatus !== 'verified' && r.verificationStatus !== 'rejected' && r.status !== 'resolved')

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">Flagged & Pending Reports</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Reports requiring officer attention — location mismatches, under-review, and anonymous.
        </p>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-[11px] text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            <th className="text-left pb-3 font-semibold pr-3">ID</th>
            <th className="text-left pb-3 font-semibold pr-3">Reporter</th>
            <th className="text-left pb-3 font-semibold pr-3">Flag</th>
            <th className="text-left pb-3 font-semibold pr-3">Type</th>
            <th className="text-left pb-3 font-semibold pr-3">Date</th>
            <th className="text-left pb-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {flagged.map((r) => (
            <>
              <tr key={r.id} className="border-t border-gray-100 dark:border-slate-800">
                <td className="py-2.5 pr-3 font-mono text-xs text-amber-600 dark:text-amber-400 align-top">{r.id}</td>
                <td className="py-2.5 pr-3 align-top">
                  {r.reporterName ? (
                    <div>
                      <span className="text-xs font-medium text-gray-800 dark:text-slate-200">{r.reporterName}</span>
                      {r.reporterTrust != null && (
                        <span className={`ml-1 text-[10px] font-bold ${trustColor(r.reporterTrust)}`}>
                          · {r.reporterTrust}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-slate-500 italic">Anonymous</span>
                  )}
                </td>
                <td className="py-2.5 pr-3 align-top">
                  {r.verificationFlag === 'location_mismatch' && (
                    <span className="text-[10px] bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30 px-1.5 py-0.5 rounded-full font-medium">
                      ⚠️ Location Mismatch
                    </span>
                  )}
                  {r.verificationStatus === 'under_review' && (
                    <span className="text-[10px] bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-500/30 px-1.5 py-0.5 rounded-full font-medium">
                      ⏳ Under Review
                    </span>
                  )}
                  {r.verificationStatus === 'pending' && !r.verificationFlag && (
                    <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-600 px-1.5 py-0.5 rounded-full font-medium">
                      Pending
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-xs text-gray-600 dark:text-slate-400 capitalize align-top">{r.type}</td>
                <td className="py-2.5 pr-3 text-xs text-gray-500 dark:text-slate-400 align-top whitespace-nowrap">
                  {new Date(r.reportedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="py-2.5 align-top">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onVerify(r)}
                      className="text-[10px] font-medium px-2 py-1 rounded bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors">
                      Verify ✓
                    </button>
                    <button
                      onClick={() => { setRejectingId(rejectingId === r.id ? null : r.id); setReason('') }}
                      className="text-[10px] font-medium px-2 py-1 rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors">
                      Reject ✕
                    </button>
                  </div>
                </td>
              </tr>
              {rejectingId === r.id && (
                <tr key={`${r.id}-rej`}>
                  <td colSpan={6} className="pb-3 pt-1 pl-2 pr-4">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                      <input type="text" placeholder="Rejection reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-xs rounded px-2 py-1 outline-none text-gray-900 dark:text-slate-50" />
                      <button onClick={() => { onReject(r, reason); setRejectingId(null); setReason('') }}
                        className="text-xs font-semibold px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white transition-colors">
                        Confirm Reject
                      </button>
                      <button onClick={() => setRejectingId(null)} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-slate-200">✕</button>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
          {flagged.length === 0 && (
            <tr><td colSpan={6} className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">No flagged reports. All clear!</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Work Orders tab ───────────────────────────────────────────────────────────
function WorkOrdersTab({ workOrders }) {
  const sorted  = [...workOrders].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

  const ROW_COLOR = {
    assigned:    'bg-orange-50 dark:bg-orange-900/10',
    in_progress: 'bg-yellow-50 dark:bg-yellow-900/10',
    resolved:    'bg-green-50 dark:bg-green-900/10',
    overdue:     'bg-red-50 dark:bg-red-900/10',
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-[11px] text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            <th className="text-left pb-3 font-semibold pr-4">WO-ID</th>
            <th className="text-left pb-3 font-semibold pr-4">Cluster</th>
            <th className="text-left pb-3 font-semibold pr-4">Assigned Team</th>
            <th className="text-left pb-3 font-semibold pr-4">Deadline</th>
            <th className="text-left pb-3 font-semibold pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((wo) => {
            const team = TEAMS.find((t) => t.id === wo.teamId)
            const dl   = deadlineLabel(wo.deadline)

            return (
              <tr key={wo.id} className={`border-t border-gray-100 dark:border-slate-800 ${ROW_COLOR[wo.status] ?? ''}`}>
                <td className="py-2.5 pr-4 font-mono text-xs text-gray-700 dark:text-slate-300 align-middle">{wo.id}</td>
                <td className="py-2.5 pr-4 align-middle">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{TYPE_ICON[wo.clusterType]}</span>
                    <span className="text-xs text-gray-700 dark:text-slate-300 capitalize">{wo.clusterType}</span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate max-w-[80px]">{wo.address}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-xs text-gray-700 dark:text-slate-300 align-middle">{team?.name ?? '—'}</td>
                <td className={`py-2.5 pr-4 text-xs font-medium align-middle ${dl.cls}`}>
                  {new Date(wo.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="py-2.5 pr-4 align-middle">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    { assigned:    'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30',
                      in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30',
                      resolved:    'bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
                      overdue:     'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
                    }[wo.status] ?? ''
                  }`}>
                    {wo.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            )
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">No work orders yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
function DashboardView({ onLogout }) {
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [activeTab,    setActiveTab]    = useState('overview')
  const [cityFilter,   setCityFilter]   = useState('All Cities')
  const [typeFilter,   setTypeFilter]   = useState('All Types')
  const [flyTarget,    setFlyTarget]    = useState(null)
  const [activeClusterId, setActiveClusterId] = useState(null)
  const [rootCause,    setRootCause]    = useState(null)
  const [rcLoading,    setRcLoading]    = useState(false)
  const [reports,      setReports]      = useState([])
  const [workOrders,   setWorkOrders]   = useState(() => initWorkOrders())
  const [toast,        setToast]        = useState(null)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  // F1: custom report override actions (categorize / dismiss / assign)
  const [localOverrides, setLocalOverrides] = useState({})

  // Poll server reports every 30 s — single source of truth
  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/reports')
        if (res.ok) {
          const json = await res.json()
          setReports(json.data ?? [])
        }
      } catch { /* silently ignore — stale data persists */ }
    }
    fetchReports()
    const id = setInterval(fetchReports, 30000)
    return () => clearInterval(id)
  }, [])

  // Re-sync workOrders from localStorage when another tab writes
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'civiclens_work_orders') setWorkOrders(loadWorkOrders())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const tileUrl = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

  // ── City list derived from data (F2) ─────────────────────────────────────
  const cityOptions = useMemo(() => {
    const m = {}
    reports.forEach((r) => {
      const c = r.city ?? 'Chennai'
      m[c] = (m[c] ?? 0) + 1
    })
    return [
      { label: `All Cities (${reports.length})`, value: 'All Cities' },
      ...Object.entries(m)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([city, count]) => ({ label: `${city} (${count})`, value: city })),
    ]
  }, [reports])

  const TYPES = ['All Types', 'pothole', 'streetlight', 'drain', 'manhole', 'waste', 'flood', 'other']

  // ── Apply local overrides to reports ────────────────────────────────────
  const effectiveReports = useMemo(() => {
    return reports.map((r) => {
      const ov = localOverrides[r.id]
      if (!ov) return r
      if (ov.action === 'categorized') return { ...r, type: ov.newType, originalCustomType: r.customType }
      if (ov.action === 'dismissed')   return { ...r, status: 'resolved' }
      return r
    })
  }, [reports, localOverrides])

  const filtered = useMemo(() => {
    return effectiveReports.filter((r) => {
      if (cityFilter !== 'All Cities' && (r.city ?? 'Chennai') !== cityFilter) return false
      if (typeFilter !== 'All Types' && r.type !== typeFilter) return false
      return true
    })
  }, [effectiveReports, cityFilter, typeFilter])

  const clusters = useMemo(() => {
    const active = filtered.filter((r) => r.status !== 'resolved' && r.type !== 'other')
    return dbscan(active, 500, 3)
  }, [filtered])

  const customReports = useMemo(() => {
    return reports.filter((r) => r.type === 'other' && r.status !== 'resolved')
  }, [reports])

  const woByCluster = useMemo(() => {
    const m = {}
    for (const wo of workOrders) m[wo.clusterId] = wo
    return m
  }, [workOrders])

  const activeCluster = clusters.find((c) => c.id === activeClusterId) ?? null

  async function selectCluster(cluster) {
    setActiveClusterId(cluster.id)
    setFlyTarget({ lat: cluster.centLat, lng: cluster.centLng })
    setDrawerOpen(true)
    setRootCause(null)
    setRcLoading(true)

    if (!woByCluster[cluster.id]) {
      const wo = autoAssign(cluster)
      upsertWorkOrder(wo)
      setWorkOrders(loadWorkOrders())
      const team = TEAMS.find((t) => t.id === wo.teamId)
      const dl   = new Date(wo.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      setToast(`Auto-assigned to ${team?.name ?? wo.teamId} · Deadline ${dl}`)
    }

    try {
      const res = await fetch('/api/root-cause', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ clusterId: cluster.id }),
      })
      if (res.ok) setRootCause(await res.json())
    } catch { /* silently ignore */ }
    finally { setRcLoading(false) }
  }

  function handleReassign(wo, newTeamId) {
    const updated = { ...wo, teamId: newTeamId }
    upsertWorkOrder(updated)
    setWorkOrders(loadWorkOrders())
    const team = TEAMS.find((t) => t.id === newTeamId)
    setToast(`Reassigned to ${team?.name ?? newTeamId}`)
  }

  function handleWoUpdate(updated) {
    upsertWorkOrder(updated)
    setWorkOrders(loadWorkOrders())
  }

  // F1: Custom report actions
  function handleCategorize(report, newType) {
    setLocalOverrides((prev) => ({
      ...prev,
      [report.id]: { action: 'categorized', newType, status: 'assigned' },
    }))
    setToast(`${report.id} categorized as ${newType}`)
  }

  function handleAssignDirectly(report, team) {
    // Create a pseudo work order for a single-report cluster
    const pseudoCluster = {
      id:          `CUSTOM-${report.id}`,
      dominantType: report.customType?.toLowerCase().includes('light') ? 'streetlight' : 'other',
      members:      [report],
      centLat:      report.lat,
      centLng:      report.lng,
      count:        1,
      avgSeverity:  report.severity,
      priorityScore: report.severity * 20,
    }
    const sla = 7
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + sla)
    const wo = {
      id:          `WO-CUST-${report.id}`,
      clusterId:   pseudoCluster.id,
      clusterType: 'other',
      teamId:      team.id,
      assignedAt:  new Date().toISOString(),
      deadline:    deadline.toISOString(),
      status:      'assigned',
      steps:       [],
      resolvedAt:  null,
      address:     report.street ?? '',
      ward:        report.ward ?? '',
      city:        report.city ?? '',
      lat:         report.lat,
      lng:         report.lng,
      count:       1,
      avgSeverity: report.severity,
      priorityScore: report.severity * 20,
    }
    upsertWorkOrder(wo)
    setWorkOrders(loadWorkOrders())
    setLocalOverrides((prev) => ({ ...prev, [report.id]: { action: 'assigned', teamId: team.id } }))
    setToast(`${report.id} assigned to ${team.name}`)
  }

  function handleDismiss(report, reason) {
    setLocalOverrides((prev) => ({
      ...prev,
      [report.id]: { action: 'dismissed', reason },
    }))
    setToast(`${report.id} dismissed${reason ? `: ${reason}` : ''}`)
  }

  async function handleVerifyReport(report) {
    try {
      const res = await fetch(`/api/reports/${report.id}/verify`, { method: 'PATCH' })
      if (res.ok) {
        setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, verificationStatus: 'verified', status: r.status === 'under_review' ? 'reported' : r.status } : r))
        setToast(`${report.id} verified ✓`)
      }
    } catch { setToast(`Failed to verify ${report.id}`) }
  }

  async function handleRejectReport(report, reason) {
    try {
      const res = await fetch(`/api/reports/${report.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'Rejected by officer' }),
      })
      if (res.ok) {
        setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, verificationStatus: 'rejected', status: 'rejected', rejectionReason: reason } : r))
        setToast(`${report.id} rejected`)
      }
    } catch { setToast(`Failed to reject ${report.id}`) }
  }

  const open     = filtered.filter((r) => r.status !== 'resolved').length
  const resolved = filtered.filter((r) => r.status === 'resolved').length
  const critical = filtered.filter((r) => r.severity >= 4 && r.status !== 'resolved').length

  function clusterColor(cluster) {
    const wo = woByCluster[cluster.id]
    return WO_CLUSTER_COLOR[wo?.status ?? 'none']
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8f7f4] dark:bg-slate-950 text-gray-800 dark:text-slate-50 overflow-hidden">
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-white/80 dark:bg-slate-900 backdrop-blur-sm border-b border-gray-200/70 dark:border-slate-700 flex-shrink-0">
        <div className="w-7 h-7 rounded-md bg-slate-900 dark:bg-amber-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
          </svg>
        </div>
        <span className="font-bold font-serif text-gray-900 dark:text-slate-50">CivicLens</span>

        {/* Tabs */}
        <div className="flex items-center gap-0 ml-2">
          {[['overview', 'Overview'], ['workorders', 'Work Orders'], ['custom', 'Custom Reports'], ['flagged', 'Flagged'], ['users', 'Users']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`text-xs font-semibold px-3 py-1.5 border-b-2 transition-all ${
                activeTab === id
                  ? 'border-amber-500 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}>
              {label}
              {id === 'workorders' && workOrders.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-amber-500 text-white rounded-full px-1.5">{workOrders.length}</span>
              )}
              {id === 'custom' && customReports.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-gray-500 text-white rounded-full px-1.5">{customReports.length}</span>
              )}
              {id === 'flagged' && (() => {
                const cnt = reports.filter((r) => r.verificationFlag === 'location_mismatch' || r.verificationStatus === 'under_review' || r.verificationStatus === 'flagged').filter((r) => r.verificationStatus !== 'verified' && r.verificationStatus !== 'rejected' && r.status !== 'resolved').length
                return cnt > 0 ? <span className="ml-1.5 text-[10px] bg-orange-500 text-white rounded-full px-1.5">{cnt}</span> : null
              })()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* F2: Dynamic city filter */}
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-50 text-xs rounded-md px-2.5 py-1.5 outline-none">
            {cityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-50 text-xs rounded-md px-2.5 py-1.5 outline-none capitalize">
            {TYPES.map((t) => <option key={t} className="capitalize">{t}</option>)}
          </select>
          <button onClick={() => navigate('/analytics')}
            className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-slate-50 border border-gray-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 transition-colors">
            Analytics
          </button>
          <ThemeToggle />
          <button onClick={onLogout}
            className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-slate-50 border border-gray-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 transition-colors ml-1">
            Sign out
          </button>
        </div>
      </header>

      {/* ── Work Orders Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'workorders' && (
        <WorkOrdersTab workOrders={workOrders} />
      )}

      {/* ── Custom Reports Tab (F1) ────────────────────────────────────────────── */}
      {activeTab === 'custom' && (
        <CustomReportsTab
          customReports={customReports}
          localOverrides={localOverrides}
          onCategorize={handleCategorize}
          onAssignDirectly={handleAssignDirectly}
          onDismiss={handleDismiss}
        />
      )}

      {/* ── Flagged Reports Tab ──────────────────────────────────────────────── */}
      {activeTab === 'flagged' && (
        <FlaggedTab reports={reports} onVerify={handleVerifyReport} onReject={handleRejectReport} />
      )}

      {/* ── Users Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <UsersTab reports={reports} />
      )}

      {/* ── Overview Tab body ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="flex flex-1 overflow-hidden relative">

          {/* ── Left sidebar — Action briefs ──────────────────────────────────── */}
          <aside className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200/70 dark:border-slate-700 overflow-hidden bg-[#f1f0ec] dark:bg-transparent">
            <div className="px-3 py-2.5 border-b border-gray-200/70 dark:border-slate-700 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Action Briefs</p>
              <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">{clusters.length} clusters · sorted by priority</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
              {clusters.length === 0 && customReports.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center mt-8">No clusters with current filters.</p>
              )}
              {clusters.map((c) => (
                <BriefCard key={c.id} cluster={c} workOrder={woByCluster[c.id] ?? null}
                  active={activeClusterId === c.id} onClick={() => selectCluster(c)} />
              ))}

              {customReports.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-1 pt-2">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wide font-medium">Custom Reports</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                  </div>
                  {customReports.map((r) => (
                    <button key={r.id} onClick={() => setFlyTarget({ lat: r.lat, lng: r.lng })}
                      className="w-full text-left p-3 rounded-lg border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 transition-all shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">📋</span>
                          <span className="text-xs font-semibold text-gray-900 dark:text-slate-50 truncate max-w-[140px]">
                            {r.customTitle ?? r.customType ?? 'Custom Issue'}
                          </span>
                        </div>
                        <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                          Custom
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-500 font-mono">{r.id}</div>
                      {(r.customDescription ?? r.customDesc) && (
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {r.customDescription ?? r.customDesc}
                        </div>
                      )}
                      <div className="text-[11px] text-gray-500 dark:text-slate-500 mt-1">
                        {r.city} · {r.ward} · Sev {r.severity}/5
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </aside>

          {/* ── Centre — Map ──────────────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            {/* Summary stats strip */}
            <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-200/70 dark:border-slate-700 bg-white dark:bg-slate-950 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-gray-600 dark:text-slate-400">Open:</span>
                <span className="font-bold text-gray-800 dark:text-slate-50">{open}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-gray-600 dark:text-slate-400">Resolved:</span>
                <span className="font-bold text-gray-800 dark:text-slate-50">{resolved}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-gray-600 dark:text-slate-400">Critical:</span>
                <span className="font-bold text-gray-800 dark:text-slate-50">{critical}</span>
              </div>
              <div className="flex items-center gap-2 ml-auto flex-wrap gap-y-1">
                {[['orange', '#f97316', 'assigned'], ['yellow', '#eab308', 'in progress'], ['green', '#22c55e', 'resolved'], ['red', '#ef4444', 'overdue']].map(([, color, label]) => (
                  <span key={label} className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Map — F2: starts at world center, FitBounds adjusts it */}
            <div className="flex-1 relative" style={{ minHeight: 0 }}>
              <MapContainer center={[20, 78]} zoom={5} className="h-full w-full">
                <TileLayer url={tileUrl} attribution={dark ? '&copy; CartoDB &copy; OpenStreetMap' : '&copy; OpenStreetMap contributors'} />
                {/* F2: Auto-fit to all filtered reports */}
                <FitBounds reports={filtered} cityFilter={cityFilter} />
                {flyTarget && <FlyTo target={flyTarget} />}

                {filtered.map((r) => (
                  <CircleMarker key={r.id} center={[r.lat, r.lng]}
                    radius={r.status === 'resolved' ? 4 : 6 + r.severity}
                    pathOptions={{
                      fillColor: TYPE_COLOR[r.type] ?? '#9ca3af',
                      fillOpacity: r.status === 'resolved' ? 0.3 : 0.85,
                      color: '#000',
                      weight: 1,
                    }}>
                    <Popup>
                      <div className="text-xs font-mono text-amber-600">{r.id}</div>
                      <div className="font-semibold text-sm capitalize">
                        {r.type === 'other' ? (r.customTitle ?? r.customType ?? 'Custom Issue') : r.type}
                      </div>
                      {(r.customDescription ?? r.customDesc) && (
                        <div className="text-xs text-slate-500 mt-0.5 max-w-[180px]">
                          {r.customDescription ?? r.customDesc}
                        </div>
                      )}
                      <div className="text-xs text-slate-500">{r.street} · {r.area ?? r.ward}</div>
                      {r.city && <div className="text-xs text-slate-400">{r.city}</div>}
                      <div className="text-xs mt-0.5">Severity {r.severity}/5 · {r.status}</div>
                      {r.reporterName && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {r.reporterName}{r.reporterTrust != null ? ` · Trust ${r.reporterTrust}` : ''}
                          {r.verificationStatus === 'auto_verified' && ' ✓'}
                        </div>
                      )}
                      {!r.reporterName && <div className="text-xs text-slate-400 mt-0.5 italic">Anonymous</div>}
                      {r.verificationFlag === 'location_mismatch' && (
                        <div className="text-xs text-orange-500 font-semibold mt-0.5">⚠️ Location Mismatch</div>
                      )}
                      {(r.confirmedBy ?? 1) > 1 && (
                        <div className="text-xs text-blue-500 font-semibold mt-0.5">{r.confirmedBy} citizens confirmed</div>
                      )}
                    </Popup>
                  </CircleMarker>
                ))}

                {/* Cluster centroids */}
                {clusters.map((c) => {
                  const cc = clusterColor(c)
                  return (
                    <CircleMarker key={c.id} center={[c.centLat, c.centLng]} radius={14}
                      pathOptions={{
                        fillColor: cc.fill,
                        fillOpacity: activeClusterId === c.id ? 0.5 : 0.3,
                        color: cc.stroke,
                        weight: activeClusterId === c.id ? 3 : 2,
                        dashArray: '4 3',
                      }}
                      eventHandlers={{ click: () => selectCluster(c) }}>
                      <Popup>
                        <div className="font-semibold text-sm">{c.id}</div>
                        <div className="text-xs">{c.count} reports · {c.dominantType}</div>
                        <div className="text-xs text-amber-600">Priority: {c.priorityScore}</div>
                        {c.isRootCause && <div className="text-xs text-red-400 font-semibold">⚠ Root Cause</div>}
                      </Popup>
                    </CircleMarker>
                  )
                })}
              </MapContainer>

              {/* Right drawer */}
              {drawerOpen && activeCluster && (
                <ClusterDrawer
                  cluster={activeCluster}
                  workOrder={woByCluster[activeCluster.id] ?? null}
                  rootCause={rootCause}
                  rcLoading={rcLoading}
                  onClose={() => setDrawerOpen(false)}
                  onReassign={handleReassign}
                  onWorkOrderUpdate={handleWoUpdate}
                />
              )}
            </div>
          </main>

          {/* ── Right panel — Area stats (F2 — dynamic) ──────────────────────── */}
          {!drawerOpen && (
            <aside className="w-72 flex-shrink-0 flex flex-col border-l border-gray-200/70 dark:border-slate-700 overflow-hidden bg-[#f1f0ec] dark:bg-transparent">
              <div className="px-3 py-2.5 border-b border-gray-200/70 dark:border-slate-700 flex-shrink-0">
                <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Area Stats</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="Total Open"    value={open}     accent />
                  <StatCard label="Total Reports" value={filtered.length} />
                  <StatCard label="Critical"      value={critical} accent />
                  <StatCard label="Clusters"      value={clusters.length} />
                </div>
                <div className="border-t border-gray-200/70 dark:border-slate-700 pt-3">
                  <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-2">Per Area</p>
                  <AreaPanel reports={filtered} />
                </div>
                <div className="border-t border-gray-200/70 dark:border-slate-700 pt-3">
                  <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-2">By Type (open)</p>
                  <div className="flex flex-col gap-1.5">
                    {Object.keys(TYPE_COLOR).map((type) => {
                      const count = filtered.filter((r) => r.type === type && r.status !== 'resolved').length
                      const max   = Math.max(...Object.keys(TYPE_COLOR).map((t) =>
                        filtered.filter((r) => r.type === t && r.status !== 'resolved').length
                      ), 1)
                      return (
                        <div key={type} className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 dark:text-slate-400 w-20 capitalize flex-shrink-0">{type}</span>
                          <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(count / max) * 100}%`, background: TYPE_COLOR[type] }} />
                          </div>
                          <span className="text-[11px] text-gray-500 dark:text-slate-500 w-4 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  if (!loggedIn) return <LoginGate onLogin={() => setLoggedIn(true)} />
  return <DashboardView onLogout={() => setLoggedIn(false)} />
}
