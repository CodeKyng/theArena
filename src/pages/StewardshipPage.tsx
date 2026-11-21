import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, HeartHandshake, Scale, Shield, ShieldAlert, Users } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import PermissionGate from '../components/PermissionGate'
import StatCard from '../components/StatCard'
import type { HouseId } from '../domain/types'

export default function StewardshipPage() {
  const {
    state,
    currentMember,
    can,
    verifyMentorship,
    logMentorship,
    resolveDispute,
    reviewSubmission,
  } = useArena()

  const [disputeNote, setDisputeNote] = useState<Record<string, string>>({})
  const [menteeId, setMenteeId] = useState(state.members[0]?.id ?? 'mem-kaito')
  const [mentHouse, setMentHouse] = useState<HouseId>('scribes')
  const [mentTopic, setMentTopic] = useState('')
  const [mentSummary, setMentSummary] = useState('')

  const handleLogMentorship = (e: FormEvent) => {
    e.preventDefault()
    const res = logMentorship(menteeId, mentHouse, mentTopic, mentSummary)
    if (res.ok) {
      setMentTopic('')
      setMentSummary('')
    }
  }

  const openDisputes = state.disputes.filter((d) => d.status === 'open' || d.status === 'under_steward_review')
  const pendingSubs = state.submissions.filter((s) => s.status === 'submitted' || s.status === 'under_review')
  const managedHouses = state.houses.filter((h) => can('house.manage', h.id))

  return (
    <PageScaffold
      section="Governance"
      name="Stewardship"
      description="Elder & Strategos dispute arbitration, human Proof-of-Work review, and mentorship verification."
    >
      <PermissionGate
        requiredAny={['mentor.manage', 'moderator', 'house.manage', 'platform.admin']}
        title="Stewardship Workspace"
      >
        <div className="moderation-experience">
          <div className="moderation-banner">
            <span className="moderation-icon"><ShieldAlert size={23} /></span>
            <div>
              <span className="section-kicker">ELDER &amp; STRATEGOS GOVERNANCE</span>
              <h2>Stewardship Workspace</h2>
              <p>
                Verify mentorship sessions (enforcing the 60 CP seasonal pair cap), arbitrate submission disputes with preserved evidence snapshots, and oversee House health.
              </p>
            </div>
            <div className="queue-count">
              <b>{String(openDisputes.length + pendingSubs.length).padStart(2, '0')}</b>
              <span>IN QUEUE</span>
            </div>
          </div>

          <div className="stats-row">
            <StatCard
              label="Open Disputes"
              value={String(openDisputes.length)}
              change="Preserved evidence snapshots"
              icon={<Scale size={16} />}
            />
            <StatCard
              label="Pending Submission Reviews"
              value={String(pendingSubs.length)}
              change="Ready for human PoW review"
              icon={<Shield size={16} />}
            />
            <StatCard
              label="Mentorship Sessions"
              value={String(state.mentorshipSessions.length)}
              change={`${state.mentorshipSessions.filter((s) => s.status === 'scheduled').length} awaiting Elder verification`}
              icon={<HeartHandshake size={16} />}
            />
            <StatCard
              label="Managed House Scope"
              value={managedHouses.length > 0 ? managedHouses.map((h) => h.name).join(', ') : 'Cross-House'}
              change="Strict RBAC boundaries enforced"
              icon={<Users size={16} />}
            />
          </div>

          <div className="dashboard-columns">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <section className="dashboard-panel">
                <div className="panel-title">
                  <h2>Dispute Arbitration Queue ({openDisputes.length})</h2>
                </div>
                {openDisputes.length === 0 ? (
                  <p style={{ color: 'var(--arena-ink-muted)', margin: 0 }}>No open disputes.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {openDisputes.map((d) => {
                      const m = state.missions.find((x) => x.id === d.missionId)
                      const opener = state.members.find((x) => x.id === d.openedByMemberId)
                      return (
                        <div key={d.id} style={{ padding: 13, border: '1px solid var(--arena-border)', borderRadius: 9, background: 'var(--arena-surface-soft)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <b>{m?.title ?? d.missionId}</b>
                            <span className="listing-kind kind-featured">{d.status}</span>
                          </div>
                          <div style={{ fontSize: 12.5, color: 'var(--arena-ink-muted)', marginBottom: 6 }}>
                            Opened by <b>{opener?.displayName}</b>: {d.reason}
                          </div>
                          <div style={{ fontSize: 12, background: '#fff', padding: 8, borderRadius: 6, border: '1px solid var(--arena-border)', marginBottom: 8 }}>
                            <b>Preserved Evidence Snapshot:</b>
                            {d.preservedEvidenceSnapshot.map((ev) => (
                              <div key={ev.id}>• {ev.label}: {ev.value}</div>
                            ))}
                          </div>
                          {(can('moderator') || can('platform.admin')) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <input
                                className="arena-input"
                                placeholder="Steward resolution rationale..."
                                value={disputeNote[d.id] ?? ''}
                                onChange={(e) => setDisputeNote((p) => ({ ...p, [d.id]: e.target.value }))}
                              />
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="button button-bright button-small"
                                  onClick={() => resolveDispute(d.id, 'resolved_overturned', disputeNote[d.id] || 'Overturned upon preserved evidence review.')}
                                >
                                  Overturn &amp; Approve Settlement
                                </button>
                                <button
                                  type="button"
                                  className="button button-quiet button-small"
                                  onClick={() => resolveDispute(d.id, 'resolved_upheld', disputeNote[d.id] || 'Original review upheld.')}
                                >
                                  Uphold Rejection
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="dashboard-panel">
                <div className="panel-title">
                  <h2>Elder Review Center (Submitted Work)</h2>
                </div>
                {pendingSubs.length === 0 ? (
                  <p style={{ color: 'var(--arena-ink-muted)', margin: 0 }}>All submissions reviewed.</p>
                ) : (
                  pendingSubs.map((sub) => {
                    const m = state.missions.find((x) => x.id === sub.missionId)
                    const author = state.members.find((x) => x.id === sub.memberId)
                    const hasScope = m && (can('house.manage', m.houseId) || can('moderator') || can('platform.admin') || can('mission.review', m.houseId))
                    return (
                      <div key={sub.id} style={{ padding: 11, borderTop: '1px solid var(--arena-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div>
                          <b>{m?.title}</b> · <span className="tag">House {m?.houseId}</span>
                          <div style={{ fontSize: 12.5, color: 'var(--arena-ink-muted)' }}>By {author?.displayName} — {sub.summary}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link className="button button-quiet button-small" to={`/missions/${sub.missionId}`}>Inspect</Link>
                          {hasScope && sub.memberId !== currentMember?.id && (
                            <button
                              type="button"
                              className="button button-bright button-small"
                              onClick={() => reviewSubmission(sub.id, 'approved', 'Verified via Stewardship Review Center.')}
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </section>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <section className="dashboard-panel">
                <div className="panel-title">
                  <h2>Mentorship Queue (+20 XP / +10 CP, 60 CP pair cap)</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {state.mentorshipSessions.map((ms) => {
                    const mentor = state.members.find((m) => m.id === ms.mentorMemberId)
                    const mentee = state.members.find((m) => m.id === ms.menteeMemberId)
                    return (
                      <div key={ms.id} style={{ padding: 11, border: '1px solid var(--arena-border)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <b>{ms.topic}</b>
                          <span className={`listing-kind ${ms.status === 'verified' ? 'kind-success' : 'kind-amber'}`}>
                            {ms.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--arena-ink-muted)', margin: '4px 0' }}>
                          Mentor: <b>{mentor?.displayName}</b> → Mentee: <b>{mentee?.displayName}</b> (House {ms.houseId})
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--arena-ink)' }}>{ms.summary}</div>
                        {ms.status === 'scheduled' && (can('mentor.manage') || can('platform.admin')) && (
                          <button
                            type="button"
                            className="button button-bright button-small"
                            style={{ marginTop: 8 }}
                            onClick={() => verifyMentorship(ms.id)}
                          >
                            <CheckCircle2 size={13} /> Verify &amp; Award XP / CP
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <form onSubmit={handleLogMentorship} className="form-panel" style={{ marginTop: 16, padding: 14 }}>
                  <b style={{ fontSize: 13.5, display: 'block', marginBottom: 10 }}>Log New Mentorship Session</b>
                  <div className="form-grid">
                    <label>
                      Mentee
                      <select value={menteeId} onChange={(e) => setMenteeId(e.target.value)}>
                        {state.members.filter((m) => m.id !== currentMember?.id).map((m) => (
                          <option key={m.id} value={m.id}>{m.displayName}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      House
                      <select value={mentHouse} onChange={(e) => setMentHouse(e.target.value as HouseId)}>
                        {state.houses.map((h) => (
                          <option key={h.id} value={h.id}>House {h.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="full-field">
                      Session Topic
                      <input required placeholder="e.g. Protocol review walkthrough" value={mentTopic} onChange={(e) => setMentTopic(e.target.value)} />
                    </label>
                    <label className="full-field">
                      Summary
                      <input placeholder="Key guidance covered..." value={mentSummary} onChange={(e) => setMentSummary(e.target.value)} />
                    </label>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <button type="submit" className="button button-quiet button-small">Log Session for Verification</button>
                  </div>
                </form>
              </section>

              <section className="dashboard-panel">
                <div className="panel-title"><h2>Knowledge Vault &amp; Community Health</h2></div>
                <p style={{ fontSize: 13, color: 'var(--arena-ink-muted)', margin: '0 0 8px' }}>
                  {state.resources.length} published Knowledge Vault resources · {state.discussions.length} active governance/community threads · {state.members.filter((m) => m.onboardingStage === 'newbie').length} New Spartans currently in onboarding.
                </p>
                <Link className="text-link" to="/explore?tab=resources">Open Knowledge Vault Resources →</Link>
              </section>
            </div>
          </div>
        </div>
      </PermissionGate>
    </PageScaffold>
  )
}
