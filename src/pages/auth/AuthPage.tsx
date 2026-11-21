import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Info, ShieldCheck, UserPlus } from 'lucide-react'
import { useArena } from '../../app/arenaContext'
import AuthBrandPanel from '../../components/auth/AuthBrandPanel'
import { DEMO_PERSONAS } from '../../domain/constants'

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { signInByEmail, registerAccount, switchPersona } = useArena()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [headline, setHeadline] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recoverySent, setRecoverySent] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'login') {
      const res = signInByEmail(email)
      if (!res.ok) {
        setError(res.error)
        return
      }
      navigate('/home')
    } else {
      const res = registerAccount({ displayName, username, email, headline })
      if (!res.ok) {
        setError(res.error)
        return
      }
      navigate('/home')
    }
  }

  return (
    <div className="auth-layout">
      <AuthBrandPanel />

      <section className="auth-main">
        <Link className="back-home" to="/">← Back to the Arena</Link>

        <div className="auth-form-wrap">
          <div className="section-kicker">
            {mode === 'login' ? 'SIMULATED SIGN IN' : 'UNIFIED REGISTRATION'}
          </div>
          <h2>{mode === 'login' ? 'Welcome back.' : 'Join as a Spartan.'}</h2>
          <p>
            {mode === 'login'
              ? 'Sign in with a seeded @arena.demo email or pick one of the demo personas below.'
              : 'Create a unified Spartan account. You will start in the Newbie stage with guided orientation (+20 XP) and House selection.'}
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
                Simulated recovery: in this frontend-only prototype no email server exists and no passwords are stored. Use any demo persona below or sign in with <code>jordan.davis@arena.demo</code>.
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
                Simulated password help?
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
                New around here? <Link to="/register">Create a unified account</Link>
              </>
            ) : (
              <>
                Already have an account? <Link to="/login">Sign in</Link>
              </>
            )}
          </div>

          <div className="demo-login">
            <div className="demo-divider">
              <span /> <small>OR TRY A DEMO PERSONA</small> <span />
            </div>
            <div className="demo-role-grid">
              {DEMO_PERSONAS.filter((p) => p.memberId !== null).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    switchPersona(p.memberId)
                    navigate('/home')
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>
                    <b>{p.label.split(' (')[0]}</b>
                    <small>{p.shortRole}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="auth-terms">
            Unified Spartan identity · Zero role split on signup · Client simulation only
          </div>
        </div>
      </section>
    </div>
  )
}
