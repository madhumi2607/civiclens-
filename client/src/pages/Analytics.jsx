import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import REPORTS from '../data/demoReports'
import { TEAMS, SLA_DAYS } from '../data/teams'
import { initWorkOrders } from '../data/seedWorkOrders'
import { ThemeToggle, useTheme } from '../context/ThemeContext'

const CREDENTIALS = { username: 'admin', password: 'civiclens2026' }

const TYPE_COLORS = {
  pothole:     '#ef4444',
  streetlight: '#f59e0b',
  drain:       '#3b82f6',
  manhole:     '#dc2626',
  waste:       '#22c55e',
  flood:       '#6366f1',
  other:       '#9ca3af',
}

const CITY_COLORS = {
  Chennai: '#f59e0b',
  Trichy:  '#3b82f6',
  Madurai: '#22c55e',
}

// ── Login Gate (same as Dashboard) ────────────────────────────────────────────
function LoginGate({ onLogin }) {
  const [user, setUser]   = useState('')
  const [pass, setPass]   = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (user === CREDENTIALS.username && pass === CREDENTIALS.password) onLogin()
    else setError(true)
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-700 rounded-lg shadow-md p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-lg bg-slate-900 dark:bg-amber-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-50">CivicLens Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to access analytics</p>
          <ThemeToggle />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" value={user} onChange={(e) => { setUser(e.target.value); setError(false) }}
            placeholder="admin" autoComplete="username"
            className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:border-amber-500 text-gray-900 dark:text-slate-50 rounded-md px-4 py-3 text-sm outline-none transition-colors" />
          <input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError(false) }}
            placeholder="••••••••••••" autoComplete="current-password"
            className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:border-amber-500 text-gray-900 dark:text-slate-50 rounded-md px-4 py-3 text-sm outline-none transition-colors" />
          {error && <p className="text-xs text-red-500">Invalid credentials. Try admin / civiclens2026</p>}
          <button type="submit"
            className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-900 font-semibold rounded-md px-6 py-3 text-sm transition-colors">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = 'amber' }) {
  const colors = {
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-600 dark:text-green-400',
    blue:  'text-blue-600 dark:text-blue-400',
    red:   'text-red-600 dark:text-red-400',
  }
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200/70 dark:border-slate-700 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
      <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide font-medium">{label}</span>
      <span className={`text-3xl font-black ${colors[color]}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400 dark:text-slate-500">{sub}</span>}
    </div>
  )
}

// ── Chart tooltip wrapper ─────────────────────────────────────────────────────
function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-gray-200/70 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col gap-4 ${className}`}>
      <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{title}</p>
      {children}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-slate-300 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-600 dark:text-slate-400">{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

