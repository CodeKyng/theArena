import { describe, expect, it } from 'vitest'
import { INITIAL_ARENA_STATE } from '../../data/seedData'
import { FEATURE_FLAGS } from '../../domain/constants'
import { buildLeaderboard, deriveXpBalance, memberHasPermission } from '../../domain/progression'
import {
  addDiscussionReply,
  addExploreOpportunity,
  addExploreProject,
  adminAdjustXp,
  appointAscendancy,
  approveHighValueMission,
  cancelOrExpireMission,
  commissionServiceAsMission,
  completeAcademyLesson,
  completeOrientationAndRules,
  createDiscussion,
  createMission,
  createOrganisation,
  decideMissionApplication,
  joinOrApplyMission,
  markAllNotificationsRead,
  markNotificationRead,
  openSubmissionDispute,
  publishDraftMission,
  recordEventAttendanceOrRole,
  registerUnifiedAccount,
  resolveDispute,
  resubmitMissionWork,
  reviewSubmission,
  rsvpEvent,
  setOrganisationVerification,
  signInDemoByEmail,
  signOutAccount,
  submitMissionWork,
  switchActiveOrganisation,
  switchDemoPersona,
  toggleBookmark,
  updateAccountPrivacy,
  updateMemberHouses,
  updateMemberProfile,
  verifyMentorshipSession,
} from '../arenaService'
import { ARENA_STORAGE_KEY, loadArenaState } from '../arenaStore'
import { resolveSafeRedirect } from '../../app/authRedirect'

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
    // Profile not yet updated -> still inbie until all 5 checklist steps are done
    expect(s.members.find((m) => m.id === newId)?.onboardingStage).toBe('newbie')
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

    // Ordinary members (Jordan, Alex) cannot verify event attendance or Host/Support roles
    const unauthorizedJordan = recordEventAttendanceOrRole(comm.state, 'mem-jordan', 'evt-onboarding-sync', 'mem-jordan', 'host')
    expect(unauthorizedJordan.ok).toBe(false)
    const unauthorizedNewbie = recordEventAttendanceOrRole(comm.state, 'mem-newbie', 'evt-onboarding-sync', 'mem-newbie', 'attendee')
    expect(unauthorizedNewbie.ok).toBe(false)

    // Authorised stewards/managers (Marcus, Maya, Elena) can verify attendance
    const attMaya = recordEventAttendanceOrRole(comm.state, 'mem-maya', 'evt-forge-clinic', 'mem-kaito', 'support')
    expect(attMaya.ok).toBe(true)

    const attElena = recordEventAttendanceOrRole(comm.state, 'mem-elena', 'evt-forge-clinic', 'mem-soren', 'host')
    expect(attElena.ok).toBe(true)

    // Event attendance recording by Marcus awards +5 XP and +1 CP and marks attendance
    const att = recordEventAttendanceOrRole(comm.state, 'mem-marcus', 'evt-onboarding-sync', 'mem-newbie', 'attendee')
    expect(att.ok).toBe(true)
    if (att.ok) {
      expect(att.data.xpAwarded).toBe(5)
      expect(att.data.cpAwarded).toBe(1)
      // Already-attended RSVP cannot be cancelled afterward
      const cancelAttended = rsvpEvent(att.state, 'mem-newbie', 'evt-onboarding-sync', 'attendee')
      expect(cancelAttended.ok).toBe(false)
    }
  })

  it('Journey 9 & 10 (V1 Org Deactivated): Blocks org creation/switching/verification while preserving Mentorship, Scoped RBAC & Ascendancy', () => {
    expect(FEATURE_FLAGS.organisationsEnabled).toBe(false)
    let s = INITIAL_ARENA_STATE
    const orgCountBefore = s.organisations.length
    const omCountBefore = s.organisationMemberships.length

    // Organisation creation, switching, and verification are cleanly rejected in V1 without mutating state
    const orgRes = createOrganisation(s, 'mem-jordan', {
      name: 'Delta Builders Guild',
      kind: 'Team',
      ecosystem: 'Base',
      tagline: 'Open benchmarking collective',
      description: 'Open benchmarking collective.',
      website: 'https://deltabuilders.demo',
    })
    expect(orgRes.ok).toBe(false)
    expect(s.organisations.length).toBe(orgCountBefore)
    expect(s.organisationMemberships.length).toBe(omCountBefore)

    const sw = switchActiveOrganisation(s, 'org-helix', 'mem-jordan')
    expect(sw.ok).toBe(false)
    expect(s.activeOrganisationId).toBeNull()

    expect(setOrganisationVerification(s, 'mem-marcus', 'org-veridian', 'verified').ok).toBe(false)
    expect(s.organisations.find((o) => o.id === 'org-veridian')?.verificationStatus).toBe('pending_review')

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

  it('Phase 1 Invariants: rejects funded mission with maxContributors > capacity, blocks past-event verification, and requires all 5 onboarding steps to graduate', () => {
    // 1. Funded mission capacity invariant
    const invalidCap = createMission(
      INITIAL_ARENA_STATE,
      'mem-jordan',
      baseCreateInput({ isFunded: true, capacity: 1, maxContributors: 3 }),
    )
    expect(invalidCap.ok).toBe(false)

    // 2. Past event verification guard
    const pastEvent = INITIAL_ARENA_STATE.events.find((e) => e.isPast)
    expect(pastEvent).toBeTruthy()
    if (pastEvent) {
      const pastVerify = recordEventAttendanceOrRole(
        INITIAL_ARENA_STATE,
        'mem-marcus',
        pastEvent.id,
        'mem-newbie',
        'attendee',
      )
      expect(pastVerify.ok).toBe(false)
    }

    // 3. Onboarding stays active until all 5 checklist steps are completed
    let s = INITIAL_ARENA_STATE
    const onb = completeOrientationAndRules(s, 'mem-newbie')
    expect(onb.ok).toBe(true)
    if (!onb.ok) return
    s = onb.state
    const hs = updateMemberHouses(s, 'mem-newbie', 'forge-masters', null)
    expect(hs.ok).toBe(true)
    if (!hs.ok) return
    s = hs.state
    // Previously graduated at 2/5 — must remain 'newbie' until 5/5 completed
    expect(s.members.find((m) => m.id === 'mem-newbie')?.onboardingStage).toBe('newbie')

    // Complete remaining steps (Academy, Intro mission, Profile) -> graduates to 'completed'
    const acad = completeAcademyLesson(s, 'mem-newbie', 'les-f1-1', 1)
    expect(acad.ok).toBe(true)
    if (!acad.ok) return
    s = acad.state
    expect(s.members.find((m) => m.id === 'mem-newbie')?.onboardingStage).toBe('newbie')

    const intro = joinOrApplyMission(s, 'mem-newbie', 'mis-intro')
    expect(intro.ok).toBe(true)
    if (!intro.ok) return
    s = intro.state
    expect(s.members.find((m) => m.id === 'mem-newbie')?.onboardingStage).toBe('newbie')

    // Simulate step 3 profile save
    const newbie = s.members.find((m) => m.id === 'mem-newbie')!
    expect(newbie.onboardingChecklist.profileGuided).toBe(false)
    const prof = updateMemberProfile(s, 'mem-newbie', { bio: 'Completed Spartan bio.' })
    expect(prof.ok).toBe(true)
    if (!prof.ok) return
    expect(prof.data.onboardingChecklist.profileGuided).toBe(true)
    expect(prof.data.onboardingStage).toBe('completed')
  })

  it('Phase 2 Invariants: discussion creation unlocks strictly at Level 15 regardless of Ascendancy rank while all Spartans can reply', () => {
    // Seeded Maya is Strategos at 5,600 XP (Level 14: threshold 5200..5949) -> blocked below Level 15
    const mayaBlocked = createDiscussion(INITIAL_ARENA_STATE, 'mem-maya', {
      title: 'Strategos Below Level 15 Attempt',
      topicTag: 'Governance',
      houseId: 'forge-masters',
      body: 'Should be rejected because lifetime XP is Level 14.',
    })
    expect(mayaBlocked.ok).toBe(false)

    // Register a plain Spartan and test exact Level 14 (5,949 XP), Level 15 (5,950 XP), and Level 16 (6,750 XP)
    const reg = registerUnifiedAccount(INITIAL_ARENA_STATE, {
      displayName: 'Tariq Mensah',
      username: 'tariq.mensah',
      email: 'tariq@arena.demo',
    })
    expect(reg.ok).toBe(true)
    if (!reg.ok) return
    let s = reg.state
    const spartanId = reg.data.id
    expect(reg.data.ascendancyRank).toBe('Spartan')

    // Level 1 Spartan can reply to an existing discussion, cannot create one
    const firstDiscId = s.discussions[0]!.id
    const spartanCreateBlocked = createDiscussion(s, spartanId, {
      title: 'Level 1 Discussion Attempt',
      topicTag: 'Community',
      houseId: null,
      body: 'Blocked at Level 1.',
    })
    expect(spartanCreateBlocked.ok).toBe(false)
    const spartanReply = addDiscussionReply(s, spartanId, firstDiscId, 'Level 1 Spartan reply works!')
    expect(spartanReply.ok).toBe(true)

    // Grant 5,949 XP -> still Level 14 -> createDiscussion blocked
    const toL14 = adminAdjustXp(s, 'mem-marcus', spartanId, 5949, 'Level 14 boundary test')
    expect(toL14.ok).toBe(true)
    if (!toL14.ok) return
    s = toL14.state
    expect(
      createDiscussion(s, spartanId, {
        title: 'Boundary Level 14 Attempt',
        topicTag: 'Community',
        houseId: null,
        body: 'Must fail at 5,949 XP (Level 14).',
      }).ok,
    ).toBe(false)

    // Grant +1 XP -> exact 5,950 XP (Level 15) -> plain Spartan (non-Vanguard) can create discussions
    const toL15 = adminAdjustXp(s, 'mem-marcus', spartanId, 1, 'Cross Level 15 threshold')
    expect(toL15.ok).toBe(true)
    if (!toL15.ok) return
    s = toL15.state
    const l15Allowed = createDiscussion(s, spartanId, {
      title: 'Level 15 Spartan Discussion',
      topicTag: 'Community',
      houseId: 'forge-masters',
      body: 'Unlocked at Level 15 without Vanguard rank.',
    })
    expect(l15Allowed.ok).toBe(true)
    if (!l15Allowed.ok) return
    s = l15Allowed.state

    // Grant +800 XP -> 6,750 XP (Level 16) -> still allowed
    const toL16 = adminAdjustXp(s, 'mem-marcus', spartanId, 800, 'Reach Level 16')
    expect(toL16.ok).toBe(true)
    if (!toL16.ok) return
    s = toL16.state
    const l16Allowed = createDiscussion(s, spartanId, {
      title: 'Level 16 Discussion',
      topicTag: 'Architecture',
      houseId: 'seers',
      body: 'Allowed at Level 16.',
    })
    expect(l16Allowed.ok).toBe(true)
  })

  it('Stage 3 Invariants: enforces Spartan membership on discussion create/reply with no Visitor or Admin bypass', () => {
    const firstDiscId = INITIAL_ARENA_STATE.discussions[0]!.id

    // Unknown/visitor actor cannot create or reply
    expect(
      createDiscussion(INITIAL_ARENA_STATE, 'visitor-unknown', {
        title: 'Anonymous Discussion',
        topicTag: 'Community',
        houseId: null,
        body: 'Should fail cleanly.',
      }).ok,
    ).toBe(false)
    expect(addDiscussionReply(INITIAL_ARENA_STATE, 'visitor-unknown', firstDiscId, 'Anonymous reply').ok).toBe(false)

    // Even if a member record had high XP + platform.admin but membershipStatus === 'visitor', both create and reply must fail
    const visitorRecordState = {
      ...INITIAL_ARENA_STATE,
      members: INITIAL_ARENA_STATE.members.map((m) =>
        m.id === 'mem-marcus' ? { ...m, membershipStatus: 'visitor' as const } : m,
      ),
    }
    expect(
      createDiscussion(visitorRecordState, 'mem-marcus', {
        title: 'Visitor Record Create Attempt',
        topicTag: 'Governance',
        houseId: null,
        body: 'Visitors cannot create even with Level 15+ XP.',
      }).ok,
    ).toBe(false)
    expect(addDiscussionReply(visitorRecordState, 'mem-marcus', firstDiscId, 'Visitor reply attempt').ok).toBe(false)

    // Marcus as Spartan Level 15+ can create & reply normally
    expect(
      createDiscussion(INITIAL_ARENA_STATE, 'mem-marcus', {
        title: 'Spartan L15+ Discussion',
        topicTag: 'Governance',
        houseId: 'scribes',
        body: 'Allowed for L15+ Spartans.',
      }).ok,
    ).toBe(true)
  })

  it('Stage 3 Invariants: enforces missionAlerts centrally across mission/submission/dispute flows without suppressing non-mission alerts or deleting records', () => {
    // 1. Disable missionAlerts on Jordan & Kaito, plus disable public visibility flags on Kaito
    let s = INITIAL_ARENA_STATE
    const privJordan = updateAccountPrivacy(s, 'mem-jordan', { missionAlerts: false })
    expect(privJordan.ok).toBe(true)
    if (!privJordan.ok) return
    s = privJordan.state

    const privKaito = updateAccountPrivacy(s, 'mem-kaito', {
      missionAlerts: false,
      publicProfileVisible: false,
      showContributionsPublicly: false,
    })
    expect(privKaito.ok).toBe(true)
    if (!privKaito.ok) return
    s = privKaito.state

    // Verify disabling publicProfileVisible and showContributionsPublicly preserves Kaito's records & XP
    expect(deriveXpBalance('mem-kaito', s.xpTransactions).lifetimeXp).toBe(
      deriveXpBalance('mem-kaito', INITIAL_ARENA_STATE.xpTransactions).lifetimeXp,
    )
    expect(s.contributionRecords.filter((c) => c.memberId === 'mem-kaito').length).toBeGreaterThan(0)

    const jordanCountBefore = s.notifications.filter((n) => n.memberId === 'mem-jordan').length
    const kaitoCountBefore = s.notifications.filter((n) => n.memberId === 'mem-kaito').length

    // 2. Mission creation & cancellation refund must NOT notify Jordan while missionAlerts === false
    const created = createMission(
      s,
      'mem-jordan',
      baseCreateInput({ rewardPerContributorXp: 200, maxContributors: 1, publishNow: true }),
    )
    expect(created.ok).toBe(true)
    if (!created.ok) return
    s = created.state

    const cancelled = cancelOrExpireMission(s, 'mem-jordan', created.data.id, 'cancelled')
    expect(cancelled.ok).toBe(true)
    if (!cancelled.ok) return
    s = cancelled.state
    expect(s.notifications.filter((n) => n.memberId === 'mem-jordan').length).toBe(jordanCountBefore)

    // 3. Submission review & dispute resolution (overturned) must NOT notify Kaito while missionAlerts === false
    const revSub = reviewSubmission(s, 'mem-jordan', 'sub-2', 'rejected', 'Needs fuller benchmark output.')
    expect(revSub.ok).toBe(true)
    if (!revSub.ok) return
    s = revSub.state
    expect(s.notifications.filter((n) => n.memberId === 'mem-kaito').length).toBe(kaitoCountBefore)

    const resolvedDispute = resolveDispute(
      s,
      'mem-elena',
      'disp-1',
      'resolved_overturned',
      'Overturned after checking timestamp.',
    )
    expect(resolvedDispute.ok).toBe(true)
    if (!resolvedDispute.ok) return
    s = resolvedDispute.state
    const kaitoAddedAfterDispute = s.notifications
      .filter((n) => n.memberId === 'mem-kaito')
      .slice(0, s.notifications.filter((n) => n.memberId === 'mem-kaito').length - kaitoCountBefore)
    // Mission dispute notification is suppressed, while non-mission achievement unlock still fires
    expect(kaitoAddedAfterDispute.some((n) => n.title.includes('Dispute Resolved'))).toBe(false)
    expect(kaitoAddedAfterDispute.every((n) => n.category === 'achievement')).toBe(true)
    const kaitoCountPostDispute = s.notifications.filter((n) => n.memberId === 'mem-kaito').length

    // 4. Non-mission system/governance notifications (appointAscendancy, adminAdjustXp) MUST still fire
    const adj = adminAdjustXp(s, 'mem-marcus', 'mem-kaito', 10, 'Calibration check')
    expect(adj.ok).toBe(true)
    if (!adj.ok) return
    s = adj.state
    expect(s.notifications.filter((n) => n.memberId === 'mem-kaito').length).toBe(kaitoCountPostDispute + 1)

    const asc = appointAscendancy(s, 'mem-marcus', 'mem-jordan', 'Vanguard', 'Community stewardship recognition')
    expect(asc.ok).toBe(true)
    if (!asc.ok) return
    s = asc.state
    expect(s.notifications.filter((n) => n.memberId === 'mem-jordan').length).toBe(jordanCountBefore + 1)
  })

  it('Stage 3 Auth & Access Control: restricts demo switching, email login, org switching, mutations, storage hydration, and redirect validation', () => {
    // 1. Unauthenticated state cannot call switchDemoPersona or switch to visitor (null)
    expect(switchDemoPersona(INITIAL_ARENA_STATE, 'mem-jordan').ok).toBe(false)
    const loggedInJordan = signInDemoByEmail(INITIAL_ARENA_STATE, 'jordan.davis@arena.demo')
    expect(loggedInJordan.ok).toBe(true)
    if (!loggedInJordan.ok) return
    expect(switchDemoPersona(loggedInJordan.state, null).ok).toBe(false)

    // Authenticated Spartan can switch to another Spartan, but never to a non-spartan record
    expect(switchDemoPersona(loggedInJordan.state, 'mem-maya').ok).toBe(true)
    const visitorTargetState = {
      ...loggedInJordan.state,
      members: loggedInJordan.state.members.map((m) =>
        m.id === 'mem-maya' ? { ...m, membershipStatus: 'visitor' as const } : m,
      ),
    }
    expect(switchDemoPersona(visitorTargetState, 'mem-maya').ok).toBe(false)
    expect(signInDemoByEmail(visitorTargetState, 'maya.kim@arena.demo').ok).toBe(false)

    // 2. signOutAccount clears both currentMemberId and any stale activeOrganisationId
    expect(switchActiveOrganisation(loggedInJordan.state, 'org-helix', 'mem-jordan').ok).toBe(false)
    expect(switchActiveOrganisation(loggedInJordan.state, 'org-helix', 'mem-maya').ok).toBe(false)
    expect(switchActiveOrganisation({ ...loggedInJordan.state, currentMemberId: null }, 'org-helix').ok).toBe(false)

    const signedOut = signOutAccount({ ...loggedInJordan.state, activeOrganisationId: 'org-helix' })
    expect(signedOut.ok).toBe(true)
    if (!signedOut.ok) return
    expect(signedOut.state.currentMemberId).toBeNull()
    expect(signedOut.state.activeOrganisationId).toBeNull()

    // 3. Service mutations reject visitor-status or unknown member IDs
    expect(createMission(visitorTargetState, 'mem-maya', baseCreateInput()).ok).toBe(false)
    expect(updateMemberProfile(visitorTargetState, 'mem-maya', { bio: 'Tampered' }).ok).toBe(false)
    expect(rsvpEvent(visitorTargetState, 'mem-maya', 'evt-onboarding-sync').ok).toBe(false)
    expect(completeAcademyLesson(visitorTargetState, 'mem-maya', 'les-f1-1', 1).ok).toBe(false)
    expect(toggleBookmark(visitorTargetState, 'mem-maya', 'mission', 'mis-intro').ok).toBe(false)
    expect(adminAdjustXp(visitorTargetState, 'mem-maya', 'mem-jordan', 10, 'Unauthorized').ok).toBe(false)

    // 4. loadArenaState sanitizes missing/visitor currentMemberId and clears stale activeOrganisationId while preserving stored org records
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        ARENA_STORAGE_KEY,
        JSON.stringify({
          ...loggedInJordan.state,
          currentMemberId: 'mem-does-not-exist',
          activeOrganisationId: 'org-helix',
        }),
      )
      const sanitizedMissing = loadArenaState()
      expect(sanitizedMissing.currentMemberId).toBeNull()
      expect(sanitizedMissing.activeOrganisationId).toBeNull()
      expect(sanitizedMissing.organisations.some((o) => o.id === 'org-helix')).toBe(true)

      window.localStorage.setItem(
        ARENA_STORAGE_KEY,
        JSON.stringify({
          ...visitorTargetState,
          currentMemberId: 'mem-maya',
          activeOrganisationId: 'org-helix',
        }),
      )
      const sanitizedVisitor = loadArenaState()
      expect(sanitizedVisitor.currentMemberId).toBeNull()
      expect(sanitizedVisitor.activeOrganisationId).toBeNull()

      window.localStorage.setItem(
        ARENA_STORAGE_KEY,
        JSON.stringify({
          ...loggedInJordan.state,
          currentMemberId: 'mem-jordan',
          activeOrganisationId: 'org-helix',
        }),
      )
      const sanitizedActiveSpartan = loadArenaState()
      expect(sanitizedActiveSpartan.currentMemberId).toBe('mem-jordan')
      expect(sanitizedActiveSpartan.activeOrganisationId).toBeNull()
      expect(sanitizedActiveSpartan.organisations.length).toBe(INITIAL_ARENA_STATE.organisations.length)

      window.localStorage.removeItem(ARENA_STORAGE_KEY)
    }

    // 5. resolveSafeRedirect preserves valid internal paths + query + hash and rejects external/unsafe/auth paths (including trailing slashes)
    expect(resolveSafeRedirect({ pathname: '/explore', search: '?tab=discussions', hash: '#top' })).toBe(
      '/explore?tab=discussions#top',
    )
    expect(resolveSafeRedirect('/explore/?tab=missions#featured')).toBe('/explore/?tab=missions#featured')
    expect(resolveSafeRedirect('/missions/mis-1?view=review#submit')).toBe('/missions/mis-1?view=review#submit')
    expect(resolveSafeRedirect('https://evil.example/phish')).toBe('/dashboard')
    expect(resolveSafeRedirect('//evil.example/phish')).toBe('/dashboard')
    expect(resolveSafeRedirect('/\\evil.example')).toBe('/dashboard')
    expect(resolveSafeRedirect('javascript:alert(1)')).toBe('/dashboard')
    expect(resolveSafeRedirect({ pathname: '/login', search: '?next=/dashboard', hash: '' })).toBe('/dashboard')
    expect(resolveSafeRedirect('/login/')).toBe('/dashboard')
    expect(resolveSafeRedirect('/register')).toBe('/dashboard')
    expect(resolveSafeRedirect('/register/')).toBe('/dashboard')
    expect(resolveSafeRedirect('/signup')).toBe('/dashboard')
    expect(resolveSafeRedirect('/signup/')).toBe('/dashboard')
    expect(resolveSafeRedirect('/login/?next=/missions#top')).toBe('/dashboard')
    expect(resolveSafeRedirect('/LOGIN///')).toBe('/dashboard')
    expect(resolveSafeRedirect({ pathname: '/signup/', search: '?from=landing', hash: '#cta' })).toBe('/dashboard')
  })

  it('enforces Spartan ownership and authentication guards on notification read mutations', () => {
    // Seed a second unread notification for mem-jordan via an authentic XP adjustment
    const awarded = adminAdjustXp(INITIAL_ARENA_STATE, 'mem-marcus', 'mem-jordan', 25, 'Verified audit check')
    expect(awarded.ok).toBe(true)
    if (!awarded.ok) return

    const jordanNotifications = awarded.state.notifications.filter((n) => n.memberId === 'mem-jordan')
    expect(jordanNotifications.length).toBeGreaterThanOrEqual(2)
    expect(jordanNotifications.every((n) => !n.read)).toBe(true)

    const [firstJordanNotif, secondJordanNotif] = jordanNotifications
    const mayaUnreadBefore = awarded.state.notifications.find((n) => n.id === 'notif-3')
    expect(mayaUnreadBefore?.memberId).toBe('mem-maya')
    expect(mayaUnreadBefore?.read).toBe(false)

    // 1. Unauthenticated actor (currentMemberId null / omitted / empty) is rejected without mutating state
    const unauthState = { ...awarded.state, currentMemberId: null }
    expect(markNotificationRead(unauthState, firstJordanNotif.id).ok).toBe(false)
    expect(markNotificationRead(unauthState, firstJordanNotif.id, null).ok).toBe(false)
    expect(markNotificationRead(unauthState, firstJordanNotif.id, '').ok).toBe(false)
    expect(markAllNotificationsRead(unauthState).ok).toBe(false)
    expect(markAllNotificationsRead(unauthState, null).ok).toBe(false)

    // 2. Invalid/unknown member ID or non-Spartan visitor actor is rejected
    expect(markNotificationRead(awarded.state, firstJordanNotif.id, 'mem-does-not-exist').ok).toBe(false)
    expect(markAllNotificationsRead(awarded.state, 'mem-does-not-exist').ok).toBe(false)

    const visitorState = {
      ...awarded.state,
      members: awarded.state.members.map((m) =>
        m.id === 'mem-maya' ? { ...m, membershipStatus: 'visitor' as const } : m,
      ),
    }
    expect(markNotificationRead(visitorState, 'notif-3', 'mem-maya').ok).toBe(false)
    expect(markAllNotificationsRead(visitorState, 'mem-maya').ok).toBe(false)

    // 3. Cross-member access: authenticated Spartan cannot mark another member's notification read
    const crossMember = markNotificationRead(awarded.state, 'notif-3', 'mem-jordan')
    expect(crossMember.ok).toBe(false)
    expect(awarded.state.notifications.find((n) => n.id === 'notif-3')?.read).toBe(false)

    // 4. Authenticated Spartan marks one of their own notifications read selectively
    const singleRead = markNotificationRead(awarded.state, firstJordanNotif.id, 'mem-jordan')
    expect(singleRead.ok).toBe(true)
    if (!singleRead.ok) return
    expect(singleRead.state.notifications.find((n) => n.id === firstJordanNotif.id)?.read).toBe(true)
    expect(singleRead.state.notifications.find((n) => n.id === secondJordanNotif.id)?.read).toBe(false)
    expect(singleRead.state.notifications.find((n) => n.id === 'notif-3')?.read).toBe(false)

    // 5. Authenticated Spartan marks all of their own notifications read without affecting other members
    const allRead = markAllNotificationsRead(singleRead.state, 'mem-jordan')
    expect(allRead.ok).toBe(true)
    if (!allRead.ok) return
    expect(
      allRead.state.notifications.filter((n) => n.memberId === 'mem-jordan').every((n) => n.read),
    ).toBe(true)
    expect(allRead.state.notifications.find((n) => n.id === 'notif-3')?.read).toBe(false)
    expect(allRead.state.notifications.find((n) => n.id === 'notif-4')?.read).toBe(false)
  })

  it('V1 Organisation Deactivation: rejects all org service mutations and org-sponsored missions while preserving seed records and personal missions', () => {
    expect(FEATURE_FLAGS.organisationsEnabled).toBe(false)
    const jordanXpBefore = deriveXpBalance('mem-jordan', INITIAL_ARENA_STATE.xpTransactions).spendableXp
    const auditBefore = INITIAL_ARENA_STATE.auditLogs.length

    // 1. Seeded organisation data and historical mission sponsor references remain preserved intact
    expect(INITIAL_ARENA_STATE.organisations.length).toBeGreaterThanOrEqual(3)
    expect(INITIAL_ARENA_STATE.organisationMemberships.length).toBeGreaterThanOrEqual(4)
    expect(INITIAL_ARENA_STATE.missions.some((m) => m.sponsorOrganisationId === 'org-helix')).toBe(true)
    expect(INITIAL_ARENA_STATE.activeOrganisationId).toBeNull()

    // 2. Direct service calls for org creation, verification, switching, and org-linked creation fail cleanly
    const orgCreate = createOrganisation(INITIAL_ARENA_STATE, 'mem-jordan', {
      name: 'Dormant Org',
      kind: 'Project',
      ecosystem: 'Ethereum',
      tagline: 'Should be blocked',
      description: 'Should be blocked in V1',
      website: 'https://example.org',
    })
    expect(orgCreate.ok).toBe(false)

    expect(setOrganisationVerification(INITIAL_ARENA_STATE, 'mem-marcus', 'org-veridian', 'verified').ok).toBe(false)
    expect(switchActiveOrganisation(INITIAL_ARENA_STATE, 'org-helix', 'mem-jordan').ok).toBe(false)
    expect(switchActiveOrganisation(INITIAL_ARENA_STATE, null, 'mem-jordan').ok).toBe(false)

    // 3. Mission creation with sponsorOrganisationId fails BEFORE XP reserve or mission mutation
    const sponsoredMission = createMission(
      INITIAL_ARENA_STATE,
      'mem-jordan',
      baseCreateInput({ sponsorOrganisationId: 'org-helix', rewardPerContributorXp: 200, maxContributors: 1 }),
    )
    expect(sponsoredMission.ok).toBe(false)
    expect(deriveXpBalance('mem-jordan', INITIAL_ARENA_STATE.xpTransactions).spendableXp).toBe(jordanXpBefore)
    expect(INITIAL_ARENA_STATE.auditLogs.length).toBe(auditBefore)

    // 4. Explore project/opportunity linking with organisationId also fails cleanly
    expect(
      addExploreProject(INITIAL_ARENA_STATE, 'mem-jordan', {
        title: 'Org Project Attempt',
        tagline: 'Blocked',
        description: 'Blocked',
        houseId: 'forge-masters',
        status: 'Building',
        tags: ['Test'],
        repoOrDemoUrl: 'https://github.com/test/repo',
        teamSize: 1,
        organisationId: 'org-helix',
      }).ok,
    ).toBe(false)
    expect(
      addExploreOpportunity(INITIAL_ARENA_STATE, 'mem-jordan', {
        title: 'Org Opportunity Attempt',
        organisationName: 'Helix',
        organisationId: 'org-helix',
        houseId: 'forge-masters',
        kind: 'Role',
        compensationLabel: 'Grant',
        description: 'Blocked',
        tags: ['Role'],
      }).ok,
    ).toBe(false)

    // 5. Normal personal-funded mission creation succeeds without sponsorOrganisationId
    const personalMission = createMission(
      INITIAL_ARENA_STATE,
      'mem-jordan',
      baseCreateInput({ rewardPerContributorXp: 150, maxContributors: 1 }),
    )
    expect(personalMission.ok).toBe(true)
    if (!personalMission.ok) return
    expect(personalMission.data.sponsorOrganisationId).toBeUndefined()
    expect(personalMission.data.budget.fundingSource).toBe('member_spendable')
  })
})


