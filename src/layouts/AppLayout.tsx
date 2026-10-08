import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppState } from '../app/appStateContext'
import { titleForPath } from '../app/navigation'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function AppLayout() {
  const location = useLocation()
  const landing = location.pathname === '/'
  const [mobileOpen, setMobileOpen] = useState(false)
  const { flash } = useAppState()

  return (
    <div className={landing ? 'app landing-app' : 'app'}>
      {!landing && <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />}
      {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <div className="main-column">
        <Topbar landing={landing} title={titleForPath(location.pathname)} onMenu={() => setMobileOpen(true)} flash={flash} />
        <main className={landing ? 'landing-main' : 'page-main'}><Outlet /></main>
      </div>
    </div>
  )
}
