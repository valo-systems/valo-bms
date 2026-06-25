import { useState } from 'react'
import { Link } from 'react-router-dom'
import { auth } from '../api/endpoints'
import Button from '../components/ui/Button'
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import logoOnDark from '../assets/logo-on-dark.png'

export default function ForgotPassword() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [sent, setSent]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await auth.forgot(email)
      setSent(true)
    } catch (err) {
      setError(err?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={22} className="text-green-400" />
              </div>
              <div>
                <p className="text-valo-text font-semibold">Check your email</p>
                <p className="text-valo-subtle text-sm mt-2 leading-relaxed">
                  If <span className="text-valo-text">{email}</span> is registered, you will receive a password reset link shortly.
                </p>
                <p className="text-valo-muted text-xs mt-3">The link expires in 1 hour.</p>
              </div>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-valo-subtle hover:text-valo-text transition-colors mt-2"
              >
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-valo-text font-semibold">Forgot password?</h2>
                <p className="text-valo-subtle text-sm mt-1.5 leading-relaxed">
                  Enter your account email and we will send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                    className={`w-full bg-valo-black rounded-lg px-3 py-2.5 text-valo-text text-sm placeholder:text-valo-muted focus:outline-none transition-colors border ${
                      error ? 'border-valo-red/60 focus:border-valo-red/80' : 'border-valo-border focus:border-valo-accent/60'
                    }`}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 bg-valo-red/10 border border-valo-red/25 rounded-lg px-3 py-2.5">
                    <AlertCircle size={15} className="text-valo-red shrink-0 mt-0.5" />
                    <p className="text-valo-red text-sm leading-snug">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full justify-center mt-2" loading={loading}>
                  Send Reset Link
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
