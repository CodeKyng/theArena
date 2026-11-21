import { PROHIBITED_ENGAGEMENT_PATTERNS } from './constants'
import type {
  AchievementDefinition,
  ContributionPointEvent,
  ContributionRecord,
  CPActivityCategory,
  HouseId,
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardPeriod,
  LearningCompletion,
  MemberAchievement,
  MemberProfile,
  Mission,
  MissionRewardBand,
  MissionSubmission,
  PermissionGrant,
  PermissionScope,
  PlatformConfig,
  XPBalance,
  XPTransaction,
  XPTransactionType,
  XPSourceType,
} from './types'

export interface LevelProgressInfo {
  level: number
  currentThreshold: number
  nextThreshold: number
  xpIntoLevel: number
  xpRequiredForNext: number
  xpRemainingToNext: number
  progressPercent: number
  isMaxLevel: boolean
}

export function calculateLevelProgress(lifetimeXp: number, thresholds: number[]): LevelProgressInfo {
  const safeXp = Math.max(0, Math.floor(lifetimeXp))
  const sorted = [...thresholds].sort((a, b) => a - b)
  let level = 1
  for (let i = 0; i < sorted.length; i++) {
    if (safeXp >= sorted[i]) {
      level = i + 1
    } else {
      break
    }
  }
  const currentThreshold = sorted[level - 1] ?? 0
  const isMaxLevel = level >= sorted.length
  const nextThreshold = isMaxLevel ? currentThreshold : (sorted[level] ?? currentThreshold)
  const span = Math.max(1, nextThreshold - currentThreshold)
  const xpIntoLevel = safeXp - currentThreshold
  const xpRemainingToNext = isMaxLevel ? 0 : Math.max(0, nextThreshold - safeXp)
  const progressPercent = isMaxLevel ? 100 : Math.min(100, Math.round((xpIntoLevel / span) * 100))

  return {
    level,
    currentThreshold,
    nextThreshold,
    xpIntoLevel,
    xpRequiredForNext: isMaxLevel ? 0 : span,
    xpRemainingToNext,
    progressPercent,
    isMaxLevel,
  }
}

export function classifyMissionBand(
  xpPerContributor: number,
  rewardBands: PlatformConfig['rewardBands'],
): { band: MissionRewardBand | 'none'; requiresAdditionalApproval: boolean; cpValue: number } {
  if (xpPerContributor <= 0) {
    return { band: 'none', requiresAdditionalApproval: false, cpValue: 5 }
  }
  if (xpPerContributor <= rewardBands.micro[1]) {
    return { band: 'micro', requiresAdditionalApproval: false, cpValue: 5 }
  }
  if (xpPerContributor <= rewardBands.standard[1]) {
    return { band: 'standard', requiresAdditionalApproval: false, cpValue: 15 }
  }
  if (xpPerContributor <= rewardBands.substantial[1]) {
    return { band: 'substantial', requiresAdditionalApproval: false, cpValue: 30 }
  }
  if (xpPerContributor <= rewardBands.major[1]) {
    return { band: 'major', requiresAdditionalApproval: false, cpValue: 50 }
  }
  return { band: 'above_major', requiresAdditionalApproval: true, cpValue: 50 }
}

export function validateMissionPolicy(textBlocks: string[]): { compliant: boolean; reason?: string } {
  const combined = textBlocks.join(' \n ')
  for (const pattern of PROHIBITED_ENGAGEMENT_PATTERNS) {
    if (pattern.test(combined)) {
      return {
        compliant: false,
        reason:
          'Policy violation: The Arena prohibits paid engagement-farming missions (no incentivised likes, follows, reposts, views, or raw comment counts).',
      }
    }
  }
  return { compliant: true }
}

export function deriveXpBalance(memberId: string, transactions: XPTransaction[]): XPBalance {
  let lifetimeXp = 0
  let spendableXp = 0
  let reservedXp = 0
  for (const tx of transactions) {
    if (tx.memberId !== memberId) continue
    lifetimeXp += tx.deltaLifetime
    spendableXp += tx.deltaSpendable
    reservedXp += tx.deltaReserved
  }
  return {
    memberId,
    lifetimeXp: Math.max(0, lifetimeXp),
    spendableXp: Math.max(0, spendableXp),
    reservedXp: Math.max(0, reservedXp),
  }
}

