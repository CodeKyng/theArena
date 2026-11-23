import { DISCUSSION_UNLOCK_LEVEL } from '../domain/constants'
import {
  calculateEligibleCp,
  calculateLevelProgress,
  classifyMissionBand,
  createXpLedgerTransaction,
  deriveXpBalance,
  evaluateNewAchievements,
  memberHasPermission,
  validateMissionPolicy,
} from '../domain/progression'
import type {
  ArenaEvent,
  ArenaPrototypeState,
  AscendancyRank,
  CPActivityCategory,
  ContributionRecord,
  EventAttendanceRole,
  EvidenceItem,
  EvidenceType,
  ExploreDiscussion,
  ExploreOpportunity,
  ExploreProject,
  ExploreResource,
  ExploreService,
  HouseId,
  MemberProfile,
  Mission,
  MissionCategory,
  MissionDispute,
  MissionParticipation,
  MissionSubmission,
  OrganisationProfile,
  ParticipationFormat,
  PermissionScope,
  PlatformConfig,
} from '../domain/types'

export type ServiceResult<T = void> =
  | { ok: true; state: ArenaPrototypeState; data: T; message: string }
  | { ok: false; error: string }

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'SP'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function appendAudit(
  state: ArenaPrototypeState,
  actorMemberId: string,
  action: string,
  targetType: string,
  targetId: string,
  summary: string,
): ArenaPrototypeState {
  return {
    ...state,
    auditLogs: [
      {
        id: uid('aud'),
        actorMemberId,
        action,
        targetType,
        targetId,
        summary,
        createdAt: nowIso(),
      },
      ...state.auditLogs,
    ],
  }
}

function notifyMember(
  state: ArenaPrototypeState,
  memberId: string,
  category: ArenaPrototypeState['notifications'][number]['category'],
  title: string,
  body: string,
  linkPath?: string,
  options?: { isMissionAlert?: boolean },
): ArenaPrototypeState {
  const isMissionRelated =
    options?.isMissionAlert ?? (category === 'mission' || category === 'submission')
  if (isMissionRelated) {
    const recipient = state.members.find((m) => m.id === memberId)
    if (recipient && !recipient.privacy.missionAlerts) {
      return state
    }
  }
  return {
    ...state,
    notifications: [
      {
        id: uid('notif'),
        memberId,
        category,
        title,
        body,
        linkPath,
        read: false,
        createdAt: nowIso(),
      },
      ...state.notifications,
    ],
  }
}

function syncMemberAchievements(state: ArenaPrototypeState, memberId: string): ArenaPrototypeState {
  const member = state.members.find((m) => m.id === memberId)
  if (!member) return state

  const hostedOrSupportedEventsCount = state.eventParticipations.filter(
    (ep) =>
      ep.memberId === memberId &&
      ep.status === 'attended' &&
      (ep.role === 'host' || ep.role === 'support'),
  ).length

  const verifiedMentorshipCount = state.mentorshipSessions.filter(
    (ms) =>
      ms.status === 'verified' &&
      (ms.mentorMemberId === memberId || ms.menteeMemberId === memberId),
  ).length

  const unlocked = evaluateNewAchievements({
    member,
    achievements: state.achievements,
    existingUnlocked: state.memberAchievements,
    contributions: state.contributionRecords,
    learningCompletions: state.learningCompletions,
    missions: state.missions,
    submissions: state.submissions,
    hostedOrSupportedEventsCount,
    verifiedMentorshipCount,
  })

  if (unlocked.length === 0) return state

  let next: ArenaPrototypeState = {
    ...state,
    memberAchievements: [...state.memberAchievements, ...unlocked],
  }

  for (const ma of unlocked) {
    const def = state.achievements.find((a) => a.id === ma.achievementId)
    if (def) {
      next = notifyMember(
        next,
        memberId,
        'achievement',
        `Achievement Unlocked: ${def.title}`,
        `${def.description} (Earned strictly via verified progress—no silent XP bonus.)`,
        '/activity',
      )
    }
  }

  return next
}

export function getMember(state: ArenaPrototypeState, memberId: string | null): MemberProfile | null {
  if (!memberId) return null
  return state.members.find((m) => m.id === memberId) ?? null
}

export function isSpartanMember(member: MemberProfile | null | undefined): member is MemberProfile {
  return Boolean(member && member.membershipStatus === 'spartan')
}

export function getAuthenticatedMember(state: ArenaPrototypeState, memberId: string | null): MemberProfile | null {
  const member = getMember(state, memberId)
  return isSpartanMember(member) ? member : null
}

function requireSpartanMember(
  state: ArenaPrototypeState,
  memberId: string | null | undefined,
  errorMessage = 'Sign in as a Spartan to continue.',
): { ok: true; member: MemberProfile } | { ok: false; error: string } {
  const member = getAuthenticatedMember(state, memberId ?? null)
  if (!member) {
    return { ok: false, error: errorMessage }
  }
  return { ok: true, member }
}

// ---------------------------------------------------------------------------
// 1. Auth, Unified Registration & New Spartan Onboarding
// ---------------------------------------------------------------------------

export function switchDemoPersona(state: ArenaPrototypeState, memberId: string | null): ServiceResult<MemberProfile> {
  const actorCheck = requireSpartanMember(
    state,
    state.currentMemberId,
    'Sign in as a Spartan before switching demo accounts.',
  )
  if (!actorCheck.ok) return actorCheck

  if (!memberId) {
    return {
      ok: false,
      error: 'Visitor mode is not a valid authenticated workspace account. Use Log out instead.',
    }
  }

  const targetCheck = requireSpartanMember(state, memberId, 'Demo persona must be a valid Spartan account.')
  if (!targetCheck.ok) return targetCheck

  return {
    ok: true,
    state: { ...state, currentMemberId: targetCheck.member.id, activeOrganisationId: null },
    data: targetCheck.member,
    message: `Switched demo view to ${targetCheck.member.displayName} (${targetCheck.member.ascendancyRank}).`,
  }
}

export function signInDemoByEmail(state: ArenaPrototypeState, email: string): ServiceResult<MemberProfile> {
  const normalized = email.trim().toLowerCase()
  const member = state.members.find((m) => m.email.toLowerCase() === normalized)
  if (!member || member.membershipStatus !== 'spartan') {
    return {
      ok: false,
      error: 'No Spartan account matches that email. Use a seeded @arena.demo address or register a new unified Arena account.',
    }
  }
  return {
    ok: true,
    state: { ...state, currentMemberId: member.id, activeOrganisationId: null },
    data: member,
    message: `Signed in as ${member.displayName}.`,
  }
}

export function registerUnifiedAccount(
  state: ArenaPrototypeState,
  input: { displayName: string; username: string; email: string; headline?: string },
): ServiceResult<MemberProfile> {
  const displayName = input.displayName.trim()
  const username = input.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
  const email = input.email.trim().toLowerCase()

  if (!displayName || !username || !email || !email.includes('@')) {
    return { ok: false, error: 'Enter a valid name, handle, and email address.' }
  }
  if (state.members.some((m) => m.email.toLowerCase() === email || m.username.toLowerCase() === username)) {
    return { ok: false, error: 'An account with that email or username already exists.' }
  }

  const newMember: MemberProfile = {
    id: uid('mem'),
    email,
    displayName,
    username,
    avatarInitials: makeInitials(displayName),
    bio: 'New Spartan joining The Arena.',
    headline: input.headline?.trim() || 'New Spartan · Exploring Houses',
    publicLinks: [],
    skills: [],
    interests: [],
    membershipStatus: 'spartan',
    onboardingStage: 'newbie',
    onboardingChecklist: {
      orientationCompleted: false,
      rulesChecked: false,
      housesSelected: false,
      profileGuided: false,
      academyStarted: false,
      introMissionJoined: false,
    },
    ascendancyRank: 'Spartan',
    primaryHouseId: null,
    secondaryHouseId: null,
    privacy: {
      publicProfileVisible: true,
      showContributionsPublicly: true,
      showOnLeaderboard: true,
      emailNotifications: true,
      missionAlerts: true,
    },
    joinedAt: nowIso(),
  }

  let next: ArenaPrototypeState = {
    ...state,
    currentMemberId: newMember.id,
    activeOrganisationId: null,
    members: [...state.members, newMember],
  }
  next = notifyMember(
    next,
    newMember.id,
    'announcement',
    'Welcome to The Arena',
    'Your unified Spartan account is ready. Complete Orientation (+20 XP) and select your Houses to begin.',
    '/dashboard',
  )
  next = appendAudit(next, newMember.id, 'account.registered', 'member', newMember.id, `Registered unified Spartan account @${username}.`)

  return {
    ok: true,
    state: next,
    data: newMember,
    message: `Welcome to The Arena, ${displayName}. You start as a New Spartan.`,
  }
}

export function signOutAccount(state: ArenaPrototypeState): ServiceResult<null> {
  return {
    ok: true,
    state: { ...state, currentMemberId: null, activeOrganisationId: null },
    data: null,
    message: 'Signed out.',
  }
}

export function isOnboardingComplete(checklist: MemberProfile['onboardingChecklist']): boolean {
  return Boolean(
    checklist.orientationCompleted &&
      checklist.rulesChecked &&
      checklist.housesSelected &&
      checklist.profileGuided &&
      checklist.academyStarted &&
      checklist.introMissionJoined,
  )
}

export function completeOrientationAndRules(state: ArenaPrototypeState, memberId: string): ServiceResult<{ awardedXp: number }> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to complete orientation.')
  if (!memberCheck.ok) return memberCheck
  const member = memberCheck.member

  const orientationXp = state.config.systemXpValues.orientationOnce
  const ledgerRes = createXpLedgerTransaction(state.xpTransactions, {
    memberId,
    amount: orientationXp,
    transactionType: 'earned',
    sourceType: 'system',
    referenceType: 'onboarding',
    referenceId: `onb-${memberId}`,
    actorMemberId: memberId,
    reason: 'Completed New Spartan Orientation and Community Rules Check',
    idempotencyKey: `onboarding-orientation-${memberId}`,
  })
  if (!ledgerRes.ok) return ledgerRes

  const nextChecklist: MemberProfile['onboardingChecklist'] = {
    ...member.onboardingChecklist,
    orientationCompleted: true,
    rulesChecked: true,
  }
  const updatedMember: MemberProfile = {
    ...member,
    onboardingChecklist: nextChecklist,
    onboardingStage: isOnboardingComplete(nextChecklist) ? 'completed' : member.onboardingStage,
  }

  let next: ArenaPrototypeState = {
    ...state,
    members: state.members.map((m) => (m.id === memberId ? updatedMember : m)),
    xpTransactions: ledgerRes.duplicated ? state.xpTransactions : [...state.xpTransactions, ledgerRes.transaction],
  }
  next = syncMemberAchievements(next, memberId)
  if (!ledgerRes.duplicated) {
    next = notifyMember(
      next,
      memberId,
      'xp',
      `+${orientationXp} XP · Orientation Completed`,
      'You unlocked Arena Ready and earned your onboarding XP.',
      '/activity',
    )
    next = appendAudit(next, memberId, 'onboarding.orientation_completed', 'member', memberId, `Completed orientation & rules check (+${orientationXp} XP).`)
  }

  return {
    ok: true,
    state: next,
    data: { awardedXp: ledgerRes.duplicated ? 0 : orientationXp },
    message: ledgerRes.duplicated
      ? 'Orientation and rules check already recorded (no duplicate XP awarded).'
      : `Orientation & rules check completed (+${orientationXp} XP).`,
  }
}

