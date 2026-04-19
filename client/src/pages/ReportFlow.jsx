import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../context/ThemeContext'
import Step1Camera       from '../steps/Step1Camera'
import Step2Location     from '../steps/Step2Location'
import Step3IssueType    from '../steps/Step3IssueType'
import Step4AIResult     from '../steps/Step4AIResult'
import Step5Confirmation from '../steps/Step5Confirmation'

const STEP_LABELS = ['Photo', 'Location', 'Category', 'AI Review', 'Done']

export default function ReportFlow() {
  const navigate = useNavigate()
  const [step, setStep]   = useState(1)
  const [report, setReport] = useState({
    imagePreview:   null,
    captureGps:     null,
    capturedAt:     null,
    isLiveCapture:  true,
    location:       null,
    issueType:      null,
    classification: null,
    trackingId:     null,
    verificationFlag: null,
  })

  function advance(patch) {
    setReport((prev) => ({ ...prev, ...patch }))
    if (patch.skipAI) setStep(5)
    else setStep((s) => s + 1)
  }

  function goBack() {
    if (step === 1) navigate('/')
    else setStep((s) => s - 1)
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8f7f4] dark:bg-slate-950 overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-slate-900 backdrop-blur-sm border-b border-gray-200/70 dark:border-slate-700 flex-shrink-0">
        {step < 5 && (
          <button
            onClick={goBack}
            className="p-1.5 -ml-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors touch-manipulation"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        <span className="font-bold font-serif text-gray-800 dark:text-slate-50 flex-1">Report an Issue</span>
        <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">{step}/5</span>
        <ThemeToggle />
      </header>

      {/* Step progress bar */}
      <div className="flex gap-1.5 px-4 py-2.5 bg-[#f1f0ec] dark:bg-slate-900 border-b border-gray-200/70 dark:border-slate-700 flex-shrink-0">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const done   = n < step
          const active = n === step
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1 w-full rounded-full transition-colors duration-300 ${
                done ? 'bg-amber-600' : active ? 'bg-amber-500' : 'bg-gray-200 dark:bg-slate-700'
              }`} />
              <span className={`text-[10px] font-medium ${
                active ? 'text-amber-600 dark:text-amber-400' :
                done   ? 'text-amber-600'                     :
                         'text-gray-400 dark:text-slate-600'
              }`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <main className="flex-1 overflow-y-auto">
        {step === 1 && <Step1Camera      report={report} onNext={(p) => advance(p)} />}
        {step === 2 && <Step2Location    report={report} onNext={(p) => advance(p)} />}
        {step === 3 && <Step3IssueType   report={report} onNext={(p) => advance(p)} />}
        {step === 4 && <Step4AIResult    report={report} onNext={(p) => advance(p)} />}
        {step === 5 && <Step5Confirmation report={report} />}
      </main>
    </div>
  )
}