export interface LedgerMutationInput {
  memberId: string
  amount: number
  transactionType: XPTransactionType
  sourceType: XPSourceType
  referenceType: XPTransaction['referenceType']
  referenceId: string
  actorMemberId: string
  creatorMemberId?: string
  recipientMemberId?: string
  reason: string
  idempotencyKey: string
  createdAt?: string
}

export function createXpLedgerTransaction(
  existingTransactions: XPTransaction[],
  input: LedgerMutationInput,
): { ok: true; transaction: XPTransaction; duplicated: boolean } | { ok: false; error: string } {
  const existing = existingTransactions.find((tx) => tx.idempotencyKey === input.idempotencyKey)
  if (existing) {
    return { ok: true, transaction: existing, duplicated: true }
  }

  const amount = Math.round(input.amount)
  if (amount <= 0 && input.transactionType !== 'adjustment') {
    return { ok: false, error: 'XP amount must be positive.' }
  }

  const current = deriveXpBalance(input.memberId, existingTransactions)
  let deltaLifetime = 0
  let deltaSpendable = 0
  let deltaReserved = 0

  switch (input.transactionType) {
    case 'earned':
    case 'received': {
      deltaLifetime = amount
      deltaSpendable = amount
      break
    }
    case 'reserved': {
      if (current.spendableXp < amount) {
        return {
          ok: false,
          error: `Insufficient Spendable XP: available ${current.spendableXp} XP, required ${amount} XP.`,
        }
      }
      // Spending / reserving never reduces Lifetime XP
      deltaLifetime = 0
      deltaSpendable = -amount
      deltaReserved = amount
      break
    }
    case 'transferred': {
      if (current.reservedXp < amount) {
        return {
          ok: false,
          error: `Insufficient reserved mission XP (${current.reservedXp} XP remaining).`,
        }
      }
      // Creator spending reserved XP does NOT reduce creator's Lifetime XP
      deltaLifetime = 0
      deltaSpendable = 0
      deltaReserved = -amount
      break
    }
    case 'refunded': {
      if (current.reservedXp < amount) {
        return {
          ok: false,
          error: `Cannot refund ${amount} XP; only ${current.reservedXp} XP is reserved.`,
        }
      }
      deltaLifetime = 0
      deltaSpendable = amount
      deltaReserved = -amount
      break
    }
    case 'adjustment': {
      if (current.spendableXp + amount < 0) {
        return { ok: false, error: 'Adjustment would result in negative Spendable XP.' }
      }
      // Adjustments only increase Lifetime XP if positive, never reduce Spendable below 0
      deltaLifetime = amount > 0 ? amount : 0
      deltaSpendable = amount
      break
    }
  }

  const transaction: XPTransaction = {
    id: `xp-${crypto.randomUUID().slice(0, 8)}`,
    memberId: input.memberId,
    amount: Math.abs(amount),
    transactionType: input.transactionType,
    sourceType: input.sourceType,
    deltaLifetime,
    deltaSpendable,
    deltaReserved,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    actorMemberId: input.actorMemberId,
    creatorMemberId: input.creatorMemberId,
    recipientMemberId: input.recipientMemberId,
    reason: input.reason,
    idempotencyKey: input.idempotencyKey,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }

  return { ok: true, transaction, duplicated: false }
}

