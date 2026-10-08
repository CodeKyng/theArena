import { ArrowRight, Bell, ChevronRight, Menu, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { pagePath } from '../app/navigation'
import { useAppState } from '../app/appStateContext'
import { useAuth } from '../app/authContext'
import { homeForRole } from '../app/authRoutes'
import Brand from './Brand'

export default function Topbar({ landing, title, onMenu, flash }: {
  landing: boolean
  title: string
  onMenu: () => void
  flash: (message: string) => void
}) {
  const { search, setSearch } = useAppState()
  const { user, signOut } = useAuth()

  return (
    <header className={`topbar ${landing ? 'topbar-landing' : ''}`}>
      {landing ? <>
        <Brand />
        <nav className="landing-nav"><a href="#explore">Explore</a><a href="#how-it-works">How it works</a><a href="#community">Community</a></nav>
        <div className="topbar-actions">{user
          ? <><Link className="login-link" to={homeForRole(user.role)}>{user.name.split(' ')[0]}’s workspace</Link><button className="button button-bright button-small" onClick={signOut}>Sign out</button></>
          : <><Link className="login-link" to="/login">Log in</Link><Link className="button button-bright button-small" to="/register">Join the Arena <ArrowRight size={15} /></Link></>}
        </div>
      </> : <>
        <button className="icon-button menu-button" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
        <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><b>{title}</b></div>
        <div className="topbar-actions">
          <label className="global-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></label>
          <button className="icon-button notification-button" aria-label="Notifications" onClick={() => flash('You’re all caught up!')}><Bell size={18} /><i /></button>
          {user?.role === 'organization' && <Link className="button button-bright button-small" to={pagePath('Create Opportunity')}><Plus size={15} /> Post an opportunity</Link>}
          {user?.role === 'member' && <Link className="button button-bright button-small" to="/profile">My profile <ArrowRight size={15} /></Link>}
          {user?.role === 'admin' && <Link className="button button-bright button-small" to={pagePath('Content Moderation', 'admin')}>Review queue <ArrowRight size={15} /></Link>}
          {!user && <Link className="button button-bright button-small" to="/register">Join the Arena <ArrowRight size={15} /></Link>}
        </div>
      </>}
    </header>
  )
}
