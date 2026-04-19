import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const STATUS_STYLE = {
  reported:    'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400',
  verified:    'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
  assigned:    'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',
  in_progress: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  resolved:    'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  rejected:    'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  under_review:'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',
}

function TrustMeter({ score }) {
  const color = score > 80 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 30 ? '#f97316' : '#ef4444'
  const label = score > 80 ? 'Trusted Reporter' : score >= 50 ? 'Active Citizen' : score >= 30 ? 'Under Review' : 'Restricted'
  const textColor = score > 80 ? 'text-green-600 dark:text-green-400' : score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : score >= 30 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Trust Score</span>
        <span className={`text-2xl font-black ${textColor}`}>{score}<span className="text-sm font-normal text-gray-400 dark:text-slate-500">/100</span></span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-500">
        <span>0 — Restricted</span>
        <span className={`font-semibold ${textColor}`}>{label}</span>
        <span>100 — Trusted</span>
      </div>
      {/* Tier markers */}
      <div className="relative h-4 mt-1">
        {[30, 50, 80].map((marker) => (
          <div key={marker} className="absolute top-0" style={{ left: `${marker}%` }}>
            <div className="w-0.5 h-2 bg-gray-300 dark:bg-slate-600" />
            <span className="text-[9px] text-gray-400 dark:text-slate-600 -translate-x-1/2 block">{marker}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BadgeIcon({ badge }) {
  const map = {
    'Trusted Reporter': { emoji: '🏆', bg: 'bg-green-100 dark:bg-green-500/20 border-green-300 dark:border-green-500/30', text: 'text-green-700 dark:text-green-400' },
    'Active Citizen':   { emoji: '⭐', bg: 'bg-blue-100 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/30',   text: 'text-blue-700 dark:text-blue-400' },
    'New Member':       { emoji: '🌱', bg: 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600',        text: 'text-gray-700 dark:text-slate-300' },
    'Restricted':       { emoji: '🚫', bg: 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/30',        text: 'text-red-700 dark:text-red-400' },
  }
  const cfg = map[badge] ?? map['New Member']
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${cfg.bg} ${cfg.text}`}>
      <span>{cfg.emoji}</span>
      {badge}
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const [user,    setUser]    = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('civiclens_user') ?? 'null') } catch { return null }
  })()

  useEffect(() => {
    if (!storedUser) { setLoading(false); return }

    async function load() {
      try {
        const [userRes, reportsRes] = await Promise.all([
          fetch(`/api/users/${storedUser.id}`),
          fetch('/api/reports'),
        ])
        if (userRes.ok) {
          const { user: freshUser } = await userRes.json()
          setUser(freshUser)
          localStorage.setItem('civiclens_user', JSON.stringify(freshUser))
        } else {
          setUser(storedUser)
        }
        if (reportsRes.ok) {
          const { data } = await reportsRes.json()
          setReports((data ?? []).filter((r) => r.reportedBy === storedUser.id))
        }
      } catch {
        setUser(storedUser)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogout() {
    localStorage.removeItem('civiclens_user')
    navigate('/')
  }

  if (!storedUser) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 flex flex-col">
        <Navbar title="My Profile" backTo="/" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center flex flex-col gap-4">
            <p className="text-gray-500 dark:text-slate-400">You're not logged in.</p>
            <button className="btn-primary" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn-ghost" onClick={() => navigate('/register')}>Create Account</button>
          </div>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 flex flex-col">
        <Navbar title="My Profile" backTo="/" />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        </main>
      </div>
    )
  }

  const u = user ?? storedUser

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 flex flex-col">
      <Navbar title="My Profile" backTo="/" />
      <main className="flex-1 p-5 flex flex-col gap-5 max-w-lg mx-auto w-full">
        {/* Profile header */}
        <div className="card p-5 flex flex-col gap-4 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{u.name}</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{u.phone} · {u.area}</p>
            </div>
            <BadgeIcon badge={u.badge} />
          </div>
          <TrustMeter score={u.trustScore} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Submitted', value: u.reportIds?.length ?? 0, color: 'text-gray-800 dark:text-slate-50' },
            { label: 'Verified', value: u.verifiedCount ?? 0,  color: 'text-blue-700 dark:text-blue-400' },
            { label: 'Resolved', value: u.resolvedCount ?? 0,  color: 'text-green-700 dark:text-green-400' },
            { label: 'Rejected', value: u.rejectedCount ?? 0,  color: 'text-red-700 dark:text-red-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-800 border border-gray-200/70 dark:border-slate-700 rounded-lg p-3 flex flex-col gap-0.5 shadow-sm">
              <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wide">{s.label}</span>
              <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Trust info */}
        <div className="card p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wide">How trust works</p>
          {[
            { text: '+5 per officer-verified report', color: 'text-green-600 dark:text-green-400' },
            { text: '+10 per resolved work order', color: 'text-green-600 dark:text-green-400' },
            { text: '−15 per rejected report', color: 'text-red-600 dark:text-red-400' },
            { text: '−25 repeat fake reports', color: 'text-red-600 dark:text-red-400' },
          ].map((item) => (
            <div key={item.text} className={`text-xs font-medium ${item.color}`}>{item.text}</div>
          ))}
        </div>

        {/* My Reports */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">My Reports ({reports.length})</h3>
          {reports.length === 0 ? (
            <div className="card p-6 text-center text-gray-400 dark:text-slate-500 text-sm">
              No reports yet.{' '}
              <button onClick={() => navigate('/report')} className="text-amber-600 dark:text-amber-400 font-medium hover:underline">
                Report an issue
              </button>
            </div>
          ) : (
            reports.slice(0, 15).map((r) => (
              <button key={r.id}
                onClick={() => navigate(`/track/${r.id}`)}
                className="card p-3.5 flex items-center justify-between hover:border-gray-400 dark:hover:border-zinc-600 transition-colors text-left touch-manipulation">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-amber-600 dark:text-amber-500">{r.id}</span>
                    <span className="text-xs text-gray-600 dark:text-slate-300 capitalize">{r.isCustom ? (r.customTitle ?? 'Custom') : r.type}</span>
                    {r.verificationFlag === 'location_mismatch' && <span className="text-[10px]">⚠️</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[r.status] ?? STATUS_STYLE.reported}`}>
                      {r.status?.replace('_', ' ') ?? 'reported'}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-600">
                      {new Date(r.reportedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 dark:text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pb-6">
          <button className="btn-primary w-full" onClick={() => navigate('/report')}>Report an Issue</button>
          <button className="btn-ghost w-full text-red-600 dark:text-red-400" onClick={handleLogout}>Sign Out</button>
        </div>
      </main>
    </div>
  )
}
