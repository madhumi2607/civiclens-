import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const STACK = [
  { name: 'React 18',         role: 'Frontend UI',             color: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/20' },
  { name: 'Vite',             role: 'Build tool',              color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/20' },
  { name: 'Tailwind CSS',     role: 'Styling',                 color: 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-500/20' },
  { name: 'React Leaflet',    role: 'Maps',                    color: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-300 dark:border-green-500/20' },
  { name: 'Express.js',       role: 'API server',              color: 'bg-gray-100 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-500/20' },
  { name: 'Claude Vision',    role: 'AI classification',       color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-300 dark:border-amber-500/20' },
  { name: 'DBSCAN',           role: 'Cluster detection',       color: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/20' },
  { name: 'OpenStreetMap',    role: 'Map tiles',               color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/20' },
]

const TEAM = [
  { name: 'Team JARVIS',      role: 'Engineering & Design',    initials: 'TJ' },
]

const HOW_IT_WORKS = [
  {
    title: 'Citizen Reports',
    desc: 'A citizen photographs a civic issue. The app uses GPS to auto-detect location and a drag-to-refine map pin for accuracy.',
    icon: '📸',
  },
  {
    title: 'AI Classification',
    desc: 'Claude Vision analyses the photo and issue type, returning severity (1–5), confidence %, and a natural-language description.',
    icon: '🤖',
  },
  {
    title: 'Ward Routing',
    desc: 'Reports are tagged with a ward, issue type, and tracking ID (CL-XXXX) then queued for the relevant maintenance team.',
    icon: '🗺️',
  },
  {
    title: 'Municipal Dashboard',
    desc: 'DBSCAN clusters nearby active reports into hotspots. Priority scores surface the most urgent areas. Root cause analysis flags recurring patterns.',
    icon: '📊',
  },
]

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-slate-950">
      <Navbar title="About CivicLens" backTo="/" backLabel="Home" />

      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-6 flex flex-col gap-8">

        {/* Hero */}
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="w-14 h-14 rounded-lg bg-slate-900 dark:bg-amber-500 flex items-center justify-center shadow-xl shadow-slate-900/20 dark:shadow-amber-500/20">
            <svg className="w-8 h-8 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.3-6.7-1.4 1.4M6.7 17.3l-1.4 1.4m0-12.7 1.4 1.4m10.6 10.6 1.4 1.4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-50">CivicLens</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            An AI-powered civic infrastructure reporting platform built for Indian cities. Citizens report
            issues in seconds; municipal teams get intelligent clustering and priority scoring to act faster.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full px-3 py-1">
              Built for FixForward by HYRUP
            </span>
          </div>
        </div>

        {/* How it works */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest">How it works</h2>
          <div className="flex flex-col gap-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="card p-4 flex gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="text-2xl flex-shrink-0 mt-0.5">{step.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{step.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Tech stack</h2>
          <div className="flex flex-wrap gap-2">
            {STACK.map((s) => (
              <div key={s.name} className={`flex flex-col rounded-xl border px-3 py-2 text-xs ${s.color}`}>
                <span className="font-semibold">{s.name}</span>
                <span className="opacity-70 mt-0.5">{s.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Team</h2>
          {TEAM.map((m) => (
            <div key={m.name} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-amber-500 flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm flex-shrink-0">
                {m.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{m.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{m.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 pb-4">
          <button className="btn-primary w-full" onClick={() => navigate('/report')}>
            Try the Citizen Flow
          </button>
          <button className="btn-ghost w-full" onClick={() => navigate('/dashboard')}>
            Open Municipal Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
