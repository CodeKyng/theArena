import { useState } from 'react'
import { Award, ShieldCheck, Trophy } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import { buildLeaderboard } from '../domain/progression'
import type { HouseId, LeaderboardCategory, LeaderboardPeriod } from '../domain/types'

const CATEGORY_TABS: { id: LeaderboardCategory; label: string }[] = [
  { id: 'overall', label: 'Overall CP' },
  { id: 'house', label: 'By House' },
  { id: 'missions', label: 'Missions' },
  { id: 'learning', label: 'Learning' },
  { id: 'community_stewardship', label: 'Community & Stewardship' },
]

export default function LeaderboardsPage() {
  const { state, currentMember } = useArena()
  const [category, setCategory] = useState<LeaderboardCategory>('overall')
  const [period, setPeriod] = useState<LeaderboardPeriod>('season')
  const [houseFilter, setHouseFilter] = useState<HouseId>('forge-masters')

  const entries = buildLeaderboard({
    members: state.members,
    xpTransactions: state.xpTransactions,
    cpEvents: state.cpEvents,
    contributions: state.contributionRecords,
    thresholds: state.config.levelThresholds,
    category,
    period,
    seasonId: state.currentSeason.id,
    houseFilter: category === 'house' ? houseFilter : undefined,
    viewerMemberId: currentMember?.id ?? null,
  })

  const maxCp = Math.max(1, ...entries.map((e) => e.cpScore))
  const top3 = entries.slice(0, 3)

  return (
    <PageScaffold
      section="Standing & Merit"
      name="Leaderboards"
      description="Seasonal and all-time Contribution Point standings—cleanly separated from XP."
    >
      <div className="leaderboard-experience">
        <div className="leaderboard-hero">
          <div>
            <span className="section-kicker">
              {period === 'season' ? state.currentSeason.name : 'ALL-TIME CUMULATIVE RANKINGS'}
            </span>
            <h2>Contribution Point Leaderboards</h2>
            <p>
              Rankings strictly measure Contribution Points (CP)—never XP. Spending or reserving Spendable XP never affects your leaderboard standing.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`button button-small ${period === 'season' ? 'button-quiet' : 'button-bright'}`}
                onClick={() => setPeriod('season')}
              >
                Current Season (90-Day)
              </button>
              <button
                type="button"
                className={`button button-small ${period === 'all_time' ? 'button-quiet' : 'button-bright'}`}
                onClick={() => setPeriod('all_time')}
              >
                All-Time
              </button>
            </div>
          </div>

          <div className="podium" aria-label="Top 3 contributors">
            {top3[1] && (
              <div className="podium-person podium-second">
                <span>{top3[1].avatarInitials}</span>
                <b>{top3[1].displayName}</b>
                <small>#{top3[1].rank} · L{top3[1].numericLevel}</small>
                <i>{top3[1].cpScore} CP</i>
              </div>
            )}
            {top3[0] && (
              <div className="podium-person podium-first">
                <span>{top3[0].avatarInitials}</span>
                <b>{top3[0].displayName}</b>
                <small>#{top3[0].rank} · L{top3[0].numericLevel}</small>
                <i>{top3[0].cpScore} CP</i>
              </div>
            )}
            {top3[2] && (
              <div className="podium-person podium-third">
                <span>{top3[2].avatarInitials}</span>
                <b>{top3[2].displayName}</b>
                <small>#{top3[2].rank} · L{top3[2].numericLevel}</small>
                <i>{top3[2].cpScore} CP</i>
              </div>
            )}
          </div>
        </div>

        <div className="arena-tabs" role="tablist">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={category === t.id}
              className={`arena-tab ${category === t.id ? 'active' : ''}`}
              onClick={() => setCategory(t.id)}
            >
              <Trophy size={14} /> {t.label}
            </button>
          ))}
        </div>

        {category === 'house' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {state.houses.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`button button-small ${houseFilter === h.id ? 'button-bright' : 'button-quiet'}`}
                onClick={() => setHouseFilter(h.id)}
              >
                {h.glyph} House {h.name}
              </button>
            ))}
          </div>
        )}

        {currentMember && !currentMember.privacy.showOnLeaderboard && (
          <div className="arena-notice arena-notice-info">
            <ShieldCheck size={16} />
            <span>
              Privacy setting active: you opted out of public leaderboards in Settings, so other visitors do not see your rank (visible only to you here).
            </span>
          </div>
        )}

        <div className="rank-list">
          {entries.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--arena-muted)' }}>
              No ranked contributions match this filter yet.
            </div>
          ) : (
            entries.map((row) => {
              const houseName = row.primaryHouseId
                ? state.houses.find((h) => h.id === row.primaryHouseId)?.name
                : 'Unassigned'
              const isYou = row.memberId === currentMember?.id
              return (
                <div className={`rank-row ${isYou ? 'rank-you' : ''}`} key={row.memberId}>
                  <span className="rank-number">#{row.rank}</span>
                  <span className="avatar avatar-small">{row.avatarInitials}</span>
                  <div className="rank-person">
                    <b>
                      {row.displayName} {isYou && <span className="tag" style={{ marginLeft: 6 }}>You</span>}
                    </b>
                    <small>
                      <Award size={11} style={{ verticalAlign: 'middle' }} /> {row.ascendancyRank} · L{row.numericLevel} · House {houseName} · {row.contributionsCount} verified records
                    </small>
                  </div>
                  <div className="rank-meter" aria-hidden="true">
                    <i style={{ width: `${Math.max(4, Math.round((row.cpScore / maxCp) * 100))}%` }} />
                  </div>
                  <div className="rank-score">{row.cpScore} CP</div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </PageScaffold>
  )
}
