import { ArrowRight, ArrowUpRight, Flame, FolderKanban, Star, Target, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useArena } from '../../app/arenaContext'
import nexusHeroBackground from '../../assets/NexusHeroBg.jpg'
import nexusHero from '../../assets/NexusHero.png'

export default function HeroSection() {
  const { state, isAuthenticated } = useArena()
  const activeMissionsCount = state.missions.filter((m) => m.status === 'active').length
  const membersCount = state.members.length
  const projectsCount = state.projects.length

  const metrics = [
    { icon: UsersRound, value: `${membersCount} active`, label: 'Community Members' },
    { icon: Target, value: `${activeMissionsCount}`, label: 'Active Missions' },
    { icon: FolderKanban, value: `${projectsCount}`, label: 'Live Projects' },
    { icon: Flame, value: '6 Houses', label: 'Community Houses' },
  ]

  return (
    <section className="hero-section" id="explore">
      <img className="hero-background" src={nexusHeroBackground} alt="" aria-hidden="true" />
      <div className="hero-background-wash" aria-hidden="true" />
      <img className="hero-person" src={nexusHero} alt="A builder wearing a digital reality visor" />

      <div className="hero-copy">
        <div className="eyebrow"><span className="live-dot" /> A COMMUNITY FOR BECOMING</div>
        <h1>Build what<br />comes <em>next.</em></h1>
        <p className="hero-description">
          Join a House, build practical skills in the Academy, take on real missions, and earn recognition for verified work.
        </p>
        <div className="hero-proof">
          <span className="hero-proof-stars" aria-label="Arena Season 2">
            {[0, 1, 2, 3, 4].map((index) => (
              <Star key={index} size={15} fill="currentColor" strokeWidth={1.7} aria-hidden="true" />
            ))}
          </span>
          <span><b>Season 2 · 90-Day Cycle</b> · Open to Builders &amp; Learners</span>
        </div>
        <div className="hero-actions">
          <Link
            className="button button-bright"
            to={isAuthenticated ? '/dashboard' : '/login'}
            state={isAuthenticated ? undefined : { from: { pathname: '/dashboard', search: '', hash: '' } }}
          >
            Enter The Arena <ArrowRight size={17} />
          </Link>
          <Link className="button button-quiet" to="/missions">Explore Missions <ArrowUpRight size={16} /></Link>
        </div>
      </div>

      <aside className="hero-feature-card">
        <div className="hero-feature-icon">A</div>
        <div className="hero-feature-copy">
          <span className="section-kicker">GET STARTED</span>
          <h2>Start as a<br />New Spartan.</h2>
          <Link to="/register">Create your account <ArrowRight size={15} /></Link>
        </div>
        <Link className="hero-feature-arrow" to="/houses" aria-label="Explore the six Houses"><ArrowUpRight size={18} /></Link>
      </aside>

      <div className="hero-metrics" aria-label="Arena ecosystem at a glance">
        {metrics.map(({ icon: Icon, value, label }) => (
          <div className="hero-metric" key={label}>
            <span className="hero-metric-icon"><Icon size={21} strokeWidth={1.8} /></span>
            <span className="hero-metric-copy"><b>{value}</b><small>{label}</small></span>
          </div>
        ))}
      </div>
    </section>
  )
}
