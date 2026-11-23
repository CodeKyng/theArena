import { Link, useSearchParams } from 'react-router-dom'
import { Award, Bookmark, History, Lock, Sparkles, Target, Trophy } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import PermissionGate from '../components/PermissionGate'
import StatCard from '../components/StatCard'
import {
  formatMissionStatus,
  formatSubmissionStatus,
  getHouseName,
} from '../domain/constants'

type ActivityTab =
  | 'contributions'
  | 'missions'
  | 'submissions'
  | 'applications'
  | 'saved'
  | 'xp'
  | 'progress'

const VALID_ACTIVITY_TABS: ActivityTab[] = [
  'contributions',
  'missions',
  'submissions',
  'applications',
  'saved',
  'xp',
  'progress',
]

function formatEnumLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
}

export default function ActivityPage() {
  const { state, currentMember, xpBalance, levelProgress, toggleBookmark } = useArena()
  const [searchParams, setSearchParams] = useSearchParams()
  const paramTab = searchParams.get('tab') as ActivityTab | null
  const tab: ActivityTab = paramTab && VALID_ACTIVITY_TABS.includes(paramTab) ? paramTab : 'contributions'

  const changeTab = (next: ActivityTab) => {
    setSearchParams({ tab: next })
  }

  return (
    <PageScaffold
      section="Personal Ledger"
      name="My Activity"
      description="Approved deliverables, mission escrow, XP history, seasonal CP, and achievements."
      actions={
        <Link className="button button-quiet" to="/leaderboards">
          <Trophy size={15} /> View Leaderboards
        </Link>
      }
    >
      <PermissionGate title="My Activity">
        {currentMember && (() => {
          const myContributions = state.contributionRecords.filter((c) => c.memberId === currentMember.id)
          const myCreatedMissions = state.missions.filter((m) => m.creatorMemberId === currentMember.id)
          const mySubmissions = state.submissions.filter((s) => s.memberId === currentMember.id)
          const myApplications = state.missionParticipations.filter(
            (p) => p.memberId === currentMember.id && (p.status === 'applied' || p.status === 'accepted' || p.status === 'declined'),
          )
          const myBookmarks = state.savedBookmarks.filter((b) => b.memberId === currentMember.id)
          const myXpLedger = state.xpTransactions
            .filter((tx) => tx.memberId === currentMember.id)
            .slice()
            .reverse()
          const myCpEvents = state.cpEvents.filter(
            (e) => e.memberId === currentMember.id && e.seasonId === state.currentSeason.id,
          )
          const myTotalSeasonCp = myCpEvents.reduce((sum, e) => sum + e.cpAmount, 0)
          const myAttendanceCp = myCpEvents
            .filter((e) => e.activityCategory === 'event_attendance')
            .reduce((sum, e) => sum + e.cpAmount, 0)
          const mySupportCp = myCpEvents
            .filter((e) => e.activityCategory === 'community_support')
            .reduce((sum, e) => sum + e.cpAmount, 0)
          const unlockedIds = new Set(
            state.memberAchievements.filter((ma) => ma.memberId === currentMember.id).map((ma) => ma.achievementId),
          )

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="stats-row">
                <StatCard
                  label="Lifetime XP"
                  value={`${xpBalance.lifetimeXp.toLocaleString()} XP`}
                  change={`Level ${levelProgress.level} / 30`}
                  icon={<Award size={16} />}
                />
                <StatCard
                  label="Spendable XP"
                  value={`${xpBalance.spendableXp.toLocaleString()} XP`}
                  change="Available to fund missions"
                  icon={<Sparkles size={16} />}
                />
                <StatCard
                  label="Reserved Escrow XP"
                  value={`${xpBalance.reservedXp.toLocaleString()} XP`}
                  change="Locked in open missions"
                  icon={<Lock size={16} />}
                />
                <StatCard
                  label="Season CP"
                  value={`${myTotalSeasonCp} CP`}
                  change="Seasonal contribution standing"
                  icon={<Trophy size={16} />}
                />
              </div>

              <div className="arena-tabs" role="tablist">
                {(
                  [
                    ['contributions', `Contributions (${myContributions.length})`],
                    ['missions', `Created Missions (${myCreatedMissions.length})`],
                    ['submissions', `Submissions (${mySubmissions.length})`],
                    ['applications', `Applications (${myApplications.length})`],
                    ['saved', `Saved (${myBookmarks.length})`],
                    ['xp', `XP History (${myXpLedger.length})`],
                    ['progress', `Progress & Recognition (${unlockedIds.size}/${state.achievements.length})`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    className={`arena-tab ${tab === id ? 'active' : ''}`}
                    onClick={() => changeTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'contributions' && (
                <div className="dashboard-panel">
                  <div className="panel-title">
                    <h2>Verified Contribution Records ({myContributions.length})</h2>
                  </div>
                  {myContributions.length === 0 ? (
                    <p style={{ color: 'var(--arena-muted)', margin: 0 }}>
                      Complete a mission, Academy path, or verified event to build your contribution record.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {myContributions.map((cr) => (
                        <div key={cr.id} style={{ padding: 12, border: '1px solid var(--arena-line)', borderRadius: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <b>{cr.title}</b>
                            <span className="tag">House {getHouseName(cr.houseId, state.houses)} · {formatEnumLabel(cr.sourceKind)}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--arena-muted)', marginTop: 4 }}>{cr.deliverableSummary}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'missions' && (
                <div className="arena-grid-2">
                  {myCreatedMissions.length === 0 ? (
                    <div className="empty-state">
                      <span><Target size={22} /></span>
                      <h3>No created missions yet</h3>
                      <p>Members with Mission Creator permission can launch funded missions using Spendable XP.</p>
                    </div>
                  ) : (
                    myCreatedMissions.map((m) => (
                      <div className="listing-card" key={m.id}>
                        <div className="listing-top">
                          <span className="listing-kind">{formatMissionStatus(m.status)}</span>
                          <span className="tag">House {getHouseName(m.houseId, state.houses)}</span>
                        </div>
                        <h3>{m.title}</h3>
                        <p>
                          Escrow remaining: <b>{m.budget.remainingReservedXp} XP</b> · Settled: {m.budget.settledXp} XP · Refunded: {m.budget.refundedXp} XP
                        </p>
                        <div className="listing-bottom">
                          <span className="listing-reward">+{m.budget.rewardPerContributorXp} XP</span>
                          <Link className="arrow-button" to={`/missions/${m.id}`}>Manage</Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'submissions' && (
                <div className="arena-table-wrap">
                  <table className="arena-table">
                    <thead>
                      <tr>
                        <th>Mission</th>
                        <th>Summary</th>
                        <th>Status</th>
                        <th>Version</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySubmissions.map((s) => {
                        const m = state.missions.find((x) => x.id === s.missionId)
                        return (
                          <tr key={s.id}>
                            <td><b>{m?.title ?? s.missionId}</b></td>
                            <td>{s.summary}</td>
                            <td><span className="listing-kind">{formatSubmissionStatus(s.status)}</span></td>
                            <td>v{s.version}</td>
                            <td><Link className="button button-quiet button-small" to={`/missions/${s.missionId}`}>Open</Link></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'applications' && (
                <div className="dashboard-panel">
                  <div className="panel-title">
                    <h2>Mission Applications ({myApplications.length})</h2>
                  </div>
                  {myApplications.length === 0 ? (
                    <p style={{ color: 'var(--arena-muted)', margin: 0 }}>You have not applied to any application-gated missions.</p>
                  ) : (
                    myApplications.map((app) => {
                      const m = state.missions.find((x) => x.id === app.missionId)
                      return (
                        <div key={app.id} style={{ padding: 12, borderTop: '1px solid var(--arena-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <b>{m?.title ?? app.missionId}</b>
                            <div style={{ fontSize: 12.5, color: 'var(--arena-muted)' }}>{app.applicationNote}</div>
                          </div>
                          <span className="listing-kind">{formatEnumLabel(app.status)}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {tab === 'saved' && (
                <div className="arena-grid-3">
                  {myBookmarks.length === 0 ? (
                    <div className="empty-state">
                      <span><Bookmark size={22} /></span>
                      <h3>Nothing bookmarked</h3>
                      <p>Save Missions, Opportunities, Projects, or Resources to revisit them here.</p>
                    </div>
                  ) : (
                    myBookmarks.map((b) => {
                      const label =
                        b.targetType === 'mission'
                          ? state.missions.find((m) => m.id === b.targetId)?.title
                          : b.targetType === 'opportunity'
                            ? state.opportunities.find((o) => o.id === b.targetId)?.title
                            : b.targetType === 'project'
                              ? state.projects.find((p) => p.id === b.targetId)?.title
                              : state.resources.find((r) => r.id === b.targetId)?.title
                      return (
                        <div className="dashboard-panel" key={`${b.targetType}-${b.targetId}`}>
                          <span className="tag">{formatEnumLabel(b.targetType)}</span>
                          <h3 style={{ margin: '8px 0' }}>{label ?? b.targetId}</h3>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {b.targetType === 'mission' && (
                              <Link className="button button-bright button-small" to={`/missions/${b.targetId}`}>Open</Link>
                            )}
                            <button
                              type="button"
                              className="button button-quiet button-small"
                              onClick={() => toggleBookmark(b.targetType, b.targetId)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {tab === 'xp' && (
                <div className="arena-table-wrap">
                  <table className="arena-table">
                    <thead>
                      <tr>
                        <th><History size={13} style={{ verticalAlign: 'middle' }} /> Type</th>
                        <th>Source</th>
                        <th>Reason</th>
                        <th>Lifetime XP</th>
                        <th>Spendable XP</th>
                        <th>Reserved XP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myXpLedger.map((tx) => (
                        <tr key={tx.id}>
                          <td><span className="listing-kind">{formatEnumLabel(tx.transactionType)}</span></td>
                          <td>{formatEnumLabel(tx.sourceType)}</td>
                          <td>{tx.reason}</td>
                          <td>{tx.deltaLifetime >= 0 ? `+${tx.deltaLifetime}` : tx.deltaLifetime}</td>
                          <td>{tx.deltaSpendable >= 0 ? `+${tx.deltaSpendable}` : tx.deltaSpendable}</td>
                          <td>{tx.deltaReserved >= 0 ? `+${tx.deltaReserved}` : tx.deltaReserved}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'progress' && (
                <div className="achievement-experience">
                  <div className="achievement-hero">
                    <div>
                      <span className="section-kicker">PROOF OF SHOWING UP · {currentMember.ascendancyRank.toUpperCase()}</span>
                      <h2>Level {levelProgress.level} Progression<br />&amp; Recognition.</h2>
                      <p>
                        {levelProgress.isMaxLevel
                          ? 'Maximum Level 30 reached.'
                          : `${levelProgress.xpRemainingToNext} XP remaining to Level ${levelProgress.level + 1}.`}{' '}
                        Achievements celebrate verified contributions.
                      </p>
                      <div className="progress-track" style={{ marginTop: 12, maxWidth: 420 }}>
                        <i style={{ width: `${levelProgress.progressPercent}%` }} />
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--arena-muted)', display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
                        <span>Event Attendance Cap: <b>{myAttendanceCp} / {state.config.seasonalCpCaps.eventAttendancePerSeason} CP</b></span>
                        <span>Community Support Cap: <b>{mySupportCp} / {state.config.seasonalCpCaps.communitySupportPerSeason} CP</b></span>
                        <span>Mentorship Pair Cap: <b>{state.config.seasonalCpCaps.mentorshipPairPerSeason} CP / pair</b></span>
                      </div>
                    </div>
                    <div className="achievement-total">
                      <strong>{String(unlockedIds.size).padStart(2, '0')}</strong>
                      <span>OF {state.achievements.length} EARNED</span>
                    </div>
                  </div>

                  <div className="achievement-grid">
                    {state.achievements.map((ach, idx) => {
                      const earned = unlockedIds.has(ach.id)
                      return (
                        <article className={`achievement-card ${earned ? 'achievement-earned' : 'achievement-locked'}`} key={ach.id}>
                          <span className="badge-number">{String(idx + 1).padStart(2, '0')}</span>
                          <span className="badge-glyph" aria-hidden="true">{earned ? <Award size={16} /> : <Lock size={14} />}</span>
                          <h3>{ach.title}</h3>
                          <p>{ach.description}</p>
                          <small>{earned ? 'Earned' : `Requirement: ${ach.unlockConditionLabel}`}</small>
                        </article>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </PermissionGate>
    </PageScaffold>
  )
}
