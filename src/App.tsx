import { Navigate, Route, Routes } from 'react-router-dom'
import { ArenaProvider } from './app/ArenaProvider'
import AppLayout from './layouts/AppLayout'
import LandingPage from './pages/public/LandingPage'
import AuthPage from './pages/auth/AuthPage'
import HomePage from './pages/HomePage'
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
import OrganisationsPage from './pages/OrganisationsPage'
import StewardshipPage from './pages/StewardshipPage'
import ControlRoomPage from './pages/ControlRoomPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <ArenaProvider>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/onboarding" element={<Navigate to="/home" replace />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
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
          <Route path="/organisations" element={<OrganisationsPage />} />
          <Route path="/stewardship" element={<StewardshipPage />} />
          <Route path="/control-room" element={<ControlRoomPage />} />

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
          <Route path="/dashboard" element={<Navigate to="/activity" replace />} />
          <Route path="/applications" element={<Navigate to="/activity" replace />} />
          <Route path="/notifications" element={<Navigate to="/home" replace />} />
          <Route path="/achievements" element={<Navigate to="/activity?tab=progress" replace />} />
          <Route path="/reputation" element={<Navigate to="/activity?tab=progress" replace />} />
          <Route path="/admin" element={<Navigate to="/control-room" replace />} />
          <Route path="/analytics" element={<Navigate to="/control-room" replace />} />
          <Route path="/moderation" element={<Navigate to="/control-room" replace />} />
          <Route path="/applicants" element={<Navigate to="/control-room" replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ArenaProvider>
  )
}
