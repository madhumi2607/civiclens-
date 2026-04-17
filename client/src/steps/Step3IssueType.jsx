import { useState } from 'react'

const ISSUE_TYPES = [
  {
    id: 'Pothole',
    icon: '🕳️',
    label: 'Pothole',
    desc: 'Road surface damage',
    border: 'border-amber-400 dark:border-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    activeBg: 'bg-amber-50 dark:bg-amber-500/10 ring-2 ring-amber-500',
  },
  {
    id: 'Broken Streetlight',
    icon: '💡',
    label: 'Broken Streetlight',
    desc: 'Non-functional lighting',
    border: 'border-yellow-400 dark:border-yellow-500',
    iconBg: 'bg-yellow-50 dark:bg-yellow-500/10',
    activeBg: 'bg-yellow-50 dark:bg-yellow-500/10 ring-2 ring-yellow-500',
  },
  {
    id: 'Clogged Drain',
    icon: '🚰',
    label: 'Clogged Drain',
    desc: 'Blocked storm drain',
    border: 'border-blue-400 dark:border-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    activeBg: 'bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-500',
  },
  {
    id: 'Open Manhole',
    icon: '⚠️',
    label: 'Open Manhole',
    desc: 'Missing or displaced cover',
    border: 'border-red-400 dark:border-red-500',
    iconBg: 'bg-red-50 dark:bg-red-500/10',
    activeBg: 'bg-red-50 dark:bg-red-500/10 ring-2 ring-red-500',
  },
  {
    id: 'Solid Waste',
    icon: '🗑️',
    label: 'Solid Waste',
    desc: 'Garbage dump or overflow',
    border: 'border-green-400 dark:border-green-500',
    iconBg: 'bg-green-50 dark:bg-green-500/10',
    activeBg: 'bg-green-50 dark:bg-green-500/10 ring-2 ring-green-500',
  },
  {
    id: 'Road Flooding',
    icon: '🌊',
    label: 'Road Flooding',
    desc: 'Water accumulation on road',
    border: 'border-cyan-400 dark:border-cyan-500',
    iconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
    activeBg: 'bg-cyan-50 dark:bg-cyan-500/10 ring-2 ring-cyan-500',
  },
]

// ── Keyword-weight maps for auto-categorization ────────────────────────────────
// Higher weight = stronger signal. Category name itself gets highest weight.
// Confidence = max(matched weights) for that category.
const KEYWORD_WEIGHTS = {
  'Pothole': {
    pothole: 90, potholes: 90,
    hole: 75, holes: 72,
    crack: 70, cracks: 68,
    pit: 65, depression: 62,
    crater: 68, damaged: 55, broken: 50,
  },
  'Broken Streetlight': {
    streetlight: 90, streetlights: 90,
    'street light': 88, 'street lamp': 85,
    light: 60, lights: 58,
    lamp: 65, lamps: 62,
    dark: 55, darkness: 52,
    bulb: 58, flickering: 60, flicker: 60,
    unlit: 62, outage: 58,
  },
  'Clogged Drain': {
    drain: 90, drains: 90, drainage: 88,
    flood: 75, flooding: 74, flooded: 74,
    water: 60, waterlogged: 72, waterlogging: 72,
    clog: 80, clogged: 82, blockage: 78, blocked: 75,
    overflow: 70, stagnant: 68,
  },
  'Solid Waste': {
    waste: 90, garbage: 88, trash: 85,
    dump: 78, dumping: 78, litter: 72,
    rubbish: 80, refuse: 75,
    filth: 65, dirty: 55,
  },
}

/**
 * Returns { issueType, confidence } if above threshold, else null.
 * confidence is the max keyword-weight matched across the text.
 * Only returns if confidence > 70.
 */
function autoDetectCategory(title, desc) {
  const text = `${title} ${desc}`.toLowerCase()
  const words = text.split(/[\s,./!?;:()_-]+/).filter(Boolean)

  let bestType = null
  let bestConf = 0

  for (const [issueType, kwMap] of Object.entries(KEYWORD_WEIGHTS)) {
    // Check single-word keywords
    for (const [kw, weight] of Object.entries(kwMap)) {
      const kwWords = kw.split(' ')
      let hit = false
      if (kwWords.length === 1) {
        hit = words.some((w) => w === kw || w.startsWith(kw) || kw.startsWith(w))
      } else {
        // Multi-word phrase: check if text contains the phrase
        hit = text.includes(kw)
      }
      if (hit && weight > bestConf) {
        bestConf = weight
        bestType = issueType
      }
    }
  }

  if (bestConf > 70 && bestType) return { issueType: bestType, confidence: bestConf }
  return null
}