export function updateMemberHouses(
  state: ArenaPrototypeState,
  memberId: string,
  primaryHouseId: HouseId | null,
  secondaryHouseId: HouseId | null,
): ServiceResult<MemberProfile> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to update Houses.')
  if (!memberCheck.ok) return memberCheck
  const member = memberCheck.member
  if (primaryHouseId && secondaryHouseId && primaryHouseId === secondaryHouseId) {
    return { ok: false, error: 'Primary and Secondary Houses must be different.' }
  }
  if (!primaryHouseId && secondaryHouseId) {
    return { ok: false, error: 'Choose a Primary House before selecting a Secondary House.' }
  }

  const nextChecklist: MemberProfile['onboardingChecklist'] = {
    ...member.onboardingChecklist,
    housesSelected: Boolean(primaryHouseId),
  }

  const updated: MemberProfile = {
    ...member,
    primaryHouseId,
    secondaryHouseId,
    onboardingChecklist: nextChecklist,
    onboardingStage: isOnboardingComplete(nextChecklist) ? 'completed' : member.onboardingStage,
  }

  let next: ArenaPrototypeState = {
    ...state,
    members: state.members.map((m) => (m.id === memberId ? updated : m)),
  }
  if (primaryHouseId) {
    const houseName = state.houses.find((h) => h.id === primaryHouseId)?.name ?? primaryHouseId
    next = appendAudit(next, memberId, 'houses.updated', 'member', memberId, `Selected Primary House ${houseName}${secondaryHouseId ? ` & Secondary ${secondaryHouseId}` : ''} (0 XP awarded).`)
  }

  return {
    ok: true,
    state: next,
    data: updated,
    message: 'House preferences saved (0 XP — House selection shapes discovery and identity only).',
  }
}

// ---------------------------------------------------------------------------
// 2. Profile, Settings & Organisations
// ---------------------------------------------------------------------------

export function updateMemberProfile(
  state: ArenaPrototypeState,
  memberId: string,
  patch: Partial<Pick<MemberProfile, 'displayName' | 'headline' | 'bio' | 'publicLinks' | 'skills' | 'interests'>>,
): ServiceResult<MemberProfile> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to update your profile.')
  if (!memberCheck.ok) return memberCheck
  const member = memberCheck.member

  const displayName = patch.displayName?.trim() || member.displayName
  const nextChecklist: MemberProfile['onboardingChecklist'] = {
    ...member.onboardingChecklist,
    profileGuided: Boolean((patch.bio !== undefined ? patch.bio : member.bio).trim()),
  }
  const updated: MemberProfile = {
    ...member,
    ...patch,
    displayName,
    avatarInitials: makeInitials(displayName),
    onboardingChecklist: nextChecklist,
    onboardingStage: isOnboardingComplete(nextChecklist) ? 'completed' : member.onboardingStage,
  }

  return {
    ok: true,
    state: {
      ...state,
      members: state.members.map((m) => (m.id === memberId ? updated : m)),
    },
    data: updated,
    message: 'Public profile updated.',
  }
}

export function updateAccountPrivacy(
  state: ArenaPrototypeState,
  memberId: string,
  privacyPatch: Partial<MemberProfile['privacy']>,
): ServiceResult<MemberProfile> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to update settings.')
  if (!memberCheck.ok) return memberCheck
  const member = memberCheck.member

  const updated: MemberProfile = {
    ...member,
    privacy: { ...member.privacy, ...privacyPatch },
  }

  return {
    ok: true,
    state: {
      ...state,
      members: state.members.map((m) => (m.id === memberId ? updated : m)),
    },
    data: updated,
    message: 'Account & privacy settings saved.',
  }
}

export function createOrganisation(
  state: ArenaPrototypeState,
  memberId: string,
  input: {
    name: string
    kind: OrganisationProfile['kind']
    ecosystem: string
    tagline: string
    description: string
    website: string
  },
): ServiceResult<OrganisationProfile> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to create an organisation profile.')
  if (!memberCheck.ok) return memberCheck
  if (!input.name.trim()) return { ok: false, error: 'Organisation name is required.' }

  const slug = input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const org: OrganisationProfile = {
    id: uid('org'),
    name: input.name.trim(),
    slug: slug || uid('org'),
    kind: input.kind,
    ecosystem: input.ecosystem.trim() || 'Multi-chain',
    tagline: input.tagline.trim() || 'Community ecosystem partner',
    description: input.description.trim() || 'Organisation profile linked to a verified Spartan account.',
    website: input.website.trim() || 'https://thearena.demo',
    verificationStatus: 'unverified',
    ownerMemberId: memberId,
    createdAt: nowIso(),
  }

  let next: ArenaPrototypeState = {
    ...state,
    organisations: [org, ...state.organisations],
    organisationMemberships: [
      ...state.organisationMemberships,
      {
        id: uid('om'),
        organisationId: org.id,
        memberId,
        roleLabel: 'Owner',
        canSponsorMissions: true,
        canPublishOpportunities: true,
        joinedAt: nowIso(),
      },
    ],
    activeOrganisationId: org.id,
  }
  next = appendAudit(next, memberId, 'organisation.created', 'organisation', org.id, `Created organisation "${org.name}" (unverified; no inherited XP or rank).`)

  return {
    ok: true,
    state: next,
    data: org,
    message: `Created "${org.name}". Organisations start unverified and never inherit personal XP or Ascendancy.`,
  }
}

export function setOrganisationVerification(
  state: ArenaPrototypeState,
  actorId: string,
  organisationId: string,
  status: OrganisationProfile['verificationStatus'],
): ServiceResult<OrganisationProfile> {
  const actorCheck = requireSpartanMember(state, actorId)
  if (!actorCheck.ok) return actorCheck
  if (!memberHasPermission(actorId, state.permissionGrants, 'platform.admin')) {
    return { ok: false, error: 'Only Control Room Admins can change organisation verification status.' }
  }
  const org = state.organisations.find((o) => o.id === organisationId)
  if (!org) return { ok: false, error: 'Organisation not found.' }
  const updated = { ...org, verificationStatus: status }
  let next: ArenaPrototypeState = {
    ...state,
    organisations: state.organisations.map((o) => (o.id === organisationId ? updated : o)),
  }
  next = appendAudit(next, actorId, 'organisation.verification_updated', 'organisation', organisationId, `Set ${org.name} verification status to ${status}.`)
  return { ok: true, state: next, data: updated, message: `${org.name} marked ${status.replace('_', ' ')}.` }
}

export function switchActiveOrganisation(
  state: ArenaPrototypeState,
  organisationId: string | null,
  actorMemberId: string | null = state.currentMemberId,
): ServiceResult<null> {
  const actorCheck = requireSpartanMember(state, actorMemberId, 'Sign in as a Spartan to switch organisation context.')
  if (!actorCheck.ok) return actorCheck

  if (organisationId === null) {
    return {
      ok: true,
      state: { ...state, activeOrganisationId: null },
      data: null,
      message: 'Switched to Personal Spartan context.',
    }
  }

  const org = state.organisations.find((o) => o.id === organisationId)
  if (!org) return { ok: false, error: 'Organisation not found.' }

  const isMemberOrOwner =
    org.ownerMemberId === actorCheck.member.id ||
    state.organisationMemberships.some(
      (om) => om.organisationId === org.id && om.memberId === actorCheck.member.id,
    )
  if (!isMemberOrOwner) {
    return { ok: false, error: 'You do not belong to this organisation.' }
  }

  return {
    ok: true,
    state: { ...state, activeOrganisationId: organisationId },
    data: null,
    message: 'Switched workspace context to Organisation.',
  }
}

// ---------------------------------------------------------------------------
// 3. Missions: Guided Creation, Funding Reserve, Participation, Review & Settlement
// ---------------------------------------------------------------------------

export interface CreateMissionInput {
  title: string
  description: string
  objective: string
  instructions: string
  steps: string[]
  deliverables: string[]
  restrictions: string[]
  category: MissionCategory
  tags: string[]
  houseId: HouseId
  crossHouseEligible: boolean
  sponsorOrganisationId?: string
  participationFormat: ParticipationFormat
  eligibilityNote: string
  capacity: number
  difficulty: Mission['difficulty']
  platformContext: string
  locationContext: string
  requiredEvidenceTypes: EvidenceType[]
  submissionInstructions: string
  verificationCriteria: string
  startDate: string
  deadline: string
  rewardPerContributorXp: number
  maxContributors: number
  isFunded: boolean
  publishNow: boolean
}

export function createMission(state: ArenaPrototypeState, creatorId: string, input: CreateMissionInput): ServiceResult<Mission> {
  const creatorCheck = requireSpartanMember(state, creatorId, 'Sign in as a Spartan to create a mission.')
  if (!creatorCheck.ok) return creatorCheck
  if (!memberHasPermission(creatorId, state.permissionGrants, 'mission.create')) {
    return { ok: false, error: 'Your account does not currently have Mission Creator permission. Request it in Control Room or switch to Jordan Davis / Maya Kim.' }
  }
  if (!input.title.trim() || !input.description.trim()) {
    return { ok: false, error: 'Mission title and description are required.' }
  }

  const policyCheck = validateMissionPolicy([
    input.title,
    input.description,
    input.objective,
    input.instructions,
    ...input.deliverables,
  ])
  if (!policyCheck.compliant) {
    return { ok: false, error: policyCheck.reason ?? 'Mission violates Arena policy.' }
  }

  const rewardXp = input.isFunded ? Math.max(0, Math.round(input.rewardPerContributorXp)) : 0
  const maxContributors = Math.max(1, Math.round(input.maxContributors))
  const capacity = Math.round(input.capacity)
  if (capacity < 1) {
    return { ok: false, error: 'Participant capacity must be at least 1.' }
  }
  if (input.isFunded && maxContributors > capacity) {
    return { ok: false, error: 'Participant capacity must be greater than or equal to max rewarded contributors.' }
  }
  if (input.isFunded && rewardXp <= 0) {
    return { ok: false, error: 'Funded missions require a positive XP reward per contributor.' }
  }

  const bandInfo = classifyMissionBand(rewardXp, state.config.rewardBands)
  const totalReserve = input.isFunded ? rewardXp * maxContributors : 0
  const missionId = uid('mis')

  let next = state
  let reservedNow = 0
  if (input.publishNow && totalReserve > 0) {
    const reserveTx = createXpLedgerTransaction(state.xpTransactions, {
      memberId: creatorId,
      amount: totalReserve,
      transactionType: 'reserved',
      sourceType: 'member_funded',
      referenceType: 'mission',
      referenceId: missionId,
      actorMemberId: creatorId,
      creatorMemberId: creatorId,
      reason: `Reserved XP budget for mission "${input.title.trim()}" (${maxContributors} × ${rewardXp} XP)`,
      idempotencyKey: `mission-reserve-${missionId}`,
    })
    if (!reserveTx.ok) return reserveTx
    next = {
      ...next,
      xpTransactions: [...next.xpTransactions, reserveTx.transaction],
    }
    reservedNow = totalReserve
  }

  const status: Mission['status'] = !input.publishNow
    ? 'draft'
    : bandInfo.requiresAdditionalApproval
      ? 'pending_review'
      : 'active'

  const now = nowIso()
  const mission: Mission = {
    id: missionId,
    title: input.title.trim(),
    description: input.description.trim(),
    objective: input.objective.trim() || input.description.trim(),
    instructions: input.instructions.trim() || 'Follow deliverables and attach verifiable evidence.',
    steps: input.steps.filter((s) => s.trim()),
    deliverables: input.deliverables.filter((d) => d.trim()),
    restrictions: input.restrictions.filter((r) => r.trim()),
    category: input.category,
    tags: input.tags.filter((t) => t.trim()),
    houseId: input.houseId,
    crossHouseEligible: input.houseId === 'echoes' ? true : input.crossHouseEligible,
    creatorMemberId: creatorId,
    sponsorOrganisationId: input.sponsorOrganisationId || undefined,
    assignedReviewerIds: [creatorId],
    participationFormat: input.participationFormat,
    participationOpen: status === 'active',
    eligibilityNote: input.eligibilityNote.trim() || 'Open to eligible Arena Spartans.',
    capacity,
    difficulty: input.difficulty,
    platformContext: input.platformContext.trim() || 'GitHub / Docs',
    locationContext: input.locationContext.trim() || 'Remote',
    requiredEvidenceTypes: input.requiredEvidenceTypes.length > 0 ? input.requiredEvidenceTypes : ['text', 'links'],
    submissionInstructions: input.submissionInstructions.trim() || 'Attach written explanation and reproducible proof links.',
    verificationCriteria: input.verificationCriteria.trim() || 'Deliverables match stated objective with verified evidence.',
    startDate: input.startDate || now.slice(0, 10),
    deadline: input.deadline || '2026-12-31',
    status,
    budget: {
      isFunded: input.isFunded,
      fundingSource: input.sponsorOrganisationId ? 'organisation_sponsor' : input.isFunded ? 'member_spendable' : 'system_non_rewarded',
      rewardPerContributorXp: rewardXp,
      rewardBand: bandInfo.band,
      cpTierValue: bandInfo.cpValue,
      maxContributors,
      totalReservedXp: reservedNow,
      remainingReservedXp: reservedNow,
      settledXp: 0,
      refundedXp: 0,
      requiresAdditionalApproval: bandInfo.requiresAdditionalApproval,
    },
    createdAt: now,
    updatedAt: now,
  }

  next = {
    ...next,
    missions: [mission, ...next.missions],
  }
  next = appendAudit(
    next,
    creatorId,
    `mission.${status}`,
    'mission',
    mission.id,
    `Created mission "${mission.title}" (${status}, reserved ${reservedNow} XP).`,
  )

  if (status === 'pending_review') {
    const admins = next.members.filter((m) => memberHasPermission(m.id, next.permissionGrants, 'platform.admin'))
    for (const adm of admins) {
      next = notifyMember(
        next,
        adm.id,
        'mission',
        'High-value mission requires Control Room approval',
        `"${mission.title}" sets ${rewardXp} XP per contributor (>1,500 XP band). Review before release.`,
        '/control-room',
      )
    }
  }

  return {
    ok: true,
    state: next,
    data: mission,
    message:
      status === 'draft'
        ? 'Mission saved as draft (no Spendable XP reserved yet).'
        : status === 'pending_review'
          ? `Reserved ${reservedNow} XP and queued for Control Room approval (>1,500 XP band).`
          : `Mission published and ${reservedNow} Spendable XP reserved in escrow.`,
  }
}

