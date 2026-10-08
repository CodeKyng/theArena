import { useState, type FormEvent } from 'react'
import { ArrowRight, BriefcaseBusiness, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { homeForRole } from '../../app/authRoutes'
import { useAuth, type UserRole } from '../../app/authContext'

type RouteState = { from?: { pathname?: string } }

export default function AuthForm({ path }: { path: string }) {
  const registerMode = path === '/register'
  const forgotMode = path === '/forgot-password'
  const onboardingMode = path === '/onboarding'
  const { user, signIn, signInDemo, register, completeOnboarding } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as RouteState | null
  const [email, setEmail] = useState('')
  const [name, setName] = useState(user?.name ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Exclude<UserRole, 'admin'>>(user?.role === 'organization' ? 'organization' : 'member')
  const [intent, setIntent] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (forgotMode) {
        setSubmitted(true)
      } else if (onboardingMode) {
        const completed = completeOnboarding(name, intent)
        navigate(homeForRole(completed.role), { replace: true })
      } else if (registerMode) {
        await register(email, name, password, role)
        navigate('/onboarding', { replace: true })
      } else {
        const signedIn = await signIn(email, password)
        const destination = routeState?.from?.pathname
        navigate(destination && !['/login', '/register'].includes(destination) ? destination : homeForRole(signedIn.role), { replace: true })
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'We couldn’t complete that request.')
    } finally {
      setBusy(false)
    }
  }

  const enterDemo = (demoRole: UserRole) => {
    const demoUser = signInDemo(demoRole)
    navigate(homeForRole(demoUser.role), { replace: true })
  }

  const heading = submitted && forgotMode ? 'Reset delivery unavailable.' : forgotMode ? 'Reset your password.' : onboardingMode ? 'Make this yours.' : registerMode ? 'Find your people.' : 'Welcome back.'
  const description = submitted && forgotMode
    ? 'Password-reset email is not connected yet. Contact the Arena team to recover this demo account.'
    : submitted
      ? 'Your account is ready. Continue to your new workspace.'
    : forgotMode ? 'Enter your email and we’ll help you get back in.'
      : onboardingMode ? 'A few details help us make your Arena feel like home.'
        : registerMode ? 'Create an account and start building your corner of Web3.'
          : 'Sign in to continue to your workspace.'
  const kicker = forgotMode ? 'ACCOUNT RECOVERY' : onboardingMode ? 'BUILDER ONBOARDING' : registerMode ? 'JOIN THE ARENA' : 'YOUR ARENA ACCOUNT'

  return <div className="auth-form-wrap">
    <div className="section-kicker">{kicker}</div>
    <h2>{heading}</h2>
    <p>{description}</p>
    {error && <div className="auth-error" role="alert">{error}</div>}
    {!submitted && <form onSubmit={handleSubmit}>
      {onboardingMode ? <>
        <label>Your display name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="How should we call you?" required /></label>
        <label>What brings you to the Arena?<select value={intent} onChange={(event) => setIntent(event.target.value)} required><option value="" disabled>Choose your focus</option><option>Find a team to build with</option><option>Share my skills and services</option><option>Find funding and opportunities</option><option>Grow my organization</option></select></label>
      </> : <>
        <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
        {registerMode && <>
          <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="How should we call you?" required /></label>
          <fieldset className="role-picker"><legend>I’m joining as</legend>
            <button type="button" className={role === 'member' ? 'role-choice role-choice-active' : 'role-choice'} onClick={() => setRole('member')}><UserRound size={17} /><span><b>Builder</b><small>Find work and collaborators</small></span></button>
            <button type="button" className={role === 'organization' ? 'role-choice role-choice-active' : 'role-choice'} onClick={() => setRole('organization')}><BriefcaseBusiness size={17} /><span><b>Organization</b><small>Hire and grow your team</small></span></button>
          </fieldset>
        </>}
        {!forgotMode && <label>Password<input type="password" autoComplete={registerMode ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={registerMode ? 'At least 8 characters' : 'Your password'} minLength={8} required /></label>}
        {!registerMode && !forgotMode && <Link className="forgot-link" to="/forgot-password">Forgot password?</Link>}
      </>}
      <button className="button button-bright auth-submit" type="submit" disabled={busy}>{busy ? 'One moment…' : forgotMode ? 'Send reset link' : onboardingMode ? 'Enter the Arena' : registerMode ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button>
    </form>}
    {!submitted && !registerMode && !forgotMode && !onboardingMode && <div className="demo-login">
      <div className="demo-divider"><span /> <small>OR TRY A DEMO WORKSPACE</small> <span /></div>
      <div className="demo-role-grid">
        <button onClick={() => enterDemo('member')}><UserRound size={15} /><span><b>Builder</b><small>Member demo</small></span></button>
        <button onClick={() => enterDemo('organization')}><BriefcaseBusiness size={15} /><span><b>Organization</b><small>Org demo</small></span></button>
        <button onClick={() => enterDemo('admin')}><ShieldCheck size={15} /><span><b>Administrator</b><small>Admin demo</small></span></button>
      </div>
    </div>}
    <div className="auth-switch">
      {forgotMode ? <Link to="/login">Back to sign in</Link>
        : onboardingMode ? <span>Signed in as {user?.email} · <b>{user?.role}</b></span>
          : registerMode ? <>Already have an account? <Link to="/login">Sign in</Link></>
            : <>New around here? <Link to="/register">Create an account</Link></>}
    </div>
    <div className="auth-terms">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</div>
  </div>
}
