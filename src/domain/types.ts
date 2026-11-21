export type HouseId =
  | 'scribes'
  | 'heralds'
  | 'artisans'
  | 'echoes'
  | 'forge-masters'
  | 'seers'

export type AscendancyRank =
  | 'Spartan'
  | 'Vanguard'
  | 'Gladiator'
  | 'Strategos'
  | 'Elder'
  | 'Champion'

export type MembershipStatus = 'visitor' | 'spartan'
export type OnboardingStage = 'newbie' | 'completed'

export type PermissionScope =
  | 'mission.create'
  | 'mission.review'
  | 'house.manage'
  | 'mentor.manage'
  | 'event.manage'
  | 'content.manage'
  | 'moderator'
  | 'finance.admin'
  | 'platform.admin'

export interface PermissionGrant {
  id: string
  memberId: string
  scope: PermissionScope
  houseId?: HouseId
  grantedBy: string
  grantedAt: string
  note?: string
}

export interface OnboardingChecklist {
  orientationCompleted: boolean
  rulesChecked: boolean
  housesSelected: boolean
  profileGuided: boolean
  academyStarted: boolean
  introMissionJoined: boolean
}

export interface AccountPrivacySettings {
  publicProfileVisible: boolean
  showContributionsPublicly: boolean
  showOnLeaderboard: boolean
  emailNotifications: boolean
  missionAlerts: boolean
  connectedWallet?: string
  connectedX?: string
  connectedGithub?: string
}

export interface MemberProfile {
  id: string
  email: string
  displayName: string
  username: string
  avatarInitials: string
  bio: string
  headline: string
  publicLinks: string[]
  skills: string[]
  interests: string[]
  membershipStatus: MembershipStatus
  onboardingStage: OnboardingStage
  onboardingChecklist: OnboardingChecklist
  ascendancyRank: AscendancyRank
  primaryHouseId: HouseId | null
  secondaryHouseId: HouseId | null
  privacy: AccountPrivacySettings
  joinedAt: string
}

export interface AscendancyAssignment {
  id: string
  memberId: string
  rank: AscendancyRank
  appointedBy: string
  appointedAt: string
  note: string
}

export interface House {
  id: HouseId
  slug: string
  name: string
  tagline: string
  description: string
  focusAreas: string[]
  glyph: string
  tone: 'blue' | 'red' | 'slate' | 'deep'
  supportsCrossHouseOutreach?: boolean
  aboutDetails: string
  stewardsNote: string
}

export interface OrganisationProfile {
  id: string
  name: string
  slug: string
  kind: 'Project' | 'Brand' | 'Company' | 'Team' | 'Community Initiative'
  ecosystem: string
  tagline: string
  description: string
  website: string
  verificationStatus: 'unverified' | 'pending_review' | 'verified'
  ownerMemberId: string
  createdAt: string
}

export interface OrganisationMembership {
  id: string
  organisationId: string
  memberId: string
  roleLabel: string
  canSponsorMissions: boolean
  canPublishOpportunities: boolean
  joinedAt: string
}

export type MissionCategory =
  | 'Social and Outreach'
  | 'Creative and Design'
  | 'Writing and Research'
  | 'Technical and Development'
  | 'Learning and Education'
  | 'Events and Participation'
  | 'Community and Operations'
  | 'Offline and IRL'
  | 'Collaboration'
  | 'Custom'

export type ParticipationFormat = 'open' | 'application' | 'team' | 'guided'

export type MissionStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'archived'

export type EvidenceType =
  | 'text'
  | 'images'
  | 'files'
  | 'links'
  | 'video_audio'
  | 'structured_response'
  | 'attendance_verification'
  | 'reviewer_confirmation'

export type SubmissionStatus =
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'approved'
  | 'rejected'
  | 'disputed'

export type MissionRewardBand = 'micro' | 'standard' | 'substantial' | 'major' | 'above_major'