export function publishDraftMission(state: ArenaPrototypeState, actorId: string, missionId: string): ServiceResult<Mission> {
  const actorCheck = requireSpartanMember(state, actorId)
  if (!actorCheck.ok) return actorCheck
  const mission = state.missions.find((m) => m.id === missionId)
  if (!mission) return { ok: false, error: 'Mission not found.' }
  if (mission.status !== 'draft') return { ok: false, error: 'Only draft missions can be published.' }
  if (mission.creatorMemberId !== actorId && !memberHasPermission(actorId, state.permissionGrants, 'platform.admin')) {
    return { ok: false, error: 'Only the creator or Control Room admin can publish this draft.' }
  }

  const totalReserve = mission.budget.isFunded
    ? mission.budget.rewardPerContributorXp * mission.budget.maxContributors
    : 0

  let next = state
  if (totalReserve > 0) {
    const tx = createXpLedgerTransaction(state.xpTransactions, {
      memberId: mission.creatorMemberId,
      amount: totalReserve,
      transactionType: 'reserved',
      sourceType: 'member_funded',
      referenceType: 'mission',
      referenceId: mission.id,
      actorMemberId: actorId,
      creatorMemberId: mission.creatorMemberId,
      reason: `Reserved XP budget on publishing "${mission.title}"`,
      idempotencyKey: `mission-reserve-${mission.id}`,
    })
    if (!tx.ok) return tx
    next = {
      ...next,
      xpTransactions: tx.duplicated ? next.xpTransactions : [...next.xpTransactions, tx.transaction],
    }
  }

  const nextStatus: Mission['status'] = mission.budget.requiresAdditionalApproval ? 'pending_review' : 'active'
  const updated: Mission = {
    ...mission,
    status: nextStatus,
    participationOpen: nextStatus === 'active',
    budget: {
      ...mission.budget,
      totalReservedXp: totalReserve,
      remainingReservedXp: totalReserve,
    },
    updatedAt: nowIso(),
  }

  next = {
    ...next,
    missions: next.missions.map((m) => (m.id === mission.id ? updated : m)),
  }
  next = appendAudit(next, actorId, 'mission.published', 'mission', mission.id, `Published draft "${mission.title}" -> ${nextStatus} (${totalReserve} XP reserved).`)

  return {
    ok: true,
    state: next,
    data: updated,
    message: nextStatus === 'pending_review'
      ? `Draft reserved ${totalReserve} XP and queued for Control Room (>1,500 XP).`
      : `Mission published (${totalReserve} XP reserved).`,
  }
}

export function approveHighValueMission(state: ArenaPrototypeState, adminId: string, missionId: string): ServiceResult<Mission> {
  const adminCheck = requireSpartanMember(state, adminId)
  if (!adminCheck.ok) return adminCheck
  if (!memberHasPermission(adminId, state.permissionGrants, 'platform.admin') && !memberHasPermission(adminId, state.permissionGrants, 'finance.admin')) {
    return { ok: false, error: 'Only Control Room Admins can approve >1,500 XP missions.' }
  }
  const mission = state.missions.find((m) => m.id === missionId)
  if (!mission || mission.status !== 'pending_review') {
    return { ok: false, error: 'Mission is not pending high-value approval.' }
  }
  const updated: Mission = {
    ...mission,
    status: 'active',
    participationOpen: true,
    updatedAt: nowIso(),
  }
  let next: ArenaPrototypeState = {
    ...state,
    missions: state.missions.map((m) => (m.id === missionId ? updated : m)),
  }
  next = notifyMember(next, mission.creatorMemberId, 'mission', 'High-value mission approved', `"${mission.title}" is now Active in The Arena.`, `/missions/${mission.id}`)
  next = appendAudit(next, adminId, 'mission.high_value_approved', 'mission', missionId, `Approved >1,500 XP mission "${mission.title}".`)
  return { ok: true, state: next, data: updated, message: `"${mission.title}" is now Active.` }
}

export function toggleMissionPause(state: ArenaPrototypeState, actorId: string, missionId: string): ServiceResult<Mission> {
  const actorCheck = requireSpartanMember(state, actorId)
  if (!actorCheck.ok) return actorCheck
  const mission = state.missions.find((m) => m.id === missionId)
  if (!mission) return { ok: false, error: 'Mission not found.' }
  const canManage =
    mission.creatorMemberId === actorId ||
    memberHasPermission(actorId, state.permissionGrants, 'house.manage', mission.houseId) ||
    memberHasPermission(actorId, state.permissionGrants, 'platform.admin')
  if (!canManage) return { ok: false, error: 'Not authorised to pause/resume this mission.' }
  if (mission.status !== 'active' && mission.status !== 'paused') {
    return { ok: false, error: 'Only Active or Paused missions can be toggled.' }
  }

  const nextStatus: Mission['status'] = mission.status === 'active' ? 'paused' : 'active'
  const updated: Mission = {
    ...mission,
    status: nextStatus,
    participationOpen: nextStatus === 'active',
    updatedAt: nowIso(),
  }
  let next: ArenaPrototypeState = {
    ...state,
    missions: state.missions.map((m) => (m.id === missionId ? updated : m)),
  }
  next = appendAudit(next, actorId, `mission.${nextStatus}`, 'mission', missionId, `Set mission "${mission.title}" to ${nextStatus}.`)
  return { ok: true, state: next, data: updated, message: `Mission is now ${nextStatus}.` }
}

export function cancelOrExpireMission(
  state: ArenaPrototypeState,
  actorId: string,
  missionId: string,
  targetStatus: 'cancelled' | 'expired',
): ServiceResult<{ mission: Mission; refundedXp: number }> {
  const actorCheck = requireSpartanMember(state, actorId)
  if (!actorCheck.ok) return actorCheck
  const mission = state.missions.find((m) => m.id === missionId)
  if (!mission) return { ok: false, error: 'Mission not found.' }
  const canManage =
    mission.creatorMemberId === actorId ||
    memberHasPermission(actorId, state.permissionGrants, 'house.manage', mission.houseId) ||
    memberHasPermission(actorId, state.permissionGrants, 'platform.admin')
  if (!canManage) return { ok: false, error: 'Not authorised to cancel or expire this mission.' }
  if (['completed', 'cancelled', 'expired', 'archived'].includes(mission.status)) {
    return { ok: false, error: `Mission is already ${mission.status}.` }
  }

  const unallocated = mission.budget.remainingReservedXp
  let next = state
  let refundedAmount = 0

  if (unallocated > 0) {
    const refundTx = createXpLedgerTransaction(state.xpTransactions, {
      memberId: mission.creatorMemberId,
      amount: unallocated,
      transactionType: 'refunded',
      sourceType: 'member_funded',
      referenceType: 'mission',
      referenceId: mission.id,
      actorMemberId: actorId,
      creatorMemberId: mission.creatorMemberId,
      reason: `Refunded unspent escrow on mission ${targetStatus}: "${mission.title}"`,
      idempotencyKey: `mission-refund-${mission.id}`,
    })
    if (!refundTx.ok) return refundTx
    if (!refundTx.duplicated) {
      next = { ...next, xpTransactions: [...next.xpTransactions, refundTx.transaction] }
      refundedAmount = unallocated
    }
  }

  const updated: Mission = {
    ...mission,
    status: targetStatus,
    participationOpen: false,
    budget: {
      ...mission.budget,
      remainingReservedXp: 0,
      refundedXp: mission.budget.refundedXp + refundedAmount,
    },
    updatedAt: nowIso(),
  }

  next = {
    ...next,
    missions: next.missions.map((m) => (m.id === missionId ? updated : m)),
  }
  if (refundedAmount > 0) {
    next = notifyMember(
      next,
      mission.creatorMemberId,
      'xp',
      `+${refundedAmount} Spendable XP Refunded`,
      `Unallocated escrow from ${targetStatus} mission "${mission.title}" returned to your Spendable XP.`,
      '/activity',
      { isMissionAlert: true },
    )
  }
  next = appendAudit(
    next,
    actorId,
    `mission.${targetStatus}`,
    'mission',
    mission.id,
    `Marked "${mission.title}" as ${targetStatus}; refunded ${refundedAmount} XP to creator.`,
  )

  return {
    ok: true,
    state: next,
    data: { mission: updated, refundedXp: refundedAmount },
    message: refundedAmount > 0
      ? `Mission marked ${targetStatus}. Refunded ${refundedAmount} unspent XP to Spendable balance.`
      : `Mission marked ${targetStatus}.`,
  }
}

export function joinOrApplyMission(
  state: ArenaPrototypeState,
  memberId: string,
  missionId: string,
  applicationNote?: string,
  teamName?: string,
): ServiceResult<MissionParticipation> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to join missions.')
  if (!memberCheck.ok) return memberCheck
  const member = memberCheck.member
  const mission = state.missions.find((m) => m.id === missionId)
  if (!mission) return { ok: false, error: 'Mission not found.' }
  if (mission.status !== 'active' || !mission.participationOpen) {
    return { ok: false, error: 'Participation is currently closed for this mission.' }
  }

  const existing = state.missionParticipations.find((p) => p.missionId === missionId && p.memberId === memberId && p.status !== 'withdrawn')
  if (existing) {
    return { ok: false, error: `You have already ${existing.status} for this mission.` }
  }

  const activeCount = state.missionParticipations.filter(
    (p) => p.missionId === missionId && (p.status === 'joined' || p.status === 'accepted'),
  ).length
  if (activeCount >= mission.capacity) {
    return { ok: false, error: 'This mission has reached participant capacity.' }
  }

  const part: MissionParticipation = {
    id: uid('mp'),
    missionId,
    memberId,
    status: mission.participationFormat === 'application' ? 'applied' : 'joined',
    applicationNote: applicationNote?.trim() || undefined,
    teamName: teamName?.trim() || undefined,
    joinedAt: nowIso(),
  }

  const updatedMembers = missionId === 'mis-intro'
    ? state.members.map((m) => {
        if (m.id !== memberId) return m
        const nextChecklist = { ...m.onboardingChecklist, introMissionJoined: true }
        return {
          ...m,
          onboardingChecklist: nextChecklist,
          onboardingStage: isOnboardingComplete(nextChecklist) ? 'completed' : m.onboardingStage,
        }
      })
    : state.members

  let next: ArenaPrototypeState = {
    ...state,
    members: updatedMembers,
    missionParticipations: [...state.missionParticipations, part],
  }
  if (part.status === 'applied') {
    next = notifyMember(
      next,
      mission.creatorMemberId,
      'mission',
      'New mission application received',
      `${member.displayName} applied to "${mission.title}".`,
      `/missions/${mission.id}`,
    )
  }

  return {
    ok: true,
    state: next,
    data: part,
    message: part.status === 'applied' ? 'Application submitted for creator review.' : 'Joined mission! Submit Proof of Work when ready.',
  }
}

