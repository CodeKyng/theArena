import { useState, type FormEvent } from 'react'
import { CheckCircle2, FileText, ShieldAlert, Sliders, Users } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PermissionGate from '../components/PermissionGate'
import StatCard from '../components/StatCard'
import {
  ASCENDANCY_LADDER,
  FEATURE_FLAGS,
  formatVerificationStatus,
  getHouseName,
  PERMISSION_LABELS,
} from '../domain/constants'
import { calculateLevelProgress } from '../domain/progression'
import type { AscendancyRank, HouseId, PermissionScope } from '../domain/types'

type ControlTab = 'overview' | 'members' | 'high-value' | 'ledger' | 'config' | 'audit'

export default function ControlRoomPage() {
  const {
    state,
    getMemberBalance,
    approveHighValue,
    setOrgVerification,
    appointAscendancy,
    togglePermission,
    adminAdjustXp,
    updateConfig,
  } = useArena()

  const [tab, setTab] = useState<ControlTab>('overview')

  const [adjMemberId, setAdjMemberId] = useState(state.members[1]?.id ?? 'mem-jordan')
  const [adjDelta, setAdjDelta] = useState('100')
  const [adjReason, setAdjReason] = useState('')

  const [rankMemberId, setRankMemberId] = useState(state.members[1]?.id ?? 'mem-jordan')
  const [newRank, setNewRank] = useState<AscendancyRank>('Gladiator')
  const [rankNote, setRankNote] = useState('')

  const [orientationXp, setOrientationXp] = useState(String(state.config.systemXpValues.orientationOnce))
  const [lessonXp, setLessonXp] = useState(String(state.config.systemXpValues.academyLesson))
  const [eventCap, setEventCap] = useState(String(state.config.seasonalCpCaps.eventAttendancePerSeason))
  const [supportCap, setSupportCap] = useState(String(state.config.seasonalCpCaps.communitySupportPerSeason))
  const [mentorCap, setMentorCap] = useState(String(state.config.seasonalCpCaps.mentorshipPairPerSeason))

  const [permMemberId, setPermMemberId] = useState(state.members[1]?.id ?? 'mem-jordan')
  const [permHouseId, setPermHouseId] = useState<string>('')

  const pendingHighValue = state.missions.filter((m) => m.status === 'pending_review')
  const newbiesCount = state.members.filter((m) => m.onboardingStage === 'newbie').length

  const handleAdjustXp = (e: FormEvent) => {
    e.preventDefault()
    const res = adminAdjustXp(adjMemberId, Number(adjDelta) || 0, adjReason)
    if (res.ok) setAdjReason('')
  }

  const handleSaveConfig = (e: FormEvent) => {
    e.preventDefault()
    updateConfig({
      ...state.config,
      systemXpValues: {
        ...state.config.systemXpValues,
        orientationOnce: Math.max(1, Number(orientationXp) || 20),
        academyLesson: Math.max(1, Number(lessonXp) || 5),
      },
      seasonalCpCaps: {
        eventAttendancePerSeason: Math.max(1, Number(eventCap) || 10),
        communitySupportPerSeason: Math.max(1, Number(supportCap) || 50),
        mentorshipPairPerSeason: Math.max(1, Number(mentorCap) || 60),
      },
    })
  }

  return (
    <div className="inner-page">
      <PermissionGate requiredAny={['platform.admin', 'finance.admin']} title="Control Room Administration">
        <div className="admin-experience">
          <div className="admin-banner">
            <div>
              <span className="section-kicker">PLATFORM GOVERNANCE · CONTROL ROOM</span>
              <h2>Arena Control Room</h2>
              <p>
                {FEATURE_FLAGS.organisationsEnabled
                  ? 'Appoint Ascendancy ranks, assign scoped member permissions, review high-value (>1,500 XP) missions, verify organisations, record XP adjustments, and configure seasonal caps.'
                  : 'Appoint Ascendancy ranks, assign scoped member permissions, review high-value (>1,500 XP) missions, record XP adjustments, and configure seasonal caps.'}
              </p>
            </div>
            <div className="admin-seal">
              <ShieldAlert size={25} />
              <b>CONTROL<br />ROOM</b>
            </div>
          </div>

          <div className="arena-tabs" role="tablist">
            {(
              [
                ['overview', FEATURE_FLAGS.organisationsEnabled ? 'Funnel & Orgs' : 'Platform Funnel'],
                ['members', 'Members, Ascendancy & RBAC'],
                ['high-value', `High-Value Missions (${pendingHighValue.length})`],
                ['ledger', 'XP Ledger Adjustments'],
                ['config', 'Configurable Rules'],
                ['audit', `Audit Log (${state.auditLogs.length})`],
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
          </div>

          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="stats-row">
                <StatCard
                  label="Total Spartans"
                  value={String(state.members.length)}
                  change={`${newbiesCount} in New Spartan onboarding`}
                  icon={<Users size={16} />}
                />
                <StatCard
                  label="Active Missions"
                  value={String(state.missions.filter((m) => m.status === 'active').length)}
                  change={`${pendingHighValue.length} awaiting >1,500 XP approval`}
                  icon={<CheckCircle2 size={16} />}
                />
                {FEATURE_FLAGS.organisationsEnabled && (
                  <StatCard
                    label="Organisations"
                    value={String(state.organisations.length)}
                    change={`${state.organisations.filter((o) => o.verificationStatus !== 'verified').length} unverified / pending`}
                    icon={<Sliders size={16} />}
                  />
                )}
                <StatCard
                  label="Audit Entries"
                  value={String(state.auditLogs.length)}
                  change="Governance log"
                  icon={<FileText size={16} />}
                />
              </div>

              {FEATURE_FLAGS.organisationsEnabled && (
                <div className="dashboard-panel">
                  <div className="panel-title">
                    <h2>Organisation Verification Queue</h2>
                  </div>
                  <div className="arena-table-wrap">
                    <table className="arena-table">
                      <thead>
                        <tr>
                          <th>Organisation</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.organisations.map((org) => (
                          <tr key={org.id}>
                            <td><b>{org.name}</b></td>
                            <td>{org.kind}</td>
                            <td><span className="listing-kind">{formatVerificationStatus(org.verificationStatus)}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button type="button" className="button button-bright button-small" onClick={() => setOrgVerification(org.id, 'verified')}>Verify</button>
                                <button type="button" className="button button-quiet button-small" onClick={() => setOrgVerification(org.id, 'pending_review')}>Pending</button>
                                <button type="button" className="button button-danger button-small" onClick={() => setOrgVerification(org.id, 'unverified')}>Unverify</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'members' && (
            <div className="dashboard-columns">
              <section className="dashboard-panel">
                <div className="panel-title"><h2>Explicit Ascendancy Appointment</h2></div>
                <p style={{ fontSize: 12.5, color: 'var(--arena-muted)', marginTop: 0 }}>
                  XP levels (1–30) never grant leadership ranks automatically. Appoint Vanguard, Gladiator, Strategos, Elder, or Champion explicitly here.
                </p>
                <div className="form-grid" style={{ marginBottom: 12 }}>
                  <label>
                    Member
                    <select value={rankMemberId} onChange={(e) => setRankMemberId(e.target.value)}>
                      {state.members.map((m) => (
                        <option key={m.id} value={m.id}>{m.displayName} ({m.ascendancyRank})</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    New Ascendancy Rank
                    <select value={newRank} onChange={(e) => setNewRank(e.target.value as AscendancyRank)}>
                      {ASCENDANCY_LADDER.map((r) => (
                        <option key={r.rank} value={r.rank}>{r.rank}</option>
                      ))}
                    </select>
                  </label>
                  <label className="full-field">
                    Appointment Rationale
                    <input placeholder="Recorded in Ascendancy & Audit Log..." value={rankNote} onChange={(e) => setRankNote(e.target.value)} />
                  </label>
                </div>
                <button
                  type="button"
                  className="button button-bright"
                  onClick={() => appointAscendancy(rankMemberId, newRank, rankNote)}
                >
                  Appoint Rank
                </button>

                <h3 style={{ marginTop: 20 }}>Member Balances &amp; Ranks</h3>
                <div className="arena-table-wrap">
                  <table className="arena-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Rank</th>
                        <th>Level</th>
                        <th>Spendable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.members.map((m) => {
                        const bal = getMemberBalance(m.id)
                        const lvl = calculateLevelProgress(bal.lifetimeXp, state.config.levelThresholds)
                        return (
                          <tr key={m.id}>
                            <td><b>{m.displayName}</b></td>
                            <td>{m.ascendancyRank}</td>
                            <td>L{lvl.level} ({bal.lifetimeXp} XP)</td>
                            <td>{bal.spendableXp} XP</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="dashboard-panel">
                <div className="panel-title"><h2>Member Permissions</h2></div>
                <div className="form-grid" style={{ marginBottom: 12 }}>
                  <label>
                    Select Member
                    <select value={permMemberId} onChange={(e) => setPermMemberId(e.target.value)}>
                      {state.members.map((m) => (
                        <option key={m.id} value={m.id}>{m.displayName} ({m.ascendancyRank})</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Optional House Scope
                    <select value={permHouseId} onChange={(e) => setPermHouseId(e.target.value)}>
                      <option value="">Global (all Houses)</option>
                      {state.houses.map((h) => (
                        <option key={h.id} value={h.id}>Scoped: House {h.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {(Object.keys(PERMISSION_LABELS) as PermissionScope[]).map((scope) => {
                    const targetHouse = (permHouseId || undefined) as HouseId | undefined
                    const active = state.permissionGrants.some(
                      (g) => g.memberId === permMemberId && g.scope === scope && g.houseId === targetHouse,
                    )
                    return (
                      <div key={scope} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', border: '1px solid var(--arena-line)', borderRadius: 7 }}>
                        <div>
                          <b style={{ fontSize: 13 }}>{PERMISSION_LABELS[scope]}</b>
                          <div style={{ fontSize: 11, color: 'var(--arena-muted)' }}>
                            {targetHouse ? `House ${getHouseName(targetHouse, state.houses)}` : 'Global scope'}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`button button-small ${active ? 'button-danger' : 'button-quiet'}`}
                          onClick={() => togglePermission(permMemberId, scope, targetHouse)}
                        >
                          {active ? 'Revoke' : 'Grant'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          )}

          {tab === 'high-value' && (
            <div className="dashboard-panel">
              <div className="panel-title"><h2>Missions Requiring Additional Approval (&gt;1,500 XP Band)</h2></div>
              {pendingHighValue.length === 0 ? (
                <p style={{ color: 'var(--arena-muted)', margin: 0 }}>No pending high-value missions right now.</p>
              ) : (
                pendingHighValue.map((m) => {
                  const creator = state.members.find((x) => x.id === m.creatorMemberId)
                  return (
                    <div key={m.id} style={{ padding: 13, border: '1px solid var(--arena-line)', borderRadius: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <b>{m.title}</b>
                        <div style={{ fontSize: 12.5, color: 'var(--arena-muted)' }}>
                          Creator: {creator?.displayName} · Reward: {m.budget.rewardPerContributorXp} XP/contributor · Reserved Escrow: {m.budget.totalReservedXp} XP
                        </div>
                      </div>
                      <button type="button" className="button button-bright button-small" onClick={() => approveHighValue(m.id)}>
                        Approve &amp; Activate
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {tab === 'ledger' && (
            <form className="form-panel" onSubmit={handleAdjustXp} style={{ maxWidth: 680 }}>
              <h2 style={{ marginTop: 0 }}>Audit-Logged XP Ledger Adjustment</h2>
              <p style={{ fontSize: 13, color: 'var(--arena-muted)', marginTop: 0 }}>
                Adjustments append ledger entries and prevent negative Spendable XP balances.
              </p>
              <div className="form-grid">
                <label>
                  Target Member
                  <select value={adjMemberId} onChange={(e) => setAdjMemberId(e.target.value)}>
                    {state.members.map((m) => {
                      const b = getMemberBalance(m.id)
                      return (
                        <option key={m.id} value={m.id}>
                          {m.displayName} (Spendable: {b.spendableXp} XP)
                        </option>
                      )
                    })}
                  </select>
                </label>
                <label>
                  Spendable Delta (+/- XP)
                  <input type="number" value={adjDelta} onChange={(e) => setAdjDelta(e.target.value)} />
                </label>
                <label className="full-field">
                  Audit Reason (required)
                  <input required placeholder="e.g. Manual hackathon correction or grant adjustment" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
                </label>
              </div>
              <div style={{ marginTop: 14 }}>
                <button type="submit" className="button button-bright">Apply Ledger Adjustment</button>
              </div>
            </form>
          )}

          {tab === 'config' && (
            <form className="form-panel" onSubmit={handleSaveConfig} style={{ maxWidth: 720 }}>
              <h2 style={{ marginTop: 0 }}>Configurable Thresholds, XP &amp; Seasonal CP Caps</h2>
              <div className="form-grid">
                <label>
                  Onboarding Orientation XP (once)
                  <input type="number" value={orientationXp} onChange={(e) => setOrientationXp(e.target.value)} />
                </label>
                <label>
                  Academy Lesson XP
                  <input type="number" value={lessonXp} onChange={(e) => setLessonXp(e.target.value)} />
                </label>
                <label>
                  Event Attendance Seasonal CP Cap
                  <input type="number" value={eventCap} onChange={(e) => setEventCap(e.target.value)} />
                </label>
                <label>
                  Community Support Seasonal CP Cap
                  <input type="number" value={supportCap} onChange={(e) => setSupportCap(e.target.value)} />
                </label>
                <label>
                  Mentorship Pair Seasonal CP Cap
                  <input type="number" value={mentorCap} onChange={(e) => setMentorCap(e.target.value)} />
                </label>
              </div>
              <div style={{ marginTop: 14 }}>
                <button type="submit" className="button button-bright">Save Platform Config</button>
              </div>
            </form>
          )}

          {tab === 'audit' && (
            <div className="arena-table-wrap">
              <table className="arena-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Summary</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {state.auditLogs.map((log) => {
                    const actor = state.members.find((m) => m.id === log.actorMemberId)
                    return (
                      <tr key={log.id}>
                        <td><span className="listing-kind"><ShieldAlert size={11} /> {log.action}</span></td>
                        <td>{actor?.displayName ?? log.actorMemberId}</td>
                        <td>{log.summary}</td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PermissionGate>
    </div>
  )
}