export function calculateEligibleCp(
  existingEvents: ContributionPointEvent[],
  params: {
    memberId: string
    contributionRecordId: string
    seasonId: string
    houseId: HouseId
    activityCategory: CPActivityCategory
    baseCpAmount: number
    partnerMemberId?: string
    referenceKey: string
    caps: PlatformConfig['seasonalCpCaps']
    createdAt?: string
  },
): { event: ContributionPointEvent | null; cappedOut: boolean; duplicated: boolean } {
  if (existingEvents.some((evt) => evt.referenceKey === params.referenceKey)) {
    return { event: null, cappedOut: false, duplicated: true }
  }

  let eligible = Math.max(0, Math.round(params.baseCpAmount))

  if (params.activityCategory === 'event_attendance') {
    const used = existingEvents
      .filter((e) => e.memberId === params.memberId && e.seasonId === params.seasonId && e.activityCategory === 'event_attendance')
      .reduce((sum, e) => sum + e.cpAmount, 0)
    eligible = Math.min(eligible, Math.max(0, params.caps.eventAttendancePerSeason - used))
  } else if (params.activityCategory === 'community_support') {
    const used = existingEvents
      .filter((e) => e.memberId === params.memberId && e.seasonId === params.seasonId && e.activityCategory === 'community_support')
      .reduce((sum, e) => sum + e.cpAmount, 0)
    eligible = Math.min(eligible, Math.max(0, params.caps.communitySupportPerSeason - used))
  } else if (params.activityCategory === 'mentorship' && params.partnerMemberId) {
    const pairUsed = existingEvents
      .filter(
        (e) =>
          e.memberId === params.memberId &&
          e.seasonId === params.seasonId &&
          e.activityCategory === 'mentorship' &&
          e.partnerMemberId === params.partnerMemberId,
      )
      .reduce((sum, e) => sum + e.cpAmount, 0)
    eligible = Math.min(eligible, Math.max(0, params.caps.mentorshipPairPerSeason - pairUsed))
  }

  if (eligible <= 0) {
    return { event: null, cappedOut: true, duplicated: false }
  }

  const leaderboardBucket: ContributionPointEvent['leaderboardBucket'] =
    params.activityCategory.startsWith('mission_')
      ? 'missions'
      : params.activityCategory.startsWith('academy_') || params.activityCategory === 'practical_assessment'
        ? 'learning'
        : 'community_stewardship'

  return {
    cappedOut: false,
    duplicated: false,
    event: {
      id: `cp-${crypto.randomUUID().slice(0, 8)}`,
      memberId: params.memberId,
      contributionRecordId: params.contributionRecordId,
      seasonId: params.seasonId,
      houseId: params.houseId,
      activityCategory: params.activityCategory,
      leaderboardBucket,
      cpAmount: eligible,
      partnerMemberId: params.partnerMemberId,
      referenceKey: params.referenceKey,
      createdAt: params.createdAt ?? new Date().toISOString(),
    },
  }
}

export function evaluateNewAchievements(params: {
  member: MemberProfile
  achievements: AchievementDefinition[]
  existingUnlocked: MemberAchievement[]
  contributions: ContributionRecord[]
  learningCompletions: LearningCompletion[]
  missions: Mission[]
  submissions: MissionSubmission[]
  hostedOrSupportedEventsCount: number
  verifiedMentorshipCount: number
}): MemberAchievement[] {
  const {
    member,
    achievements,
    existingUnlocked,
    contributions,
    learningCompletions,
    missions,
    submissions,
    hostedOrSupportedEventsCount,
    verifiedMentorshipCount,
  } = params

  const alreadyIds = new Set(existingUnlocked.filter((a) => a.memberId === member.id).map((a) => a.achievementId))
  const myContribs = contributions.filter((c) => c.memberId === member.id)
  const myMissionContribs = myContribs.filter((c) => c.sourceKind === 'mission')
  const distinctMissionDates = new Set(myMissionContribs.map((c) => c.createdAt.slice(0, 10)))
  const distinctHouses = new Set(myContribs.map((c) => c.houseId))
  const maxContribsInOneHouse = Object.values(
    myContribs.reduce<Record<string, number>>((acc, c) => {
      acc[c.houseId] = (acc[c.houseId] ?? 0) + 1
      return acc
    }, {}),
  ).reduce((max, n) => Math.max(max, n), 0)

  const myLearnings = learningCompletions.filter((l) => l.memberId === member.id)
  const modulesDone = myLearnings.filter((l) => l.itemType === 'module').length
  const pathsDone = myLearnings.filter((l) => l.itemType === 'path').length
  const assessmentsPassed = myLearnings.filter((l) => l.itemType === 'assessment').length
  const communitySupportCount = myContribs.filter((c) => c.sourceKind === 'community_support').length

  const createdCompletedMissionByOther = missions.some(
    (m) =>
      m.creatorMemberId === member.id &&
      submissions.some((s) => s.missionId === m.id && s.memberId !== member.id && s.status === 'approved'),
  )

  const checks: Record<string, boolean> = {
    arena_ready: member.onboardingChecklist.orientationCompleted && member.onboardingChecklist.rulesChecked,
    first_contribution: myMissionContribs.length >= 1,
    mission_maker: createdCompletedMissionByOther,
    reliable_contributor: myMissionContribs.length >= 5 && distinctMissionDates.size >= 3,
    mission_veteran: myMissionContribs.length >= 25,
    academy_starter: modulesDone >= 5,
    path_finisher: pathsDone >= 1,
    practical_learner: assessmentsPassed >= 3,
    cross_house_collaborator: distinctHouses.size >= 3,
    house_pillar: maxContribsInOneHouse >= 10,
    community_builder: communitySupportCount >= 10,
    event_steward: hostedOrSupportedEventsCount >= 3,
    mentors_mark: verifiedMentorshipCount >= 3,
    scribes_mark: myContribs.some((c) => c.houseId === 'scribes'),
    heralds_voice: myContribs.some((c) => c.houseId === 'heralds'),
    artisans_craft: myContribs.some((c) => c.houseId === 'artisans'),
    echoes_reach: myContribs.some((c) => c.houseId === 'echoes'),
    forge_mark: myContribs.some((c) => c.houseId === 'forge-masters'),
    seers_insight: myContribs.some((c) => c.houseId === 'seers'),
  }

  const now = new Date().toISOString()
  const newlyUnlocked: MemberAchievement[] = []
  for (const def of achievements) {
    if (!alreadyIds.has(def.id) && checks[def.code]) {
      newlyUnlocked.push({
        id: `ma-${crypto.randomUUID().slice(0, 8)}`,
        memberId: member.id,
        achievementId: def.id,
        unlockedAt: now,
      })
    }
  }
  return newlyUnlocked
}

