import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ArenaProvider } from './app/ArenaProvider'
import { useArena } from './app/arenaContext'
import RequireAuth from './components/RequireAuth'
import AppLayout from './layouts/AppLayout'
import LandingPage from './pages/public/LandingPage'
import AuthPage from './pages/auth/AuthPage'
import HomePage from './pages/HomePage'
import NotificationsPage from './pages/NotificationsPage'
import MissionsPage from './pages/MissionsPage'
import MissionCreatePage from './pages/MissionCreatePage'
import MissionDetailPage from './pages/MissionDetailPage'
import HousesPage from './pages/HousesPage'
import HouseDetailPage from './pages/HouseDetailPage'
import ExplorePage from './pages/ExplorePage'
import AcademyPage from './pages/AcademyPage'
import EventsPage from './pages/EventsPage'
import LeaderboardsPage from './pages/LeaderboardsPage'
import ActivityPage from './pages/ActivityPage'
import ProfilePage from './pages/ProfilePage'
import PersonalizationPage from './pages/PersonalizationPage'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'
import OrganisationsPage from './pages/OrganisationsPage'
import StewardshipPage from './pages/StewardshipPage'
import ControlRoomPage from './pages/ControlRoomPage'
import NotFoundPage from './pages/NotFoundPage'

function SignupRedirect() {
  const location = useLocation()
  return <Navigate to="/register" replace state={location.state} />
}

function NotFoundRoute() {
  const { isAuthenticated } = useArena()
  if (isAuthenticated) {
    return (
      <AppLayout>
        <NotFoundPage />
      </AppLayout>
    )
  }
  return <NotFoundPage />
}

export default function App() {
  return (
    <ArenaProvider>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/signup" element={<SignupRedirect />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/missions/new" element={<MissionCreatePage />} />
          <Route path="/missions/:id" element={<MissionDetailPage />} />
          <Route path="/houses" element={<HousesPage />} />
          <Route path="/houses/:slug" element={<HouseDetailPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/academy" element={<AcademyPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/leaderboards" element={<LeaderboardsPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/personalization" element={<PersonalizationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/organisations" element={<OrganisationsPage />} />
          <Route path="/stewardship" element={<StewardshipPage />} />
          <Route path="/control-room" element={<ControlRoomPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Legacy route redirects */}
          <Route path="/discover" element={<Navigate to="/explore?tab=opportunities" replace />} />
          <Route path="/opportunities" element={<Navigate to="/missions" replace />} />
          <Route path="/bounties" element={<Navigate to="/missions" replace />} />
          <Route path="/grants" element={<Navigate to="/missions" replace />} />
          <Route path="/hackathons" element={<Navigate to="/missions" replace />} />
          <Route path="/projects" element={<Navigate to="/explore?tab=projects" replace />} />
          <Route path="/services" element={<Navigate to="/explore?tab=services" replace />} />
          <Route path="/communities" element={<Navigate to="/houses" replace />} />
          <Route path="/learning" element={<Navigate to="/academy" replace />} />
          <Route path="/organizations" element={<Navigate to="/organisations" replace />} />
          <Route path="/resources" element={<Navigate to="/explore?tab=resources" replace />} />
          <Route path="/discussions" element={<Navigate to="/explore?tab=discussions" replace />} />
          <Route path="/applications" element={<Navigate to="/activity" replace />} />
          <Route path="/achievements" element={<Navigate to="/activity?tab=progress" replace />} />
          <Route path="/reputation" element={<Navigate to="/activity?tab=progress" replace />} />
          <Route path="/admin" element={<Navigate to="/control-room" replace />} />
          <Route path="/analytics" element={<Navigate to="/control-room" replace />} />
          <Route path="/moderation" element={<Navigate to="/control-room" replace />} />
          <Route path="/applicants" element={<Navigate to="/control-room" replace />} />
        </Route>

        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </ArenaProvider>
  )
}
