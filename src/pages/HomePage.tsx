import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Flame,
  Target,
} from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import WorkspaceOverview from '../components/WorkspaceOverview'
import { buildLeaderboard } from '../domain/progression'
import type { HouseId } from '../domain/types'

export default function HomePage() {
  const {
    state,
    currentMember,
    completeOrientation,
    updateHouses,
  } = useArena()
  const navigate = useNavigate()

  const [primaryPick, setPrimaryPick] = useState<string>(currentMember?.primaryHouseId ?? '')
  const [secondaryPick, setSecondaryPick] = useState<string>(currentMember?.secondaryHouseId ?? '')

  const activeMissions = state.missions.filter((m) => m.status === 'active')
  const recommendedMissions = currentMember?.primaryHouseId
    ? [
        ...activeMissions.filter(
          (m) =>
            m.houseId === currentMember.primaryHouseId ||
            m.houseId === currentMember.secondaryHouseId ||
            m.crossHouseEligible,
        ),
        ...activeMissions.filter(
          (m) =>
            m.houseId !== currentMember.primaryHouseId &&
            m.houseId !== currentMember.secondaryHouseId &&
            !m.crossHouseEligible,
        ),
      ].slice(0, 4)
    : activeMissions.slice(0, 4)

  const upcomingEvents = state.events.filter((e) => !e.isPast).slice(0, 3)
  const myNotifications = currentMember
    ? state.notifications.filter((n) => n.memberId === currentMember.id).slice(0, 4)
    : []

  const compactLeaderboard = buildLeaderboard({
    members: state.members,
    xpTransactions: state.xpTransactions,
    cpEvents: state.cpEvents,
    contributions: state.contributionRecords,
    thresholds: state.config.levelThresholds,
    category: 'overall',
    period: 'season',
    seasonId: state.currentSeason.id,
    viewerMemberId: currentMember?.id ?? null,
  }).slice(0, 5)

  const recentContribs = state.contributionRecords.slice(0, 4)

  return (
    <PageScaffold
      section={state.currentSeason.name}
      name={
        currentMember
          ? `Welcome back, ${currentMember.displayName.split(' ')[0]}`
          : 'Welcome to The Arena'
      }
      description={
        currentMember
          ? 'Track your House momentum, open Missions, Academy progress, and verifiable Contribution Points.'
          : 'Explore active Missions, the 6 canonical Houses, Academy learning paths, and community events.'
      }
      actions={
        <>
          <Link className="button button-quiet" to="/houses">
            <Flame size={15} /> Explore Houses
          </Link>
          <Link className="button button-bright" to="/missions">
            <Target size={15} /> Browse Missions
          </Link>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {currentMember && currentMember.onboardingStage === 'newbie' && (
          <section
            className="dashboard-panel"
            style={{ borderLeft: '4px solid #1e5cb5', background: '#f8fbff' }}
            aria-label="New Spartan Onboarding Checklist"
          >
            <div className="panel-title">
              <div>
                <span className="section-kicker" style={{ color: '#1e5cb5' }}>
                  NEW SPARTAN ONBOARDING · NEWBIE STAGE
                </span>
                <h2>Start your Arena journey</h2>
              </div>
              <span className="listing-kind kind-featured">
                {Object.values(currentMember.onboardingChecklist).filter(Boolean).length} / 6 steps
              </span>
            </div>

            <div className="arena-grid-2" style={{ alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 11, background: '#fff', border: '1px solid #d7e2f1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    {currentMember.onboardingChecklist.orientationCompleted ? (
                      <CheckCircle2 size={18} color="#166534" />
                    ) : (
                      <Circle size={18} color="#70829a" />
                    )}
                    <div>
                      <b style={{ fontSize: 13.5 }}>1. Orientation &amp; Rules Check</b>
                      <div style={{ fontSize: 12, color: '#52647d' }}>
                        Learn Proof-of-Work &amp; anti-farming rules (+{state.config.systemXpValues.orientationOnce} XP once + Arena Ready badge)
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="button button-bright button-small"
                    disabled={currentMember.onboardingChecklist.orientationCompleted}
                    onClick={completeOrientation}
                  >
                    {currentMember.onboardingChecklist.orientationCompleted ? 'Completed' : 'Complete (+20 XP)'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 11, background: '#fff', border: '1px solid #d7e2f1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    {currentMember.onboardingChecklist.academyStarted ? (
                      <CheckCircle2 size={18} color="#166534" />
                    ) : (
                      <Circle size={18} color="#70829a" />
                    )}
                    <div>
                      <b style={{ fontSize: 13.5 }}>3. Pass First Academy Lesson</b>
                      <div style={{ fontSize: 12, color: '#52647d' }}>Start Web3 &amp; Arena Foundations (+5 XP, +1 CP)</div>
                    </div>
                  </div>
                  <Link className="button button-quiet button-small" to="/academy">Open Academy</Link>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 11, background: '#fff', border: '1px solid #d7e2f1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    {currentMember.onboardingChecklist.introMissionJoined ? (
                      <CheckCircle2 size={18} color="#166534" />
                    ) : (
                      <Circle size={18} color="#70829a" />
                    )}
                    <div>
                      <b style={{ fontSize: 13.5 }}>4. Join Guided Intro Mission</b>
                      <div style={{ fontSize: 12, color: '#52647d' }}>Submit your first House Case Study (+60 XP)</div>
                    </div>
                  </div>
                  <Link className="button button-quiet button-small" to="/missions/mis-intro">Open Intro</Link>
                </div>
              </div>

              <div style={{ padding: 14, background: '#fff', border: '1px solid #d7e2f1', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {currentMember.onboardingChecklist.housesSelected ? (
                    <CheckCircle2 size={18} color="#166534" />
                  ) : (
                    <Circle size={18} color="#70829a" />
                  )}
                  <b style={{ fontSize: 14 }}>2. Choose Primary &amp; Secondary Houses (0 XP)</b>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#52647d' }}>
                  House choice shapes your identity and recommendations. Selecting Houses intentionally awards 0 XP.
                </p>
                <div className="form-grid" style={{ gap: 10 }}>
                  <label>
                    Primary House
                    <select
                      value={primaryPick || currentMember.primaryHouseId || ''}
                      onChange={(e) => setPrimaryPick(e.target.value)}
                    >
                      <option value="">Select Primary House...</option>
                      {state.houses.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.glyph} {h.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Secondary House (optional)
                    <select
                      value={secondaryPick || currentMember.secondaryHouseId || ''}
                      onChange={(e) => setSecondaryPick(e.target.value)}
                    >
                      <option value="">None</option>
                      {state.houses
                        .filter((h) => h.id !== (primaryPick || currentMember.primaryHouseId))
                        .map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.glyph} {h.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="button button-bright button-small"
                    onClick={() => {
                      const p = (primaryPick || currentMember.primaryHouseId || null) as HouseId | null
                      const s = (secondaryPick || currentMember.secondaryHouseId || null) as HouseId | null
                      updateHouses(p, s === p ? null : s)
                    }}
                  >
                    Save Houses
                  </button>
                  <Link className="button button-quiet button-small" to="/profile">
                    Complete Profile
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <WorkspaceOverview />

        <div className="dashboard-columns">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section className="dashboard-panel">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">FOR YOUR HOUSES</span>
                  <h2>Recommended Missions</h2>
                </div>
                <Link className="text-link" to="/missions">All missions <ArrowRight size={14} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recommendedMissions.map((m) => {
                  const house = state.houses.find((h) => h.id === m.houseId)
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: 12,
                        border: '1px solid #e3ebf5',
                        borderRadius: 9,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span className="listing-kind">{house?.glyph} House {house?.name}</span>
                          {m.crossHouseEligible && <span className="listing-kind kind-featured">Cross-House</span>}
                          <span className="tag">{m.participationFormat}</span>
                        </div>
                        <Link to={`/missions/${m.id}`} style={{ fontWeight: 700, fontSize: 14.5, color: '#080d16' }}>
                          {m.title}
                        </Link>
                        <div style={{ fontSize: 12.5, color: '#52647d', marginTop: 2 }}>{m.objective}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="listing-reward">+{m.budget.rewardPerContributorXp} XP · +{m.budget.cpTierValue} CP</span>
                        <button
                          type="button"
                          className="button button-quiet button-small"
                          onClick={() => navigate(`/missions/${m.id}`)}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">VERIFIED PROOF OF WORK</span>
                  <h2>Recent Arena Contributions</h2>
                </div>
                <Link className="text-link" to="/houses">Houses <ArrowRight size={14} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentContribs.map((cr) => {
                  const author = state.members.find((m) => m.id === cr.memberId)
                  const house = state.houses.find((h) => h.id === cr.houseId)
                  return (
                    <div key={cr.id} style={{ display: 'flex', gap: 10, paddingTop: 10, borderTop: '1px solid #edf2f8' }}>
                      <span className="avatar avatar-small">{author?.avatarInitials ?? 'SP'}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5 }}>
                          <b>{author?.displayName ?? 'Spartan'}</b> completed <b>{cr.title}</b>{' '}
                          <span className="tag">House {house?.name}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#52647d', marginTop: 2 }}>{cr.deliverableSummary}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section className="dashboard-panel">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">SEASONAL RANKINGS (CP)</span>
                  <h2>Leaderboard Preview</h2>
                </div>
                <Link className="text-link" to="/leaderboards">Full board <ArrowRight size={14} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {compactLeaderboard.map((row) => (
                  <div
                    key={row.memberId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: row.memberId === currentMember?.id ? '#eef5ff' : '#f8faff',
                      border: '1px solid #e1eaf5',
                    }}
                  >
                    <span style={{ font: '700 12px DM Mono, monospace', width: 22, color: '#52647d' }}>#{row.rank}</span>
                    <span className="avatar avatar-small">{row.avatarInitials}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.displayName}
                      </div>
                      <div style={{ fontSize: 11, color: '#52647d' }}>{row.ascendancyRank} · L{row.numericLevel}</div>
                    </div>
                    <strong style={{ font: '700 13px DM Mono, monospace', color: '#1e5cb5' }}>{row.cpScore} CP</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">ARENA CALENDAR</span>
                  <h2>Upcoming Events</h2>
                </div>
                <Link className="text-link" to="/events">All events <ArrowRight size={14} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {upcomingEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to="/events"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: 10,
                      border: '1px solid #e3ebf5',
                      borderRadius: 8,
                    }}
                  >
                    <Calendar size={16} color="#1e5cb5" style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#080d16' }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: '#52647d' }}>
                        {ev.kind} · {new Date(ev.startsAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">ACADEMY PICKS</span>
                  <h2>Structured Learning</h2>
                </div>
                <Link className="text-link" to="/academy">Open Academy <ArrowRight size={14} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {state.academyPaths.slice(0, 2).map((p) => (
                  <Link
                    key={p.id}
                    to="/academy"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 10,
                      border: '1px solid #e3ebf5',
                      borderRadius: 8,
                    }}
                  >
                    <BookOpen size={16} color="#1e5cb5" />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: '#52647d' }}>{p.modules.length} module(s) · {p.track}</div>
                    </div>
                  </Link>
                ))}
              </div>

              {currentMember && myNotifications.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #e5ecf6' }}>
                  <div className="section-kicker" style={{ marginBottom: 8 }}>RECENT NOTIFICATIONS</div>
                  {myNotifications.slice(0, 2).map((n) => (
                    <div key={n.id} style={{ fontSize: 12.5, padding: '6px 0', color: '#344760' }}>
                      <b>{n.title}:</b> {n.body}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </PageScaffold>
  )
}
