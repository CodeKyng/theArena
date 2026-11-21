import { ArrowRight, ArrowUpRight, Award, Compass, Sparkles, Trophy } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useArena } from '../app/arenaContext'
import StatCard from './StatCard'

export default function WorkspaceOverview() {
  const { state, currentMember, xpBalance, levelProgress } = useArena()
  const navigate = useNavigate()

  if (!currentMember) return null

  const seasonCp = state.cpEvents
    .filter((e) => e.memberId === currentMember.id && e.seasonId === state.currentSeason.id)
    .reduce((sum, e) => sum + e.cpAmount, 0)

  const primaryHouseName = currentMember.primaryHouseId
    ? state.houses.find((h) => h.id === currentMember.primaryHouseId)?.name
    : null

  const unlockedCount = state.memberAchievements.filter(
    (ma) => ma.memberId === currentMember.id,
  ).length

  const recommended = state.missions
    .filter((m) => m.status === 'active')
    .slice(0, 3)

  return (
    <>
      <div className="stats-row" aria-label="Personal progression metrics">
        <StatCard
          label="Lifetime XP & Level"
          value={`Level ${levelProgress.level} · ${xpBalance.lifetimeXp.toLocaleString()}`}
          change={
            levelProgress.isMaxLevel
              ? 'Max Level 30 reached'
              : `${levelProgress.xpRemainingToNext} XP to Level ${levelProgress.level + 1}`
          }
          icon={<Award size={17} />}
        />
        <StatCard
          label="Spendable XP"
          value={`${xpBalance.spendableXp.toLocaleString()} XP`}
          change={`${xpBalance.reservedXp.toLocaleString()} XP reserved in escrow`}
          icon={<Sparkles size={17} />}
        />
        <StatCard
          label="Ascendancy Rank"
          value={currentMember.ascendancyRank}
          change={primaryHouseName ? `Primary: House ${primaryHouseName}` : 'No Primary House selected'}
          icon={<Compass size={17} />}
        />
        <StatCard
          label="Season CP"
          value={`${seasonCp} CP`}
          change="Kept strictly separate from XP"
          icon={<Trophy size={17} />}
        />
      </div>

      <div className="dashboard-columns">
        <section className="dashboard-panel">
          <div className="panel-title">
            <div>
              <span className="section-kicker">MADE FOR YOUR NEXT MOVE</span>
              <h2>Active House Missions</h2>
            </div>
            <Link to="/missions">
              See all <ArrowRight size={14} />
            </Link>
          </div>
          {recommended.map((m) => {
            const house = state.houses.find((h) => h.id === m.houseId)
            return (
              <div className="compact-listing" key={m.id}>
                <span className={`org-mark ${house?.tone ?? 'blue'}`}>{house?.glyph ?? '⌘'}</span>
                <span>
                  <b>{m.title}</b>
                  <small>
                    House {house?.name ?? m.houseId} · +{m.budget.rewardPerContributorXp} XP · +{m.budget.cpTierValue} CP
                  </small>
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/missions/${m.id}`)}
                  aria-label={`Open ${m.title}`}
                >
                  <ArrowUpRight size={17} />
                </button>
              </div>
            )
          })}
        </section>

        <section className="dashboard-panel activity-panel">
          <div className="panel-title">
            <div>
              <span className="section-kicker">YOUR MOMENTUM</span>
              <h2>Level {levelProgress.level} Progression</h2>
            </div>
          </div>
          <div className="progress-copy">
            <span>Level {levelProgress.level} · {currentMember.ascendancyRank}</span>
            <b>{levelProgress.progressPercent}%</b>
          </div>
          <div className="progress-track">
            <i style={{ width: `${levelProgress.progressPercent}%` }} />
          </div>
          <p>
            {levelProgress.isMaxLevel
              ? 'You have reached Level 30 mastery in Lifetime XP.'
              : <>You’re <b>{levelProgress.xpRemainingToNext} XP</b> away from Level {levelProgress.level + 1}. {unlockedCount} achievements unlocked.</>}
          </p>
          <Link to="/activity?tab=progress" className="text-link">
            See your achievements &amp; ledger <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </>
  )
}