export interface MissionBudget {
  isFunded: boolean
  fundingSource: 'member_spendable' | 'system_non_rewarded' | 'organisation_sponsor'
  rewardPerContributorXp: number
  rewardBand: MissionRewardBand | 'none'
  cpTierValue: number
  maxContributors: number
  totalReservedXp: number
  remainingReservedXp: number
  settledXp: number
  refundedXp: number
  requiresAdditionalApproval: boolean
}

export interface Mission {
  id: string
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
  creatorMemberId: string
  sponsorOrganisationId?: string
  assignedReviewerIds: string[]
  participationFormat: ParticipationFormat
  participationOpen: boolean
  eligibilityNote: string
  capacity: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  platformContext: string
  locationContext: string
  requiredEvidenceTypes: EvidenceType[]
  submissionInstructions: string
  verificationCriteria: string
  startDate: string
  deadline: string
  status: MissionStatus
  budget: MissionBudget
  createdAt: string
  updatedAt: string
}

export interface MissionParticipation {
  id: string
  missionId: string
  memberId: string
  status: 'joined' | 'applied' | 'accepted' | 'declined' | 'withdrawn'
  applicationNote?: string
  teamName?: string
  joinedAt: string
}

export interface EvidenceItem {
  id: string
  type: EvidenceType
  label: string
  value: string
  fileMeta?: {
    fileName: string
    mimeType: string
    sizeBytes: number
    simulatedNotice: string
  }
}

export interface SubmissionRevision {
  version: number
  summary: string
  evidenceItems: EvidenceItem[]
  submittedAt: string
}

export interface ReviewEvent {
  id: string
  submissionId: string
  reviewerId: string
  decision: 'under_review' | 'revision_requested' | 'approved' | 'rejected' | 'disputed'
  comment: string
  createdAt: string
}

export interface MissionSubmission {
  id: string
  missionId: string
  memberId: string
  status: SubmissionStatus
  version: number
  summary: string
  evidenceItems: EvidenceItem[]
  revisionHistory: SubmissionRevision[]
  reviews: ReviewEvent[]
  submittedAt: string
  updatedAt: string
}

export interface MissionDispute {
  id: string
  missionId: string
  submissionId: string
  openedByMemberId: string
  reason: string
  preservedEvidenceSnapshot: EvidenceItem[]
  preservedReviewComments: string[]
  status: 'open' | 'under_steward_review' | 'resolved_upheld' | 'resolved_overturned'
  resolutionNote?: string
  resolvedByMemberId?: string
  createdAt: string
  resolvedAt?: string
}

export type XPTransactionType =
  | 'earned'
  | 'reserved'
  | 'transferred'
  | 'received'
  | 'refunded'
  | 'adjustment'

export type XPSourceType = 'system' | 'member_funded' | 'admin'

export interface XPTransaction {
  id: string
  memberId: string
  amount: number
  transactionType: XPTransactionType
  sourceType: XPSourceType
  deltaLifetime: number
  deltaSpendable: number
  deltaReserved: number
  referenceType: 'onboarding' | 'mission' | 'submission' | 'academy' | 'event' | 'mentorship' | 'house_responsibility' | 'admin'
  referenceId: string
  actorMemberId: string
  creatorMemberId?: string
  recipientMemberId?: string
  reason: string
  idempotencyKey: string
  createdAt: string
}

export interface XPBalance {
  memberId: string
  lifetimeXp: number
  spendableXp: number
  reservedXp: number
}

export type CPActivityCategory =
  | 'mission_micro'
  | 'mission_standard'
  | 'mission_substantial'
  | 'mission_major'
  | 'academy_lesson'
  | 'academy_module'
  | 'academy_path'
  | 'practical_assessment'
  | 'community_support'
  | 'event_attendance'
  | 'event_support'
  | 'event_hosting'
  | 'mentorship'
  | 'house_responsibility'

