import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { TEAMS, RESOLUTION_STEPS } from '../data/teams'
import { loadWorkOrders, upsertWorkOrder } from '../utils/autoAssign'

const STATUS_COLOR = {
  assigned:    'bg-orange-100 text-orange-700 border-orange-300',
  in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  resolved:    'bg-green-100 text-green-700 border-green-300',
  overdue:     'bg-red-100 text-red-700 border-red-300',
}

function countdown(deadline) {
  const ms = new Date(deadline) - Date.now()
  if (ms <= 0) return { label: 'Overdue', color: 'text-red-600' }
  const hours = Math.floor(ms / 3600000)
  const days  = Math.floor(hours / 24)
  if (days > 0) return { label: `${days}d ${hours % 24}h left`, color: hours < 24 ? 'text-orange-600' : 'text-gray-600' }
  return { label: `${hours}h left`, color: 'text-orange-600' }
}

export default function FieldView() {
  const { teamId } = useParams()
  const navigate   = useNavigate()
  const team = TEAMS.find((t) => t.id === teamId)
  const [workOrders, setWorkOrders] = useState(() => loadWorkOrders())
  const [activeWo, setActiveWo] = useState(null)
  const [success, setSuccess]   = useState(null)

  // Refresh when localStorage changes (e.g. from dashboard)
  useEffect(() => {
    const handler = () => setWorkOrders(loadWorkOrders())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const myOrders = workOrders.filter((o) => o.teamId === teamId)

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
        {!teamId ? (
          <>
            <p className="text-gray-700 font-bold text-lg">Field Team Portal</p>
            <p className="text-gray-500 text-sm">Select your team:</p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {TEAMS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/field/${t.id}`)}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left shadow-sm hover:border-gray-400 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.fullName}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-700 font-semibold">Unknown team: {teamId}</p>
            <button className="text-amber-600 underline" onClick={() => navigate('/')}>Back to Home</button>
          </>
        )}
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 p-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Work verified.</h2>
          <p className="text-gray-600 mt-1">Cluster {success} resolved.</p>
        </div>
        <button
          className="bg-gray-900 text-white font-semibold rounded-lg px-6 py-3 text-sm"
          onClick={() => { setSuccess(null); setActiveWo(null) }}
        >
          Back to Work Orders
        </button>
      </div>
    )
  }

  if (activeWo) {
    return (
      <WoDetail
        wo={activeWo}
        team={team}
        onUpdate={(updated) => {
          upsertWorkOrder(updated)
          setWorkOrders(loadWorkOrders())
          setActiveWo(updated)
          // Dispatch storage event so Dashboard tab can react
          window.dispatchEvent(new StorageEvent('storage', { key: 'civiclens_work_orders' }))
        }}
        onProofSubmit={(updated) => {
          upsertWorkOrder(updated)
          window.dispatchEvent(new StorageEvent('storage', { key: 'civiclens_work_orders' }))
          setSuccess(updated.clusterId)
        }}
        onBack={() => setActiveWo(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{team.name}</p>
            <p className="text-xs text-gray-500">{team.fullName}</p>
          </div>
          <span className="ml-auto text-xs bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full font-medium">
            {team.available}/{team.capacity} available
          </span>
        </div>
      </header>

      {/* Work orders list */}
      <main className="p-4 flex flex-col gap-3 max-w-lg mx-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {myOrders.length} Work Order{myOrders.length !== 1 ? 's' : ''}
        </p>

        {myOrders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No work orders assigned.</p>
          </div>
        )}

        {myOrders.map((wo) => {
          const cd = countdown(wo.deadline)
          const checkedCount = wo.steps.filter((s) => s.checked).length
          const pct = wo.steps.length > 0 ? Math.round((checkedCount / wo.steps.length) * 100) : 0
          return (
            <button
              key={wo.id}
              onClick={() => setActiveWo(wo)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-gray-400 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs font-mono text-gray-400">{wo.id}</span>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{wo.clusterType} — {wo.address}</p>
                  <p className="text-xs text-gray-500">{wo.ward}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLOR[wo.status] ?? STATUS_COLOR.assigned}`}>
                  {wo.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className={cd.color}>{cd.label}</span>
                <span className="text-gray-300">·</span>
                <span>{checkedCount}/{wo.steps.length} steps</span>
              </div>
              {wo.steps.length > 0 && (
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${wo.status === 'resolved' ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </button>
          )
        })}
      </main>
    </div>
  )
}

function WoDetail({ wo, team, onUpdate, onProofSubmit, onBack }) {
  const [steps, setSteps] = useState(() => {
    // Hydrate steps from RESOLUTION_STEPS if empty
    if (wo.steps.length === 0) {
      return (RESOLUTION_STEPS[wo.clusterType] ?? []).map((label, i) => ({
        id: i, label, checked: false
      }))
    }
    return wo.steps
  })
  const allChecked = steps.every((s) => s.checked)
  const cd = countdown(wo.deadline)

  function toggleStep(id) {
    const updated = steps.map((s) => s.id === id ? { ...s, checked: !s.checked } : s)
    setSteps(updated)
    const anyChecked = updated.some((s) => s.checked)
    const allDone    = updated.every((s) => s.checked)
    const newStatus  = wo.status === 'resolved' ? 'resolved'
      : allDone    ? 'in_progress'
      : anyChecked ? 'in_progress'
      : wo.status === 'overdue' ? 'overdue' : 'assigned'
    onUpdate({ ...wo, steps: updated, status: newStatus })
  }

  function handleMarkComplete() {
    onProofSubmit({
      ...wo,
      steps,
      status:     'resolved',
      resolvedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate capitalize">{wo.clusterType} — {wo.address}</p>
            <p className="text-xs text-gray-500">{wo.id} · {wo.ward}</p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-4">
        {/* Deadline banner */}
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium ${
          wo.status === 'resolved' ? 'bg-green-50 border-green-300 text-green-700'
          : wo.status === 'overdue' ? 'bg-red-50 border-red-300 text-red-700'
          : 'bg-orange-50 border-orange-300 text-orange-700'
        }`}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {wo.status === 'resolved'
            ? `Resolved · ${new Date(wo.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
            : `Deadline: ${new Date(wo.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — ${cd.label}`
          }
        </div>

        {/* Assigned team */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Assigned Team</p>
          <p className="text-sm font-bold text-gray-900">{team.fullName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{team.members.join(', ')}</p>
        </div>

        {/* Resolution checklist */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resolution Steps</p>
          <div className="flex flex-col gap-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => wo.status !== 'resolved' && toggleStep(step.id)}
                disabled={wo.status === 'resolved'}
                className={`flex items-start gap-3 p-2.5 rounded-lg border text-left transition-all touch-manipulation
                  ${step.checked
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                  }
                  ${wo.status === 'resolved' ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  step.checked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                }`}>
                  {step.checked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm leading-snug ${step.checked ? 'text-green-800 line-through decoration-green-400' : 'text-gray-700'}`}>
                  {step.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {allChecked && wo.status !== 'resolved' && (
          <button
            onClick={handleMarkComplete}
            className="w-full bg-gray-900 text-white font-semibold rounded-xl py-4 text-base flex items-center justify-center gap-2 active:bg-gray-800 transition-colors touch-manipulation animate-fade-in"
          >
            Mark Complete
          </button>
        )}

        {!allChecked && wo.status !== 'resolved' && (
          <p className="text-xs text-center text-gray-400 pb-4">
            Complete all steps to mark as resolved.
          </p>
        )}
      </main>
    </div>
  )
}
