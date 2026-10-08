import { Navigate, Link } from 'react-router-dom'
import AuthBrandPanel from '../../components/auth/AuthBrandPanel'
import AuthForm from '../../components/auth/AuthForm'
import { useAuth } from '../../app/authContext'
import { homeForRole } from '../../app/authRoutes'

export default function AuthPage({ path }: { path: string }) {
  const { user } = useAuth()
  if (path === '/onboarding' && (!user || user.onboardingComplete)) {
    return <Navigate to={user ? homeForRole(user.role) : '/login'} replace />
  }
  return <div className="auth-layout">
    <AuthBrandPanel />
    <section className="auth-main">
      <Link to="/" className="back-home">← Back to the Arena</Link>
      <AuthForm path={path} />
    </section>
  </div>
}
