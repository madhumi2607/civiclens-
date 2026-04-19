import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'

const TIMELINE_STEPS = [
  { step: 1, label: 'Reported',    icon: '📋', detail: 'Your report has been received and logged in our system.' },
  { step: 2, label: 'Verified',    icon: '🔍', detail: 'A field officer has verified the issue on-site.' },
  { step: 3, label: 'Assigned',    icon: '👷', detail: 'Assigned to the Roads & Infrastructure ward team.' },
  { step: 4, label: 'In Progress', icon: '🔧', detail: 'Repair crew is on-site. Work is underway.' },
  { step: 5, label: 'Resolved',    icon: '✅', detail: 'Issue has been resolved. Thank you for reporting!' },
]

// Custom report timeline
const CUSTOM_TIMELINE_STEPS = [
  { step: 1, label: 'Reported',              icon: '📋', detail: 'Your custom report has been received and logged.' },
  { step: 2, label: 'Under Review',          icon: '🔍', detail: 'A field officer is reviewing your report.' },
  { step: 3, label: 'Categorized / Assigned', icon: '🗂️', detail: 'Issue has been categorized and assigned to the appropriate team.' },
  { step: 4, label: 'In Progress',           icon: '🔧', detail: 'The team is working on the issue.' },
  { step: 5, label: 'Resolved',              icon: '✅', detail: 'Issue has been resolved. Thank you for reporting!' },
]

