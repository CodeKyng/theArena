import { ChevronDown, LogIn, LogOut, ShieldCheck, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { homeForRole } from '../app/authRoutes'
import { ADMIN_PAGES, MEMBER_PAGES, ORG_PAGES, pagePath } from '../app/navigation'
import Brand from './Brand'
import IconForPage from './IconForPage'

const workspacePages = ['Dashboard', 'Discover', 'Opportunities', 'Projects', 'Communities']
const explorePages = ['Services', 'Events', 'Learning Hub', 'Grants', 'Hackathons', 'Bounties', 'Organizations', 'Resources', 'Discussions', 'Leaderboard']
const personalPages = MEMBER_PAGES.filter((name) => name !== 'Dashboard')

function NavGroup({ title, pages, scope, dashboardPath }: { title: string; pages: string[]; scope?: 'organization' | 'admin'; dashboardPath?: string }) {
  return <>
    <label className="side-label side-label-spaced">{title}</label>
    <nav className="side-nav">
      {pages.map((name) => <NavLink key={name} to={name === 'Dashboard' && dashboardPath ? dashboardPath : pagePath(name, scope)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <IconForPage name={name} /><span>{name}</span>
        {name === 'Notifications' && <i className="nav-count">3</i>}
      </NavLink>)}
    </nav>
  </>
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth()
  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top"><Brand /><button className="icon-button mobile-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button></div>
      <button className="workspace-switch"><span className="workspace-avatar">{user?.name.slice(0, 1).toUpperCase() ?? 'A'}</span><span className="workspace-copy"><b>{user ? `${user.name}’s space` : 'Explore as guest'}</b><small>{user?.role ?? 'Public account'}</small></span><ChevronDown size={15} /></button>
      <NavGroup title="WORKSPACE" pages={workspacePages} dashboardPath={homeForRole(user?.role ?? 'member')} />
      <NavGroup title="EXPLORE" pages={explorePages} />
      {user?.role === 'member' && <NavGroup title="MY ARENA" pages={personalPages} />}
      {user?.role === 'organization' && <NavGroup title="ORGANIZATION STUDIO" pages={ORG_PAGES} scope="organization" />}
      {user?.role === 'admin' && <NavGroup title="ADMIN CONSOLE" pages={ADMIN_PAGES} scope="admin" />}
      <div className="sidebar-bottom">
        {user?.role === 'member' && <div className="xp-card">
          <div className="xp-heading"><span><Sparkles size={13} /> YOUR JOURNEY</span><b>Lvl 08</b></div>
          <strong>Builder</strong><div className="xp-bar"><i /></div><small>2,450 / 3,000 XP <span>550 to level up</span></small>
        </div>}
        {user?.role === 'organization' && <div className="xp-card role-card">
          <div className="xp-heading"><span><Sparkles size={13} /> TEAM PULSE</span><b>LIVE</b></div>
          <strong>4 active opportunities</strong><small>12 applicants this week</small>
        </div>}
        {user?.role === 'admin' && <div className="xp-card role-card">
          <div className="xp-heading"><span><ShieldCheck size={13} /> TRUST & SAFETY</span><b>OK</b></div>
          <strong>All systems clear</strong><small>Moderation queue: 6 items</small>
        </div>}
        {user
          ? <div className="profile-mini">
            <span className="avatar avatar-small">{user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
            <span><b>{user.name}</b><small>{user.role}</small></span>
            <button className="sidebar-signout" onClick={() => signOut()} title="Sign out" aria-label="Sign out"><LogOut size={16} /></button>
          </div>
          : <div className="guest-join"><p>Make this space yours.</p><Link className="button button-bright" to="/login"><LogIn size={14} /> Sign in</Link></div>}
      </div>
    </aside>
  )
}
