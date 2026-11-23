import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useArena } from '../../app/arenaContext'

export default function CommunitySection() {
  const { state } = useArena()

  return (
    <section className="builder-section section-wrap" id="community">
      <div className="builder-intro">
        <div className="section-kicker">THE SIX HOUSES</div>
        <h2>Find your craft.<br /><em>Grow with your House.</em></h2>
        <p>
          Choose a Primary House—and an optional Secondary House—to focus your work, from engineering in Forge Masters to research in Seers and outreach in Echoes.
        </p>
        <Link className="button button-bright" to="/houses">
          Explore all 6 Houses <ArrowRight size={16} />
        </Link>
      </div>

      <div className="topic-panel">
        <div className="topic-panel-head">
          <div>
            <span className="section-kicker">THE ARENA HOUSES</span>
            <h3>Disciplines &amp; craft</h3>
          </div>
          <span className="topic-count">01 — 06</span>
        </div>
        {state.houses.map((house, index) => (
          <Link to={`/houses/${house.slug}`} className="topic-row" key={house.id}>
            <span className={`topic-icon ${house.tone === 'red' ? 'red' : house.tone === 'slate' ? 'purple' : 'blue'}`}>
              {house.glyph}
            </span>
            <span className="topic-name">
              <b>House {house.name}</b>
              <small>{house.tagline}</small>
            </span>
            <span className="topic-index">0{index + 1}</span>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </div>
    </section>
  )
}