// ── Main analytics view ────────────────────────────────────────────────────────
function AnalyticsView({ onLogout }) {
  const { dark } = useTheme()
  const navigate = useNavigate()
  const workOrders = useMemo(() => initWorkOrders(), [])

  const gridColor  = dark ? '#334155' : '#e5e7eb'
  const axisColor  = dark ? '#94a3b8' : '#4b5563'
  const textStyle  = { fill: axisColor, fontSize: 11 }

  // ── Derived metrics ───────────────────────────────────────────────────────
  const total    = REPORTS.length
  const weekAgo  = new Date(Date.now() - 7 * 86400000)
  const resolved = REPORTS.filter((r) => r.status === 'resolved')
  const resolvedThisWeek = resolved.filter((r) => new Date(r.reportedAt) >= weekAgo).length

  const avgResolutionDays = useMemo(() => {
    const res = resolved.filter((r) => r.reportedAt)
    if (!res.length) return 0
    const total = res.reduce((s, r) => s + Math.max(1, (Date.now() - new Date(r.reportedAt)) / 86400000), 0)
    return (total / res.length).toFixed(1)
  }, [resolved])

  const activeWO = workOrders.filter((w) => w.status !== 'resolved').length

  // ── Reports over time (last 30 days) ─────────────────────────────────────
  const reportsOverTime = useMemo(() => {
    const buckets = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      buckets[key] = 0
    }
    REPORTS.forEach((r) => {
      const d = new Date(r.reportedAt)
      const daysAgo = Math.floor((Date.now() - d) / 86400000)
      if (daysAgo < 30) {
        const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        if (key in buckets) buckets[key]++
      }
    })
    return Object.entries(buckets).map(([date, count]) => ({ date, count }))
  }, [])

  // ── Avg resolution time by type ───────────────────────────────────────────
  const resolutionByType = useMemo(() => {
    const TYPES = ['pothole', 'streetlight', 'drain', 'manhole', 'waste', 'flood']
    return TYPES.map((type) => {
      const typeResolved = resolved.filter((r) => r.type === type)
      const avg = typeResolved.length
        ? (typeResolved.reduce((s, r) => s + Math.max(1, (Date.now() - new Date(r.reportedAt)) / 86400000), 0) / typeResolved.length).toFixed(1)
        : SLA_DAYS[type]  // fallback to SLA as baseline
      return { type, avg: parseFloat(avg), sla: SLA_DAYS[type] }
    })
  }, [resolved])

  // ── Team performance leaderboard ──────────────────────────────────────────
  const teamPerformance = useMemo(() => {
    return TEAMS.map((team) => {
      const teamWOs = workOrders.filter((w) => w.teamId === team.id)
      const resolvedWOs = teamWOs.filter((w) => w.status === 'resolved')
      const avgDays = resolvedWOs.length
        ? (resolvedWOs.reduce((s, w) => {
            const days = w.resolvedAt
              ? (new Date(w.resolvedAt) - new Date(w.assignedAt)) / 86400000
              : (Date.now() - new Date(w.assignedAt)) / 86400000
            return s + Math.max(0.1, days)
          }, 0) / resolvedWOs.length).toFixed(1)
        : '—'
      return {
        name:     team.name,
        city:     team.city === 'any' ? 'All' : team.city,
        resolved: resolvedWOs.length,
        avgDays,
        avail:    `${team.available}/${team.capacity}`,
      }
    }).sort((a, b) => b.resolved - a.resolved)
  }, [workOrders])

  // ── Reports by city (pie) ─────────────────────────────────────────────────
  const byCity = useMemo(() => {
    const m = {}
    REPORTS.forEach((r) => { const c = r.city ?? 'Chennai'; m[c] = (m[c] ?? 0) + 1 })
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [])

  // ── SLA compliance heatmap ────────────────────────────────────────────────
  const slaCompliance = useMemo(() => {
    const TYPES = ['pothole', 'streetlight', 'drain', 'manhole', 'waste', 'flood']
    return TYPES.map((type) => {
      const typeReports = REPORTS.filter((r) => r.type === type)
      const sla = SLA_DAYS[type]
      const res = typeReports.filter((r) => r.status === 'resolved')
      const onTime = res.filter((r) => {
        const days = (Date.now() - new Date(r.reportedAt)) / 86400000
        return days <= sla
      }).length
      const overdue = typeReports.filter((r) => {
        if (r.status === 'resolved') return false
        const days = (Date.now() - new Date(r.reportedAt)) / 86400000
        return days > sla
      }).length
      const active = typeReports.filter((r) => r.status !== 'resolved').length - overdue
      return { type, onTime, overdue, active, sla }
    })
  }, [])

  // ── Last 10 resolved work orders ──────────────────────────────────────────
  const lastResolved = useMemo(() => {
    return workOrders
      .filter((w) => w.status === 'resolved')
      .sort((a, b) => new Date(b.resolvedAt ?? b.assignedAt) - new Date(a.resolvedAt ?? a.assignedAt))
      .slice(0, 10)
  }, [workOrders])

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 text-gray-800 dark:text-slate-50">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3 bg-white/80 dark:bg-slate-900 backdrop-blur-sm border-b border-gray-200/70 dark:border-slate-700 sticky top-0 z-40">
        <button onClick={() => navigate('/dashboard')}
          className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-slate-50 border border-gray-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 transition-colors">
          ← Dashboard
        </button>
        <div className="w-7 h-7 rounded-md bg-slate-900 dark:bg-amber-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <span className="font-bold font-serif">CivicLens Analytics</span>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <button onClick={onLogout}
            className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-slate-50 border border-gray-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <div className="p-5 flex flex-col gap-6 max-w-7xl mx-auto">
        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Reports"        value={total}              sub="all time"                  color="amber" />
          <KpiCard label="Resolved This Week"   value={resolvedThisWeek}   sub="last 7 days"               color="green" />
          <KpiCard label="Avg Resolution Days"  value={avgResolutionDays}  sub="across resolved reports"   color="blue"  />
          <KpiCard label="Active Work Orders"   value={activeWO}           sub="in progress / assigned"    color="red"   />
        </div>

        {/* ── Charts Row 1 ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Line chart: Reports Over Time */}
          <ChartCard title="Reports Over Time (last 30 days)">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={reportsOverTime} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={textStyle} interval={6} />
                <YAxis tick={textStyle} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" name="Reports" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Bar chart: Avg Resolution Time by Type */}
          <ChartCard title="Avg Resolution Time by Issue Type (days)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={resolutionByType} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="type" tick={textStyle} />
                <YAxis tick={textStyle} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg" name="Avg Days" radius={[3, 3, 0, 0]}>
                  {resolutionByType.map((entry) => (
                    <Cell key={entry.type} fill={TYPE_COLORS[entry.type] ?? '#9ca3af'} />
                  ))}
                </Bar>
                <Bar dataKey="sla" name="SLA Target" fill={dark ? '#475569' : '#d1d5db'} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Charts Row 2 ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Horizontal bar: Team Performance Leaderboard */}
          <ChartCard title="Team Performance Leaderboard" className="md:col-span-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={teamPerformance} layout="vertical" margin={{ top: 4, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={textStyle} />
                <YAxis type="category" dataKey="name" tick={textStyle} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="resolved" name="Resolved WOs" fill="#22c55e" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {/* Team details table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-gray-400 dark:text-slate-500 uppercase">
                    <th className="text-left pb-2 pr-3">Team</th>
                    <th className="text-left pb-2 pr-3">City</th>
                    <th className="text-left pb-2 pr-3">Resolved</th>
                    <th className="text-left pb-2 pr-3">Avg Days</th>
                    <th className="text-left pb-2">Avail</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerformance.map((t) => (
                    <tr key={t.name} className="border-t border-gray-100 dark:border-slate-700">
                      <td className="py-1.5 pr-3 font-semibold text-gray-900 dark:text-slate-50">{t.name}</td>
                      <td className="py-1.5 pr-3 text-gray-500 dark:text-slate-400">{t.city}</td>
                      <td className="py-1.5 pr-3 font-bold text-green-600 dark:text-green-400">{t.resolved}</td>
                      <td className="py-1.5 pr-3 text-gray-500 dark:text-slate-400">{t.avgDays}</td>
                      <td className="py-1.5 text-gray-500 dark:text-slate-400">{t.avail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Pie chart: Reports by City */}
          <ChartCard title="Reports by City">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={byCity} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" nameKey="name">
                  {byCity.map((entry) => (
                    <Cell key={entry.name} fill={CITY_COLORS[entry.name] ?? '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5">
              {byCity.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CITY_COLORS[c.name] ?? '#9ca3af' }} />
                    <span className="text-gray-600 dark:text-slate-400">{c.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-slate-50">{c.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* ── SLA Compliance Heatmap ────────────────────────────────────────── */}
        <ChartCard title="SLA Compliance by Category">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                  <th className="text-left pb-3 pr-6 font-semibold">Type</th>
                  <th className="text-center pb-3 pr-4 font-semibold">SLA (days)</th>
                  <th className="text-center pb-3 pr-4 font-semibold">On-time</th>
                  <th className="text-center pb-3 pr-4 font-semibold">Active</th>
                  <th className="text-center pb-3 font-semibold">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {slaCompliance.map((row) => (
                  <tr key={row.type} className="border-t border-gray-100 dark:border-slate-700">
                    <td className="py-2.5 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS[row.type] }} />
                        <span className="capitalize text-gray-800 dark:text-slate-200">{row.type}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-center text-gray-500 dark:text-slate-400">{row.sla}d</td>
                    <td className="py-2.5 pr-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                        {row.onTime}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        {row.active}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        row.overdue > 0
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                      }`}>
                        {row.overdue}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        {/* ── Last 10 Resolved Work Orders ─────────────────────────────────── */}
        <ChartCard title="Last 10 Resolved Work Orders">
          {lastResolved.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-500 py-4 text-center">No resolved work orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                    <th className="text-left pb-3 pr-4 font-semibold">WO-ID</th>
                    <th className="text-left pb-3 pr-4 font-semibold">Type</th>
                    <th className="text-left pb-3 pr-4 font-semibold">Team</th>
                    <th className="text-left pb-3 pr-4 font-semibold">Resolution Time</th>
                    <th className="text-left pb-3 font-semibold">Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {lastResolved.map((wo) => {
                    const team = TEAMS.find((t) => t.id === wo.teamId)
                    const sla  = SLA_DAYS[wo.clusterType] ?? 7
                    const days = wo.resolvedAt
                      ? Math.max(0.1, (new Date(wo.resolvedAt) - new Date(wo.assignedAt)) / 86400000).toFixed(1)
                      : null
                    const underSLA = days ? parseFloat(days) <= sla : true
                    return (
                      <tr key={wo.id} className="border-t border-gray-100 dark:border-slate-700">
                        <td className="py-2.5 pr-4 font-mono text-xs text-gray-700 dark:text-slate-300">{wo.id}</td>
                        <td className="py-2.5 pr-4">
                          <span className="capitalize text-xs text-gray-700 dark:text-slate-300">{wo.clusterType}</span>
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-gray-600 dark:text-slate-400">{team?.name ?? '—'}</td>
                        <td className="py-2.5 pr-4">
                          {days ? (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              underSLA
                                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                            }`}>
                              {days}d {underSLA ? '(under SLA)' : '(over SLA)'}
                            </span>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="py-2.5">
                          {wo.proofPhoto ? (
                            <img src={wo.proofPhoto.url} alt="proof" className="w-10 h-10 rounded object-cover border border-gray-200 dark:border-slate-600" />
                          ) : <span className="text-xs text-gray-300 dark:text-slate-600">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [loggedIn, setLoggedIn] = useState(false)
  if (!loggedIn) return <LoginGate onLogin={() => setLoggedIn(true)} />
  return <AnalyticsView onLogout={() => setLoggedIn(false)} />
}