export function decideMissionApplication(
  state: ArenaPrototypeState,
  reviewerId: string,
  participationId: string,
  decision: 'accepted' | 'declined',
): ServiceResult<MissionParticipation> {
  const reviewerCheck = requireSpartanMember(state, reviewerId)
  if (!reviewerCheck.ok) return reviewerCheck
  const part = state.missionParticipations.find((p) => p.id === participationId)
  if (!part) return { ok: false, error: 'Application not found.' }
  const mission = state.missions.find((m) => m.id === part.missionId)
  if (!mission) return { ok: false, error: 'Mission not found.' }

  const canDecide =
    mission.creatorMemberId === reviewerId ||
    mission.assignedReviewerIds.includes(reviewerId) ||
    memberHasPermission(reviewerId, state.permissionGrants, 'house.manage', mission.houseId) ||
    memberHasPermission(reviewerId, state.permissionGrants, 'platform.admin')
  if (!canDecide) return { ok: false, error: 'Not authorised to review applications for this mission.' }

  if (decision === 'accepted') {
    const activeCount = state.missionParticipations.filter(
      (p) => p.missionId === mission.id && (p.status === 'joined' || p.status === 'accepted'),
    ).length
    if (activeCount >= mission.capacity) {
      return { ok: false, error: 'Mission participant capacity is already full.' }
    }
  }

  const updated: MissionParticipation = { ...part, status: decision }
  let next: ArenaPrototypeState = {
    ...state,
    missionParticipations: state.missionParticipations.map((p) => (p.id === participationId ? updated : p)),
  }
  next = notifyMember(
    next,
    part.memberId,
    'mission',
    decision === 'accepted' ? 'Mission application accepted' : 'Mission application declined',
    `Your application for "${mission.title}" was ${decision}.`,
    `/missions/${mission.id}`,
  )
  return { ok: true, state: next, data: updated, message: `Applicant ${decision}.` }
}

export function submitMissionWork(
  state: ArenaPrototypeState,
  memberId: string,
  missionId: string,
  summary: string,
  evidenceItems: EvidenceItem[],
): ServiceResult<MissionSubmission> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to submit Proof of Work.')
  if (!memberCheck.ok) return memberCheck
  const member = memberCheck.member
  const mission = state.missions.find((m) => m.id === missionId)
  if (!mission) return { ok: false, error: 'Mission not found.' }
  if (mission.status !== 'active') return { ok: false, error: 'Submissions are only accepted while a mission is Active.' }
  if (!summary.trim()) return { ok: false, error: 'Provide a summary of your deliverable.' }
  if (evidenceItems.length === 0) return { ok: false, error: 'Attach at least one piece of Proof of Work evidence.' }

  const existingOpen = state.submissions.find(
    (s) => s.missionId === missionId && s.memberId === memberId && ['submitted', 'under_review', 'approved'].includes(s.status),
  )
  if (existingOpen) {
    return { ok: false, error: `You already have a ${existingOpen.status} submission for this mission.` }
  }

  const part = state.missionParticipations.find((p) => p.missionId === missionId && p.memberId === memberId)
  if (mission.participationFormat === 'application' && part?.status !== 'accepted') {
    return { ok: false, error: 'Your application must be accepted before submitting Proof of Work.' }
  }

  const now = nowIso()
  let next = state
  if (!part) {
    next = {
      ...next,
      missionParticipations: [
        ...next.missionParticipations,
        { id: uid('mp'), missionId, memberId, status: 'joined', joinedAt: now },
      ],
    }
  }

  const submission: MissionSubmission = {
    id: uid('sub'),
    missionId,
    memberId,
    status: 'submitted',
    version: 1,
    summary: summary.trim(),
    evidenceItems,
    revisionHistory: [],
    reviews: [],
    submittedAt: now,
    updatedAt: now,
  }

  next = {
    ...next,
    submissions: [submission, ...next.submissions],
    members:
      missionId === 'mis-intro'
        ? next.members.map((m) => {
            if (m.id !== memberId) return m
            const nextChecklist = { ...m.onboardingChecklist, introMissionJoined: true }
            return {
              ...m,
              onboardingChecklist: nextChecklist,
              onboardingStage: isOnboardingComplete(nextChecklist) ? 'completed' : m.onboardingStage,
            }
          })
        : next.members,
  }

  for (const revId of mission.assignedReviewerIds) {
    if (revId !== memberId) {
      next = notifyMember(
        next,
        revId,
        'submission',
        'New submission ready for review',
        `${member.displayName} submitted Proof of Work on "${mission.title}".`,
        `/missions/${mission.id}`,
      )
    }
  }

  return {
    ok: true,
    state: next,
    data: submission,
    message: 'Proof of Work submitted! Reviewers have been notified.',
  }
}

export function resubmitMissionWork(
  state: ArenaPrototypeState,
  memberId: string,
  submissionId: string,
  summary: string,
  evidenceItems: EvidenceItem[],
): ServiceResult<MissionSubmission> {
  const memberCheck = requireSpartanMember(state, memberId)
  if (!memberCheck.ok) return memberCheck
  const submission = state.submissions.find((s) => s.id === submissionId)
  if (!submission) return { ok: false, error: 'Submission not found.' }
  if (submission.memberId !== memberId) return { ok: false, error: 'Only the submission author can revise it.' }
  if (submission.status !== 'revision_requested') {
    return { ok: false, error: 'Resubmission is only available when revisions are requested.' }
  }
  if (!summary.trim() || evidenceItems.length === 0) {
    return { ok: false, error: 'Updated summary and evidence are required.' }
  }

  const now = nowIso()
  const updated: MissionSubmission = {
    ...submission,
    status: 'submitted',
    version: submission.version + 1,
    summary: summary.trim(),
    evidenceItems,
    revisionHistory: [
      ...submission.revisionHistory,
      {
        version: submission.version,
        summary: submission.summary,
        evidenceItems: submission.evidenceItems,
        submittedAt: submission.updatedAt,
      },
    ],
    updatedAt: now,
  }

  let next: ArenaPrototypeState = {
    ...state,
    submissions: state.submissions.map((s) => (s.id === submissionId ? updated : s)),
  }
  const mission = state.missions.find((m) => m.id === submission.missionId)
  if (mission) {
    for (const revId of mission.assignedReviewerIds) {
      if (revId !== memberId) {
        next = notifyMember(
          next,
          revId,
          'submission',
          `Revised Proof of Work (v${updated.version})`,
          `Updated deliverable submitted for "${mission.title}".`,
          `/missions/${mission.id}`,
        )
      }
    }
  }

  return {
    ok: true,
    state: next,
    data: updated,
    message: `Resubmitted v${updated.version} for review.`,
  }
}

function settleApprovedSubmission(
  state: ArenaPrototypeState,
  reviewerId: string,
  submission: MissionSubmission,
  mission: Mission,
): { ok: true; state: ArenaPrototypeState; payoutXp: number; awardedCp: number } | { ok: false; error: string } {
  const now = nowIso()
  let next = state
  const reward = mission.budget.isFunded ? mission.budget.rewardPerContributorXp : 0
  let payoutXp = 0

  if (reward > 0) {
    if (mission.budget.remainingReservedXp < reward) {
      return { ok: false, error: 'Mission escrow has no remaining reserved XP for another approval.' }
    }

    const transferKey = `submission-settle-transfer-${submission.id}`
    const transferRes = createXpLedgerTransaction(next.xpTransactions, {
      memberId: mission.creatorMemberId,
      amount: reward,
      transactionType: 'transferred',
      sourceType: 'member_funded',
      referenceType: 'submission',
      referenceId: submission.id,
      actorMemberId: reviewerId,
      creatorMemberId: mission.creatorMemberId,
      recipientMemberId: submission.memberId,
      reason: `Settled ${reward} reserved XP for "${mission.title}"`,
      idempotencyKey: transferKey,
      createdAt: now,
    })
    if (!transferRes.ok) return transferRes

    const receiveKey = `submission-settle-receive-${submission.id}`
    const receiveRes = createXpLedgerTransaction(
      transferRes.duplicated ? next.xpTransactions : [...next.xpTransactions, transferRes.transaction],
      {
        memberId: submission.memberId,
        amount: reward,
        transactionType: 'received',
        sourceType: 'member_funded',
        referenceType: 'submission',
        referenceId: submission.id,
        actorMemberId: reviewerId,
        creatorMemberId: mission.creatorMemberId,
        recipientMemberId: submission.memberId,
        reason: `Approved Proof of Work on "${mission.title}"`,
        idempotencyKey: receiveKey,
        createdAt: now,
      },
    )
    if (!receiveRes.ok) return receiveRes

    if (!transferRes.duplicated) {
      next = { ...next, xpTransactions: [...next.xpTransactions, transferRes.transaction] }
    }
    if (!receiveRes.duplicated) {
      next = { ...next, xpTransactions: [...next.xpTransactions, receiveRes.transaction] }
      payoutXp = reward
    }

    const remaining = mission.budget.remainingReservedXp - payoutXp
    const settled = mission.budget.settledXp + payoutXp
    const reachedMax = remaining < reward || settled >= mission.budget.totalReservedXp

    const updatedMission: Mission = {
      ...mission,
      status: reachedMax ? 'completed' : mission.status,
      participationOpen: reachedMax ? false : mission.participationOpen,
      budget: {
        ...mission.budget,
        remainingReservedXp: remaining,
        settledXp: settled,
      },
      updatedAt: now,
    }
    next = {
      ...next,
      missions: next.missions.map((m) => (m.id === mission.id ? updatedMission : m)),
    }
  }

  // ContributionRecord + CP event (strictly idempotent per submission)
  const cpCategory: CPActivityCategory =
    mission.budget.rewardBand === 'major' || mission.budget.rewardBand === 'above_major'
      ? 'mission_major'
      : mission.budget.rewardBand === 'substantial'
        ? 'mission_substantial'
        : mission.budget.rewardBand === 'standard'
          ? 'mission_standard'
          : 'mission_micro'

  const existingRecord = next.contributionRecords.find(
    (cr) => cr.referenceId === submission.id && cr.memberId === submission.memberId,
  )
  const recordId = existingRecord?.id ?? uid('cr')
  if (!existingRecord) {
    const record: ContributionRecord = {
      id: recordId,
      memberId: submission.memberId,
      houseId: mission.houseId,
      sourceKind: 'mission',
      referenceId: submission.id,
      title: mission.title,
      deliverableSummary: submission.summary,
      verifiedByMemberId: reviewerId,
      createdAt: now,
    }
    next = { ...next, contributionRecords: [record, ...next.contributionRecords] }
  }

  const cpCalc = calculateEligibleCp(next.cpEvents, {
    memberId: submission.memberId,
    contributionRecordId: recordId,
    seasonId: next.currentSeason.id,
    houseId: mission.houseId,
    activityCategory: cpCategory,
    baseCpAmount: next.config.cpValues[cpCategory] ?? mission.budget.cpTierValue,
    referenceKey: `cp-submission-${submission.id}`,
    caps: next.config.seasonalCpCaps,
    createdAt: now,
  })
  let awardedCp = 0
  if (cpCalc.event) {
    next = { ...next, cpEvents: [...next.cpEvents, cpCalc.event] }
    awardedCp = cpCalc.event.cpAmount
  }

  next = syncMemberAchievements(next, submission.memberId)
  next = syncMemberAchievements(next, mission.creatorMemberId)

  return { ok: true, state: next, payoutXp, awardedCp }
}

