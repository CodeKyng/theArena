import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, ChevronRight, Menu, Plus, Search, X } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import { LANDING_LINKS, resolveBreadcrumb } from '../app/navigation'
import Brand from './Brand'

export default function Topbar({
  landing = false,
  onOpenMobileMenu,
}: {
  landing?: boolean
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

  const breadcrumb = resolveBreadcrumb(pathname, (slug) =>
    state.houses.find((h) => h.slug === slug)?.id,
  )

  const myNotifications = currentMember
    ? state.notifications.filter((n) => n.memberId === currentMember.id).slice(0, 8)
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
                <Link className="login-link" to="/home">
                  {currentMember.displayName.split(' ')[0]}’s workspace
                </Link>
                <button
                  type="button"
                  className="button button-bright button-small"
                  onClick={signOut}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link className="login-link" to="/login">Log in</Link>
                <Link className="button button-bright button-small" to="/register">
                  Join the Arena <ArrowRight size={15} />
                </Link>
              </>
            )}
            <button
              type="button"
              className="icon-button landing-mobile-toggle"
              aria-label={landingMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
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
              <Link to="/home" onClick={() => setLandingMenuOpen(false)}>
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
        >
          <Menu size={18} />
        </button>

        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <span>{breadcrumb.group}</span>
          <ChevronRight size={13} />
          <b>{breadcrumb.page}</b>
        </nav>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="global-search"
          onClick={() => setSearchModalOpen(true)}
          aria-label="Open global search"
        >
          <Search size={15} />
          <span>Search Arena...</span>
          <kbd>⌘K</kbd>
        </button>

        {currentMember ? (
          <>
            <div className="arena-popover-wrap">
              <button
                type="button"
                className="icon-button notification-button"
                aria-label={`Notifications (${unreadNotificationsCount} unread)`}
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
                    <p style={{ margin: 0, fontSize: 12.5, color: '#647790' }}>No notifications yet.</p>
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
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#080d16' }}>{n.title}</div>
                          <div style={{ fontSize: 11.5, color: '#52647d', marginTop: 2 }}>{n.body}</div>
                        </button>
                      ))}
                    </div>
                  )}
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
          </>
        ) : (
          <Link to="/register" className="button button-bright button-small">
            Join the Arena <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </header>
  )
}