export interface ContributionRecord {
  id: string
  memberId: string
  houseId: HouseId
  sourceKind: 'mission' | 'academy' | 'event' | 'mentorship' | 'community_support' | 'house_responsibility'
  referenceId: string
  title: string
  deliverableSummary: string
  verifiedByMemberId: string
  createdAt: string
}

export interface ContributionPointEvent {
  id: string
  memberId: string
  contributionRecordId: string
  seasonId: string
  houseId: HouseId
  activityCategory: CPActivityCategory
  leaderboardBucket: 'missions' | 'learning' | 'community_stewardship'
  cpAmount: number
  partnerMemberId?: string
  referenceKey: string
  createdAt: string
}

export type LeaderboardCategory =
  | 'overall'
  | 'house'
  | 'missions'
  | 'learning'
  | 'community_stewardship'

export type LeaderboardPeriod = 'season' | 'all_time'

export interface LeaderboardEntry {
  rank: number
  memberId: string
  displayName: string
  username: string
  avatarInitials: string
  primaryHouseId: HouseId | null
  ascendancyRank: AscendancyRank
  numericLevel: number
  cpScore: number
  contributionsCount: number
}

export interface AchievementDefinition {
  id: string
  code: string
  title: string
  description: string
  unlockConditionLabel: string
}

export interface MemberAchievement {
  id: string
  memberId: string
  achievementId: string
  unlockedAt: string
}

export interface AcademyLesson {
  id: string
  moduleId: string
  title: string
  summary: string
  estimatedMinutes: number
  knowledgeCheckQuestion: string
  knowledgeCheckOptions: string[]
  correctOptionIndex: number
}

export interface AcademyModule {
  id: string
  pathId: string
  title: string
  summary: string
  houseId: HouseId | null
  lessons: AcademyLesson[]
}

export interface AcademyAssessment {
  id: string
  pathId: string
  title: string
  brief: string
  xpReward: number
  cpReward: number
}

export interface AcademyPath {
  id: string
  title: string
  subtitle: string
  track: 'Web3 Foundations' | 'Beginner Learning' | 'Wallet & Digital Safety' | 'House Mastery'
  houseId: HouseId | null
  modules: AcademyModule[]
  assessment?: AcademyAssessment
}

export interface GlossaryEntry {
  term: string
  definition: string
  category: string
}

export interface LearningCompletion {
  id: string
  memberId: string
  itemType: 'lesson' | 'module' | 'path' | 'assessment'
  itemId: string
  scoreNote?: string
  completedAt: string
}

export type EventKind =
  | 'Arena-Wide'
  | 'House Session'
  | 'Workshop'
  | 'AMA'
  | 'Onboarding Session'
  | 'Portfolio Review'

export type EventAttendanceRole = 'attendee' | 'support' | 'host'

export interface ArenaEvent {
  id: string
  title: string
  description: string
  kind: EventKind
  houseId: HouseId | null
  hostMemberId: string
  startsAt: string
  durationMinutes: number
  locationOrLink: string
  capacity: number
  isPast: boolean
  recordingNote?: string
}

export interface EventParticipation {
  id: string
  eventId: string
  memberId: string
  role: EventAttendanceRole
  status: 'registered' | 'attended' | 'cancelled'
  registeredAt: string
  attendedAt?: string
}

export interface ExploreOpportunity {
  id: string
  title: string
  organisationName: string
  organisationId?: string
  houseId: HouseId
  kind: 'Role' | 'Grant' | 'Collaboration' | 'Commission'
  compensationLabel: string
  description: string
  tags: string[]
  postedByMemberId: string
  createdAt: string
}

export interface ExploreProject {
  id: string
  title: string
  tagline: string
  description: string
  houseId: HouseId
  ownerMemberId: string
  organisationId?: string
  status: 'Idea' | 'Building' | 'Beta' | 'Live'
  tags: string[]
  repoOrDemoUrl: string
  teamSize: number
  createdAt: string
}

export interface ExploreService {
  id: string
  title: string
  categoryLabel: string
  description: string
  houseId: HouseId
  providerMemberId: string
  suggestedXpRate: number
  tags: string[]
  createdAt: string
}

