import { describe, expect, it } from 'vitest'
import { INITIAL_ARENA_STATE } from '../../data/seedData'
import { buildLeaderboard, deriveXpBalance, memberHasPermission } from '../../domain/progression'
import {
  adminAdjustXp,
  appointAscendancy,
  approveHighValueMission,
  cancelOrExpireMission,
  commissionServiceAsMission,
  completeAcademyLesson,
  completeOrientationAndRules,
  createMission,
  createOrganisation,
  decideMissionApplication,
  joinOrApplyMission,
  openSubmissionDispute,
  publishDraftMission,
  recordEventAttendanceOrRole,
  registerUnifiedAccount,
  resolveDispute,
  resubmitMissionWork,
  reviewSubmission,
  setOrganisationVerification,
  submitMissionWork,
  switchActiveOrganisation,
  updateMemberHouses,
  verifyMentorshipSession,
} from '../arenaService'

function baseCreateInput(overrides: Partial<Parameters<typeof createMission>[2]> = {}): Parameters<typeof createMission>[2] {
  return {
    title: 'Deterministic Schema Fixture Suite',
    description: 'Build reproducible validation fixtures for Arena ledger outputs.',
    objective: 'Ensure ledger totals never drift across browser restarts.',
    instructions: 'Follow repository guidelines and include Vitest proof.',
    steps: ['Draft fixture schema', 'Write invariants', 'Run unit tests'],
    deliverables: ['Vitest test PR link', 'Coverage note'],
    restrictions: ['No copied templates'],
    category: 'Technical and Development',
    tags: ['TypeScript', 'Testing'],
    houseId: 'forge-masters',
    crossHouseEligible: false,
    participationFormat: 'open',
    eligibilityNote: 'Open to Forge Masters & cross-House engineers.',
    capacity: 2,
    difficulty: 'Intermediate',
    platformContext: 'GitHub',
    locationContext: 'Remote',
    requiredEvidenceTypes: ['links', 'text'],
    submissionInstructions: 'Include link and test summary.',
    verificationCriteria: 'All tests pass deterministically.',
    startDate: '2026-11-20',
    deadline: '2026-12-20',
    rewardPerContributorXp: 250,
    maxContributors: 1,
    isFunded: true,
    publishNow: true,
    ...overrides,
  }
}

