import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { auth } from '../api/endpoints'
import Button from '../components/ui/Button'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [shake, setShake]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const { login }   = useAuth()
  const navigate    = useNavigate()

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await auth.login(email, password)
      login(res.user, res.token)
      navigate('/')
    } catch (err) {
      const msg = err?.error || err?.message || ''
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('unauthorized')) {
        setError('Email or password is incorrect. Please try again.')
      } else if (msg.toLowerCase().includes('required')) {
        setError('Please enter your email and password.')
      } else if (!navigator.onLine) {
        setError('No internet connection. Check your network and try again.')
      } else {
        setError('Unable to sign in. Please try again in a moment.')
      }
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const hasError = !!error
  const fieldCls = (base) =>
    `${base} ${hasError ? 'border-valo-red/60 focus:border-valo-red/80' : 'border-valo-border focus:border-valo-accent/60'}`

  return (
    <div className="min-h-screen bg-valo-black flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-valo-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-valo-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-valo-accent rounded-xl items-center justify-center mb-4">
            <span className="text-valo-black font-bold text-2xl">V</span>
          </div>
          <h1 className="text-valo-text text-xl font-semibold">Valo BMS</h1>
          <p className="text-valo-subtle text-sm mt-1">Business Management System</p>
        </div>

        {/* Card */}
        <div
          className={`bg-valo-dark border rounded-2xl p-8 transition-colors ${
            hasError ? 'border-valo-red/30' : 'border-valo-border'
          } ${shake ? 'animate-shake' : ''}`}
        >
          <h2 className="text-valo-text font-semibold mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                placeholder="you@valosystems.co.za"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                required
                autoFocus
                autoComplete="email"
                className={fieldCls(
                  'w-full bg-valo-black rounded-lg px-3 py-2.5 text-valo-text text-sm placeholder:text-valo-muted focus:outline-none transition-colors border'
                )}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  required
                  autoComplete="current-password"
                  className={fieldCls(
                    'w-full bg-valo-black rounded-lg px-3 py-2.5 pr-10 text-valo-text text-sm placeholder:text-valo-muted focus:outline-none transition-colors border'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-valo-subtle hover:text-valo-text transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2.5 bg-valo-red/10 border border-valo-red/25 rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="text-valo-red shrink-0 mt-0.5" />
                <p className="text-valo-red text-sm leading-snug">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full justify-center mt-2"
              loading={loading}
            >
              Sign in
            </Button>
          </form>

          <p className="text-valo-subtle text-xs text-center mt-6">
            Use your @valosystems.co.za account
          </p>
        </div>

        <p className="text-center text-valo-muted text-xs mt-6">
          VALO SYSTEMS (PTY) LTD - Internal Platform
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.45s ease-in-out; }
      `}</style>
    </div>
  )
}