export interface ExploreResource {
  id: string
  title: string
  kind: 'Field Guide' | 'Toolkit' | 'Template' | 'Safety Brief' | 'Ecosystem Map'
  houseId: HouseId | null
  summary: string
  formatLabel: string
  authorMemberId: string
  createdAt: string
}

export interface ExploreDiscussionReply {
  id: string
  authorMemberId: string
  body: string
  createdAt: string
}

export interface ExploreDiscussion {
  id: string
  title: string
  topicTag: string
  houseId: HouseId | null
  authorMemberId: string
  body: string
  replies: ExploreDiscussionReply[]
  createdAt: string
}

export interface NotificationItem {
  id: string
  memberId: string
  category:
    | 'mission'
    | 'submission'
    | 'xp'
    | 'achievement'
    | 'house'
    | 'event'
    | 'announcement'
  title: string
  body: string
  linkPath?: string
  read: boolean
  createdAt: string
}

export interface AuditLogEntry {
  id: string
  actorMemberId: string
  action: string
  targetType: string
  targetId: string
  summary: string
  createdAt: string
}

export interface SeasonConfig {
  id: string
  name: string
  durationDays: number
  startsAt: string
  endsAt: string
  isCurrent: boolean
}

export interface PlatformConfig {
  levelThresholds: number[]
  systemXpValues: {
    orientationOnce: number
    academyLesson: number
    academyModule: number
    learningPath: number
    practicalAssessmentDefault: number
    communitySupportDefault: number
    eventAttendance: number
    eventSupportDefault: number
    eventHostDefault: number
    mentorshipSession: number
    houseResponsibilityDefault: number
    leadershipResponsibilityDefault: number
  }
  cpValues: Record<CPActivityCategory, number>
  seasonalCpCaps: {
    eventAttendancePerSeason: number
    communitySupportPerSeason: number
    mentorshipPairPerSeason: number
  }
  rewardBands: {
    micro: [number, number]
    standard: [number, number]
    substantial: [number, number]
    major: [number, number]
  }
}

export interface SavedBookmark {
  memberId: string
  targetType: 'mission' | 'opportunity' | 'project' | 'resource' | 'event'
  targetId: string
  savedAt: string
}

export interface MentorshipSession {
  id: string
  mentorMemberId: string
  menteeMemberId: string
  houseId: HouseId
  topic: string
  summary: string
  status: 'scheduled' | 'verified'
  verifiedByMemberId?: string
  createdAt: string
}

export interface DemoPersona {
  id: string
  label: string
  shortRole: string
  description: string
  memberId: string | null
}

export interface ArenaPrototypeState {
  currentMemberId: string | null
  activeOrganisationId: string | null
  currentSeason: SeasonConfig
  config: PlatformConfig
  houses: House[]
  members: MemberProfile[]
  permissionGrants: PermissionGrant[]
  ascendancyHistory: AscendancyAssignment[]
  organisations: OrganisationProfile[]
  organisationMemberships: OrganisationMembership[]
  missions: Mission[]
  missionParticipations: MissionParticipation[]
  submissions: MissionSubmission[]
  disputes: MissionDispute[]
  xpTransactions: XPTransaction[]
  contributionRecords: ContributionRecord[]
  cpEvents: ContributionPointEvent[]
  achievements: AchievementDefinition[]
  memberAchievements: MemberAchievement[]
  academyPaths: AcademyPath[]
  glossary: GlossaryEntry[]
  learningCompletions: LearningCompletion[]
  events: ArenaEvent[]
  eventParticipations: EventParticipation[]
  opportunities: ExploreOpportunity[]
  projects: ExploreProject[]
  services: ExploreService[]
  resources: ExploreResource[]
  discussions: ExploreDiscussion[]
  savedBookmarks: SavedBookmark[]
  mentorshipSessions: MentorshipSession[]
  notifications: NotificationItem[]
  auditLogs: AuditLogEntry[]
}