export function reviewSubmission(
  state: ArenaPrototypeState,
  reviewerId: string,
  submissionId: string,
  decision: 'under_review' | 'revision_requested' | 'approved' | 'rejected',
  comment: string,
): ServiceResult<MissionSubmission> {
  const reviewerCheck = requireSpartanMember(state, reviewerId)
  if (!reviewerCheck.ok) return reviewerCheck
  const submission = state.submissions.find((s) => s.id === submissionId)
  if (!submission) return { ok: false, error: 'Submission not found.' }
  const mission = state.missions.find((m) => m.id === submission.missionId)
  if (!mission) return { ok: false, error: 'Mission not found.' }

  // STRICT INVARIANT: Self-review is blocked
  if (submission.memberId === reviewerId) {
    return {
      ok: false,
      error: 'Self-review prohibited: members cannot review or approve their own submission.',
    }
  }

  const isAuthorisedReviewer =
    mission.creatorMemberId === reviewerId ||
    mission.assignedReviewerIds.includes(reviewerId) ||
    memberHasPermission(reviewerId, state.permissionGrants, 'house.manage', mission.houseId) ||
    memberHasPermission(reviewerId, state.permissionGrants, 'mission.review', mission.houseId) ||
    memberHasPermission(reviewerId, state.permissionGrants, 'moderator') ||
    memberHasPermission(reviewerId, state.permissionGrants, 'platform.admin')

  if (!isAuthorisedReviewer) {
    return { ok: false, error: 'You do not have review permission for this House or mission.' }
  }

  if (submission.status === 'approved') {
    return { ok: false, error: 'This submission has already been approved and settled.' }
  }

  const now = nowIso()
  const reviewEvent = {
    id: uid('rev'),
    submissionId,
    reviewerId,
    decision,
    comment: comment.trim() || `Marked ${decision.replace('_', ' ')}.`,
    createdAt: now,
  }

  const updatedSubmission: MissionSubmission = {
    ...submission,
    status: decision,
    reviews: [...submission.reviews, reviewEvent],
    updatedAt: now,
  }

  let next: ArenaPrototypeState = {
    ...state,
    submissions: state.submissions.map((s) => (s.id === submissionId ? updatedSubmission : s)),
  }

  let extraMsg = ''
  if (decision === 'approved') {
    const settlement = settleApprovedSubmission(next, reviewerId, updatedSubmission, mission)
    if (!settlement.ok) return settlement
    next = settlement.state
    extraMsg = ` Settled +${settlement.payoutXp} XP & +${settlement.awardedCp} CP.`
    next = notifyMember(
      next,
      submission.memberId,
      'xp',
      `Approved: +${settlement.payoutXp} XP & +${settlement.awardedCp} CP`,
      `Your Proof of Work for "${mission.title}" was approved!`,
      `/missions/${mission.id}`,
      { isMissionAlert: true },
    )
  } else {
    next = notifyMember(
      next,
      submission.memberId,
      'submission',
      `Submission ${decision.replace('_', ' ')}`,
      `"${mission.title}": ${reviewEvent.comment}`,
      `/missions/${mission.id}`,
    )
  }

  next = appendAudit(next, reviewerId, `submission.${decision}`, 'submission', submissionId, `Reviewed submission ${submissionId} on "${mission.title}": ${decision}.`)

  return {
    ok: true,
    state: next,
    data: updatedSubmission,
    message: `Submission marked ${decision.replace('_', ' ')}.${extraMsg}`,
  }
}

export function openSubmissionDispute(
  state: ArenaPrototypeState,
  memberId: string,
  submissionId: string,
  reason: string,
): ServiceResult<MissionDispute> {
  const memberCheck = requireSpartanMember(state, memberId)
  if (!memberCheck.ok) return memberCheck
  const submission = state.submissions.find((s) => s.id === submissionId)
  if (!submission) return { ok: false, error: 'Submission not found.' }
  if (submission.memberId !== memberId) return { ok: false, error: 'Only the submission author can open a dispute.' }
  if (submission.status !== 'rejected' && submission.status !== 'revision_requested') {
    return { ok: false, error: 'Disputes can only be opened on rejected or revision-requested submissions.' }
  }
  if (!reason.trim()) return { ok: false, error: 'Explain why this decision should be reviewed by Stewards.' }

  const now = nowIso()
  const dispute: MissionDispute = {
    id: uid('disp'),
    missionId: submission.missionId,
    submissionId: submission.id,
    openedByMemberId: memberId,
    reason: reason.trim(),
    preservedEvidenceSnapshot: submission.evidenceItems.map((ev) => ({ ...ev })),
    preservedReviewComments: submission.reviews.map((r) => `${r.decision}: ${r.comment}`),
    status: 'open',
    createdAt: now,
  }

  const updatedSub: MissionSubmission = {
    ...submission,
    status: 'disputed',
    reviews: [
      ...submission.reviews,
      { id: uid('rev'), submissionId, reviewerId: memberId, decision: 'disputed', comment: reason.trim(), createdAt: now },
    ],
    updatedAt: now,
  }

  let next: ArenaPrototypeState = {
    ...state,
    disputes: [dispute, ...state.disputes],
    submissions: state.submissions.map((s) => (s.id === submissionId ? updatedSub : s)),
  }

  const moderators = next.members.filter((m) => memberHasPermission(m.id, next.permissionGrants, 'moderator'))
  for (const mod of moderators) {
    if (mod.id !== memberId) {
      next = notifyMember(next, mod.id, 'submission', 'New Mission Dispute Opened', `Dispute on submission ${submission.id} awaits Steward review.`, '/stewardship')
    }
  }
  next = appendAudit(next, memberId, 'dispute.opened', 'submission', submissionId, `Opened dispute ${dispute.id} with preserved evidence snapshot.`)

  return {
    ok: true,
    state: next,
    data: dispute,
    message: 'Dispute opened. Your evidence and review history have been preserved for Steward review.',
  }
}

export function resolveDispute(
  state: ArenaPrototypeState,
  stewardId: string,
  disputeId: string,
  resolution: 'resolved_upheld' | 'resolved_overturned',
  resolutionNote: string,
): ServiceResult<MissionDispute> {
  const stewardCheck = requireSpartanMember(state, stewardId)
  if (!stewardCheck.ok) return stewardCheck
  const canModerate =
    memberHasPermission(stewardId, state.permissionGrants, 'moderator') ||
    memberHasPermission(stewardId, state.permissionGrants, 'platform.admin')
  if (!canModerate) return { ok: false, error: 'Steward / Moderator permission required to resolve disputes.' }

  const dispute = state.disputes.find((d) => d.id === disputeId)
  if (!dispute) return { ok: false, error: 'Dispute not found.' }
  if (dispute.openedByMemberId === stewardId) {
    return { ok: false, error: 'You cannot resolve your own dispute.' }
  }

  const submission = state.submissions.find((s) => s.id === dispute.submissionId)
  const mission = state.missions.find((m) => m.id === dispute.missionId)
  if (!submission || !mission) return { ok: false, error: 'Related submission or mission missing.' }

  const now = nowIso()
  const updatedDispute: MissionDispute = {
    ...dispute,
    status: resolution,
    resolutionNote: resolutionNote.trim() || 'Reviewed and resolved by Stewardship.',
    resolvedByMemberId: stewardId,
    resolvedAt: now,
  }

  let next: ArenaPrototypeState = {
    ...state,
    disputes: state.disputes.map((d) => (d.id === disputeId ? updatedDispute : d)),
  }

  if (resolution === 'resolved_overturned') {
    const approvedSub: MissionSubmission = {
      ...submission,
      status: 'approved',
      reviews: [
        ...submission.reviews,
        { id: uid('rev'), submissionId: submission.id, reviewerId: stewardId, decision: 'approved', comment: `Dispute overturned: ${updatedDispute.resolutionNote}`, createdAt: now },
      ],
      updatedAt: now,
    }
    next = {
      ...next,
      submissions: next.submissions.map((s) => (s.id === submission.id ? approvedSub : s)),
    }
    const settlement = settleApprovedSubmission(next, stewardId, approvedSub, mission)
    if (!settlement.ok) return settlement
    next = settlement.state
    next = notifyMember(next, submission.memberId, 'xp', 'Dispute Resolved in Your Favour', `Stewardship overturned rejection on "${mission.title}" (+${settlement.payoutXp} XP, +${settlement.awardedCp} CP).`, `/missions/${mission.id}`, { isMissionAlert: true })
  } else {
    const upheldSub: MissionSubmission = {
      ...submission,
      status: 'rejected',
      updatedAt: now,
    }
    next = {
      ...next,
      submissions: next.submissions.map((s) => (s.id === submission.id ? upheldSub : s)),
    }
    next = notifyMember(next, submission.memberId, 'submission', 'Dispute Upheld', `Original decision upheld on "${mission.title}": ${updatedDispute.resolutionNote}`, `/missions/${mission.id}`)
  }

  next = appendAudit(next, stewardId, `dispute.${resolution}`, 'dispute', disputeId, `Resolved dispute ${disputeId} (${resolution}).`)

  return {
    ok: true,
    state: next,
    data: updatedDispute,
    message: resolution === 'resolved_overturned'
      ? 'Dispute overturned — submission approved and XP/CP settled.'
      : 'Dispute upheld — original review decision retained.',
  }
}

export function reportMission(
  state: ArenaPrototypeState,
  reporterId: string,
  missionId: string,
  reason: string,
): ServiceResult<null> {
  const reporterCheck = requireSpartanMember(state, reporterId)
  if (!reporterCheck.ok) return reporterCheck
  const mission = state.missions.find((m) => m.id === missionId)
  if (!mission) return { ok: false, error: 'Mission not found.' }
  if (!reason.trim()) return { ok: false, error: 'Provide a reason for flagging this mission.' }

  let next = appendAudit(state, reporterId, 'mission.flagged', 'mission', missionId, `Flagged "${mission.title}": ${reason.trim()}`)
  const mods = next.members.filter((m) => memberHasPermission(m.id, next.permissionGrants, 'moderator'))
  for (const mod of mods) {
    next = notifyMember(next, mod.id, 'announcement', 'Mission Flagged for Review', `"${mission.title}" flagged: ${reason.trim()}`, '/stewardship')
  }
  return { ok: true, state: next, data: null, message: 'Mission reported to Stewardship moderators.' }
}

// ---------------------------------------------------------------------------
// 4. Academy Learning Progression & Assessments
// ---------------------------------------------------------------------------