describe('The Arena 10 Critical User Journeys', () => {
  it('Journey 1 & 2: Unified Spartan signup (no role split), idempotent +20 XP orientation, 0-XP House choice, Academy quiz & Intro Mission', () => {
    const reg = registerUnifiedAccount(INITIAL_ARENA_STATE, {
      displayName: 'Samira Patel',
      username: 'samira.patel',
      email: 'samira@arena.demo',
      headline: 'Protocol Researcher',
    })
    expect(reg.ok).toBe(true)
    if (!reg.ok) return
    let s = reg.state
    const newId = reg.data.id
    expect(reg.data.membershipStatus).toBe('spartan')
    expect(reg.data.ascendancyRank).toBe('Spartan')
    expect(reg.data.onboardingStage).toBe('newbie')

    // Orientation + Rules check grants +20 XP once and unlocks Arena Ready
    const onb1 = completeOrientationAndRules(s, newId)
    expect(onb1.ok).toBe(true)
    if (!onb1.ok) return
    expect(onb1.data.awardedXp).toBe(20)
    s = onb1.state
    expect(deriveXpBalance(newId, s.xpTransactions).lifetimeXp).toBe(20)

    // Duplicate orientation click awards 0 extra XP
    const onb2 = completeOrientationAndRules(s, newId)
    expect(onb2.ok).toBe(true)
    if (onb2.ok) expect(onb2.data.awardedXp).toBe(0)

    // House selection adds 0 XP
    const houseRes = updateMemberHouses(s, newId, 'seers', 'scribes')
    expect(houseRes.ok).toBe(true)
    if (!houseRes.ok) return
    s = houseRes.state
    expect(deriveXpBalance(newId, s.xpTransactions).lifetimeXp).toBe(20)

    // Wrong Academy answer fails cleanly; correct answer awards +5 XP / +1 CP
    const badQuiz = completeAcademyLesson(s, newId, 'les-f1-1', 0)
    expect(badQuiz.ok).toBe(false)
    const goodQuiz = completeAcademyLesson(s, newId, 'les-f1-1', 1)
    expect(goodQuiz.ok).toBe(true)
    if (!goodQuiz.ok) return
    expect(goodQuiz.data.xpAwarded).toBe(5)
    expect(goodQuiz.data.cpAwarded).toBe(1)
    s = goodQuiz.state

    // Join & submit Intro Mission -> Elena approves
    const joinRes = joinOrApplyMission(s, newId, 'mis-intro')
    expect(joinRes.ok).toBe(true)
    if (!joinRes.ok) return
    s = joinRes.state
    const subRes = submitMissionWork(s, newId, 'mis-intro', 'My first case study for House Seers.', [
      { id: 'ev-1', type: 'text', label: 'Case Study', value: 'Detailed breakdown of House Seers workflow.' },
    ])
    expect(subRes.ok).toBe(true)
    if (!subRes.ok) return
    s = subRes.state

    const appRes = reviewSubmission(s, 'mem-elena', subRes.data.id, 'approved', 'Great starter study!')
    expect(appRes.ok).toBe(true)
    if (!appRes.ok) return
    s = appRes.state
    // 20 orientation + 5 lesson + 60 intro mission = 85 XP
    expect(deriveXpBalance(newId, s.xpTransactions).lifetimeXp).toBe(85)
  })

  it('Journey 3: Draft vs Funded publish, anti-farming block, insufficient balance block, and >1,500 XP Control Room approval hold', () => {
    const creatorId = 'mem-jordan'
    const initialBal = deriveXpBalance(creatorId, INITIAL_ARENA_STATE.xpTransactions)

    // Anti-farming mission rejected
    const badPolicy = createMission(
      INITIAL_ARENA_STATE,
      creatorId,
      baseCreateInput({ title: 'Like and retweet for XP boost' }),
    )
    expect(badPolicy.ok).toBe(false)

    // Insufficient Spendable XP blocked
    const tooExpensive = createMission(
      INITIAL_ARENA_STATE,
      creatorId,
      baseCreateInput({ rewardPerContributorXp: 99999, maxContributors: 1 }),
    )
    expect(tooExpensive.ok).toBe(false)

    // Save as Draft -> 0 XP reserved
    const draft = createMission(
      INITIAL_ARENA_STATE,
      creatorId,
      baseCreateInput({ rewardPerContributorXp: 200, maxContributors: 2, publishNow: false }),
    )
    expect(draft.ok).toBe(true)
    if (!draft.ok) return
    let s = draft.state
    expect(draft.data.status).toBe('draft')
    expect(deriveXpBalance(creatorId, s.xpTransactions).spendableXp).toBe(initialBal.spendableXp)

    // Publish Draft -> reserves 400 Spendable XP, Lifetime XP untouched
    const pub = publishDraftMission(s, creatorId, draft.data.id)
    expect(pub.ok).toBe(true)
    if (!pub.ok) return
    s = pub.state
    const postBal = deriveXpBalance(creatorId, s.xpTransactions)
    expect(postBal.lifetimeXp).toBe(initialBal.lifetimeXp)
    expect(postBal.spendableXp).toBe(initialBal.spendableXp - 400)
    expect(postBal.reservedXp).toBe(initialBal.reservedXp + 400)

    // >1,500 XP mission routes to pending_review until Control Room approves
    const highVal = createMission(
      s,
      creatorId,
      baseCreateInput({ rewardPerContributorXp: 1600, maxContributors: 1, publishNow: true }),
    )
    expect(highVal.ok).toBe(true)
    if (!highVal.ok) return
    s = highVal.state
    expect(highVal.data.status).toBe('pending_review')

    // Non-admin Maya cannot approve >1,500 XP mission
    expect(approveHighValueMission(s, 'mem-maya', highVal.data.id).ok).toBe(false)
    // Marcus (Control Room admin) approves -> Active
    const approvedHv = approveHighValueMission(s, 'mem-marcus', highVal.data.id)
    expect(approvedHv.ok).toBe(true)
    if (approvedHv.ok) {
      expect(approvedHv.data.status).toBe('active')
    }
  })

  it('Journey 4: Application approval, local file metadata proof, self-review block, revision loop & atomic XP/CP settlement', () => {
    let s = INITIAL_ARENA_STATE
    // Create application-based mission by Maya (400 XP x 1 contributor)
    const created = createMission(
      s,
      'mem-maya',
      baseCreateInput({ participationFormat: 'application', rewardPerContributorXp: 400, maxContributors: 1 }),
    )
    expect(created.ok).toBe(true)
    if (!created.ok) return
    s = created.state
    const missionId = created.data.id

    // Kaito applies
    const applied = joinOrApplyMission(s, 'mem-kaito', missionId, 'I have Vitest experience.')
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    s = applied.state
    expect(applied.data.status).toBe('applied')

    // Cannot submit before application accepted
    expect(
      submitMissionWork(s, 'mem-kaito', missionId, 'Early attempt', [
        { id: 'e1', type: 'text', label: 'Note', value: 'Early' },
      ]).ok,
    ).toBe(false)

    // Maya accepts Kaito
    const accepted = decideMissionApplication(s, 'mem-maya', applied.data.id, 'accepted')
    expect(accepted.ok).toBe(true)
    if (!accepted.ok) return
    s = accepted.state

    // Kaito submits with local file metadata proof
    const sub1 = submitMissionWork(s, 'mem-kaito', missionId, 'Initial PR + test artifact.', [
      {
        id: 'e-file',
        type: 'files',
        label: 'Test Artifact',
        value: 'vitest-report.json',
        fileMeta: {
          fileName: 'vitest-report.json',
          sizeBytes: 12400,
          mimeType: 'application/json',
          simulatedNotice: 'Simulated client file metadata',
        },
      },
    ])
    expect(sub1.ok).toBe(true)
    if (!sub1.ok) return
    s = sub1.state

    // Self-review strictly blocked
    expect(reviewSubmission(s, 'mem-kaito', sub1.data.id, 'approved', 'LGTM').ok).toBe(false)

    // Maya requests revision
    const revReq = reviewSubmission(s, 'mem-maya', sub1.data.id, 'revision_requested', 'Add edge-case assertions.')
    expect(revReq.ok).toBe(true)
    if (!revReq.ok) return
    s = revReq.state

    // Kaito resubmits v2 preserving revision history
    const resub = resubmitMissionWork(s, 'mem-kaito', sub1.data.id, 'Added edge cases and full log.', [
      { id: 'e-link', type: 'links', label: 'PR Link', value: 'https://github.com/thearena-demo/fixtures/pull/9' },
    ])
    expect(resub.ok).toBe(true)
    if (!resub.ok) return
    s = resub.state
    expect(resub.data.version).toBe(2)
    expect(resub.data.revisionHistory).toHaveLength(1)

    const kaitoBefore = deriveXpBalance('mem-kaito', s.xpTransactions)
    const mayaBefore = deriveXpBalance('mem-maya', s.xpTransactions)

    // Maya approves -> atomic transfer
    const app = reviewSubmission(s, 'mem-maya', resub.data.id, 'approved', 'Verified clean PR.')
    expect(app.ok).toBe(true)
    if (!app.ok) return
    s = app.state

    const kaitoAfter = deriveXpBalance('mem-kaito', s.xpTransactions)
    const mayaAfter = deriveXpBalance('mem-maya', s.xpTransactions)
    expect(kaitoAfter.lifetimeXp).toBe(kaitoBefore.lifetimeXp + 400)
    expect(kaitoAfter.spendableXp).toBe(kaitoBefore.spendableXp + 400)
    // Creator Lifetime XP unchanged; reserved decreased
    expect(mayaAfter.lifetimeXp).toBe(mayaBefore.lifetimeXp)
    expect(mayaAfter.reservedXp).toBe(mayaBefore.reservedXp - 400)
    expect(s.missions.find((m) => m.id === missionId)?.status).toBe('completed')
  })

  it('Journey 5: Cancelling/expiring a mission refunds unallocated reserved XP back to creator Spendable XP', () => {
    const creatorId = 'mem-jordan'
    const startBal = deriveXpBalance(creatorId, INITIAL_ARENA_STATE.xpTransactions)
    const created = createMission(
      INITIAL_ARENA_STATE,
      creatorId,
      baseCreateInput({ rewardPerContributorXp: 300, maxContributors: 2, publishNow: true }),
    )
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const afterCreate = deriveXpBalance(creatorId, created.state.xpTransactions)
    expect(afterCreate.spendableXp).toBe(startBal.spendableXp - 600)

    const cancelled = cancelOrExpireMission(created.state, creatorId, created.data.id, 'cancelled')
    expect(cancelled.ok).toBe(true)
    if (!cancelled.ok) return
    expect(cancelled.data.refundedXp).toBe(600)
    const afterCancel = deriveXpBalance(creatorId, cancelled.state.xpTransactions)
    expect(afterCancel.spendableXp).toBe(startBal.spendableXp)
    expect(afterCancel.reservedXp).toBe(startBal.reservedXp)
  })

  it('Journey 6: Opening a dispute preserves evidence snapshot; Steward overturn settles XP/CP cleanly', () => {
    // Seeded open dispute disp-1 on sub-6 (mem-kaito on mis-seers-grants)
    const kaitoBefore = deriveXpBalance('mem-kaito', INITIAL_ARENA_STATE.xpTransactions)
    // Self-resolution blocked if Kaito tries
    expect(resolveDispute(INITIAL_ARENA_STATE, 'mem-kaito', 'disp-1', 'resolved_overturned', 'Approve me').ok).toBe(false)

    // Elena (Elder/Moderator) overturns
    const resolved = resolveDispute(
      INITIAL_ARENA_STATE,
      'mem-elena',
      'disp-1',
      'resolved_overturned',
      'Confirmed Track B reopened Nov 14.',
    )
    expect(resolved.ok).toBe(true)
    if (!resolved.ok) return
    const kaitoAfter = deriveXpBalance('mem-kaito', resolved.state.xpTransactions)
    expect(kaitoAfter.lifetimeXp).toBe(kaitoBefore.lifetimeXp + 350)
    expect(resolved.state.submissions.find((s) => s.id === 'sub-6')?.status).toBe('approved')

    // Also verify opening a fresh dispute preserves snapshot on rejected submission
    const rejected = reviewSubmission(INITIAL_ARENA_STATE, 'mem-jordan', 'sub-2', 'rejected', 'Missing CLI tests.')
    expect(rejected.ok).toBe(true)
    if (!rejected.ok) return
    const disp = openSubmissionDispute(rejected.state, 'mem-kaito', 'sub-2', 'Tests are in branch feat/tests.')
    expect(disp.ok).toBe(true)
    if (disp.ok) {
      expect(disp.data.preservedEvidenceSnapshot.length).toBeGreaterThan(0)
      expect(disp.data.preservedReviewComments.some((c) => c.includes('Missing CLI tests'))).toBe(true)
    }
  })

  it('Journey 7 & 8: Funding missions never lowers CP leaderboard rank; Service commissioning & Event attendance caps', () => {
    const beforeBoard = buildLeaderboard({
      members: INITIAL_ARENA_STATE.members,
      xpTransactions: INITIAL_ARENA_STATE.xpTransactions,
      cpEvents: INITIAL_ARENA_STATE.cpEvents,
      contributions: INITIAL_ARENA_STATE.contributionRecords,
      thresholds: INITIAL_ARENA_STATE.config.levelThresholds,
      category: 'overall',
      period: 'season',
      seasonId: INITIAL_ARENA_STATE.currentSeason.id,
    })
    const jordanRankBefore = beforeBoard.find((r) => r.memberId === 'mem-jordan')?.rank

    // Jordan spends 500 Spendable XP commissioning Soren's design service (srv-3)
    const comm = commissionServiceAsMission(
      INITIAL_ARENA_STATE,
      'mem-jordan',
      'srv-3',
      'Need 3 Figma frames for Launch Guide.',
      500,
    )
    expect(comm.ok).toBe(true)
    if (!comm.ok) return

    const afterBoard = buildLeaderboard({
      members: comm.state.members,
      xpTransactions: comm.state.xpTransactions,
      cpEvents: comm.state.cpEvents,
      contributions: comm.state.contributionRecords,
      thresholds: comm.state.config.levelThresholds,
      category: 'overall',
      period: 'season',
      seasonId: comm.state.currentSeason.id,
    })
    expect(afterBoard.find((r) => r.memberId === 'mem-jordan')?.rank).toBe(jordanRankBefore)

    // Event attendance recording awards +5 XP and +1 CP
    const att = recordEventAttendanceOrRole(comm.state, 'mem-marcus', 'evt-onboarding-sync', 'mem-newbie', 'attendee')
    expect(att.ok).toBe(true)
    if (att.ok) {
      expect(att.data.xpAwarded).toBe(5)
      expect(att.data.cpAwarded).toBe(1)
    }
  })

  it('Journey 9 & 10: Unified Account -> Organisation creation (unverified, 0 XP boost) + Control Room verification + Scoped RBAC & Ascendancy', () => {
    // Jordan creates an Organisation -> starts unverified, zero XP/Ascendancy inherited
    const jordanBefore = deriveXpBalance('mem-jordan', INITIAL_ARENA_STATE.xpTransactions)
    const orgRes = createOrganisation(INITIAL_ARENA_STATE, 'mem-jordan', {
      name: 'Delta Builders Guild',
      kind: 'Team',
      ecosystem: 'Base',
      tagline: 'Open benchmarking collective',
      description: 'Open benchmarking collective.',
      website: 'https://deltabuilders.demo',
    })
    expect(orgRes.ok).toBe(true)
    if (!orgRes.ok) return
    let s = orgRes.state
    expect(orgRes.data.verificationStatus).toBe('unverified')
    expect(deriveXpBalance('mem-jordan', s.xpTransactions).lifetimeXp).toBe(jordanBefore.lifetimeXp)

    // Switch context to org
    const sw = switchActiveOrganisation(s, orgRes.data.id)
    expect(sw.ok).toBe(true)
    if (sw.ok) s = sw.state
    expect(s.activeOrganisationId).toBe(orgRes.data.id)

    // Non-admin cannot verify organisation; Control Room admin verifies
    expect(setOrganisationVerification(s, 'mem-maya', orgRes.data.id, 'verified').ok).toBe(false)
    const ver = setOrganisationVerification(s, 'mem-marcus', orgRes.data.id, 'verified')
    expect(ver.ok).toBe(true)
    if (ver.ok) {
      expect(ver.data.verificationStatus).toBe('verified')
      s = ver.state
    }

    // Mentorship verification by Elena (Elder)
    const ment = verifyMentorshipSession(s, 'mem-elena', 'ment-2')
    expect(ment.ok).toBe(true)
    if (ment.ok) {
      expect(ment.data.xpAwarded).toBe(20)
      s = ment.state
    }

    // Permission boundary check: Maya is Forge Masters Strategos, blocked from Control Room & Scribes management
    expect(memberHasPermission('mem-maya', s.permissionGrants, 'house.manage', 'forge-masters')).toBe(true)
    expect(memberHasPermission('mem-maya', s.permissionGrants, 'house.manage', 'scribes')).toBe(false)
    expect(adminAdjustXp(s, 'mem-maya', 'mem-jordan', 100, 'Unauthorized').ok).toBe(false)

    // Marcus appoints Jordan to Strategos (explicit Ascendancy, never auto-by-XP)
    const asc = appointAscendancy(s, 'mem-marcus', 'mem-jordan', 'Strategos', 'Approved by Stewardship Council')
    expect(asc.ok).toBe(true)
    if (asc.ok) expect(asc.data.ascendancyRank).toBe('Strategos')
  })
})
