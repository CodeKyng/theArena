import { ArrowRight, ArrowUpRight, BriefcaseBusiness, FolderKanban, Globe2, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import nexusHeroBackground from '../../assets/NexusHeroBg.jpg'
import nexusHero from '../../assets/NexusHero.png'

const metrics = [
  { icon: UsersRound, value: '12.4k+', label: 'Builders' },
  { icon: BriefcaseBusiness, value: '86', label: 'Open opportunities' },
  { icon: FolderKanban, value: '327', label: 'Projects' },
  { icon: Globe2, value: '40+', label: 'Ecosystems' },
]

export default function HeroSection() {
  return (
    <section className="hero-section" id="explore">
      <img className="hero-background" src={nexusHeroBackground} alt="" aria-hidden="true" />
      <div className="hero-background-wash" aria-hidden="true" />
      <img className="hero-person" src={nexusHero} alt="A builder wearing a digital reality visor" />

      <div className="hero-copy">
        <div className="eyebrow"><span className="live-dot" /> THE HOME OF WEB3 BUILDERS</div>
        <h1>Build what<br />comes <em>next.</em></h1>
        <p className="hero-description">Find your people. Discover meaningful work. Build what comes next—together.</p>
        <div className="hero-proof">
          <span className="hero-proof-stars" aria-label="Rated 4.9 out of 5">★★★★★</span>
          <span><b>12,400+</b> builders already here</span>
        </div>
        <div className="hero-actions">
          <Link className="button button-bright" to="/discover">Find your people <ArrowRight size={17} /></Link>
          <Link className="button button-quiet" to="/opportunities">Explore opportunities <ArrowUpRight size={16} /></Link>
        </div>
      </div>

      <aside className="hero-feature-card">
        <div className="hero-feature-icon">A</div>
        <div className="hero-feature-copy">
          <span className="section-kicker">YOUR NEXT MOVE</span>
          <h2>Find your next<br />way to build.</h2>
          <Link to="/opportunities">Explore opportunities <ArrowRight size={15} /></Link>
        </div>
        <Link className="hero-feature-arrow" to="/discover" aria-label="Discover the Arena"><ArrowUpRight size={18} /></Link>
      </aside>

      <div className="hero-metrics" aria-label="Arena community at a glance">
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
