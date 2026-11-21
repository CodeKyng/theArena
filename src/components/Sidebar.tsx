import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  Award,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  Compass,
  Flame,
  Home,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Sliders,
  Target,
  Trophy,
  UserCheck,
  X,
} from 'lucide-react'
import { useArena } from '../app/arenaContext'
import {
  getGovernanceNavItems,
  PERSONAL_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
  type NavItem,
} from '../app/navigation'
import Brand from './Brand'

function renderNavIcon(icon: NavItem['icon']) {
  switch (icon) {
    case 'home':
      return <Home size={16} />
    case 'missions':
      return <Target size={16} />
    case 'houses':
      return <Flame size={16} />
    case 'explore':
      return <Compass size={16} />
    case 'academy':
      return <BookOpen size={16} />
    case 'events':
      return <Calendar size={16} />
    case 'leaderboards':
      return <Trophy size={16} />
    case 'activity':
      return <Activity size={16} />
    case 'profile':
      return <UserCheck size={16} />
    case 'stewardship':
      return <Shield size={16} />
    case 'control-room':
      return <Sliders size={16} />
  }
}

export default function Sidebar({
  open,
  collapsed,
  onToggleCollapse,
  onClose,
}: {
  open: boolean
  collapsed: boolean
  onToggleCollapse: () => void
  onClose: () => void
}) {
  const {
    state,
    currentMember,
    xpBalance,
    levelProgress,
    activeOrganisation,
    memberOrganisations,
    switchOrg,
    signOut,
  } = useArena()
  const navigate = useNavigate()
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)

  const governanceItems = getGovernanceNavItems(
    currentMember?.id ?? null,
    state.permissionGrants,
  )

  const pendingReviewsCount = state.submissions.filter(
    (s) => s.status === 'submitted' || s.status === 'under_review',
  ).length

  const activeHouseName = currentMember?.primaryHouseId
    ? state.houses.find((h) => h.id === currentMember.primaryHouseId)?.name ?? 'House'
    : 'No House Selected'

  return (
    <>
      {open && (
        <button
          type="button"
          className="mobile-scrim"
          aria-label="Close navigation menu"
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="Primary Arena navigation">
        <div className="sidebar-top">
          <Brand to="/home" />
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
          <button
            type="button"
            className="icon-button mobile-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          className="workspace-switch"
          onClick={() => {
            if (!currentMember) {
              navigate('/login')
              onClose()
              return
            }
            setOrgMenuOpen((prev) => !prev)
          }}
          aria-expanded={orgMenuOpen}
        >
          <span className="workspace-avatar">
            {activeOrganisation
              ? activeOrganisation.name.slice(0, 1).toUpperCase()
              : currentMember
                ? currentMember.avatarInitials
                : 'A'}
          </span>
          <span className="workspace-copy">
            <b>
              {activeOrganisation
                ? activeOrganisation.name
                : currentMember
                  ? currentMember.displayName
                  : 'Explore as guest'}
            </b>
            <small>
              {activeOrganisation
                ? `Org (${activeOrganisation.verificationStatus.replace('_', ' ')})`
                : currentMember
                  ? `${currentMember.ascendancyRank} · ${activeHouseName}`
                  : 'Public account'}
            </small>
          </span>
          <ChevronDown size={14} className="workspace-switch-chevron" />
        </button>

        {orgMenuOpen && currentMember && !collapsed && (
          <div className="org-switch-menu">
            <button
              type="button"
              className={`sidebar-link org-switch-item ${!activeOrganisation ? 'active' : ''}`}
              onClick={() => {
                switchOrg(null)
                setOrgMenuOpen(false)
              }}
            >
              <UserCheck size={14} />
              <span className="sidebar-link-label">Personal Spartan Context</span>
            </button>
            {memberOrganisations.map((org) => (
              <button
                key={org.id}
                type="button"
                className={`sidebar-link org-switch-item ${activeOrganisation?.id === org.id ? 'active' : ''}`}
                onClick={() => {
                  switchOrg(org.id)
                  setOrgMenuOpen(false)
                }}
              >
                <Building2 size={14} />
                <span className="sidebar-link-label">{org.name}</span>
              </button>
            ))}
            <Link
              to="/organisations"
              className="sidebar-link"
              onClick={() => {
                setOrgMenuOpen(false)
                onClose()
              }}
            >
              <Building2 size={14} />
              <span className="sidebar-link-label">Manage Organisations</span>
            </Link>
          </div>
        )}

        <label className="side-label">WORKSPACE</label>
        <nav className="side-nav">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {renderNavIcon(item.icon)}
              <span className="sidebar-link-label">{item.label}</span>
              {item.id === 'missions' && pendingReviewsCount > 0 && currentMember && (
                <i className="nav-count" title="Submissions awaiting review">
                  {pendingReviewsCount}
                </i>
              )}
            </NavLink>
          ))}
        </nav>

        {currentMember && (
          <>
            <label className="side-label side-label-spaced">MY ARENA</label>
            <nav className="side-nav">
              {PERSONAL_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  {renderNavIcon(item.icon)}
                  <span className="sidebar-link-label">{item.label}</span>
                </NavLink>
              ))}
              <NavLink
                to="/organisations"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Building2 size={16} />
                <span className="sidebar-link-label">Organisations</span>
              </NavLink>
            </nav>
          </>
        )}

        {governanceItems.length > 0 && (
          <>
            <label className="side-label side-label-spaced">GOVERNANCE</label>
            <nav className="side-nav">
              {governanceItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  {renderNavIcon(item.icon)}
                  <span className="sidebar-link-label">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </>
        )}

        <div className="sidebar-bottom">
          {currentMember ? (
            <>
              <div className="xp-card">
                <div className="xp-heading">
                  <span>
                    <Award size={12} /> LEVEL {levelProgress.level}
                  </span>
                  <b>{xpBalance.spendableXp} SPEND</b>
                </div>
                <strong>{currentMember.ascendancyRank}</strong>
                <div className="xp-bar">
                  <i style={{ width: `${levelProgress.progressPercent}%` }} />
                </div>
                <small>
                  {xpBalance.lifetimeXp.toLocaleString()} XP{' '}
                  <span>
                    {levelProgress.isMaxLevel
                      ? 'Max L30'
                      : `${levelProgress.xpRemainingToNext} to L${levelProgress.level + 1}`}
                  </span>
                </small>
              </div>

              <div className="profile-mini">
                <span className="avatar avatar-small">{currentMember.avatarInitials}</span>
                <span className="profile-mini-meta">
                  <b>{currentMember.displayName}</b>
                  <small>{currentMember.ascendancyRank}</small>
                </span>
                <button
                  type="button"
                  className="sidebar-signout"
                  onClick={() => {
                    signOut()
                    onClose()
                  }}
                  aria-label="Sign out to Visitor view"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="guest-join">
              <p>Make this space yours.</p>
              <Link
                to="/login"
                className="button button-bright"
                onClick={onClose}
              >
                <LogIn size={14} /> Sign in
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
