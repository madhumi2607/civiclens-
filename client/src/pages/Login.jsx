import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Login() {
  const navigate = useNavigate()
  const [step,  setStep]  = useState('phone') // phone | otp
  const [phone, setPhone] = useState('')
  const [otp,   setOtp]   = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleRequestOtp(e) {
    e.preventDefault()
    if (!phone.trim()) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send OTP')
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
      navigate('/profile')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-950 flex flex-col">
      <Navbar title="Sign In" backTo="/" />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-700 rounded-2xl shadow-md p-7 flex flex-col gap-6 animate-fade-in">
          {step === 'phone' ? (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sign In</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Enter your registered phone number.</p>
              </div>
              <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Phone Number</label>
                  <input
                    type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setError(null) }}
                    placeholder="9876543210" autoComplete="tel"
                    className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:border-amber-500 text-gray-900 dark:text-slate-50 rounded-md px-4 py-3 text-sm outline-none transition-colors"
                  />
                </div>
                {/* Demo login hints */}
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Demo accounts:</p>
                  {[
                    ['9876540001', 'Priya', 90, 'Trusted'],
                    ['9876540002', 'Karthik', 75, 'Standard'],
                    ['9876540004', 'Deepa', 35, 'Under Review'],
                  ].map(([ph, name, score, tier]) => (
                    <button key={ph} type="button" onClick={() => setPhone(ph)}
                      className="w-full text-left text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 py-0.5 flex items-center gap-2">
                      <span className="font-mono">{ph}</span>
                      <span className="text-amber-600/70 dark:text-amber-500/70">— {name} · {score} · {tier}</span>
                    </button>
                  ))}
                </div>
                {error && <p className="text-xs text-red-600 dark:text-red-400">⚠ {error}</p>}
                <button type="submit" disabled={!phone.trim() || loading}
                  className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'Sending OTP…' : 'Send OTP →'}
                </button>
              </form>
              <p className="text-xs text-center text-gray-500 dark:text-slate-500">
                New here?{' '}
                <Link to="/register" className="text-amber-600 dark:text-amber-400 font-medium hover:underline">Create account</Link>
              </p>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Enter OTP</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Sent to {phone}.</p>
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
                  {loading ? 'Verifying…' : 'Sign In'}
                </button>
                <button type="button" onClick={() => setStep('phone')}
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