export function completeAcademyLesson(
  state: ArenaPrototypeState,
  memberId: string,
  lessonId: string,
  selectedOptionIndex: number,
): ServiceResult<{ xpAwarded: number; cpAwarded: number; unlockedModules: string[]; unlockedPaths: string[] }> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to record learning progress.')
  if (!memberCheck.ok) return memberCheck
  const member = memberCheck.member

  let targetPath = state.academyPaths[0]
  let targetModule = state.academyPaths[0]?.modules[0]
  let targetLesson = state.academyPaths[0]?.modules[0]?.lessons[0]
  let found = false

  for (const path of state.academyPaths) {
    for (const mod of path.modules) {
      const lesson = mod.lessons.find((l) => l.id === lessonId)
      if (lesson) {
        targetPath = path
        targetModule = mod
        targetLesson = lesson
        found = true
        break
      }
    }
    if (found) break
  }

  if (!found || !targetLesson || !targetModule || !targetPath) {
    return { ok: false, error: 'Lesson not found.' }
  }

  if (selectedOptionIndex !== targetLesson.correctOptionIndex) {
    return { ok: false, error: 'Not quite right — review the lesson summary and try another answer on the knowledge check.' }
  }

  const already = state.learningCompletions.some((lc) => lc.memberId === memberId && lc.itemType === 'lesson' && lc.itemId === lessonId)
  if (already) {
    return {
      ok: true,
      state,
      data: { xpAwarded: 0, cpAwarded: 0, unlockedModules: [], unlockedPaths: [] },
      message: 'Knowledge check passed (lesson already completed earlier—no duplicate XP awarded).',
    }
  }

  const now = nowIso()
  const houseId: HouseId = targetModule.houseId ?? targetPath.houseId ?? member.primaryHouseId ?? 'scribes'
  let next: ArenaPrototypeState = {
    ...state,
    learningCompletions: [
      ...state.learningCompletions,
      { id: uid('lc'), memberId, itemType: 'lesson', itemId: lessonId, completedAt: now },
    ],
    members: state.members.map((m) => {
      if (m.id !== memberId) return m
      const nextChecklist = { ...m.onboardingChecklist, academyStarted: true }
      return {
        ...m,
        onboardingChecklist: nextChecklist,
        onboardingStage: isOnboardingComplete(nextChecklist) ? 'completed' : m.onboardingStage,
      }
    }),
  }

  let totalXp = 0
  let totalCp = 0

  const grantLearningItem = (
    itemId: string,
    title: string,
    xpAmount: number,
    cpCategory: CPActivityCategory,
  ) => {
    const txRes = createXpLedgerTransaction(next.xpTransactions, {
      memberId,
      amount: xpAmount,
      transactionType: 'earned',
      sourceType: 'system',
      referenceType: 'academy',
      referenceId: itemId,
      actorMemberId: 'system',
      reason: `Academy completion: ${title}`,
      idempotencyKey: `academy-xp-${memberId}-${itemId}`,
      createdAt: now,
    })
    if (txRes.ok && !txRes.duplicated) {
      next = { ...next, xpTransactions: [...next.xpTransactions, txRes.transaction] }
      totalXp += xpAmount
    }
    const recId = uid('cr')
    next = {
      ...next,
      contributionRecords: [
        {
          id: recId,
          memberId,
          houseId,
          sourceKind: 'academy',
          referenceId: itemId,
          title,
          deliverableSummary: `Completed ${title}`,
          verifiedByMemberId: 'system',
          createdAt: now,
        },
        ...next.contributionRecords,
      ],
    }
    const cpRes = calculateEligibleCp(next.cpEvents, {
      memberId,
      contributionRecordId: recId,
      seasonId: next.currentSeason.id,
      houseId,
      activityCategory: cpCategory,
      baseCpAmount: next.config.cpValues[cpCategory],
      referenceKey: `academy-cp-${memberId}-${itemId}`,
      caps: next.config.seasonalCpCaps,
      createdAt: now,
    })
    if (cpRes.event) {
      next = { ...next, cpEvents: [...next.cpEvents, cpRes.event] }
      totalCp += cpRes.event.cpAmount
    }
  }

  grantLearningItem(lessonId, targetLesson.title, next.config.systemXpValues.academyLesson, 'academy_lesson')

  const unlockedModules: string[] = []
  const unlockedPaths: string[] = []

  const allLessonsDone = targetModule.lessons.every((l) =>
    next.learningCompletions.some((lc) => lc.memberId === memberId && lc.itemType === 'lesson' && lc.itemId === l.id),
  )
  const moduleAlreadyDone = next.learningCompletions.some(
    (lc) => lc.memberId === memberId && lc.itemType === 'module' && lc.itemId === targetModule.id,
  )
  if (allLessonsDone && !moduleAlreadyDone) {
    next = {
      ...next,
      learningCompletions: [
        ...next.learningCompletions,
        { id: uid('lc'), memberId, itemType: 'module', itemId: targetModule.id, completedAt: now },
      ],
    }
    grantLearningItem(targetModule.id, targetModule.title, next.config.systemXpValues.academyModule, 'academy_module')
    unlockedModules.push(targetModule.title)
  }

  const allModulesDone = targetPath.modules.every((m) =>
    next.learningCompletions.some((lc) => lc.memberId === memberId && lc.itemType === 'module' && lc.itemId === m.id),
  )
  const pathAlreadyDone = next.learningCompletions.some(
    (lc) => lc.memberId === memberId && lc.itemType === 'path' && lc.itemId === targetPath.id,
  )
  if (allModulesDone && !pathAlreadyDone) {
    next = {
      ...next,
      learningCompletions: [
        ...next.learningCompletions,
        { id: uid('lc'), memberId, itemType: 'path', itemId: targetPath.id, completedAt: now },
      ],
    }
    grantLearningItem(targetPath.id, targetPath.title, next.config.systemXpValues.learningPath, 'academy_path')
    unlockedPaths.push(targetPath.title)
  }

  next = syncMemberAchievements(next, memberId)

  return {
    ok: true,
    state: next,
    data: { xpAwarded: totalXp, cpAwarded: totalCp, unlockedModules, unlockedPaths },
    message: `Lesson passed (+${totalXp} XP, +${totalCp} CP)${unlockedPaths.length ? ' · Full Path Completed!' : unlockedModules.length ? ' · Module Completed!' : ''}`,
  }
}

export function submitPracticalAssessment(
  state: ArenaPrototypeState,
  memberId: string,
  assessmentId: string,
  responseText: string,
): ServiceResult<{ xpAwarded: number; cpAwarded: number }> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to submit an assessment.')
  if (!memberCheck.ok) return memberCheck
  const member = memberCheck.member
  if (responseText.trim().length < 20) {
    return { ok: false, error: 'Write at least 20 characters for your practical assessment response.' }
  }

  const path = state.academyPaths.find((p) => p.assessment?.id === assessmentId)
  const assessment = path?.assessment
  if (!path || !assessment) return { ok: false, error: 'Assessment not found.' }

  const already = state.learningCompletions.some(
    (lc) => lc.memberId === memberId && lc.itemType === 'assessment' && lc.itemId === assessmentId,
  )
  if (already) {
    return { ok: false, error: 'You have already completed this practical assessment.' }
  }

  const now = nowIso()
  const houseId: HouseId = path.houseId ?? member.primaryHouseId ?? 'scribes'
  let next: ArenaPrototypeState = {
    ...state,
    learningCompletions: [
      ...state.learningCompletions,
      { id: uid('lc'), memberId, itemType: 'assessment', itemId: assessmentId, scoreNote: responseText.trim(), completedAt: now },
    ],
  }

  const txRes = createXpLedgerTransaction(next.xpTransactions, {
    memberId,
    amount: assessment.xpReward,
    transactionType: 'earned',
    sourceType: 'system',
    referenceType: 'academy',
    referenceId: assessmentId,
    actorMemberId: 'system',
    reason: `Practical Assessment Passed: ${assessment.title}`,
    idempotencyKey: `assessment-xp-${memberId}-${assessmentId}`,
    createdAt: now,
  })
  if (txRes.ok && !txRes.duplicated) {
    next = { ...next, xpTransactions: [...next.xpTransactions, txRes.transaction] }
  }

  const recId = uid('cr')
  next = {
    ...next,
    contributionRecords: [
      {
        id: recId,
        memberId,
        houseId,
        sourceKind: 'academy',
        referenceId: assessmentId,
        title: assessment.title,
        deliverableSummary: responseText.trim(),
        verifiedByMemberId: 'system',
        createdAt: now,
      },
      ...next.contributionRecords,
    ],
  }

  const cpRes = calculateEligibleCp(next.cpEvents, {
    memberId,
    contributionRecordId: recId,
    seasonId: next.currentSeason.id,
    houseId,
    activityCategory: 'practical_assessment',
    baseCpAmount: assessment.cpReward,
    referenceKey: `assessment-cp-${memberId}-${assessmentId}`,
    caps: next.config.seasonalCpCaps,
    createdAt: now,
  })
  const cpAwarded = cpRes.event?.cpAmount ?? 0
  if (cpRes.event) {
    next = { ...next, cpEvents: [...next.cpEvents, cpRes.event] }
  }

  next = syncMemberAchievements(next, memberId)
  return {
    ok: true,
    state: next,
    data: { xpAwarded: assessment.xpReward, cpAwarded },
    message: `Practical assessment verified (+${assessment.xpReward} XP, +${cpAwarded} CP).`,
  }
}

// ---------------------------------------------------------------------------
// 5. Events, RSVPs, Attendance & Role Attribution
// ---------------------------------------------------------------------------

export function rsvpEvent(
  state: ArenaPrototypeState,
  memberId: string,
  eventId: string,
  role: EventAttendanceRole = 'attendee',
): ServiceResult<null> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to RSVP for events.')
  if (!memberCheck.ok) return memberCheck
  const event = state.events.find((e) => e.id === eventId)
  if (!event) return { ok: false, error: 'Event not found.' }
  if (event.isPast) return { ok: false, error: 'RSVP is closed for past events.' }

  const activeRsvps = state.eventParticipations.filter((ep) => ep.eventId === eventId && ep.status !== 'cancelled').length
  const existing = state.eventParticipations.find((ep) => ep.eventId === eventId && ep.memberId === memberId && ep.status !== 'cancelled')
  if (existing) {
    if (existing.status === 'attended') {
      return { ok: false, error: 'Attendance for this event has already been verified.' }
    }
    // Cancel RSVP
    return {
      ok: true,
      state: {
        ...state,
        eventParticipations: state.eventParticipations.map((ep) =>
          ep.id === existing.id ? { ...ep, status: 'cancelled' } : ep,
        ),
      },
      data: null,
      message: 'Event RSVP cancelled.',
    }
  }
  if (activeRsvps >= event.capacity) {
    return { ok: false, error: 'This event is currently at capacity.' }
  }

  return {
    ok: true,
    state: {
      ...state,
      eventParticipations: [
        ...state.eventParticipations,
        {
          id: uid('ep'),
          eventId,
          memberId,
          role,
          status: 'registered',
          registeredAt: nowIso(),
        },
      ],
    },
    data: null,
    message: `Registered for "${event.title}".`,
  }
}

export function recordEventAttendanceOrRole(
  state: ArenaPrototypeState,
  actorId: string,
  eventId: string,
  memberId: string,
  role: EventAttendanceRole,
): ServiceResult<{ xpAwarded: number; cpAwarded: number; cappedOut: boolean }> {
  const actorCheck = requireSpartanMember(state, actorId)
  if (!actorCheck.ok) return actorCheck
  const event = state.events.find((e) => e.id === eventId)
  const member = state.members.find((m) => m.id === memberId)
  if (!event || !member) return { ok: false, error: 'Event or member not found.' }
  if (event.isPast) return { ok: false, error: 'Cannot verify attendance or roles for past events.' }

  const canVerifyEvent =
    memberHasPermission(actorId, state.permissionGrants, 'event.manage', event.houseId ?? undefined) ||
    (event.houseId ? memberHasPermission(actorId, state.permissionGrants, 'house.manage', event.houseId) : false) ||
    memberHasPermission(actorId, state.permissionGrants, 'moderator') ||
    memberHasPermission(actorId, state.permissionGrants, 'platform.admin')

  if (!canVerifyEvent) {
    return {
      ok: false,
      error: 'Only authorised Event Managers, House Strategoi, or Stewards can verify event attendance and roles.',
    }
  }

  const now = nowIso()
  const existing = state.eventParticipations.find((ep) => ep.eventId === eventId && ep.memberId === memberId)
  let next: ArenaPrototypeState = {
    ...state,
    eventParticipations: existing
      ? state.eventParticipations.map((ep) => (ep.id === existing.id ? { ...ep, role, status: 'attended', attendedAt: now } : ep))
      : [...state.eventParticipations, { id: uid('ep'), eventId, memberId, role, status: 'attended', registeredAt: now, attendedAt: now }],
  }

  const xpAmount =
    role === 'host'
      ? next.config.systemXpValues.eventHostDefault
      : role === 'support'
        ? next.config.systemXpValues.eventSupportDefault
        : next.config.systemXpValues.eventAttendance

  const cpCategory: CPActivityCategory =
    role === 'host' ? 'event_hosting' : role === 'support' ? 'event_support' : 'event_attendance'

  const txRes = createXpLedgerTransaction(next.xpTransactions, {
    memberId,
    amount: xpAmount,
    transactionType: 'earned',
    sourceType: 'system',
    referenceType: 'event',
    referenceId: eventId,
    actorMemberId: actorId,
    reason: `Event ${role} verified: "${event.title}"`,
    idempotencyKey: `event-xp-${eventId}-${memberId}-${role}`,
    createdAt: now,
  })
  const xpAwarded = txRes.ok && !txRes.duplicated ? xpAmount : 0
  if (txRes.ok && !txRes.duplicated) {
    next = { ...next, xpTransactions: [...next.xpTransactions, txRes.transaction] }
  }

  const houseId: HouseId = event.houseId ?? member.primaryHouseId ?? 'heralds'
  const recId = uid('cr')
  next = {
    ...next,
    contributionRecords: [
      {
        id: recId,
        memberId,
        houseId,
        sourceKind: 'event',
        referenceId: eventId,
        title: `${event.title} (${role})`,
        deliverableSummary: `Verified ${role} participation`,
        verifiedByMemberId: actorId,
        createdAt: now,
      },
      ...next.contributionRecords,
    ],
  }

  const cpRes = calculateEligibleCp(next.cpEvents, {
    memberId,
    contributionRecordId: recId,
    seasonId: next.currentSeason.id,
    houseId,
    activityCategory: cpCategory,
    baseCpAmount: next.config.cpValues[cpCategory],
    referenceKey: `event-cp-${eventId}-${memberId}-${role}`,
    caps: next.config.seasonalCpCaps,
    createdAt: now,
  })
  const cpAwarded = cpRes.event?.cpAmount ?? 0
  if (cpRes.event) {
    next = { ...next, cpEvents: [...next.cpEvents, cpRes.event] }
  }

  next = syncMemberAchievements(next, memberId)

  return {
    ok: true,
    state: next,
    data: { xpAwarded, cpAwarded, cappedOut: cpRes.cappedOut },
    message: cpRes.cappedOut
      ? `Event ${role} recorded (+${xpAwarded} XP; seasonal attendance CP cap reached).`
      : `Event ${role} verified (+${xpAwarded} XP, +${cpAwarded} CP).`,
  }
}

