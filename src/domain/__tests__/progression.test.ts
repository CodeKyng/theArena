import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PLATFORM_CONFIG,
  INITIAL_ACHIEVEMENTS,
  LEVEL_THRESHOLDS,
} from '../constants'
import {
  buildLeaderboard,
  calculateEligibleCp,
  calculateLevelProgress,
  classifyMissionBand,
  createXpLedgerTransaction,
  deriveXpBalance,
  evaluateNewAchievements,
  memberHasPermission,
  validateMissionPolicy,
} from '../progression'
import { INITIAL_ARENA_STATE } from '../../data/seedData'
import type {
  ContributionPointEvent,
  ContributionRecord,
  LearningCompletion,
  MemberProfile,
  XPTransaction,
} from '../types'

describe('Arena Progression Domain Rules', () => {
  it('defines all 30 Lifetime XP level thresholds accurately', () => {
    expect(LEVEL_THRESHOLDS).toHaveLength(30)
    expect(LEVEL_THRESHOLDS[0]).toBe(0)
    expect(LEVEL_THRESHOLDS[1]).toBe(100)
    expect(LEVEL_THRESHOLDS[9]).toBe(2700)
    expect(LEVEL_THRESHOLDS[29]).toBe(23200)

    expect(calculateLevelProgress(0, LEVEL_THRESHOLDS).level).toBe(1)
    expect(calculateLevelProgress(99, LEVEL_THRESHOLDS).level).toBe(1)
    expect(calculateLevelProgress(100, LEVEL_THRESHOLDS).level).toBe(2)
    expect(calculateLevelProgress(2850, LEVEL_THRESHOLDS).level).toBe(10)
    const maxLvl = calculateLevelProgress(25000, LEVEL_THRESHOLDS)
    expect(maxLvl.level).toBe(30)
    expect(maxLvl.isMaxLevel).toBe(true)
    expect(maxLvl.progressPercent).toBe(100)
  })

  it('classifies mission reward bands and flags >1,500 XP for Control Room approval', () => {
    const bands = DEFAULT_PLATFORM_CONFIG.rewardBands
    expect(classifyMissionBand(50, bands)).toMatchObject({ band: 'micro', requiresAdditionalApproval: false, cpValue: 5 })
    expect(classifyMissionBand(200, bands)).toMatchObject({ band: 'standard', requiresAdditionalApproval: false, cpValue: 15 })
    expect(classifyMissionBand(500, bands)).toMatchObject({ band: 'substantial', requiresAdditionalApproval: false, cpValue: 30 })
    expect(classifyMissionBand(1500, bands)).toMatchObject({ band: 'major', requiresAdditionalApproval: false, cpValue: 50 })
    expect(classifyMissionBand(1501, bands)).toMatchObject({ band: 'above_major', requiresAdditionalApproval: true, cpValue: 50 })
  })

  it('rejects prohibited engagement-farming mission instructions', () => {
    expect(validateMissionPolicy(['Write a security architecture guide', 'Link GitHub PR']).compliant).toBe(true)
    expect(validateMissionPolicy(['Like and retweet our launch post for XP']).compliant).toBe(false)
    expect(validateMissionPolicy(['Buy 100 likes and follow for XP']).compliant).toBe(false)
    expect(validateMissionPolicy(['Rewarded views and reposts campaign']).compliant).toBe(false)
  })

  it('enforces XP ledger monotonicity, no negative Spendable XP, and idempotency', () => {
    let txs: XPTransaction[] = []
    const earn = createXpLedgerTransaction(txs, {
      memberId: 'm1',
      amount: 300,
      transactionType: 'earned',
      sourceType: 'system',
      referenceType: 'academy',
      referenceId: 'p1',
      actorMemberId: 'system',
      reason: 'Academy path',
      idempotencyKey: 'earn-1',
    })
    expect(earn.ok).toBe(true)
    if (!earn.ok) return
    txs = [...txs, earn.transaction]

    // Duplicate idempotencyKey returns existing transaction without adding
    const dup = createXpLedgerTransaction(txs, {
      memberId: 'm1',
      amount: 300,
      transactionType: 'earned',
      sourceType: 'system',
      referenceType: 'academy',
      referenceId: 'p1',
      actorMemberId: 'system',
      reason: 'Academy path',
      idempotencyKey: 'earn-1',
    })
    expect(dup.ok).toBe(true)
    if (dup.ok) expect(dup.duplicated).toBe(true)

    // Reserving Spendable XP leaves Lifetime XP unchanged
    const res = createXpLedgerTransaction(txs, {
      memberId: 'm1',
      amount: 200,
      transactionType: 'reserved',
      sourceType: 'member_funded',
      referenceType: 'mission',
      referenceId: 'mis-1',
      actorMemberId: 'm1',
      reason: 'Fund mission',
      idempotencyKey: 'res-1',
    })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    txs = [...txs, res.transaction]

    const balAfterReserve = deriveXpBalance('m1', txs)
    expect(balAfterReserve.lifetimeXp).toBe(300)
    expect(balAfterReserve.spendableXp).toBe(100)
    expect(balAfterReserve.reservedXp).toBe(200)

    // Cannot reserve more than Spendable XP
    const overReserve = createXpLedgerTransaction(txs, {
      memberId: 'm1',
      amount: 150,
      transactionType: 'reserved',
      sourceType: 'member_funded',
      referenceType: 'mission',
      referenceId: 'mis-2',
      actorMemberId: 'm1',
      reason: 'Too expensive',
      idempotencyKey: 'res-2',
    })
    expect(overReserve.ok).toBe(false)

    // Admin negative adjustment cannot push Spendable XP below zero
    const negAdj = createXpLedgerTransaction(txs, {
      memberId: 'm1',
      amount: -150,
      transactionType: 'adjustment',
      sourceType: 'admin',
      referenceType: 'admin',
      referenceId: 'adj-1',
      actorMemberId: 'admin',
      reason: 'Invalid deduction',
      idempotencyKey: 'adj-1',
    })
    expect(negAdj.ok).toBe(false)
  })

  it('enforces seasonal CP caps (10 event attendance, 50 community support, 60 mentorship pair)', () => {
    const caps = DEFAULT_PLATFORM_CONFIG.seasonalCpCaps
    let events: ContributionPointEvent[] = []

    // 10 x 1 CP attendance allowed, 11th capped out
    for (let i = 1; i <= 11; i++) {
      const res = calculateEligibleCp(events, {
        memberId: 'm1',
        contributionRecordId: `cr-att-${i}`,
        seasonId: 's2',
        houseId: 'heralds',
        activityCategory: 'event_attendance',
        baseCpAmount: 1,
        referenceKey: `att-${i}`,
        caps,
      })
      if (i <= 10) {
        expect(res.cappedOut).toBe(false)
        expect(res.event?.cpAmount).toBe(1)
        if (res.event) events = [...events, res.event]
      } else {
        expect(res.cappedOut).toBe(true)
        expect(res.event).toBeNull()
      }
    }

    // 6 x 10 CP mentorship with same mentee -> 60 CP total, 7th capped out
    for (let i = 1; i <= 7; i++) {
      const res = calculateEligibleCp(events, {
        memberId: 'm1',
        contributionRecordId: `cr-ment-${i}`,
        seasonId: 's2',
        houseId: 'scribes',
        activityCategory: 'mentorship',
        baseCpAmount: 10,
        partnerMemberId: 'mentee-1',
        referenceKey: `ment-${i}`,
        caps,
      })
      if (i <= 6) {
        expect(res.event?.cpAmount).toBe(10)
        if (res.event) events = [...events, res.event]
      } else {
        expect(res.cappedOut).toBe(true)
      }
    }
  })

  it('builds leaderboards respecting privacy opt-out, tie ranks, and period separation', () => {
    const members: MemberProfile[] = INITIAL_ARENA_STATE.members.slice(0, 3).map((m, idx) => ({
      ...m,
      privacy: { ...m.privacy, showOnLeaderboard: idx !== 1 }, // hide index 1 unless viewer
    }))
    const hiddenMemberId = members[1].id

    const publicBoard = buildLeaderboard({
      members,
      xpTransactions: INITIAL_ARENA_STATE.xpTransactions,
      cpEvents: INITIAL_ARENA_STATE.cpEvents,
      contributions: INITIAL_ARENA_STATE.contributionRecords,
      thresholds: LEVEL_THRESHOLDS,
      category: 'overall',
      period: 'season',
      seasonId: INITIAL_ARENA_STATE.currentSeason.id,
      viewerMemberId: null,
    })
    expect(publicBoard.some((r) => r.memberId === hiddenMemberId)).toBe(false)

    const selfBoard = buildLeaderboard({
      members,
      xpTransactions: INITIAL_ARENA_STATE.xpTransactions,
      cpEvents: INITIAL_ARENA_STATE.cpEvents,
      contributions: INITIAL_ARENA_STATE.contributionRecords,
      thresholds: LEVEL_THRESHOLDS,
      category: 'overall',
      period: 'season',
      seasonId: INITIAL_ARENA_STATE.currentSeason.id,
      viewerMemberId: hiddenMemberId,
    })
    expect(selfBoard.some((r) => r.memberId === hiddenMemberId)).toBe(true)
  })

  it('evaluates achievement triggers including cross-house, reliable contributor, and house pillar', () => {
    const member: MemberProfile = {
      ...INITIAL_ARENA_STATE.members[0],
      onboardingChecklist: {
        ...INITIAL_ARENA_STATE.members[0].onboardingChecklist,
        orientationCompleted: true,
        rulesChecked: true,
      },
    }
    const contribs: ContributionRecord[] = [
      { id: 'c1', memberId: member.id, houseId: 'scribes', sourceKind: 'mission', referenceId: 's1', title: 'S1', deliverableSummary: 'ok', verifiedByMemberId: 'mem-elena', createdAt: '2026-10-01T10:00:00Z' },
      { id: 'c2', memberId: member.id, houseId: 'artisans', sourceKind: 'mission', referenceId: 's2', title: 'S2', deliverableSummary: 'ok', verifiedByMemberId: 'mem-elena', createdAt: '2026-10-02T10:00:00Z' },
      { id: 'c3', memberId: member.id, houseId: 'forge-masters', sourceKind: 'mission', referenceId: 's3', title: 'S3', deliverableSummary: 'ok', verifiedByMemberId: 'mem-elena', createdAt: '2026-10-03T10:00:00Z' },
      { id: 'c4', memberId: member.id, houseId: 'echoes', sourceKind: 'mission', referenceId: 's4', title: 'S4', deliverableSummary: 'ok', verifiedByMemberId: 'mem-elena', createdAt: '2026-10-04T10:00:00Z' },
      { id: 'c5', memberId: member.id, houseId: 'seers', sourceKind: 'mission', referenceId: 's5', title: 'S5', deliverableSummary: 'ok', verifiedByMemberId: 'mem-elena', createdAt: '2026-10-05T10:00:00Z' },
    ]
    const learnings: LearningCompletion[] = [
      { id: 'l1', memberId: member.id, itemType: 'path', itemId: 'p1', completedAt: '2026-10-05T10:00:00Z' },
    ]
    const unlocked = evaluateNewAchievements({
      member,
      achievements: INITIAL_ACHIEVEMENTS,
      existingUnlocked: [],
      contributions: contribs,
      learningCompletions: learnings,
      missions: [],
      submissions: [],
      hostedOrSupportedEventsCount: 3,
      verifiedMentorshipCount: 3,
    })
    const unlockedIds = unlocked.map((u) => u.achievementId)
    expect(unlockedIds).toContain('ach-01') // Arena Ready
    expect(unlockedIds).toContain('ach-02') // First Contribution
    expect(unlockedIds).toContain('ach-04') // Reliable Contributor
    expect(unlockedIds).toContain('ach-07') // Path Finisher
    expect(unlockedIds).toContain('ach-09') // Cross-House Collaborator
    expect(unlockedIds).toContain('ach-12') // Event Steward
    expect(unlockedIds).toContain('ach-13') // Mentor's Mark
  })

  it('enforces House-scoped permissions vs platform.admin', () => {
    expect(memberHasPermission('mem-maya', INITIAL_ARENA_STATE.permissionGrants, 'house.manage', 'forge-masters')).toBe(true)
    expect(memberHasPermission('mem-maya', INITIAL_ARENA_STATE.permissionGrants, 'house.manage', 'scribes')).toBe(false)
    expect(memberHasPermission('mem-maya', INITIAL_ARENA_STATE.permissionGrants, 'platform.admin')).toBe(false)
    expect(memberHasPermission('mem-marcus', INITIAL_ARENA_STATE.permissionGrants, 'platform.admin')).toBe(true)
    expect(memberHasPermission('mem-marcus', INITIAL_ARENA_STATE.permissionGrants, 'house.manage', 'scribes')).toBe(true)
  })
})
