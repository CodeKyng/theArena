import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import DemoPersonaBar from '../components/DemoPersonaBar'
import GlobalModals from '../components/GlobalModals'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { loadSidebarCollapsed, saveSidebarCollapsed } from '../services/arenaStore'

export default function AppLayout({ children }: { children?: ReactNode }) {
  const { toast, currentMember, isAuthenticated } = useArena()
  const location = useLocation()
  const landing = location.pathname === '/'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(() => loadSidebarCollapsed())
  const personaKey = currentMember?.id ?? 'guest'

  const setSidebarCollapsed = (next: boolean | ((prev: boolean) => boolean)) => {
    setCollapsed((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      saveSidebarCollapsed(resolved)
      return resolved
    })
  }

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    const onCollapseSync = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail
      if (typeof detail === 'boolean') setCollapsed(detail)
    }
    window.addEventListener('keydown', onEsc)
    window.addEventListener('arena:sidebar-collapse', onCollapseSync)
    return () => {
      window.removeEventListener('keydown', onEsc)
      window.removeEventListener('arena:sidebar-collapse', onCollapseSync)
    }
  }, [])

  const shellClass = landing
    ? 'app landing-app'
    : collapsed
      ? 'app sidebar-collapsed'
      : 'app'

  return (
    <div className={shellClass}>
      {!landing && isAuthenticated && (
        <Sidebar
          open={mobileOpen}
          collapsed={collapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onClose={() => setMobileOpen(false)}
        />
      )}

      <div className="main-column">
        <Topbar
          landing={landing}
          sidebarCollapsed={collapsed}
          onExpandSidebar={() => setSidebarCollapsed(false)}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        {!landing && isAuthenticated && <DemoPersonaBar variant="workspace" />}
        <main className={landing ? 'landing-main' : 'page-main'}>
          <div key={personaKey} style={{ display: 'contents' }}>
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      {isAuthenticated && <GlobalModals key={personaKey} />}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
