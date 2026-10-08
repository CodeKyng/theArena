import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { ADMIN_PAGES, AUTH_PATHS, MEMBER_PAGES, ORG_PAGES, PUBLIC_PAGES, pagePath } from './app/navigation'
import { AppStateProvider } from './app/AppState'
import { AuthProvider } from './app/AuthProvider'
import AuthGate from './components/AuthGate'
import AppLayout from './layouts/AppLayout'
import LandingPage from './pages/public/LandingPage'
import AuthPage from './pages/auth/AuthPage'
import DirectoryPage from './pages/public/DirectoryPage'
import GeneralPage from './pages/public/GeneralPage'
import MemberPage from './pages/member/MemberPage'
import OrganizationPage from './pages/organization/OrganizationPage'
import AdminPage from './pages/admin/AdminPage'
import NotFoundPage from './pages/NotFoundPage'
import { homeForRole } from './app/authRoutes'
import { useAuth } from './app/authContext'

export default function App() {
  return (
    <AuthProvider>
    <AppStateProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          {PUBLIC_PAGES.map((name) => (
            <Route key={name} path={pagePath(name)} element={
              ['Discover', 'Opportunities', 'Projects', 'Services', 'Grants', 'Hackathons', 'Bounties', 'Events'].includes(name)
                ? <DirectoryPage name={name} />
                : <GeneralPage name={name} />
            } />
          ))}
          <Route element={<AuthGate roles={['member']} />}>
            {MEMBER_PAGES.map((name) => <Route key={name} path={pagePath(name)} element={<MemberPage name={name} />} />)}
          </Route>
          <Route element={<AuthGate roles={['organization']} />}>
            {ORG_PAGES.map((name) => <Route key={name} path={pagePath(name, 'organization')} element={<OrganizationPage name={name} />} />)}
          </Route>
          <Route element={<AuthGate roles={['admin']} />}>
            {ADMIN_PAGES.map((name) => <Route key={name} path={pagePath(name, 'admin')} element={<AdminPage name={name} />} />)}
          </Route>
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        {AUTH_PATHS.map((path) => <Route key={path} path={path} element={<AuthEntry path={path} />} />)}
      </Routes>
    </AppStateProvider>
    </AuthProvider>
  )
}

function AuthEntry({ path }: { path: string }) {
  const { user } = useAuth()
  if (path !== '/forgot-password' && user?.onboardingComplete) return <Navigate to={homeForRole(user.role)} replace />
  if (path === '/onboarding' && !user) return <Navigate to="/login" replace state={{ from: { pathname: '/onboarding' } }} />
  return <AuthPage path={path} />
}

function ForbiddenPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!user) return <Navigate to="/login" replace />
  return <div className="not-found"><span className="section-kicker">ROLE-RESTRICTED AREA</span><h1>Not your<br /><span>workspace.</span></h1><p>This area is for another Arena role. You’re signed in as {user.role}.</p><button className="button button-bright" onClick={() => navigate(homeForRole(user.role), { replace: true })}>Go to your workspace</button></div>
}
