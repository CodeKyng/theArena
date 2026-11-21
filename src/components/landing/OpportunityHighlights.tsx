import { ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useArena } from '../../app/arenaContext'
import ListingCard from '../ListingCard'

export default function OpportunityHighlights() {
  const { state, currentMember, toggleBookmark } = useArena()
  const navigate = useNavigate()
  const featured = state.missions.filter((m) => m.status === 'active').slice(0, 3)

  return (
    <section className="discover-section section-wrap">
      <div className="section-heading">
        <div>
          <div className="section-kicker">ACTIVE MISSIONS</div>
          <h2>Proof of Work in <em>action.</em></h2>
          <p>Funded missions reserve Spendable XP upfront and settle verified contributions to your Ledger and CP.</p>
        </div>
        <Link className="text-link" to="/missions">Browse all missions <ArrowRight size={16} /></Link>
      </div>

      <div className="opportunity-grid">
        {featured.map((mission) => {
          const house = state.houses.find((h) => h.id === mission.houseId)
          const saved = currentMember
            ? state.savedBookmarks.some(
                (b) => b.memberId === currentMember.id && b.targetType === 'mission' && b.targetId === mission.id,
              )
            : false
          return (
            <ListingCard
              key={mission.id}
              glyph={house?.glyph ?? '⌘'}
              tone={house?.tone ?? 'blue'}
              kind={`House ${house?.name ?? mission.houseId}`}
              kindTone="featured"
              meta={`${mission.category} · ${mission.difficulty}`}
              title={mission.title}
              description={mission.description}
              tags={mission.tags.slice(0, 3)}
              reward={`+${mission.budget.rewardPerContributorXp} XP · +${mission.budget.cpTierValue} CP`}
              saved={saved}
              onToggleSave={() => toggleBookmark('mission', mission.id)}
              onOpen={() => navigate(`/missions/${mission.id}`)}
            />
          )
        })}
      </div>
    </section>
  )
}
