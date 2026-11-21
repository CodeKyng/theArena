import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import PermissionGate from '../components/PermissionGate'
import {
  EVIDENCE_TYPE_LABELS,
  MISSION_CATEGORIES,
  PARTICIPATION_FORMATS,
} from '../domain/constants'
import { classifyMissionBand, validateMissionPolicy } from '../domain/progression'
import type { EvidenceType, HouseId, Mission, MissionCategory, ParticipationFormat } from '../domain/types'

const STEP_LABELS = [
  '1. Purpose & House',
  '2. Category & Format',
  '3. Steps & Deliverables',
  '4. Evidence Rules',
  '5. Reward & Escrow',
  '6. Timeline & Scope',
  '7. Review & Publish',
]

export default function MissionCreatePage() {
  const { state, currentMember, xpBalance, memberOrganisations, createMission } = useArena()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [objective, setObjective] = useState('')
  const [houseId, setHouseId] = useState<HouseId>(currentMember?.primaryHouseId ?? 'forge-masters')
  const [crossHouseEligible, setCrossHouseEligible] = useState(false)
  const [sponsorOrganisationId, setSponsorOrganisationId] = useState('')

  const [category, setCategory] = useState<MissionCategory>('Technical and Development')
  const [participationFormat, setParticipationFormat] = useState<ParticipationFormat>('open')
  const [difficulty, setDifficulty] = useState<Mission['difficulty']>('Intermediate')
  const [eligibilityNote, setEligibilityNote] = useState('Open to eligible Arena Spartans.')
  const [capacity, setCapacity] = useState(3)

  const [instructions, setInstructions] = useState('')
  const [stepsText, setStepsText] = useState('Review requirements\nDeliver verified artefact\nSubmit evidence links & summary')
  const [deliverablesText, setDeliverablesText] = useState('Working artefact or report\nBrief rationale summary')
  const [restrictionsText, setRestrictionsText] = useState('Original work only; follow Arena policy')
  const [tagsText, setTagsText] = useState('Builder, Proof-of-Work')

  const [requiredEvidenceTypes, setRequiredEvidenceTypes] = useState<EvidenceType[]>(['text', 'links'])
  const [submissionInstructions, setSubmissionInstructions] = useState('Share reproducible links and summary notes.')
  const [verificationCriteria, setVerificationCriteria] = useState('Meets deliverable checklist with verified proof.')

  const [isFunded, setIsFunded] = useState(true)
  const [rewardPerContributorXp, setRewardPerContributorXp] = useState(150)
  const [maxContributors, setMaxContributors] = useState(2)

  const [platformContext, setPlatformContext] = useState('GitHub / Docs')
  const [locationContext, setLocationContext] = useState('Remote')
  const [startDate, setStartDate] = useState('2026-11-20')
  const [deadline, setDeadline] = useState('2026-12-31')
  const [formError, setFormError] = useState<string | null>(null)

  const bandInfo = classifyMissionBand(isFunded ? rewardPerContributorXp : 0, state.config.rewardBands)
  const totalReserveNeeded = isFunded ? Math.max(0, rewardPerContributorXp) * Math.max(1, maxContributors) : 0
  const policyCheck = validateMissionPolicy([title, description, objective, instructions, deliverablesText])

  const toggleEvidence = (ev: EvidenceType) => {
    setRequiredEvidenceTypes((prev) =>
      prev.includes(ev) ? (prev.length > 1 ? prev.filter((x) => x !== ev) : prev) : [...prev, ev],
    )
  }

  const submitMission = (publishNow: boolean) => {
    setFormError(null)
    const res = createMission({
      title,
      description,
      objective,
      instructions,
      steps: stepsText.split('\n'),
      deliverables: deliverablesText.split('\n'),
      restrictions: restrictionsText.split('\n'),
      category,
      tags: tagsText.split(','),
      houseId,
      crossHouseEligible: houseId === 'echoes' ? true : crossHouseEligible,
      sponsorOrganisationId: sponsorOrganisationId || undefined,
      participationFormat,
      eligibilityNote,
      capacity: Math.max(maxContributors, capacity),
      difficulty,
      platformContext,
      locationContext,
      requiredEvidenceTypes,
      submissionInstructions,
      verificationCriteria,
      startDate,
      deadline,
      rewardPerContributorXp: isFunded ? rewardPerContributorXp : 0,
      maxContributors,
      isFunded,
      publishNow,
    })

    if (!res.ok) {
      setFormError(res.error)
      return
    }
    navigate(`/missions/${res.data.id}`)
  }

  return (
    <PageScaffold
      section="Guided 7-Step Wizard"
      name="Create a Mission"
      description={`Available Spendable XP: ${xpBalance.spendableXp.toLocaleString()} XP (Lifetime XP is never reduced when funding missions).`}
      actions={
        <Link className="button button-quiet button-small" to="/missions">
          <ArrowLeft size={14} /> Back to Missions
        </Link>
      }
    >
      <PermissionGate requiredAny={['mission.create']} title="Guided Mission Creation Wizard">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="arena-tabs" role="tablist" aria-label="Creation wizard steps">
            {STEP_LABELS.map((label, idx) => (
              <button
                key={label}
                type="button"
                className={`arena-tab ${step === idx ? 'active' : ''}`}
                onClick={() => setStep(idx)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="form-panel" style={{ maxWidth: 880 }}>
            {formError && (
              <div className="arena-notice arena-notice-danger" style={{ marginBottom: 14 }}>
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {!policyCheck.compliant && (
              <div className="arena-notice arena-notice-danger" style={{ marginBottom: 14 }}>
                <AlertTriangle size={16} />
                <span>{policyCheck.reason}</span>
              </div>
            )}

            {step === 0 && (
              <div className="form-grid">
                <label className="full-field">
                  Mission Title
                  <input
                    required
                    placeholder="e.g. Build Deterministic Proof-of-Work Diff Checker"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label className="full-field">
                  Description
                  <textarea
                    rows={3}
                    placeholder="Clear overview of the problem, value to the community, and expected quality."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                <label className="full-field">
                  Objective
                  <input
                    placeholder="Concrete outcome this mission achieves"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                  />
                </label>
                <label>
                  Target House
                  <select value={houseId} onChange={(e) => setHouseId(e.target.value as HouseId)}>
                    {state.houses.map((h) => (
                      <option key={h.id} value={h.id}>{h.glyph} House {h.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Sponsor Organisation (optional)
                  <select value={sponsorOrganisationId} onChange={(e) => setSponsorOrganisationId(e.target.value)}>
                    <option value="">Personal Spartan Funded</option>
                    {memberOrganisations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.verificationStatus})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={houseId === 'echoes' || crossHouseEligible}
                    disabled={houseId === 'echoes'}
                    onChange={(e) => setCrossHouseEligible(e.target.checked)}
                  />
                  Cross-House Eligible (open to Spartans outside the primary target House)
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="form-grid">
                <label>
                  Mission Category (10 Canonical)
                  <select value={category} onChange={(e) => setCategory(e.target.value as MissionCategory)}>
                    {MISSION_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Participation Format
                  <select value={participationFormat} onChange={(e) => setParticipationFormat(e.target.value as ParticipationFormat)}>
                    {PARTICIPATION_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Difficulty Level
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Mission['difficulty'])}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </label>
                <label>
                  Participant Capacity
                  <input type="number" min={1} max={100} value={capacity} onChange={(e) => setCapacity(Number(e.target.value) || 1)} />
                </label>
                <label className="full-field">
                  Eligibility &amp; Access Note
                  <input value={eligibilityNote} onChange={(e) => setEligibilityNote(e.target.value)} />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="form-grid">
                <label className="full-field">
                  Contributor Instructions
                  <textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Detailed guidance for completing the work..." />
                </label>
                <label>
                  Steps (one per line)
                  <textarea rows={4} value={stepsText} onChange={(e) => setStepsText(e.target.value)} />
                </label>
                <label>
                  Deliverables (one per line)
                  <textarea rows={4} value={deliverablesText} onChange={(e) => setDeliverablesText(e.target.value)} />
                </label>
                <label className="full-field">
                  Tags (comma-separated)
                  <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="form-grid">
                <div className="full-field">
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                    Required Proof-of-Work Evidence Types
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                    {(Object.keys(EVIDENCE_TYPE_LABELS) as EvidenceType[]).map((evKey) => (
                      <label
                        key={evKey}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          padding: 9,
                          border: '1px solid var(--arena-border)',
                          borderRadius: 7,
                          background: requiredEvidenceTypes.includes(evKey) ? '#eef5ff' : '#fff',
                        }}
                      >
                        <input
                          type="checkbox"
                          style={{ width: 'auto' }}
                          checked={requiredEvidenceTypes.includes(evKey)}
                          onChange={() => toggleEvidence(evKey)}
                        />
                        <span style={{ fontSize: 12.5 }}>{EVIDENCE_TYPE_LABELS[evKey]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="full-field">
                  Submission Instructions
                  <textarea rows={2} value={submissionInstructions} onChange={(e) => setSubmissionInstructions(e.target.value)} />
                </label>
                <label className="full-field">
                  Verification &amp; Review Criteria
                  <textarea rows={2} value={verificationCriteria} onChange={(e) => setVerificationCriteria(e.target.value)} />
                </label>
              </div>
            )}

            {step === 4 && (
              <div className="form-grid">
                <label className="full-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={isFunded}
                    onChange={(e) => setIsFunded(e.target.checked)}
                  />
                  Fund mission with Spendable XP escrow (recommended; uncheck for non-rewarded mission)
                </label>

                {isFunded && (
                  <>
                    <label>
                      Reward per Contributor (XP)
                      <input
                        type="number"
                        min={25}
                        max={5000}
                        value={rewardPerContributorXp}
                        onChange={(e) => setRewardPerContributorXp(Number(e.target.value) || 0)}
                      />
                    </label>
                    <label>
                      Max Rewarded Contributors
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={maxContributors}
                        onChange={(e) => setMaxContributors(Math.max(1, Number(e.target.value) || 1))}
                      />
                    </label>

                    <div className="full-field arena-notice arena-notice-info" style={{ flexDirection: 'column', gap: 6 }}>
                      <div>
                        <b>Reward Band Classification:</b> {bandInfo.band.toUpperCase()} · CP awarded per approval: <b>+{bandInfo.cpValue} CP</b>
                      </div>
                      <div>
                        Bands: Micro (25–75 XP / 5 CP) · Standard (100–250 XP / 15 CP) · Substantial (300–750 XP / 30 CP) · Major (800–1,500 XP / 50 CP).
                      </div>
                      <div>
                        <b>Total Escrow Reservation on Publish:</b> {totalReserveNeeded.toLocaleString()} XP (Your Spendable XP: {xpBalance.spendableXp.toLocaleString()} XP)
                      </div>
                    </div>

                    {bandInfo.requiresAdditionalApproval && (
                      <div className="full-field arena-notice arena-notice-warn">
                        <AlertTriangle size={16} />
                        <span>
                          <b>Above-Major Threshold (&gt;1,500 XP):</b> Publishing reserves {totalReserveNeeded} XP and places this mission in <b>Pending Control Room Review</b> before contributors can join.
                        </span>
                      </div>
                    )}

                    {totalReserveNeeded > xpBalance.spendableXp && (
                      <div className="full-field arena-notice arena-notice-danger">
                        <AlertTriangle size={16} />
                        <span>
                          Insufficient Spendable XP ({xpBalance.spendableXp} available vs {totalReserveNeeded} required). Lower the reward or save as Draft.
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="form-grid">
                <label>
                  Platform / Tool Context
                  <input value={platformContext} onChange={(e) => setPlatformContext(e.target.value)} />
                </label>
                <label>
                  Location Context
                  <input value={locationContext} onChange={(e) => setLocationContext(e.target.value)} />
                </label>
                <label>
                  Start Date
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>
                <label>
                  Deadline
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </label>
                <label className="full-field">
                  Restrictions &amp; Policy Guardrails (one per line)
                  <textarea rows={3} value={restrictionsText} onChange={(e) => setRestrictionsText(e.target.value)} />
                </label>
              </div>
            )}

            {step === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="arena-notice arena-notice-success">
                  <CheckCircle2 size={16} />
                  <div>
                    <b>Ready to Save or Publish:</b> "{title || 'Untitled Mission'}" · House {houseId} · {category} · {participationFormat} · {isFunded ? `${totalReserveNeeded} XP Escrow (${rewardPerContributorXp} × ${maxContributors})` : 'Non-rewarded'}.
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--arena-ink-muted)' }}>
                  Saving as <b>Draft</b> reserves 0 XP. Clicking <b>Publish &amp; Reserve XP</b> immediately locks {totalReserveNeeded} Spendable XP into mission escrow (refunded automatically if cancelled or expired unspent).
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--arena-border)', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button button-quiet"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Previous Step
              </button>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button button-quiet"
                  onClick={() => submitMission(false)}
                >
                  Save as Draft (0 XP)
                </button>
                {step < STEP_LABELS.length - 1 ? (
                  <button
                    type="button"
                    className="button button-bright"
                    onClick={() => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))}
                  >
                    Next Step <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button-bright"
                    disabled={!policyCheck.compliant || (isFunded && totalReserveNeeded > xpBalance.spendableXp)}
                    onClick={() => submitMission(true)}
                  >
                    {bandInfo.requiresAdditionalApproval
                      ? 'Submit for Control Room Approval'
                      : 'Publish & Reserve XP'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </PermissionGate>
    </PageScaffold>
  )
}
