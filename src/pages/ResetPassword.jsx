import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { auth } from '../api/endpoints'
import Button from '../components/ui/Button'
import { AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import logoOnDark from '../assets/logo-on-dark.png'

export default function ResetPassword() {
  const [searchParams]        = useSearchParams()
  const navigate              = useNavigate()
  const token                 = searchParams.get('token') || ''

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [showConf, setShowConf]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Please request a new link.')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await auth.reset(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err?.error || 'Something went wrong. Please try again or request a new link.')
    } finally {
      setLoading(false)
    }
  }

  const hasError = !!error
  const fieldCls = `w-full bg-valo-black rounded-lg px-3 py-2.5 text-valo-text text-sm placeholder:text-valo-muted focus:outline-none transition-colors border ${
    hasError ? 'border-valo-red/60 focus:border-valo-red/80' : 'border-valo-border focus:border-valo-accent/60'
  }`

  return (
    <div className="min-h-screen bg-valo-black flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-valo-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-valo-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logoOnDark} alt="Valo BMS" className="h-10 w-auto mx-auto mb-4" />
          <p className="text-valo-subtle text-sm mt-1">Business Management System</p>
        </div>

        <div className="bg-valo-dark border border-valo-border rounded-2xl p-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={22} className="text-green-400" />
              </div>
              <div>
                <p className="text-valo-text font-semibold">Password updated</p>
                <p className="text-valo-subtle text-sm mt-2 leading-relaxed">
                  Your password has been changed. Redirecting you to sign in...
                </p>
              </div>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-valo-accent hover:underline"
              >
                Sign in now
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-valo-text font-semibold">Set new password</h2>
                <p className="text-valo-subtle text-sm mt-1.5">
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* New password */}
                <div className="space-y-1.5">
                  <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      required
                      autoFocus
                      autoComplete="new-password"
                      className={fieldCls + ' pr-10'}
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

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="block text-valo-subtle text-xs font-medium uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConf ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError('') }}
                      required
                      autoComplete="new-password"
                      className={fieldCls + ' pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConf(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-valo-subtle hover:text-valo-text transition-colors"
                      tabIndex={-1}
                    >
                      {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Strength hint */}
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs text-valo-muted">
                    {8 - password.length} more character{8 - password.length !== 1 ? 's' : ''} needed
                  </p>
                )}

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
                  disabled={!token}
                >
                  Update Password
                </Button>
              </form>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-valo-subtle hover:text-valo-text transition-colors mt-6"
              >
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </>
          )}
        </div>

        <p className="text-center text-valo-muted text-xs mt-6">
          VALO SYSTEMS (PTY) LTD - Internal Platform
        </p>
      </div>
    </div>
  )
}