export function proposeEvent(
  state: ArenaPrototypeState,
  hostMemberId: string,
  input: Omit<ArenaEvent, 'id' | 'hostMemberId' | 'isPast'>,
): ServiceResult<ArenaEvent> {
  const hostCheck = requireSpartanMember(state, hostMemberId, 'Sign in as a Spartan to propose an event.')
  if (!hostCheck.ok) return hostCheck
  if (!input.title.trim()) return { ok: false, error: 'Event title is required.' }
  const event: ArenaEvent = {
    ...input,
    id: uid('evt'),
    hostMemberId,
    isPast: false,
  }
  let next: ArenaPrototypeState = {
    ...state,
    events: [event, ...state.events],
    eventParticipations: [
      ...state.eventParticipations,
      { id: uid('ep'), eventId: event.id, memberId: hostMemberId, role: 'host', status: 'registered', registeredAt: nowIso() },
    ],
  }
  next = appendAudit(next, hostMemberId, 'event.created', 'event', event.id, `Scheduled event "${event.title}".`)
  return { ok: true, state: next, data: event, message: `Event "${event.title}" published.` }
}

// ---------------------------------------------------------------------------
// 6. Explore Creation, Bookmarking & Service Commissioning
// ---------------------------------------------------------------------------

export function toggleBookmark(
  state: ArenaPrototypeState,
  memberId: string,
  targetType: 'mission' | 'opportunity' | 'project' | 'resource' | 'event',
  targetId: string,
): ServiceResult<boolean> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to save bookmarks.')
  if (!memberCheck.ok) return memberCheck
  const exists = state.savedBookmarks.some(
    (b) => b.memberId === memberId && b.targetType === targetType && b.targetId === targetId,
  )
  const savedBookmarks = exists
    ? state.savedBookmarks.filter((b) => !(b.memberId === memberId && b.targetType === targetType && b.targetId === targetId))
    : [...state.savedBookmarks, { memberId, targetType, targetId, savedAt: nowIso() }]
  return {
    ok: true,
    state: { ...state, savedBookmarks },
    data: !exists,
    message: exists ? 'Removed from Saved.' : 'Saved to My Activity.',
  }
}

export function addExploreProject(
  state: ArenaPrototypeState,
  memberId: string,
  input: Omit<ExploreProject, 'id' | 'ownerMemberId' | 'createdAt'>,
): ServiceResult<ExploreProject> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to add a project.')
  if (!memberCheck.ok) return memberCheck
  if (!input.title.trim()) return { ok: false, error: 'Project title is required.' }
  const project: ExploreProject = {
    ...input,
    id: uid('proj'),
    ownerMemberId: memberId,
    createdAt: nowIso(),
  }
  return {
    ok: true,
    state: { ...state, projects: [project, ...state.projects] },
    data: project,
    message: `Project "${project.title}" added to Explore & your Portfolio.`,
  }
}

export function addExploreService(
  state: ArenaPrototypeState,
  memberId: string,
  input: Omit<ExploreService, 'id' | 'providerMemberId' | 'createdAt'>,
): ServiceResult<ExploreService> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to publish a service.')
  if (!memberCheck.ok) return memberCheck
  if (!input.title.trim()) return { ok: false, error: 'Service title is required.' }
  const service: ExploreService = {
    ...input,
    id: uid('srv'),
    providerMemberId: memberId,
    createdAt: nowIso(),
  }
  return {
    ok: true,
    state: { ...state, services: [service, ...state.services] },
    data: service,
    message: `Service "${service.title}" published.`,
  }
}

export function commissionServiceAsMission(
  state: ArenaPrototypeState,
  clientMemberId: string,
  serviceId: string,
  customBrief: string,
  xpReward: number,
): ServiceResult<Mission> {
  const clientCheck = requireSpartanMember(state, clientMemberId, 'Sign in as a Spartan to commission a service.')
  if (!clientCheck.ok) return clientCheck
  const service = state.services.find((s) => s.id === serviceId)
  if (!service) return { ok: false, error: 'Service not found.' }
  if (service.providerMemberId === clientMemberId) {
    return { ok: false, error: 'You cannot commission your own service listing.' }
  }
  const provider = state.members.find((m) => m.id === service.providerMemberId)

  // Temporarily allow commissioning if client has Spendable XP + mission.create OR if client is Spartan commissioning a service
  const hasCreate = memberHasPermission(clientMemberId, state.permissionGrants, 'mission.create')
  const tempState = hasCreate
    ? state
    : {
        ...state,
        permissionGrants: [
          ...state.permissionGrants,
          { id: uid('pg'), memberId: clientMemberId, scope: 'mission.create' as const, grantedBy: 'system', grantedAt: nowIso() },
        ],
      }

  const res = createMission(tempState, clientMemberId, {
    title: `Service Commission: ${service.title}`,
    description: customBrief.trim() || service.description,
    objective: `Commissioned deliverable from ${provider?.displayName ?? 'Arena Specialist'}: ${service.title}`,
    instructions: `Deliver agreed scope with ${provider?.displayName ?? 'provider'} and attach Proof of Work.`,
    steps: ['Confirm scope & milestone checklist', 'Deliver service output', 'Submit Proof of Work for review'],
    deliverables: [service.categoryLabel, 'Verified summary & artefact link'],
    restrictions: ['Follow Arena verification criteria'],
    category: 'Collaboration',
    tags: ['Service Commission', ...service.tags.slice(0, 2)],
    houseId: service.houseId,
    crossHouseEligible: false,
    participationFormat: 'application',
    eligibilityNote: `Commissioned for ${provider?.displayName ?? 'provider'}`,
    capacity: 1,
    difficulty: 'Intermediate',
    platformContext: 'Arena Service Commission',
    locationContext: 'Remote',
    requiredEvidenceTypes: ['text', 'links', 'files'],
    submissionInstructions: 'Attach completed service deliverable and summary.',
    verificationCriteria: 'Meets commissioned brief requirements.',
    startDate: nowIso().slice(0, 10),
    deadline: '2026-12-31',
    rewardPerContributorXp: xpReward,
    maxContributors: 1,
    isFunded: true,
    publishNow: true,
  })

  if (!res.ok) return res
  // Strip temporary permission if we added one
  const finalState = hasCreate
    ? res.state
    : { ...res.state, permissionGrants: state.permissionGrants }

  const notified = notifyMember(
    finalState,
    service.providerMemberId,
    'mission',
    'Your service was commissioned!',
    `New funded mission "${res.data.title}" (${xpReward} XP) is live.`,
    `/missions/${res.data.id}`,
  )
  return {
    ok: true,
    state: notified,
    data: res.data,
    message: `Commissioned "${service.title}" as funded Mission (${xpReward} XP reserved).`,
  }
}

export function addExploreResource(
  state: ArenaPrototypeState,
  memberId: string,
  input: Omit<ExploreResource, 'id' | 'authorMemberId' | 'createdAt'>,
): ServiceResult<ExploreResource> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to publish a resource.')
  if (!memberCheck.ok) return memberCheck
  if (!input.title.trim()) return { ok: false, error: 'Resource title is required.' }
  const resource: ExploreResource = {
    ...input,
    id: uid('res'),
    authorMemberId: memberId,
    createdAt: nowIso(),
  }
  return {
    ok: true,
    state: { ...state, resources: [resource, ...state.resources] },
    data: resource,
    message: `Published resource "${resource.title}".`,
  }
}

export function addExploreOpportunity(
  state: ArenaPrototypeState,
  memberId: string,
  input: Omit<ExploreOpportunity, 'id' | 'postedByMemberId' | 'createdAt'>,
): ServiceResult<ExploreOpportunity> {
  const memberCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to publish an opportunity.')
  if (!memberCheck.ok) return memberCheck
  if (!input.title.trim()) return { ok: false, error: 'Opportunity title is required.' }
  const opp: ExploreOpportunity = {
    ...input,
    id: uid('opp'),
    postedByMemberId: memberId,
    createdAt: nowIso(),
  }
  return {
    ok: true,
    state: { ...state, opportunities: [opp, ...state.opportunities] },
    data: opp,
    message: `Published opportunity "${opp.title}".`,
  }
}

export function createDiscussion(
  state: ArenaPrototypeState,
  memberId: string,
  input: { title: string; topicTag: string; houseId: HouseId | null; body: string },
): ServiceResult<ExploreDiscussion> {
  const member = state.members.find((m) => m.id === memberId)
  if (!member) return { ok: false, error: 'Sign in to start a discussion.' }
  if (member.membershipStatus !== 'spartan') {
    return { ok: false, error: 'Only Spartan members can start discussions.' }
  }

  const balance = deriveXpBalance(memberId, state.xpTransactions)
  const levelInfo = calculateLevelProgress(balance.lifetimeXp, state.config.levelThresholds)
  if (levelInfo.level < DISCUSSION_UNLOCK_LEVEL) {
    return {
      ok: false,
      error: `Discussion creation unlocks at Level ${DISCUSSION_UNLOCK_LEVEL}. Your account is currently Level ${levelInfo.level}.`,
    }
  }

  if (!input.title.trim() || !input.body.trim()) return { ok: false, error: 'Title and message are required.' }
  const disc: ExploreDiscussion = {
    id: uid('disc'),
    title: input.title.trim(),
    topicTag: input.topicTag.trim() || 'Community',
    houseId: input.houseId,
    authorMemberId: memberId,
    body: input.body.trim(),
    replies: [],
    createdAt: nowIso(),
  }
  return {
    ok: true,
    state: { ...state, discussions: [disc, ...state.discussions] },
    data: disc,
    message: 'Discussion posted.',
  }
}

export function addDiscussionReply(
  state: ArenaPrototypeState,
  memberId: string,
  discussionId: string,
  body: string,
): ServiceResult<ExploreDiscussion> {
  const member = state.members.find((m) => m.id === memberId)
  if (!member) return { ok: false, error: 'Sign in to reply to discussions.' }
  if (member.membershipStatus !== 'spartan') {
    return { ok: false, error: 'Only Spartan members can reply to discussions.' }
  }
  if (!body.trim()) return { ok: false, error: 'Reply cannot be empty.' }
  const disc = state.discussions.find((d) => d.id === discussionId)
  if (!disc) return { ok: false, error: 'Discussion not found.' }
  const updated: ExploreDiscussion = {
    ...disc,
    replies: [...disc.replies, { id: uid('rep'), authorMemberId: memberId, body: body.trim(), createdAt: nowIso() }],
  }
  return {
    ok: true,
    state: { ...state, discussions: state.discussions.map((d) => (d.id === discussionId ? updated : d)) },
    data: updated,
    message: 'Reply posted.',
  }
}

// ---------------------------------------------------------------------------
// 7. Stewardship, Mentorship & Control Room Administration
// ---------------------------------------------------------------------------

