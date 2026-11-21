import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import DemoPersonaBar from '../components/DemoPersonaBar'
import GlobalModals from '../components/GlobalModals'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function AppLayout() {
  const { toast } = useArena()
  const location = useLocation()
  const landing = location.pathname === '/'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  const shellClass = landing
    ? 'app landing-app'
    : collapsed
      ? 'app sidebar-collapsed'
      : 'app'

  return (
    <div className={shellClass}>
      {!landing && (
        <Sidebar
          open={mobileOpen}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onClose={() => setMobileOpen(false)}
        />
      )}

      <div className="main-column">
        <Topbar landing={landing} onOpenMobileMenu={() => setMobileOpen(true)} />
        {!landing && <DemoPersonaBar variant="workspace" />}
        <main className={landing ? 'landing-main' : 'page-main'}>
          <Outlet />
        </main>
      </div>

      <GlobalModals />

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