function TimelineItem({ step, label, icon, detail, status }) {
  const isDone    = status === 'done'
  const isActive  = status === 'active'
  const isPending = status === 'pending'

  return (
    <div className="flex gap-3">
      {/* Dot + line */}
      <div className="flex flex-col items-center gap-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 border-2 transition-all
          ${isDone   ? 'bg-green-500/20 border-green-500'   : ''}
          ${isActive ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/20' : ''}
          ${isPending ? 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700' : ''}
        `}>
          {isDone ? (
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <span className={isPending ? 'opacity-40' : ''}>{icon}</span>
          )}
        </div>
        {step < 5 && (
          <div className={`w-0.5 flex-1 min-h-[2rem] my-1 ${isDone ? 'bg-green-500/40' : 'bg-gray-200 dark:bg-zinc-700'}`} />
        )}
      </div>

      {/* Content */}
      <div className={`pb-4 flex-1 ${isPending ? 'opacity-40' : ''}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`font-semibold text-sm ${
            isDone   ? 'text-green-700 dark:text-green-300' :
            isActive ? 'text-amber-700 dark:text-amber-400' :
                       'text-gray-400 dark:text-slate-400'
          }`}>
            {label}
          </span>
          {isActive && (
            <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-300/70 dark:border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium">
              Current
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-500 leading-relaxed">{detail}</p>
      </div>
    </div>
  )
}

export default function TrackReport() {
  const { id: routeId } = useParams()
  const navigate        = useNavigate()

  const [inputId,   setInputId]   = useState(routeId ?? '')
  const [submitted, setSubmitted] = useState(!!routeId)
  const [loading,   setLoading]   = useState(!!routeId)
  const [data,      setData]      = useState(null)
  const [error,     setError]     = useState(null)
  const [localInfo, setLocalInfo] = useState(null)

  function normalise(raw) {
    const upper = raw.trim().toUpperCase()
    // CL-M-XXXX (custom reports)
    if (/^CL-M-\d{4}$/.test(upper)) return upper
    // CL-XXXX (standard)
    if (/^CL-\d{4}$/.test(upper)) return upper
    // Just digits XXXX
    if (/^\d{4}$/.test(upper)) return `CL-${upper}`
    // M-XXXX shorthand
    if (/^M-\d{4}$/.test(upper)) return `CL-${upper}`
    return upper
  }

  async function fetchStatus(id) {
    setLoading(true)
    setError(null)
    setData(null)

    const stored = JSON.parse(localStorage.getItem('civiclens_reports') ?? '[]')
    const local  = stored.find((r) => r.trackingId === id)
    setLocalInfo(local ?? null)

    try {
      const res = await fetch(`/api/reports/${id}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Server error ${res.status}`)
      }
      setData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (routeId) fetchStatus(normalise(routeId))
  }, [routeId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e) {
    e.preventDefault()
    const id = normalise(inputId)
    if (!id) return
    setSubmitted(true)
    fetchStatus(id)
  }

  // Choose timeline template based on whether it's a custom report
  const timelineSteps = data?.isCustom ? CUSTOM_TIMELINE_STEPS : TIMELINE_STEPS

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f4] dark:bg-slate-950">
      <Navbar title="Track My Report" backTo="/" backLabel="Home" />

      <main className="flex-1 p-5 flex flex-col gap-5 max-w-lg mx-auto w-full">
        {/* ── Input form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 animate-fade-in">
          <div>
            <label htmlFor="trackId" className="text-sm font-medium text-gray-700 dark:text-zinc-300 block mb-1.5">
              Enter Tracking ID
            </label>
            <input
              id="trackId"
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="CL-1234 or CL-M-1234"
              maxLength={12}
              autoComplete="off"
              autoCapitalize="characters"
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:border-amber-500 text-gray-900 dark:text-slate-50 rounded-md px-4 py-3.5 text-base font-mono placeholder-gray-400 dark:placeholder-slate-500 outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-zinc-600 mt-1.5">
              Standard: CL-XXXX &nbsp;·&nbsp; Custom: CL-M-XXXX
            </p>
          </div>

          <button
            type="submit"
            disabled={!inputId.trim() || loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3" />
                </svg>
                Looking up…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                </svg>
                Track Report
              </>
            )}
          </button>
        </form>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && submitted && (
          <div className="card p-4 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 flex items-start gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">Not found</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Results ────────────────────────────────────────────────────── */}
        {data && !loading && (
          <div className="flex flex-col gap-4 animate-slide-up">
            {/* Rejected report banner */}
            {data.rejected && (
              <div className="card p-5 border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-900/20 flex flex-col items-center gap-3 text-center">
                <span className="text-4xl">🚫</span>
                <div>
                  <p className="font-bold text-red-800 dark:text-red-300 text-base">Report Rejected</p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">{data.rejectionReason ?? 'Report rejected — location mismatch detected'}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-500">This report has been removed from the active queue.</p>
              </div>
            )}

            {/* Header */}
            {!data.rejected && (
            <div className="card p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5">Tracking ID</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-500 tracking-widest">{data.trackingId}</p>
                {data.isCustom && (
                  <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
                    Custom Report
                  </span>
                )}
                {data.verificationFlag === 'location_mismatch' && (
                  <span className="text-[10px] bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30 px-1.5 py-0.5 rounded-full font-medium ml-1">
                    ⚠️ Flagged
                  </span>
                )}
                {data.verificationStatus === 'auto_verified' && (
                  <span className="text-[10px] bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30 px-1.5 py-0.5 rounded-full font-medium ml-1">
                    ✓ Auto-Verified
                  </span>
                )}
              </div>
              <div className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                data.currentStep === 5
                  ? 'bg-green-100 dark:bg-green-500/20 border-green-400 dark:border-green-500/50 text-green-700 dark:text-green-300'
                  : 'bg-amber-100 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500/50 text-amber-700 dark:text-amber-400'
              }`}>
                {data.statuses[data.currentStep - 1]?.label ?? '—'}
              </div>
            </div>
            )}

            {/* Non-rejected content */}
            {!data.rejected && localInfo?.customType && (
              <div className="card p-4 flex flex-col gap-2">
                <p className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wide font-medium flex items-center gap-1.5">
                  <span>📋</span> Custom Report Details
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{localInfo.customType}</p>
                {localInfo.customDesc && (
                  <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">{localInfo.customDesc}</p>
                )}
              </div>
            )}

            {/* Local report details if available */}
            {!data.rejected && localInfo && !localInfo.customType && (
              <div className="card p-4 flex flex-col gap-2">
                <p className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wide font-medium">Your Report</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{localInfo.issueType}</span>
                  {localInfo.severity && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30">
                      Severity {localInfo.severity}/5
                    </span>
                  )}
                </div>
                {localInfo.address && (
                  <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{localInfo.address}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-zinc-600">
                  {new Date(localInfo.ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            )}

            {/* Progress indicator */}
            {!data.rejected && (<div className="flex items-center gap-1.5">
              {data.statuses.map((s) => (
                <div key={s.step} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`h-1.5 w-full rounded-full ${s.done ? 'bg-amber-500' : 'bg-gray-200 dark:bg-slate-700'}`} />
                </div>
              ))}
            </div>)}
            {!data.rejected && <p className="text-xs text-gray-500 dark:text-zinc-500 text-center -mt-2">
              Step {data.currentStep} of 5
            </p>}

            {/* Timeline */}
            {!data.rejected && <div className="card p-4">
              {data.statuses.map((s, i) => {
                let status
                if (s.step < data.currentStep)       status = 'done'
                else if (s.step === data.currentStep) status = 'active'
                else                                  status = 'pending'
                const tpl = timelineSteps[i]
                return (
                  <TimelineItem
                    key={s.step}
                    step={s.step}
                    label={tpl.label}
                    icon={tpl.icon}
                    detail={s.detail}
                    status={status}
                  />
                )
              })}
            </div>}

            <button
              className="btn-ghost w-full"
              onClick={() => navigate('/report')}
            >
              Report Another Issue
            </button>
          </div>
        )}

        {/* ── Recent reports from localStorage ───────────────────────────── */}
        {!submitted && <RecentReports />}
      </main>
    </div>
  )
}

function RecentReports() {
  const reports = JSON.parse(localStorage.getItem('civiclens_reports') ?? '[]').slice(0, 3)
  const navigate = useNavigate()

  if (reports.length === 0) return null

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      <p className="text-sm font-semibold text-gray-700 dark:text-zinc-400">Recent Reports</p>
      {reports.map((r) => (
        <button
          key={r.trackingId}
          onClick={() => navigate(`/track/${r.trackingId}`)}
          className="card p-3.5 flex items-center justify-between hover:border-gray-400 dark:hover:border-zinc-600 transition-colors text-left touch-manipulation"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-600 dark:text-amber-500">{r.trackingId}</span>
              <span className="text-xs text-gray-500 dark:text-zinc-500">{r.customType ?? r.issueType}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5">
              {new Date(r.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <svg className="w-4 h-4 text-gray-400 dark:text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      ))}
    </div>
  )
}