export default function Step3IssueType({ onNext }) {
  const [selected,       setSelected]       = useState(null)
  const [customType,     setCustomType]     = useState('')
  const [customDesc,     setCustomDesc]     = useState('')
  const [autoDetecting,  setAutoDetecting]  = useState(false)
  const [autoResult,     setAutoResult]     = useState(null)  // { issueType, confidence }

  const isOther = selected === '__other__'

  function handleContinue() {
    if (isOther) {
      // Run auto-categorize for custom issues
      const detected = autoDetectCategory(customType, customDesc)
      if (detected) {
        setAutoResult(detected)
        setAutoDetecting(true)
        // After 1.8s, advance with the detected standard type
        setTimeout(() => {
          onNext({ issueType: detected.issueType, skipAI: false })
        }, 1800)
      } else {
        // Below threshold → queue as custom (skip AI)
        onNext({
          issueType:  'Other / Custom Issue',
          customType: customType.trim(),
          customDesc: customDesc.trim(),
          skipAI:     true,
        })
      }
    } else {
      onNext({ issueType: selected })
    }
  }

  const canContinue = isOther
    ? customType.trim().length > 0 && !autoDetecting
    : selected !== null

  return (
    <div className="flex flex-col min-h-full p-5 gap-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">What's the issue?</h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
          Select the category that best describes what you've found.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ISSUE_TYPES.map((type) => {
          const isActive = selected === type.id
          return (
            <button
              key={type.id}
              onClick={() => setSelected(type.id)}
              className={`
                relative flex flex-col items-start p-4 rounded-2xl border
                bg-white dark:bg-slate-800
                text-left transition-all duration-150 touch-manipulation
                ${isActive
                  ? type.activeBg + ' ' + type.border
                  : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm hover:shadow active:scale-[0.97]'
                }
              `}
            >
              {isActive && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
              )}
              <span className="text-3xl mb-2">{type.icon}</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{type.label}</span>
              <span className="text-gray-500 dark:text-zinc-400 text-xs mt-0.5">{type.desc}</span>
            </button>
          )
        })}

        {/* 7th card — Other / Custom Issue (full width) */}
        <button
          onClick={() => setSelected('__other__')}
          className={`
            col-span-2 relative flex items-center gap-3 p-4 rounded-2xl border
            bg-white dark:bg-slate-800
            text-left transition-all duration-150 touch-manipulation
            ${isOther
              ? 'border-slate-500 dark:border-slate-400 ring-2 ring-slate-400 dark:ring-slate-500 bg-slate-50 dark:bg-slate-700/50'
              : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm hover:shadow active:scale-[0.98]'
            }
          `}
        >
          {isOther && (
            <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
          )}
          <span className="text-3xl flex-shrink-0">✏️</span>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm block">Other / Custom Issue</span>
            <span className="text-gray-500 dark:text-zinc-400 text-xs">Describe something not listed above</span>
          </div>
        </button>
      </div>

      {/* Inline form for "Other" */}
      {isOther && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wide">
              Issue Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Broken park bench, fallen tree…"
              value={customType}
              onChange={(e) => { setCustomType(e.target.value); setAutoResult(null) }}
              maxLength={60}
              disabled={autoDetecting}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600
                         bg-white dark:bg-slate-800
                         text-gray-900 dark:text-white
                         placeholder-gray-400 dark:placeholder-zinc-500
                         px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         transition-colors disabled:opacity-60"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wide">
              Description <span className="text-gray-400 dark:text-zinc-500 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Briefly describe the issue, hazard level, and location details…"
              value={customDesc}
              onChange={(e) => { setCustomDesc(e.target.value); setAutoResult(null) }}
              maxLength={300}
              disabled={autoDetecting}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600
                         bg-white dark:bg-slate-800
                         text-gray-900 dark:text-white
                         placeholder-gray-400 dark:placeholder-zinc-500
                         px-3 py-2.5 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         transition-colors disabled:opacity-60"
            />
            <p className="text-xs text-gray-400 dark:text-zinc-600 text-right">{customDesc.length}/300</p>
          </div>

          {/* Auto-detect result banner */}
          {autoDetecting && autoResult && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/40 animate-fade-in">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Auto-detected: {autoResult.issueType} ({autoResult.confidence}% confidence)
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  Routing as standard report for faster processing…
                </p>
              </div>
            </div>
          )}

          {!autoDetecting && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-white dark:bg-slate-800/50 border border-gray-200/70 dark:border-slate-700 shadow-sm">
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                We'll try to auto-categorize your report. If matched, it'll be routed as a standard issue. Otherwise a field officer will review within 48 hrs.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto">
        <button
          className="btn-primary w-full"
          disabled={!canContinue}
          onClick={handleContinue}
        >
          {autoDetecting
            ? 'Auto-categorizing…'
            : isOther
              ? (canContinue ? `Continue with "${customType.trim()}" →` : 'Enter issue name to continue')
              : selected
                ? `Continue with "${selected}" →`
                : 'Select a category'}
        </button>
      </div>
    </div>
  )
}
