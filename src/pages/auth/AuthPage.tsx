import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Info, ShieldCheck, UserPlus } from 'lucide-react'
import { useArena } from '../../app/arenaContext'
import { resolveSafeRedirect } from '../../app/authRedirect'
import AuthBrandPanel from '../../components/auth/AuthBrandPanel'
import { DEMO_PERSONAS } from '../../domain/constants'

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { state, isAuthenticated, signInByEmail, registerAccount } = useArena()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTarget = resolveSafeRedirect(
    (location.state as { from?: unknown } | null)?.from,
    '/dashboard',
  )

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [headline, setHeadline] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recoverySent, setRecoverySent] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'login') {
      const res = signInByEmail(email)
      if (!res.ok) {
        setError(res.error)
        return
      }
      navigate(redirectTarget, { replace: true })
    } else {
      const res = registerAccount({ displayName, username, email, headline })
      if (!res.ok) {
        setError(res.error)
        return
      }
      navigate(redirectTarget, { replace: true })
    }
  }

  return (
    <div className="auth-layout">
      <AuthBrandPanel />

      <section className="auth-main">
        <Link className="back-home" to="/">← Back to the Arena</Link>

        <div className="auth-form-wrap">
          <div className="section-kicker">
            {mode === 'login' ? 'SIGN IN' : 'JOIN THE ARENA'}
          </div>
          <h2>{mode === 'login' ? 'Welcome back.' : 'Join as a Spartan.'}</h2>
          <p>
            {mode === 'login'
              ? 'Sign in with a demo email or choose one of the demo accounts below.'
              : 'Create your account to join a House, explore the Academy, and take on missions.'}
          </p>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {recoverySent && (
            <div className="arena-notice arena-notice-info" style={{ marginBottom: 14 }}>
              <Info size={16} />
              <span>
                Demo mode: this preview stores data locally in your browser without passwords or email recovery. Choose any demo account below or sign in with <code>jordan.davis@arena.demo</code>.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label>
                  Display Name
                  <input
                    required
                    placeholder="e.g. Samira Patel"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </label>
                <label>
                  Arena Handle
                  <input
                    required
                    placeholder="e.g. samira.patel"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>
                <label>
                  Short Headline (optional)
                  <input
                    placeholder="e.g. Protocol researcher & designer"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                  />
                </label>
              </>
            )}

            <label>
              Email Address
              <input
                required
                type="email"
                placeholder={mode === 'login' ? 'jordan.davis@arena.demo' : 'you@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {mode === 'login' && (
              <button
                type="button"
                className="forgot-link"
                style={{ border: 0, background: 'none', cursor: 'pointer' }}
                onClick={() => setRecoverySent(true)}
              >
                Sign-in help?
              </button>
            )}

            <button type="submit" className="button button-bright auth-submit">
              {mode === 'login' ? (
                <>Sign in to Workspace <ArrowRight size={15} /></>
              ) : (
                <>Create Unified Spartan Account <UserPlus size={15} /></>
              )}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'login' ? (
              <>
                New around here? <Link to="/register" state={location.state}>Create a unified account</Link>
              </>
            ) : (
              <>
                Already have an account? <Link to="/login" state={location.state}>Sign in</Link>
              </>
            )}
          </div>

          <div className="demo-login">
            <div className="demo-divider">
              <span /> <small>OR TRY A DEMO ACCOUNT</small> <span />
            </div>
            <div className="demo-role-grid">
              {DEMO_PERSONAS.filter((p) => p.memberId !== null).map((p) => {
                const member = state.members.find((m) => m.id === p.memberId)
                if (!member || member.membershipStatus !== 'spartan') return null
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setError(null)
                      const res = signInByEmail(member.email)
                      if (!res.ok) {
                        setError(res.error)
                        return
                      }
                      navigate(redirectTarget, { replace: true })
                    }}
                  >
                    <ShieldCheck size={15} />
                    <span>
                      <b>{p.label.split(' (')[0]}</b>
                      <small>{p.shortRole}</small>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="auth-terms">
            One account for learning, building, and organising · Demo Mode
          </div>
        </div>
      </section>
    </div>
  )
}
