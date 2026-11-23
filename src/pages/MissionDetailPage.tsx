import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileUp,
  Flag,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import {
  EVIDENCE_TYPE_LABELS,
  FEATURE_FLAGS,
  formatMissionStatus,
  formatParticipationFormat,
  formatSubmissionStatus,
  formatVerificationStatus,
  getHouseName,
} from '../domain/constants'
import type { EvidenceItem } from '../domain/types'

function formatParticipationStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
}

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const {
    state,
    currentMember,
    can,
    publishDraft,
    approveHighValue,
    toggleMissionPause,
    cancelOrExpireMission,
    joinOrApplyMission,
    decideApplication,
    submitMissionWork,
    resubmitMissionWork,
    reviewSubmission,
    openDispute,
    reportMission,
  } = useArena()

  const mission = state.missions.find((m) => m.id === id)

  const [applyNote, setApplyNote] = useState('')
  const [teamName, setTeamName] = useState('')
  const [summary, setSummary] = useState('')
  const [evidenceLink, setEvidenceLink] = useState('')
  const [evidenceText, setEvidenceText] = useState('')
  const [fileMeta, setFileMeta] = useState<EvidenceItem['fileMeta'] | null>(null)
  const [reviewComment, setReviewComment] = useState<Record<string, string>>({})
  const [disputeReason, setDisputeReason] = useState<Record<string, string>>({})
  const [resubmitId, setResubmitId] = useState<string | null>(null)
  const [reportText, setReportText] = useState('')
  const [showReport, setShowReport] = useState(false)

  if (!mission) {
    return (
      <PageScaffold
        section="Proof of Work"
        name="Mission Not Found"
        description="Browse open Missions across all six Houses."
      >
        <div className="empty-state">
          <h3>Mission not found</h3>
          <Link className="button button-bright" to="/missions">Back to Missions</Link>
        </div>
      </PageScaffold>
    )
  }

  const house = state.houses.find((h) => h.id === mission.houseId)
  const houseName = getHouseName(mission.houseId, state.houses)
  const creator = state.members.find((m) => m.id === mission.creatorMemberId)
  const org =
    FEATURE_FLAGS.organisationsEnabled && mission.sponsorOrganisationId
      ? state.organisations.find((o) => o.id === mission.sponsorOrganisationId)
      : null

  const participations = state.missionParticipations.filter((p) => p.missionId === mission.id)
  const myParticipation = currentMember
    ? participations.find((p) => p.memberId === currentMember.id && p.status !== 'withdrawn')
    : undefined
  const activeParticipantCount = participations.filter(
    (p) => p.status === 'joined' || p.status === 'accepted',
  ).length

  const missionSubmissions = state.submissions.filter((s) => s.missionId === mission.id)
  const mySubmission = currentMember
    ? missionSubmissions.find((s) => s.memberId === currentMember.id)
    : undefined

  const canManage = Boolean(
    currentMember &&
      (mission.creatorMemberId === currentMember.id ||
        can('house.manage', mission.houseId) ||
        can('platform.admin')),
  )

  const canReviewAny = Boolean(
    currentMember &&
      (mission.creatorMemberId === currentMember.id ||
        mission.assignedReviewerIds.includes(currentMember.id) ||
        can('house.manage', mission.houseId) ||
        can('mission.review', mission.houseId) ||
        can('moderator') ||
        can('platform.admin')),
  )

  const handleFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setFileMeta(null)
      return
    }
    setFileMeta({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      simulatedNotice: 'Demo mode: saves filename and size only — files are not uploaded.',
    })
  }

  const buildEvidenceList = (): EvidenceItem[] => {
    const items: EvidenceItem[] = []
    if (evidenceText.trim()) {
      items.push({ id: `ev-${Date.now()}-1`, type: 'text', label: 'Written Context', value: evidenceText.trim() })
    }
    if (evidenceLink.trim()) {
      items.push({ id: `ev-${Date.now()}-2`, type: 'links', label: 'Deliverable URL', value: evidenceLink.trim() })
    }
    if (fileMeta) {
      items.push({
        id: `ev-${Date.now()}-3`,
        type: 'files',
        label: 'File Attachment (Demo)',
        value: fileMeta.fileName,
        fileMeta,
      })
    }
    return items
  }

  const handleSubmitPoW = (e: FormEvent) => {
    e.preventDefault()
    const evidence = buildEvidenceList()
    if (resubmitId) {
      const res = resubmitMissionWork(resubmitId, summary, evidence)
      if (res.ok) {
        setResubmitId(null)
        setSummary('')
        setEvidenceLink('')
        setEvidenceText('')
        setFileMeta(null)
      }
      return
    }
    const res = submitMissionWork(mission.id, summary, evidence)
    if (res.ok) {
      setSummary('')
      setEvidenceLink('')
      setEvidenceText('')
      setFileMeta(null)
    }
  }

  return (
    <div className="inner-page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <Link className="button button-quiet button-small" to="/missions">
            <ArrowLeft size={14} /> Back to Missions
          </Link>
          {currentMember && (
            <button
              type="button"
              className="button button-quiet button-small"
              onClick={() => setShowReport((r) => !r)}
            >
              <Flag size={13} /> Flag / Report
            </button>
          )}
        </div>

        {showReport && (
          <div className="dashboard-panel" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="arena-input"
              style={{ flex: '1 1 240px' }}
              placeholder="Reason for reporting this mission..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            />
            <button
              type="button"
              className="button button-danger button-small"
              onClick={() => {
                reportMission(mission.id, reportText)
                setReportText('')
                setShowReport(false)
              }}
            >
              Submit Report
            </button>
          </div>
        )}

        <section className="community-banner">
          <div className="community-banner-art" aria-hidden="true">
            <span>{house?.glyph ?? '◈'}</span>
            <i>✳</i>
            <b>⌘</b>
          </div>
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span className="listing-kind">{house?.glyph} House {houseName}</span>
              <span className="listing-kind">{mission.category}</span>
              <span className="listing-kind">{formatParticipationFormat(mission.participationFormat)}</span>
              <span className="listing-kind kind-featured">{formatMissionStatus(mission.status)}</span>
              {mission.crossHouseEligible && <span className="listing-kind kind-success">Cross-House Eligible</span>}
            </div>
            <h2>{mission.title}</h2>
            <p>{mission.description}</p>
            <p style={{ marginTop: 6, fontSize: 12.5 }}>
              Created by <b>{creator?.displayName ?? 'Arena Steward'}</b>
              {FEATURE_FLAGS.organisationsEnabled && org
                ? ` · Sponsored by ${org.name} (${formatVerificationStatus(org.verificationStatus)})`
                : ''}
              {` · Deadline: ${mission.deadline}`}
            </p>
          </div>
          <div className="community-total">
            <b>+{mission.budget.rewardPerContributorXp} XP</b>
            <small>REWARD (+{mission.budget.cpTierValue} CP)</small>
            <b>{mission.budget.remainingReservedXp} XP</b>
            <small>RESERVED · {mission.budget.settledXp} XP SETTLED</small>
          </div>
        </section>

        {canManage && (
          <div className="dashboard-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13 }}>
              <b>Mission Controls:</b> {formatMissionStatus(mission.status)} · {activeParticipantCount} / {mission.capacity} participant slots filled.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {mission.status === 'draft' && (
                <button type="button" className="button button-bright button-small" onClick={() => publishDraft(mission.id)}>
                  Publish &amp; Reserve XP
                </button>
              )}
              {mission.status === 'pending_review' && (can('platform.admin') || can('finance.admin')) && (
                <button type="button" className="button button-bright button-small" onClick={() => approveHighValue(mission.id)}>
                  Approve &gt;1,500 XP Mission
                </button>
              )}
              {(mission.status === 'active' || mission.status === 'paused') && (
                <button type="button" className="button button-quiet button-small" onClick={() => toggleMissionPause(mission.id)}>
                  {mission.status === 'active' ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
                </button>
              )}
              {!['completed', 'cancelled', 'expired', 'archived'].includes(mission.status) && (
                <>
                  <button
                    type="button"
                    className="button button-danger button-small"
                    onClick={() => cancelOrExpireMission(mission.id, 'cancelled')}
                  >
                    <XCircle size={13} /> Cancel &amp; Refund Unspent XP
                  </button>
                  <button
                    type="button"
                    className="button button-quiet button-small"
                    onClick={() => cancelOrExpireMission(mission.id, 'expired')}
                  >
                    <RotateCcw size={13} /> Mark Expired &amp; Refund
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="dashboard-columns">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section className="dashboard-panel">
              <div className="panel-title"><h2>Mission Brief &amp; Deliverables</h2></div>
              <p style={{ fontSize: 13.5, color: 'var(--arena-ink)' }}><b>Objective:</b> {mission.objective}</p>
              <p style={{ fontSize: 13.5, color: 'var(--arena-ink)' }}><b>Instructions:</b> {mission.instructions}</p>

              <div className="arena-grid-2" style={{ marginTop: 14 }}>
                <div>
                  <div className="section-kicker" style={{ marginBottom: 6 }}>STEPS</div>
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: 'var(--arena-ink)' }}>
                    {mission.steps.map((s) => <li key={s} style={{ marginBottom: 4 }}>{s}</li>)}
                  </ol>
                </div>
                <div>
                  <div className="section-kicker" style={{ marginBottom: 6 }}>DELIVERABLES</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: 'var(--arena-ink)' }}>
                    {mission.deliverables.map((d) => <li key={d} style={{ marginBottom: 4 }}>{d}</li>)}
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--arena-line)' }}>
                <div className="section-kicker" style={{ marginBottom: 6 }}>REQUIRED EVIDENCE FORMATS</div>
                <div className="tag-row">
                  {mission.requiredEvidenceTypes.map((ev) => (
                    <span className="tag" key={ev}>{EVIDENCE_TYPE_LABELS[ev]}</span>
                  ))}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--arena-muted)', margin: '10px 0 0' }}>
                  <b>Verification criteria:</b> {mission.verificationCriteria}
                </p>
              </div>
            </section>

            {currentMember ? (
              <section className="dashboard-panel">
                <div className="panel-title">
                  <div>
                    <span className="section-kicker">YOUR PARTICIPATION</span>
                    <h2>Join &amp; Submit Proof of Work</h2>
                  </div>
                  {myParticipation && (
                    <span className="listing-kind kind-success">Status: {formatParticipationStatus(myParticipation.status)}</span>
                  )}
                </div>

                {!myParticipation && mission.status === 'active' && mission.participationOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {mission.participationFormat === 'application' && (
                      <label className="arena-field">
                        Application Pitch
                        <textarea
                          rows={2}
                          className="arena-textarea"
                          placeholder="Share relevant experience or approach..."
                          value={applyNote}
                          onChange={(e) => setApplyNote(e.target.value)}
                        />
                      </label>
                    )}
                    {mission.participationFormat === 'team' && (
                      <label className="arena-field">
                        Team / Squad Name (optional)
                        <input
                          className="arena-input"
                          placeholder="e.g. Artisans Pair Alpha"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                        />
                      </label>
                    )}
                    <div>
                      <button
                        type="button"
                        className="button button-bright"
                        onClick={() => joinOrApplyMission(mission.id, applyNote, teamName)}
                      >
                        {mission.participationFormat === 'application' ? 'Submit Application' : 'Join Mission'}
                      </button>
                    </div>
                  </div>
                )}

                {mySubmission && resubmitId !== mySubmission.id && (
                  <div style={{ padding: 14, background: 'var(--arena-canvas)', border: '1px solid var(--arena-line)', borderRadius: 9, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <b>Your Submission (v{mySubmission.version})</b>
                      <span className="listing-kind kind-featured">{formatSubmissionStatus(mySubmission.status)}</span>
                    </div>
                    <p style={{ margin: '8px 0', fontSize: 13.5 }}>{mySubmission.summary}</p>
                    <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 12.5, color: 'var(--arena-muted)' }}>
                      {mySubmission.evidenceItems.map((ev) => (
                        <li key={ev.id}>
                          <b>{ev.label}:</b> {ev.value}
                          {ev.fileMeta && ` (${Math.round(ev.fileMeta.sizeBytes / 1024)} KB · ${ev.fileMeta.simulatedNotice})`}
                        </li>
                      ))}
                    </ul>
                    {mySubmission.reviews.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--arena-line)', paddingTop: 8, marginTop: 8, fontSize: 12.5 }}>
                        <b>Review History:</b>
                        {mySubmission.reviews.map((r) => (
                          <div key={r.id} style={{ marginTop: 4 }}>
                            <b>{formatSubmissionStatus(r.decision)}:</b> {r.comment}
                          </div>
                        ))}
                      </div>
                    )}

                    {mySubmission.status === 'revision_requested' && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="button button-bright button-small"
                          onClick={() => {
                            setResubmitId(mySubmission.id)
                            setSummary(mySubmission.summary)
                          }}
                        >
                          Prepare Revised Resubmission (v{mySubmission.version + 1})
                        </button>
                      </div>
                    )}

                    {(mySubmission.status === 'rejected' || mySubmission.status === 'revision_requested') && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                          className="arena-input"
                          style={{ flex: '1 1 220px' }}
                          placeholder="Why should Stewards review this rejection/revision?"
                          value={disputeReason[mySubmission.id] ?? ''}
                          onChange={(e) => setDisputeReason((p) => ({ ...p, [mySubmission.id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="button button-danger button-small"
                          onClick={() => openDispute(mySubmission.id, disputeReason[mySubmission.id] ?? '')}
                        >
                          <ShieldAlert size={13} /> Open Dispute (Preserve Evidence)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {mission.status === 'active' &&
                  (!mySubmission || resubmitId === mySubmission.id) &&
                  (mission.participationFormat !== 'application' || myParticipation?.status === 'accepted') && (
                    <form onSubmit={handleSubmitPoW} className="form-panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <label className="arena-field">
                        Deliverable Summary {resubmitId ? `(Resubmission v${(mySubmission?.version ?? 1) + 1})` : ''}
                        <textarea
                          required
                          rows={3}
                          className="arena-textarea"
                          placeholder="Summarise what you built, verified, or delivered..."
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                        />
                      </label>
                      <div className="form-grid">
                        <label>
                          Public URL / PR / Thread Link
                          <input
                            placeholder="https://github.com/..."
                            value={evidenceLink}
                            onChange={(e) => setEvidenceLink(e.target.value)}
                          />
                        </label>
                        <label>
                          Written Evidence / Verification Notes
                          <input
                            placeholder="Notes, test counts, or checklist summary..."
                            value={evidenceText}
                            onChange={(e) => setEvidenceText(e.target.value)}
                          />
                        </label>
                      </div>
                      <label className="arena-field">
                        Optional File Deliverable (Demo placeholder)
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <input type="file" onChange={handleFilePick} style={{ maxWidth: 280 }} />
                          {fileMeta && (
                            <span className="listing-kind kind-featured">
                              <FileUp size={12} /> {fileMeta.fileName} ({fileMeta.sizeBytes} bytes · demo only)
                            </span>
                          )}
                        </div>
                        <small style={{ color: 'var(--arena-muted)' }}>
                          Demo mode: saves filename and size only — files are not uploaded.
                        </small>
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" className="button button-bright">
                          {resubmitId ? 'Submit Revised Proof of Work' : 'Submit Proof of Work'}
                        </button>
                        {resubmitId && (
                          <button type="button" className="button button-quiet" onClick={() => setResubmitId(null)}>
                            Cancel Revision
                          </button>
                        )}
                      </div>
                    </form>
                  )}
              </section>
            ) : (
              <div className="arena-notice arena-notice-info">
                <span>Sign in as a Spartan to join this mission or submit Proof of Work.</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mission.participationFormat === 'application' && canManage && (
              <section className="dashboard-panel">
                <div className="panel-title">
                  <h2>Applications ({participations.length})</h2>
                </div>
                {participations.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--arena-muted)' }}>No applicants yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {participations.map((p) => {
                      const applicant = state.members.find((m) => m.id === p.memberId)
                      return (
                        <div key={p.id} style={{ padding: 11, border: '1px solid var(--arena-line)', borderRadius: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <b>{applicant?.displayName ?? p.memberId}</b>
                            <span className="listing-kind">{formatParticipationStatus(p.status)}</span>
                          </div>
                          {p.applicationNote && <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'var(--arena-muted)' }}>{p.applicationNote}</p>}
                          {p.status === 'applied' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button type="button" className="button button-bright button-small" onClick={() => decideApplication(p.id, 'accepted')}>Accept</button>
                              <button type="button" className="button button-quiet button-small" onClick={() => decideApplication(p.id, 'declined')}>Decline</button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            <section className="dashboard-panel">
              <div className="panel-title">
                <div>
                  <span className="section-kicker">VERIFICATION QUEUE</span>
                  <h2>Submissions ({missionSubmissions.length})</h2>
                </div>
              </div>

              {missionSubmissions.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--arena-muted)' }}>No Proof of Work submitted yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {missionSubmissions.map((sub) => {
                    const contributor = state.members.find((m) => m.id === sub.memberId)
                    const isOwnSubmission = currentMember?.id === sub.memberId

                    return (
                      <div key={sub.id} style={{ padding: 12, border: '1px solid var(--arena-line)', borderRadius: 9 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <b>{contributor?.displayName ?? sub.memberId} · v{sub.version}</b>
                          <span className={`listing-kind ${sub.status === 'approved' ? 'kind-success' : sub.status === 'disputed' ? 'kind-featured' : ''}`}>
                            {formatSubmissionStatus(sub.status)}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0', fontSize: 13 }}>{sub.summary}</p>
                        <div style={{ fontSize: 12, color: 'var(--arena-muted)' }}>
                          {sub.evidenceItems.map((ev) => (
                            <div key={ev.id}>• <b>{ev.label}:</b> {ev.value}</div>
                          ))}
                        </div>

                        {canReviewAny && sub.status !== 'approved' && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--arena-line)' }}>
                            {isOwnSubmission ? (
                              <div className="arena-notice arena-notice-warn">
                                <AlertTriangle size={15} />
                                <span>Self-review blocked: you cannot review or approve your own submission.</span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input
                                  className="arena-input"
                                  placeholder="Reviewer comment..."
                                  value={reviewComment[sub.id] ?? ''}
                                  onChange={(e) => setReviewComment((p) => ({ ...p, [sub.id]: e.target.value }))}
                                />
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className="button button-bright button-small"
                                    onClick={() =>
                                      reviewSubmission(
                                        sub.id,
                                        'approved',
                                        reviewComment[sub.id] || 'Approved Proof of Work and settled reward.',
                                      )
                                    }
                                  >
                                    <CheckCircle2 size={13} /> Approve &amp; Settle
                                  </button>
                                  <button
                                    type="button"
                                    className="button button-quiet button-small"
                                    onClick={() =>
                                      reviewSubmission(
                                        sub.id,
                                        'revision_requested',
                                        reviewComment[sub.id] || 'Please add clarifying details and resubmit.',
                                      )
                                    }
                                  >
                                    Request Revision
                                  </button>
                                  <button
                                    type="button"
                                    className="button button-danger button-small"
                                    onClick={() =>
                                      reviewSubmission(
                                        sub.id,
                                        'rejected',
                                        reviewComment[sub.id] || 'Does not meet verification criteria.',
                                      )
                                    }
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