export function verifyMentorshipSession(
  state: ArenaPrototypeState,
  stewardId: string,
  sessionId: string,
): ServiceResult<{ xpAwarded: number; mentorCp: number; cappedOut: boolean }> {
  const stewardCheck = requireSpartanMember(state, stewardId)
  if (!stewardCheck.ok) return stewardCheck
  const canVerify =
    memberHasPermission(stewardId, state.permissionGrants, 'mentor.manage') ||
    memberHasPermission(stewardId, state.permissionGrants, 'platform.admin')
  if (!canVerify) return { ok: false, error: 'Stewardship Mentor permission required to verify sessions.' }

  const session = state.mentorshipSessions.find((s) => s.id === sessionId)
  if (!session) return { ok: false, error: 'Mentorship session not found.' }
  if (session.status === 'verified') return { ok: false, error: 'Session already verified.' }

  const now = nowIso()
  let next: ArenaPrototypeState = {
    ...state,
    mentorshipSessions: state.mentorshipSessions.map((s) =>
      s.id === sessionId ? { ...s, status: 'verified', verifiedByMemberId: stewardId } : s,
    ),
  }

  const xpAmount = next.config.systemXpValues.mentorshipSession
  const txRes = createXpLedgerTransaction(next.xpTransactions, {
    memberId: session.mentorMemberId,
    amount: xpAmount,
    transactionType: 'earned',
    sourceType: 'system',
    referenceType: 'mentorship',
    referenceId: sessionId,
    actorMemberId: stewardId,
    reason: `Verified mentorship session: "${session.topic}"`,
    idempotencyKey: `mentorship-xp-${sessionId}`,
    createdAt: now,
  })
  if (txRes.ok && !txRes.duplicated) {
    next = { ...next, xpTransactions: [...next.xpTransactions, txRes.transaction] }
  }

  const recId = uid('cr')
  next = {
    ...next,
    contributionRecords: [
      {
        id: recId,
        memberId: session.mentorMemberId,
        houseId: session.houseId,
        sourceKind: 'mentorship',
        referenceId: sessionId,
        title: `Mentorship: ${session.topic}`,
        deliverableSummary: session.summary,
        verifiedByMemberId: stewardId,
        createdAt: now,
      },
      ...next.contributionRecords,
    ],
  }

  const cpRes = calculateEligibleCp(next.cpEvents, {
    memberId: session.mentorMemberId,
    contributionRecordId: recId,
    seasonId: next.currentSeason.id,
    houseId: session.houseId,
    activityCategory: 'mentorship',
    baseCpAmount: next.config.cpValues.mentorship,
    partnerMemberId: session.menteeMemberId,
    referenceKey: `mentorship-cp-${sessionId}`,
    caps: next.config.seasonalCpCaps,
    createdAt: now,
  })
  const mentorCp = cpRes.event?.cpAmount ?? 0
  if (cpRes.event) {
    next = { ...next, cpEvents: [...next.cpEvents, cpRes.event] }
  }

  next = syncMemberAchievements(next, session.mentorMemberId)
  next = syncMemberAchievements(next, session.menteeMemberId)
  next = appendAudit(next, stewardId, 'mentorship.verified', 'mentorship', sessionId, `Verified mentorship session "${session.topic}" (+${xpAmount} XP, +${mentorCp} CP).`)

  return {
    ok: true,
    state: next,
    data: { xpAwarded: xpAmount, mentorCp, cappedOut: cpRes.cappedOut },
    message: cpRes.cappedOut
      ? `Session verified (+${xpAmount} XP; pair seasonal CP cap reached).`
      : `Session verified (+${xpAmount} XP, +${mentorCp} CP).`,
  }
}

export function logMentorshipSession(
  state: ArenaPrototypeState,
  mentorId: string,
  menteeMemberId: string,
  houseId: HouseId,
  topic: string,
  summary: string,
): ServiceResult<ArenaPrototypeState['mentorshipSessions'][number]> {
  const mentorCheck = requireSpartanMember(state, mentorId)
  if (!mentorCheck.ok) return mentorCheck
  if (mentorId === menteeMemberId) return { ok: false, error: 'Mentor and mentee must be different members.' }
  if (!topic.trim()) return { ok: false, error: 'Mentorship topic is required.' }
  const session: ArenaPrototypeState['mentorshipSessions'][number] = {
    id: uid('ment'),
    mentorMemberId: mentorId,
    menteeMemberId,
    houseId,
    topic: topic.trim(),
    summary: summary.trim() || '1:1 contributor guidance session.',
    status: 'scheduled',
    createdAt: nowIso(),
  }
  return {
    ok: true,
    state: { ...state, mentorshipSessions: [session, ...state.mentorshipSessions] },
    data: session,
    message: 'Mentorship session logged and queued for Elder verification.',
  }
}

export function adminAdjustXp(
  state: ArenaPrototypeState,
  adminId: string,
  targetMemberId: string,
  deltaAmount: number,
  reason: string,
): ServiceResult<null> {
  const adminCheck = requireSpartanMember(state, adminId)
  if (!adminCheck.ok) return adminCheck
  const canFinance =
    memberHasPermission(adminId, state.permissionGrants, 'finance.admin') ||
    memberHasPermission(adminId, state.permissionGrants, 'platform.admin')
  if (!canFinance) return { ok: false, error: 'Finance or Platform Admin permission required.' }
  if (!reason.trim()) return { ok: false, error: 'Provide an audit reason for XP adjustment.' }
  if (deltaAmount === 0) return { ok: false, error: 'Adjustment amount cannot be zero.' }

  const txRes = createXpLedgerTransaction(state.xpTransactions, {
    memberId: targetMemberId,
    amount: Math.round(deltaAmount),
    transactionType: 'adjustment',
    sourceType: 'admin',
    referenceType: 'admin',
    referenceId: uid('adj'),
    actorMemberId: adminId,
    reason: reason.trim(),
    idempotencyKey: `admin-adj-${uid('k')}`,
  })
  if (!txRes.ok) return txRes

  let next: ArenaPrototypeState = {
    ...state,
    xpTransactions: [...state.xpTransactions, txRes.transaction],
  }
  const bal = deriveXpBalance(targetMemberId, next.xpTransactions)
  next = notifyMember(
    next,
    targetMemberId,
    'xp',
    'Control Room XP Adjustment',
    `${deltaAmount > 0 ? `+${deltaAmount}` : deltaAmount} Spendable XP: ${reason.trim()} (Available: ${bal.spendableXp} XP).`,
    '/activity',
  )
  next = appendAudit(next, adminId, 'xp.adjusted', 'member', targetMemberId, `Adjusted XP by ${deltaAmount} (${reason.trim()}).`)
  return { ok: true, state: next, data: null, message: `XP ledger adjusted (${deltaAmount > 0 ? `+${deltaAmount}` : deltaAmount} XP).` }
}

export function grantOrRevokePermission(
  state: ArenaPrototypeState,
  adminId: string,
  targetMemberId: string,
  scope: PermissionScope,
  houseId?: HouseId,
): ServiceResult<{ granted: boolean }> {
  const adminCheck = requireSpartanMember(state, adminId)
  if (!adminCheck.ok) return adminCheck
  if (!memberHasPermission(adminId, state.permissionGrants, 'platform.admin')) {
    return { ok: false, error: 'Control Room Admin permission required.' }
  }
  const existing = state.permissionGrants.find(
    (g) => g.memberId === targetMemberId && g.scope === scope && (g.houseId ?? undefined) === (houseId || undefined),
  )

  let next: ArenaPrototypeState
  if (existing) {
    next = {
      ...state,
      permissionGrants: state.permissionGrants.filter((g) => g.id !== existing.id),
    }
    next = appendAudit(next, adminId, 'permission.revoked', 'member', targetMemberId, `Revoked ${scope}${houseId ? ` (${houseId})` : ''}.`)
    return { ok: true, state: next, data: { granted: false }, message: `Revoked ${scope}.` }
  } else {
    next = {
      ...state,
      permissionGrants: [
        ...state.permissionGrants,
        {
          id: uid('pg'),
          memberId: targetMemberId,
          scope,
          houseId: houseId || undefined,
          grantedBy: adminId,
          grantedAt: nowIso(),
        },
      ],
    }
    next = appendAudit(next, adminId, 'permission.granted', 'member', targetMemberId, `Granted ${scope}${houseId ? ` (${houseId})` : ''}.`)
    return { ok: true, state: next, data: { granted: true }, message: `Granted ${scope}.` }
  }
}

export function appointAscendancy(
  state: ArenaPrototypeState,
  adminId: string,
  targetMemberId: string,
  rank: AscendancyRank,
  note: string,
): ServiceResult<MemberProfile> {
  const adminCheck = requireSpartanMember(state, adminId)
  if (!adminCheck.ok) return adminCheck
  if (!memberHasPermission(adminId, state.permissionGrants, 'platform.admin')) {
    return { ok: false, error: 'Only Control Room Admins can appoint Ascendancy ranks.' }
  }
  const member = state.members.find((m) => m.id === targetMemberId)
  if (!member) return { ok: false, error: 'Member not found.' }

  const updated: MemberProfile = { ...member, ascendancyRank: rank }
  let next: ArenaPrototypeState = {
    ...state,
    members: state.members.map((m) => (m.id === targetMemberId ? updated : m)),
    ascendancyHistory: [
      {
        id: uid('asc'),
        memberId: targetMemberId,
        rank,
        appointedBy: adminId,
        appointedAt: nowIso(),
        note: note.trim() || `Explicitly appointed ${rank}.`,
      },
      ...state.ascendancyHistory,
    ],
  }
  next = notifyMember(next, targetMemberId, 'announcement', `Ascendancy Appointment: ${rank}`, `You were appointed ${rank} by Stewardship / Control Room.`, '/profile')
  next = appendAudit(next, adminId, 'ascendancy.appointed', 'member', targetMemberId, `Appointed ${member.displayName} as ${rank}.`)
  return { ok: true, state: next, data: updated, message: `Appointed ${member.displayName} as ${rank}.` }
}

export function updatePlatformConfig(
  state: ArenaPrototypeState,
  adminId: string,
  updatedConfig: PlatformConfig,
): ServiceResult<PlatformConfig> {
  const adminCheck = requireSpartanMember(state, adminId)
  if (!adminCheck.ok) return adminCheck
  if (!memberHasPermission(adminId, state.permissionGrants, 'platform.admin')) {
    return { ok: false, error: 'Control Room Admin permission required.' }
  }
  let next: ArenaPrototypeState = {
    ...state,
    config: updatedConfig,
  }
  next = appendAudit(next, adminId, 'config.updated', 'platform', 'config', 'Updated configurable XP/CP/cap rules in Control Room.')
  return { ok: true, state: next, data: updatedConfig, message: 'Platform progression configuration updated.' }
}

export function markAllNotificationsRead(
  state: ArenaPrototypeState,
  memberId: string | null = state.currentMemberId,
): ServiceResult<null> {
  const actorCheck = requireSpartanMember(state, memberId, 'Sign in as a Spartan to manage notifications.')
  if (!actorCheck.ok) return actorCheck

  return {
    ok: true,
    state: {
      ...state,
      notifications: state.notifications.map((n) =>
        n.memberId === actorCheck.member.id ? { ...n, read: true } : n,
      ),
    },
    data: null,
    message: 'All notifications marked as read.',
  }
}

export function markNotificationRead(
  state: ArenaPrototypeState,
  notificationId: string,
  actorMemberId: string | null = state.currentMemberId,
): ServiceResult<null> {
  const actorCheck = requireSpartanMember(state, actorMemberId, 'Sign in as a Spartan to manage notifications.')
  if (!actorCheck.ok) return actorCheck

  const notification = state.notifications.find((n) => n.id === notificationId)
  if (!notification) {
    return { ok: false, error: 'Notification not found.' }
  }
  if (notification.memberId !== actorCheck.member.id) {
    return { ok: false, error: 'You can only mark your own notifications as read.' }
  }

  return {
    ok: true,
    state: {
      ...state,
      notifications: state.notifications.map((n) =>
        n.id === notificationId && n.memberId === actorCheck.member.id ? { ...n, read: true } : n,
      ),
    },
    data: null,
    message: 'Notification marked as read.',
  }
}
