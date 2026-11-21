import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, BookOpen, Shield, Target, Users } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import ListingCard from '../components/ListingCard'
import PageScaffold from '../components/PageScaffold'
import PermissionGate from '../components/PermissionGate'
import StatCard from '../components/StatCard'

type HouseTab = 'overview' | 'activity' | 'missions' | 'academy' | 'members' | 'about' | 'management'

export default function HouseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { state, currentMember, can, updateHouses, toggleMissionPause } = useArena()
  const house = state.houses.find((h) => h.slug === slug)
  const [tab, setTab] = useState<HouseTab>('overview')

  if (!house) {
    return (
      <PageScaffold
        section="Arena Houses"
        name="House Not Found"
        description="Select one of the six canonical Arena Houses."
      >
        <div className="empty-state">
          <h3>House not found</h3>
          <p>Select one of the six canonical Arena Houses.</p>
          <Link className="button button-bright" to="/houses">All Houses</Link>
        </div>
      </PageScaffold>
    )
  }

  const canManageHouse = can('house.manage', house.id)
  const houseMissions = state.missions.filter(
    (m) => m.houseId === house.id || (house.id === 'echoes' && m.crossHouseEligible),
  )
  const houseMembers = state.members.filter(
    (m) => m.primaryHouseId === house.id || m.secondaryHouseId === house.id,
  )
  const houseAcademy = state.academyPaths.filter(
    (p) => p.houseId === house.id || p.modules.some((mod) => mod.houseId === house.id),
  )
  const houseContributions = state.contributionRecords.filter((cr) => cr.houseId === house.id)
  const houseSubmissions = state.submissions.filter((sub) =>
    houseMissions.some((m) => m.id === sub.missionId),
  )

  return (
    <PageScaffold
      section="Arena Houses"
      name={`House ${house.name}`}
      description={house.tagline}
      actions={
        <Link className="button button-quiet button-small" to="/houses">
          <ArrowLeft size={14} /> All 6 Houses
        </Link>
      }
    >
      <div className="community-experience">
        <section className="community-banner">
          <div className="community-banner-art" aria-hidden="true">
            <span>{house.glyph}</span>
            <i>✳</i>
            <b>⌘</b>
          </div>
          <div>
            <span className="section-kicker">
              {house.supportsCrossHouseOutreach ? 'CANONICAL HOUSE + CROSS-HOUSE CAPABILITY' : 'CANONICAL ARENA HOUSE'}
            </span>
            <h2>House {house.name}</h2>
            <p>{house.description}</p>
            {currentMember && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                <button
                  type="button"
                  className="button button-quiet button-small"
                  onClick={() => updateHouses(house.id, currentMember.secondaryHouseId === house.id ? null : currentMember.secondaryHouseId)}
                  disabled={currentMember.primaryHouseId === house.id}
                >
                  {currentMember.primaryHouseId === house.id ? 'Primary House' : 'Set as Primary (0 XP)'}
                </button>
                <button
                  type="button"
                  className="button button-quiet button-small"
                  onClick={() =>
                    updateHouses(
                      currentMember.primaryHouseId ?? house.id,
                      currentMember.primaryHouseId === house.id ? null : house.id,
                    )
                  }
                >
                  {currentMember.secondaryHouseId === house.id ? 'Secondary House' : 'Set as Secondary'}
                </button>
              </div>
            )}
          </div>
          <div className="community-total">
            <b>{String(houseMissions.length).padStart(2, '0')}</b>
            <small>MISSIONS</small>
            <b>{String(houseMembers.length).padStart(2, '0')}</b>
            <small>SPARTANS</small>
          </div>
        </section>

        <div className="arena-tabs" role="tablist">
          {(
            [
              ['overview', 'Overview'],
              ['activity', 'Activity'],
              ['missions', `Missions (${houseMissions.length})`],
              ['academy', `Academy (${houseAcademy.length})`],
              ['members', `Members (${houseMembers.length})`],
              ['about', 'About & Standards'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`arena-tab ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}

          {canManageHouse && (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'management'}
              className={`arena-tab ${tab === 'management' ? 'active' : ''}`}
              onClick={() => setTab('management')}
            >
              <Shield size={14} /> House Management (Scoped)
            </button>
          )}
        </div>

        {tab === 'overview' && (
          <div className="dashboard-columns">
            <div className="dashboard-panel">
              <div className="panel-title">
                <h2>Focus Areas &amp; Stewardship Standard</h2>
              </div>
              <div className="tag-row" style={{ marginBottom: 14 }}>
                {house.focusAreas.map((fa) => (
                  <span className="tag" key={fa}>{fa}</span>
                ))}
              </div>
              <p style={{ margin: '0 0 12px', fontSize: 14 }}>{house.aboutDetails}</p>
              <div className="arena-notice arena-notice-info">
                <span><b>Reviewer standard:</b> {house.stewardsNote}</span>
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="panel-title">
                <h2>Active House Highlights</h2>
                <Link className="text-link" to="/leaderboards">House Leaderboard</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <StatCard
                  label="Active Missions"
                  value={String(houseMissions.filter((m) => m.status === 'active').length)}
                  change="Verified Proof-of-Work deliverables"
                  icon={<Target size={15} />}
                />
                <StatCard
                  label="Verified Contributions"
                  value={String(houseContributions.length)}
                  change="Permanent House records"
                  icon={<Users size={15} />}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="dashboard-panel">
            <div className="panel-title"><h2>House Contribution Feed</h2></div>
            {houseContributions.length === 0 ? (
              <p style={{ color: 'var(--arena-ink-muted)', margin: 0 }}>No verified contributions logged in this House yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {houseContributions.map((cr) => {
                  const member = state.members.find((m) => m.id === cr.memberId)
                  return (
                    <div key={cr.id} style={{ padding: 12, border: '1px solid var(--arena-border)', borderRadius: 8 }}>
                      <div style={{ fontSize: 13.5 }}>
                        <b>{member?.displayName}</b> · {cr.title}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--arena-ink-muted)', marginTop: 3 }}>{cr.deliverableSummary}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'missions' && (
          <div className="opportunity-grid">
            {houseMissions.map((m) => (
              <ListingCard
                key={m.id}
                glyph={house.glyph}
                tone="blue"
                kind={m.status}
                kindTone={m.status === 'active' ? 'success' : 'default'}
                secondaryBadge={m.crossHouseEligible ? 'Cross-House' : undefined}
                meta={m.category}
                title={m.title}
                description={m.description}
                tags={m.tags.slice(0, 3)}
                reward={`+${m.budget.rewardPerContributorXp} XP · +${m.budget.cpTierValue} CP`}
                actionLabel="Open"
                onOpen={() => navigate(`/missions/${m.id}`)}
              />
            ))}
          </div>
        )}

        {tab === 'academy' && (
          <div className="arena-grid-2">
            {houseAcademy.length === 0 ? (
              <div className="dashboard-panel">
                <p style={{ margin: 0, color: 'var(--arena-ink-muted)' }}>
                  House-specific modules are complemented by Web3 Foundations &amp; Safety paths in the{' '}
                  <Link className="text-link" to="/academy">Arena Academy</Link>.
                </p>
              </div>
            ) : (
              houseAcademy.map((p) => (
                <div className="dashboard-panel" key={p.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <BookOpen size={17} color="#1e5cb5" />
                    <span className="tag">{p.track}</span>
                  </div>
                  <h3 style={{ margin: '0 0 6px' }}>{p.title}</h3>
                  <p style={{ margin: '0 0 12px', fontSize: 13.5, color: 'var(--arena-ink-muted)' }}>{p.subtitle}</p>
                  <Link className="button button-bright button-small" to="/academy">Open Path in Academy</Link>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'members' && (
          <div className="arena-grid-3">
            {houseMembers.map((m) => (
              <div className="dashboard-panel" key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="avatar avatar-small" style={{ width: 42, height: 42, fontSize: 13 }}>{m.avatarInitials}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.displayName}</div>
                  <div style={{ fontSize: 12, color: 'var(--arena-ink-muted)' }}>
                    {m.ascendancyRank} · {m.primaryHouseId === house.id ? 'Primary' : 'Secondary'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'about' && (
          <div className="dashboard-panel">
            <div className="panel-title"><h2>About House {house.name}</h2></div>
            <p>{house.aboutDetails}</p>
            {house.supportsCrossHouseOutreach && (
              <div className="arena-notice arena-notice-warn">
                <AlertTriangle size={16} />
                <span>
                  <b>Anti-Engagement-Farming Policy:</b> House Echoes strictly prohibits buying likes, reposts, follows, or raw impression counts. All outreach missions verify substance and alignment.
                </span>
              </div>
            )}
          </div>
        )}

        {tab === 'management' && (
          <PermissionGate requiredAny={['house.manage']} houseId={house.id} title={`House ${house.name} Management`}>
            <div className="dashboard-panel">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">HOUSE-SCOPED STRATEGOS WORKSPACE</span>
                  <h2>Manage House {house.name}</h2>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--arena-ink-muted)', marginTop: 0 }}>
                Permission check verified: you hold scoped <code>house.manage</code> authority strictly for <b>House {house.name}</b>. You cannot manage other Houses unless explicitly granted scope.
              </p>
              <div className="arena-table-wrap">
                <table className="arena-table">
                  <thead>
                    <tr>
                      <th>Mission</th>
                      <th>Status</th>
                      <th>Escrow Remaining</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {houseMissions.filter((m) => m.houseId === house.id).map((m) => (
                      <tr key={m.id}>
                        <td><Link className="text-link" to={`/missions/${m.id}`}>{m.title}</Link></td>
                        <td><span className="listing-kind">{m.status}</span></td>
                        <td>{m.budget.remainingReservedXp} XP</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {(m.status === 'active' || m.status === 'paused') && (
                              <button
                                type="button"
                                className="button button-quiet button-small"
                                onClick={() => toggleMissionPause(m.id)}
                              >
                                {m.status === 'active' ? 'Pause' : 'Resume'}
                              </button>
                            )}
                            <Link className="button button-quiet button-small" to={`/missions/${m.id}`}>
                              Review ({houseSubmissions.filter((s) => s.missionId === m.id && s.status === 'submitted').length})
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </PermissionGate>
        )}
      </div>
    </PageScaffold>
  )
}
