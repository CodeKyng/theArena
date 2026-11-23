import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Compass,
  FolderGit2,
  Megaphone,
  MessageSquare,
  Sparkles,
  Trophy,
  Wrench,
} from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import StatCard from '../components/StatCard'
import { DISCUSSION_UNLOCK_LEVEL, formatParticipationFormat, getHouseName } from '../domain/constants'
import type { HouseId } from '../domain/types'
import { isOnboardingComplete } from '../services/arenaService'

export default function HomePage() {
  const {
    state,
    currentMember,
    xpBalance,
    levelProgress,
    completeOrientation,
    updateHouses,
    openQuickCreate,
    markNotificationRead,
  } = useArena()
  const navigate = useNavigate()

  const [primaryPick, setPrimaryPick] = useState<string>(currentMember?.primaryHouseId ?? '')
  const [secondaryPick, setSecondaryPick] = useState<string>(currentMember?.secondaryHouseId ?? '')

  const isSpartan = currentMember?.membershipStatus === 'spartan'
  const canCreateDiscussion = Boolean(isSpartan && levelProgress.level >= DISCUSSION_UNLOCK_LEVEL)

  const seasonCp = currentMember
    ? state.cpEvents
        .filter((e) => e.memberId === currentMember.id && e.seasonId === state.currentSeason.id)
        .reduce((sum, e) => sum + e.cpAmount, 0)
    : 0

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
      ].slice(0, 3)
    : activeMissions.slice(0, 3)

  const recentContribs = state.contributionRecords
    .filter((cr) => {
      const author = state.members.find((m) => m.id === cr.memberId)
      return author ? author.privacy.showContributionsPublicly : true
    })
    .slice(0, 3)
  const upcomingEvents = state.events.filter((e) => !e.isPast).slice(0, 2)
  const activeDiscussions = state.discussions.slice(0, 2)

  const memberNotifications = currentMember
    ? state.notifications.filter((n) => n.memberId === currentMember.id)
    : []
  const personalNotifications = memberNotifications
    .filter((n) => n.category !== 'announcement')
    .slice(0, 3)
  const communityAnnouncements = memberNotifications
    .filter((n) => n.category === 'announcement')
    .slice(0, 3)

  const showOnboarding = Boolean(
    currentMember &&
      (currentMember.onboardingStage === 'newbie' || !isOnboardingComplete(currentMember.onboardingChecklist)),
  )

  const onboardingStepsCompleted = currentMember
    ? [
        currentMember.onboardingChecklist.orientationCompleted &&
          currentMember.onboardingChecklist.rulesChecked,
        currentMember.onboardingChecklist.housesSelected,
        currentMember.onboardingChecklist.profileGuided,
        currentMember.onboardingChecklist.academyStarted,
        currentMember.onboardingChecklist.introMissionJoined,
      ].filter(Boolean).length
    : 0

  const quickActions = [
    { kind: 'project' as const, label: 'Create Project', Icon: FolderGit2 },
    { kind: 'service' as const, label: 'Create Service', Icon: Wrench },
    { kind: 'resource' as const, label: 'Create Resource', Icon: Compass },
    { kind: 'opportunity' as const, label: 'Create Opportunity', Icon: Sparkles },
    { kind: 'event' as const, label: 'Create Event', Icon: Calendar },
    { kind: 'discussion' as const, label: 'Create Discussion', Icon: MessageSquare },
  ]

  return (
    <PageScaffold
      section={state.currentSeason.name}
      name="Dashboard"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {currentMember && (
          <div className="stats-row dashboard-metrics-strip" aria-label="Personal progression metrics">
            <StatCard
              label="Lifetime XP"
              value={`${xpBalance.lifetimeXp.toLocaleString()} XP`}
              change={
                levelProgress.isMaxLevel
                  ? 'Max Level 30 reached'
                  : `${levelProgress.xpRemainingToNext.toLocaleString()} XP to Level ${levelProgress.level + 1}`
              }
              icon={<Award size={16} />}
            />
            <StatCard
              label="Spendable XP"
              value={`${xpBalance.spendableXp.toLocaleString()} XP`}
              change={`${xpBalance.reservedXp.toLocaleString()} XP reserved`}
              icon={<Sparkles size={16} />}
            />
            <StatCard
              label="Level & Rank"
              value={`Level ${levelProgress.level} · ${currentMember.ascendancyRank}`}
              change={
                currentMember.primaryHouseId
                  ? `House ${getHouseName(currentMember.primaryHouseId, state.houses)}`
                  : 'No Primary House'
              }
              icon={<Compass size={16} />}
            />
            <StatCard
              label="Season CP"
              value={`${seasonCp} CP`}
              change={state.currentSeason.name}
              icon={<Trophy size={16} />}
            />
          </div>
        )}

        {showOnboarding && currentMember && (
          <section
            className="dashboard-panel"
            style={{ borderLeft: '4px solid #1e5cb5', background: '#f8fbff' }}
            aria-label="New Spartan Onboarding Checklist"
          >
            <div className="panel-title">
              <div>
                <span className="section-kicker" style={{ color: '#1e5cb5' }}>
                  GETTING STARTED
                </span>
                <h2>Your First Steps</h2>
              </div>
              <span className="listing-kind kind-featured">
                {onboardingStepsCompleted} / 5 completed
              </span>
            </div>

            <div className="arena-grid-2" style={{ alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 11, background: '#fff', border: '1px solid #d7e2f1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    {currentMember.onboardingChecklist.orientationCompleted && currentMember.onboardingChecklist.rulesChecked ? (
                      <CheckCircle2 size={18} color="#166534" />
                    ) : (
                      <Circle size={18} color="#70829a" />
                    )}
                    <div>
                      <b style={{ fontSize: 13.5 }}>1. Orientation &amp; Rules Check</b>
                      <div style={{ fontSize: 12, color: '#52647d' }}>
                        Proof of Work &amp; fair play (+{state.config.systemXpValues.orientationOnce} XP once)
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="button button-bright button-small"
                    disabled={
                      currentMember.onboardingChecklist.orientationCompleted &&
                      currentMember.onboardingChecklist.rulesChecked
                    }
                    onClick={completeOrientation}
                  >
                    {currentMember.onboardingChecklist.orientationCompleted &&
                    currentMember.onboardingChecklist.rulesChecked
                      ? 'Completed'
                      : 'Complete (+20 XP)'}
                  </button>
                </div>

                <div style={{ padding: 12, background: '#fff', border: '1px solid #d7e2f1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {currentMember.onboardingChecklist.housesSelected ? (
                      <CheckCircle2 size={18} color="#166534" />
                    ) : (
                      <Circle size={18} color="#70829a" />
                    )}
                    <b style={{ fontSize: 13.5 }}>2. Choose Your Houses (0 XP)</b>
                  </div>
                  <div className="form-grid" style={{ gap: 10 }}>
                    <label>
                      Primary House
                      <select
                        value={primaryPick}
                        onChange={(e) => {
                          const next = e.target.value
                          setPrimaryPick(next)
                          if (!next || next === secondaryPick) setSecondaryPick('')
                        }}
                      >
                        <option value="">None</option>
                        {state.houses.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Secondary House (optional)
                      <select
                        value={secondaryPick}
                        onChange={(e) => setSecondaryPick(e.target.value)}
                      >
                        <option value="">None</option>
                        {state.houses
                          .filter((h) => h.id !== primaryPick)
                          .map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="button button-bright button-small"
                      onClick={() => {
                        const p = (primaryPick || null) as HouseId | null
                        const s = (!p || secondaryPick === p ? null : (secondaryPick || null)) as HouseId | null
                        updateHouses(p, s)
                      }}
                    >
                      Save Houses
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 11, background: '#fff', border: '1px solid #d7e2f1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    {currentMember.onboardingChecklist.profileGuided ? (
                      <CheckCircle2 size={18} color="#166534" />
                    ) : (
                      <Circle size={18} color="#70829a" />
                    )}
                    <div>
                      <b style={{ fontSize: 13.5 }}>3. Complete Your Profile</b>
                      <div style={{ fontSize: 12, color: '#52647d' }}>Add your headline, bio, skills, and links</div>
                    </div>
                  </div>
                  <Link className="button button-quiet button-small" to="/profile">Complete Profile</Link>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 11, background: '#fff', border: '1px solid #d7e2f1', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    {currentMember.onboardingChecklist.academyStarted ? (
                      <CheckCircle2 size={18} color="#166534" />
                    ) : (
                      <Circle size={18} color="#70829a" />
                    )}
                    <div>
                      <b style={{ fontSize: 13.5 }}>4. Start in the Academy</b>
                      <div style={{ fontSize: 12, color: '#52647d' }}>Pass your first lesson (+5 XP, +1 CP)</div>
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
                      <b style={{ fontSize: 13.5 }}>5. Join the Intro Mission</b>
                      <div style={{ fontSize: 12, color: '#52647d' }}>Submit your first House Case Study (+60 XP)</div>
                    </div>
                  </div>
                  <Link className="button button-quiet button-small" to="/missions/mis-intro">Open Intro</Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="dashboard-panel" aria-label="Dashboard quick actions">
          <div className="panel-title" style={{ marginBottom: 10 }}>
            <div>
              <span className="section-kicker">CONTRIBUTE</span>
              <h2>Quick Actions</h2>
            </div>
            {!canCreateDiscussion && (
              <span className="listing-kind kind-amber">
                Discussion creation unlocks at Level {DISCUSSION_UNLOCK_LEVEL}
              </span>
            )}
          </div>
          <div className="dashboard-quick-actions">
            {quickActions.map(({ kind, label, Icon }) => {
              const isDiscussionBlocked = kind === 'discussion' && !canCreateDiscussion
              return (
                <button
                  key={kind}
                  type="button"
                  className="button button-quiet button-small"
                  disabled={isDiscussionBlocked}
                  title={isDiscussionBlocked ? `Discussion creation unlocks at Level ${DISCUSSION_UNLOCK_LEVEL}.` : label}
                  onClick={() => openQuickCreate(kind)}
                >
                  <Icon size={14} /> {label}
                </button>
              )
            })}
          </div>
        </section>

        <div className="dashboard-columns">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <section className="dashboard-panel">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">FOR YOUR HOUSES</span>
                  <h2>Recommended Missions</h2>
                </div>
                <Link className="text-link" to="/missions">All missions <ArrowRight size={14} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recommendedMissions.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 12px',
                      border: '1px solid #e3ebf5',
                      borderRadius: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span className="listing-kind">House {getHouseName(m.houseId, state.houses)}</span>
                        <span className="tag">{formatParticipationFormat(m.participationFormat)}</span>
                      </div>
                      <Link to={`/missions/${m.id}`} style={{ fontWeight: 700, fontSize: 14, color: '#080d16' }}>
                        {m.title}
                      </Link>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="listing-reward">+{m.budget.rewardPerContributorXp} XP</span>
                      <button
                        type="button"
                        className="button button-quiet button-small"
                        onClick={() => navigate(`/missions/${m.id}`)}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">VERIFIED WORK</span>
                  <h2>Recent Contributions</h2>
                </div>
                <Link className="text-link" to="/houses">Houses <ArrowRight size={14} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentContribs.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#52647d' }}>No public contributions to display yet.</div>
                ) : (
                  recentContribs.map((cr) => {
                    const author = state.members.find((m) => m.id === cr.memberId)
                    return (
                      <div key={cr.id} style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '1px solid #edf2f8' }}>
                        <span className="avatar avatar-small">{author?.avatarInitials ?? 'SP'}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13 }}>
                            <b>{author?.displayName ?? 'Spartan'}</b> · {cr.title}{' '}
                            <span className="tag">House {getHouseName(cr.houseId, state.houses)}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#52647d' }}>{cr.deliverableSummary}</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">COMMUNITY THREADS</span>
                  <h2>Active Discussions</h2>
                </div>
                <Link className="text-link" to="/explore?tab=discussions">Explore discussions <ArrowRight size={14} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeDiscussions.map((disc) => (
                  <Link
                    key={disc.id}
                    to="/explore?tab=discussions"
                    style={{ padding: '9px 11px', border: '1px solid #e3ebf5', borderRadius: 8, display: 'block' }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#080d16' }}>{disc.title}</div>
                    <div style={{ fontSize: 12, color: '#52647d', marginTop: 2 }}>
                      #{disc.topicTag} · {disc.replies.length} {disc.replies.length === 1 ? 'reply' : 'replies'}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <section className="dashboard-panel" aria-label="Recent notifications">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">PERSONAL</span>
                  <h2>Recent Notifications</h2>
                </div>
                <Link className="text-link" to="/notifications">View all <ArrowRight size={14} /></Link>
              </div>
              {personalNotifications.length === 0 ? (
                <div style={{ fontSize: 13, color: '#52647d' }}>
                  No personal alerts right now. <Link className="text-link" to="/missions">Browse missions</Link>.
                </div>
              ) : (
                personalNotifications.map((n) => (
                  <div className="compact-listing" key={n.id}>
                    <span className="org-mark blue"><Bell size={14} /></span>
                    <span>
                      <b>{n.title}{!n.read ? ' · New' : ''}</b>
                      <small>{n.body}</small>
                    </span>
                    {n.linkPath && (
                      <button
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id)
                          navigate(n.linkPath!)
                        }}
                        aria-label={`Open ${n.title}`}
                      >
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </section>

            <section className="dashboard-panel" aria-label="Community announcements">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">ARENA UPDATES</span>
                  <h2>Announcements</h2>
                </div>
                <Link className="text-link" to="/notifications">All updates <ArrowRight size={14} /></Link>
              </div>
              {communityAnnouncements.length === 0 ? (
                <div style={{ fontSize: 13, color: '#52647d' }}>
                  No community announcements right now.
                </div>
              ) : (
                communityAnnouncements.map((item) => (
                  <div className="compact-listing" key={item.id}>
                    <span className="org-mark red"><Megaphone size={14} /></span>
                    <span>
                      <b>{item.title}</b>
                      <small>{item.body}</small>
                    </span>
                    {item.linkPath && (
                      <button
                        type="button"
                        onClick={() => {
                          markNotificationRead(item.id)
                          navigate(item.linkPath!)
                        }}
                        aria-label={`Open ${item.title}`}
                      >
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </section>

            <section className="dashboard-panel">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">UP NEXT</span>
                  <h2>Events &amp; Academy</h2>
                </div>
                <Link className="text-link" to="/events">Calendar <ArrowRight size={14} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to="/events"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      border: '1px solid #e3ebf5',
                      borderRadius: 8,
                    }}
                  >
                    <Calendar size={15} color="#1e5cb5" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#080d16' }}>{ev.title}</div>
                      <div style={{ fontSize: 11.5, color: '#52647d' }}>
                        {ev.kind} · {new Date(ev.startsAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
                {state.academyPaths.slice(0, 1).map((p) => (
                  <Link
                    key={p.id}
                    to="/academy"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      border: '1px solid #e3ebf5',
                      borderRadius: 8,
                    }}
                  >
                    <BookOpen size={15} color="#1e5cb5" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#080d16' }}>{p.title}</div>
                      <div style={{ fontSize: 11.5, color: '#52647d' }}>{p.modules.length} module(s) · {p.track}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageScaffold>
  )
}
