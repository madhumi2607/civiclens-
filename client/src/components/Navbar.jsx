import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../context/ThemeContext'

export default function Navbar({ title, backTo, backLabel = 'Back' }) {
  const navigate = useNavigate()

  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border-b border-gray-200/70 dark:border-slate-700 safe-top">
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="p-1.5 -ml-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors touch-manipulation"
          aria-label={backLabel}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      <div className="flex items-center gap-2 flex-1">
        {!backTo && (
          <div className="w-7 h-7 rounded-md bg-slate-800 dark:bg-amber-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
            </svg>
          </div>
        )}
        <span className="font-bold font-serif text-gray-800 dark:text-slate-50 tracking-tight">
          {title || 'CivicLens'}
        </span>
      </div>

      <ThemeToggle />
    </header>
  )
}
