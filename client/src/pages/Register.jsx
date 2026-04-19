import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState('form') // form | otp | done
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [area,  setArea]  = useState('')
  const [otp,   setOtp]   = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim(), area: area.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Registration failed')
      setStep('otp')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (!otp.trim()) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Verification failed')
      localStorage.setItem('civiclens_user', JSON.stringify(data.user))
      setStep('done')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    const user = JSON.parse(localStorage.getItem('civiclens_user') ?? 'null')
    return (
      <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 flex flex-col">
        <Navbar title="CivicLens" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name}!</h2>
              <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">Your account is ready. Trust score: {user?.trustScore}/100</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <button className="btn-primary w-full" onClick={() => navigate('/report')}>Report an Issue</button>
              <button className="btn-ghost w-full" onClick={() => navigate('/')}>Back to Home</button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 flex flex-col">
      <Navbar title="Create Account" backTo="/" />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-700 rounded-2xl shadow-md p-7 flex flex-col gap-6 animate-fade-in">
          {step === 'form' ? (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Account</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Join CivicLens to earn trust and get faster report processing.</p>
              </div>
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <Field label="Full Name *" type="text" value={name} onChange={setName} placeholder="Priya Krishnamurthy" />
                <Field label="Phone Number *" type="tel" value={phone} onChange={setPhone} placeholder="9876543210" />
                <Field label="Your Area / Ward" type="text" value={area} onChange={setArea} placeholder="T. Nagar, Chennai" />
                {error && <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">⚠ {error}</p>}
                <button type="submit" disabled={!name.trim() || !phone.trim() || loading}
                  className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'Sending OTP…' : 'Send OTP →'}
                </button>
              </form>
              <p className="text-xs text-center text-gray-500 dark:text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-amber-600 dark:text-amber-400 font-medium hover:underline">Log in</Link>
              </p>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verify Phone</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Enter the OTP sent to {phone}.</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Demo: use 123456</p>
              </div>
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600 dark:text-slate-400">OTP</label>
                  <input
                    type="text" value={otp} onChange={(e) => { setOtp(e.target.value); setError(null) }}
                    placeholder="123456" maxLength={6} autoComplete="one-time-code"
                    className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:border-amber-500 text-gray-900 dark:text-slate-50 rounded-md px-4 py-3 text-2xl font-mono tracking-widest text-center outline-none transition-colors"
                  />
                </div>
                {error && <p className="text-xs text-red-600 dark:text-red-400">⚠ {error}</p>}
                <button type="submit" disabled={!otp.trim() || loading}
                  className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'Verifying…' : 'Verify & Register'}
                </button>
                <button type="button" onClick={() => setStep('form')}
                  className="text-xs text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 text-center">
                  ← Change phone number
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-600 dark:text-slate-400">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:border-amber-500 text-gray-900 dark:text-slate-50 rounded-md px-4 py-3 text-sm outline-none transition-colors"
      />
    </div>
  )
}
