import { ArrowRight, ArrowUpRight, Flame, FolderKanban, Target, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useArena } from '../../app/arenaContext'
import nexusHeroBackground from '../../assets/NexusHeroBg.jpg'
import nexusHero from '../../assets/NexusHero.png'

export default function HeroSection() {
  const { state } = useArena()
  const activeMissionsCount = state.missions.filter((m) => m.status === 'active').length
  const membersCount = state.members.length
  const projectsCount = state.projects.length

  const metrics = [
    { icon: UsersRound, value: `${membersCount} active`, label: 'Seeded Spartans' },
    { icon: Target, value: `${activeMissionsCount}`, label: 'Active Missions' },
    { icon: FolderKanban, value: `${projectsCount}`, label: 'Live Projects' },
    { icon: Flame, value: '6 Houses', label: 'Canonical Disciplines' },
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
          Discover your House, learn through structured Academy tracks, execute Proof-of-Work Missions, and earn verifiable Contribution Points.
        </p>
        <div className="hero-proof">
          <span className="hero-proof-stars" aria-label="Arena Season 2">★★★★★</span>
          <span><b>Season 2 · 90-Day Cycle</b> · Open to Builders &amp; Learners</span>
        </div>
        <div className="hero-actions">
          <Link className="button button-bright" to="/home">Enter The Arena <ArrowRight size={17} /></Link>
          <Link className="button button-quiet" to="/missions">Explore Missions <ArrowUpRight size={16} /></Link>
        </div>
      </div>

      <aside className="hero-feature-card">
        <div className="hero-feature-icon">A</div>
        <div className="hero-feature-copy">
          <span className="section-kicker">UNIFIED ACCOUNT</span>
          <h2>Start as a<br />New Spartan.</h2>
          <Link to="/register">Join &amp; pick your House <ArrowRight size={15} /></Link>
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
