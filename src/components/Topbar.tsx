import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, ChevronRight, Menu, PanelLeftOpen, Plus, Search, X } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import { LANDING_LINKS, resolveBreadcrumb } from '../app/navigation'
import AccountMenu from './AccountMenu'
import Brand from './Brand'

export default function Topbar({
  landing = false,
  sidebarCollapsed = false,
  onExpandSidebar,
  onOpenMobileMenu,
}: {
  landing?: boolean
  sidebarCollapsed?: boolean
  onExpandSidebar?: () => void
  onOpenMobileMenu: () => void
}) {
  const {
    state,
    currentMember,
    unreadNotificationsCount,
    can,
    setSearchModalOpen,
    openQuickCreate,
    markAllNotificationsRead,
    markNotificationRead,
    signOut,
  } = useArena()

  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [landingMenuOpen, setLandingMenuOpen] = useState(false)
  const notifWrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!notifOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (notifWrapRef.current && !notifWrapRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [notifOpen])

  const breadcrumb = resolveBreadcrumb(pathname, (slug) =>
    state.houses.find((h) => h.slug === slug)?.id,
  )

  const myNotifications = currentMember
    ? state.notifications.filter((n) => n.memberId === currentMember.id).slice(0, 6)
    : []

  if (landing) {
    return (
      <>
        <header className="topbar topbar-landing">
          <Brand to="/" />
          <nav className="landing-nav" aria-label="Landing navigation">
            {LANDING_LINKS.map((item) => (
              <Link key={item.to} to={item.to}>{item.label}</Link>
            ))}
          </nav>
          <div className="topbar-actions">
            {currentMember ? (
              <>
                <Link className="login-link" to="/dashboard">
                  {currentMember.displayName.split(' ')[0]}’s workspace
                </Link>
                <button
                  type="button"
                  className="button button-bright button-small"
                  onClick={() => signOut()}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link className="login-link" to="/login">Sign in</Link>
                <Link className="button button-bright button-small" to="/register">
                  Join The Arena <ArrowRight size={15} />
                </Link>
              </>
            )}
            <button
              type="button"
              className="icon-button landing-mobile-toggle"
              aria-label={landingMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              title={landingMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={landingMenuOpen}
              onClick={() => setLandingMenuOpen((v) => !v)}
            >
              {landingMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </header>

        {landingMenuOpen && (
          <nav className="landing-mobile-drawer" aria-label="Mobile landing navigation">
            {LANDING_LINKS.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setLandingMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            {currentMember ? (
              <Link to="/dashboard" onClick={() => setLandingMenuOpen(false)}>
                Open Workspace
              </Link>
            ) : (
              <Link to="/login" onClick={() => setLandingMenuOpen(false)}>
                Sign in / Register
              </Link>
            )}
          </nav>
        )}
      </>
    )
  }

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <button
          type="button"
          className="icon-button menu-button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          title="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        {sidebarCollapsed && onExpandSidebar && (
          <button
            type="button"
            className="icon-button sidebar-expand-btn"
            onClick={onExpandSidebar}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={17} />
          </button>
        )}

        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to={breadcrumb.groupTo} className="breadcrumb-link">
            {breadcrumb.group}
          </Link>
          <ChevronRight size={13} className="breadcrumb-sep" aria-hidden="true" />
          <b>{breadcrumb.page}</b>
        </nav>
      </div>

      <div className="topbar-actions">
        {sidebarCollapsed && (
          <button
            type="button"
            className="icon-button topbar-search-compact topbar-search-visible-desktop"
            onClick={() => setSearchModalOpen(true)}
            aria-label="Search"
            title="Search"
          >
            <Search size={17} />
          </button>
        )}

        {currentMember ? (
          <>
            <div className="arena-popover-wrap" ref={notifWrapRef}>
              <button
                type="button"
                className="icon-button notification-button"
                aria-label={`Notifications (${unreadNotificationsCount} unread)`}
                aria-expanded={notifOpen}
                title="Notifications"
                onClick={() => setNotifOpen((prev) => !prev)}
              >
                <Bell size={17} />
                {unreadNotificationsCount > 0 && <i aria-hidden="true" />}
              </button>

              {notifOpen && (
                <div className="arena-popover" role="region" aria-label="Notifications">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <strong style={{ fontSize: 13 }}>Notifications ({unreadNotificationsCount})</strong>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        className="text-link"
                        style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 12 }}
                        onClick={markAllNotificationsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {myNotifications.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12.5, color: '#647790' }}>You’re all caught up.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {myNotifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(n.id)
                            setNotifOpen(false)
                            if (n.linkPath) navigate(n.linkPath)
                          }}
                          style={{
                            textAlign: 'left',
                            border: '1px solid #d7e2f1',
                            background: n.read ? '#fff' : '#eff6ff',
                            borderRadius: 8,
                            padding: '8px 10px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#080d16' }}>{n.title}</span>
                            {n.category === 'announcement' && (
                              <span className="listing-kind kind-featured" style={{ fontSize: 10 }}>Announcement</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#52647d', marginTop: 2 }}>{n.body}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid #e5ecf6', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                    <Link
                      to="/notifications"
                      className="text-link"
                      style={{ fontSize: 12.5, fontWeight: 600 }}
                      onClick={() => setNotifOpen(false)}
                    >
                      View all notifications <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="button button-bright button-small"
              onClick={() => openQuickCreate(can('mission.create') ? 'mission' : 'project')}
            >
              <Plus size={15} />
              <span className="button-label-hide-xs">Quick Create</span>
            </button>

            {sidebarCollapsed && <AccountMenu variant="topbar" />}
          </>
        ) : (
          <Link to="/register" className="button button-bright button-small">
            Join The Arena <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </header>
  )
}