export function buildLeaderboard(params: {
  members: MemberProfile[]
  xpTransactions: XPTransaction[]
  cpEvents: ContributionPointEvent[]
  contributions: ContributionRecord[]
  thresholds: number[]
  category: LeaderboardCategory
  period: LeaderboardPeriod
  seasonId: string
  houseFilter?: HouseId
  viewerMemberId?: string | null
}): LeaderboardEntry[] {
  const {
    members,
    xpTransactions,
    cpEvents,
    contributions,
    thresholds,
    category,
    period,
    seasonId,
    houseFilter,
    viewerMemberId,
  } = params

  const scored = members
    .filter((m) => m.privacy.showOnLeaderboard || m.id === viewerMemberId)
    .filter((m) => (category === 'house' && houseFilter ? m.primaryHouseId === houseFilter : true))
    .map((m) => {
      const relevantEvents = cpEvents.filter((evt) => {
        if (evt.memberId !== m.id) return false
        if (period === 'season' && evt.seasonId !== seasonId) return false
        if (category === 'house' && houseFilter && evt.houseId !== houseFilter && m.primaryHouseId !== houseFilter) {
          return false
        }
        if (category === 'missions' && evt.leaderboardBucket !== 'missions') return false
        if (category === 'learning' && evt.leaderboardBucket !== 'learning') return false
        if (category === 'community_stewardship' && evt.leaderboardBucket !== 'community_stewardship') return false
        return true
      })

      const cpScore = relevantEvents.reduce((sum, e) => sum + e.cpAmount, 0)
      const balance = deriveXpBalance(m.id, xpTransactions)
      const levelInfo = calculateLevelProgress(balance.lifetimeXp, thresholds)
      const contribCount = contributions.filter((c) => c.memberId === m.id).length

      return {
        memberId: m.id,
        displayName: m.displayName,
        username: m.username,
        avatarInitials: m.avatarInitials,
        primaryHouseId: m.primaryHouseId,
        ascendancyRank: m.ascendancyRank,
        numericLevel: levelInfo.level,
        cpScore,
        contributionsCount: contribCount,
      }
    })
    .sort((a, b) => b.cpScore - a.cpScore || b.contributionsCount - a.contributionsCount || a.displayName.localeCompare(b.displayName))

  // Tied ranks where CP scores are equal
  const result: LeaderboardEntry[] = []
  let lastScore: number | null = null
  let currentRank = 0
  scored.forEach((row, index) => {
    if (lastScore === null || row.cpScore < lastScore) {
      currentRank = index + 1
      lastScore = row.cpScore
    }
    result.push({ ...row, rank: currentRank })
  })

  return result
}

export function memberHasPermission(
  memberId: string | null,
  grants: PermissionGrant[],
  scope: PermissionScope,
  houseId?: HouseId,
): boolean {
  if (!memberId) return false
  const memberGrants = grants.filter((g) => g.memberId === memberId)
  if (memberGrants.some((g) => g.scope === 'platform.admin')) return true
  return memberGrants.some((g) => {
    if (g.scope !== scope) return false
    if (houseId && g.houseId && g.houseId !== houseId) return false
    return true
  })
}
