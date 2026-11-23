import { createContext, useContext } from 'react'
import type { LevelProgressInfo } from '../domain/progression'
import type {
  ArenaEvent,
  ArenaPrototypeState,
  AscendancyRank,
  EventAttendanceRole,
  EvidenceItem,
  ExploreOpportunity,
  ExploreProject,
  ExploreResource,
  ExploreService,
  HouseId,
  MemberProfile,
  Mission,
  OrganisationProfile,
  PermissionScope,
  PlatformConfig,
  XPBalance,
} from '../domain/types'
import type { CreateMissionInput, ServiceResult } from '../services/arenaService'

export type QuickCreateKind =
  | 'mission'
  | 'project'
  | 'service'
  | 'resource'
  | 'opportunity'
  | 'event'
  | 'discussion'

export interface ArenaContextValue {
  state: ArenaPrototypeState
  currentMember: MemberProfile | null
  isAuthenticated: boolean
  logoutRedirectTo: string | null
  xpBalance: XPBalance
  levelProgress: LevelProgressInfo
  unreadNotificationsCount: number
  activeOrganisation: OrganisationProfile | null
  memberOrganisations: OrganisationProfile[]
  toast: string | null
  flash: (msg: string) => void
  can: (scope: PermissionScope, houseId?: HouseId) => boolean
  getMemberBalance: (memberId: string) => XPBalance
  getMemberById: (memberId: string) => MemberProfile | undefined
  searchModalOpen: boolean
  setSearchModalOpen: (open: boolean) => void
  quickCreateKind: QuickCreateKind | null
  openQuickCreate: (kind: QuickCreateKind | null) => void
  // Actions
  switchPersona: (memberId: string | null) => void
  signInByEmail: (email: string) => ServiceResult<MemberProfile>
  registerAccount: (input: { displayName: string; username: string; email: string; headline?: string }) => ServiceResult<MemberProfile>
  signOut: (options?: { redirectTo?: string }) => void
  resetPrototype: () => void
  completeOrientation: () => void
  updateHouses: (primary: HouseId | null, secondary: HouseId | null) => ServiceResult<MemberProfile>
  updateProfile: (patch: Partial<Pick<MemberProfile, 'displayName' | 'headline' | 'bio' | 'publicLinks' | 'skills' | 'interests'>>) => ServiceResult<MemberProfile>
  updatePrivacy: (patch: Partial<MemberProfile['privacy']>) => ServiceResult<MemberProfile>
  createOrg: (input: { name: string; kind: OrganisationProfile['kind']; ecosystem: string; tagline: string; description: string; website: string }) => ServiceResult<OrganisationProfile>
  setOrgVerification: (orgId: string, status: OrganisationProfile['verificationStatus']) => ServiceResult<OrganisationProfile>
  switchOrg: (orgId: string | null) => void
  createMission: (input: CreateMissionInput) => ServiceResult<Mission>
  publishDraft: (missionId: string) => ServiceResult<Mission>
  approveHighValue: (missionId: string) => ServiceResult<Mission>
  toggleMissionPause: (missionId: string) => ServiceResult<Mission>
  cancelOrExpireMission: (missionId: string, status: 'cancelled' | 'expired') => ServiceResult<{ mission: Mission; refundedXp: number }>
  joinOrApplyMission: (missionId: string, note?: string, teamName?: string) => void
  decideApplication: (participationId: string, decision: 'accepted' | 'declined') => void
  submitMissionWork: (missionId: string, summary: string, evidenceItems: EvidenceItem[]) => ServiceResult<unknown>
  resubmitMissionWork: (submissionId: string, summary: string, evidenceItems: EvidenceItem[]) => ServiceResult<unknown>
  reviewSubmission: (submissionId: string, decision: 'under_review' | 'revision_requested' | 'approved' | 'rejected', comment: string) => ServiceResult<unknown>
  openDispute: (submissionId: string, reason: string) => ServiceResult<unknown>
  resolveDispute: (disputeId: string, resolution: 'resolved_upheld' | 'resolved_overturned', note: string) => ServiceResult<unknown>
  reportMission: (missionId: string, reason: string) => void
  completeLesson: (lessonId: string, selectedIndex: number) => ServiceResult<unknown>
  submitAssessment: (assessmentId: string, responseText: string) => ServiceResult<unknown>
  rsvpEvent: (eventId: string, role?: EventAttendanceRole) => void
  recordEventAttendance: (eventId: string, memberId: string, role: EventAttendanceRole) => void
  proposeEvent: (input: Omit<ArenaEvent, 'id' | 'hostMemberId' | 'isPast'>) => ServiceResult<ArenaEvent>
  toggleBookmark: (targetType: 'mission' | 'opportunity' | 'project' | 'resource' | 'event', targetId: string) => void
  addProject: (input: Omit<ExploreProject, 'id' | 'ownerMemberId' | 'createdAt'>) => ServiceResult<ExploreProject>
  addService: (input: Omit<ExploreService, 'id' | 'providerMemberId' | 'createdAt'>) => ServiceResult<ExploreService>
  commissionService: (serviceId: string, brief: string, xpReward: number) => ServiceResult<Mission>
  addResource: (input: Omit<ExploreResource, 'id' | 'authorMemberId' | 'createdAt'>) => ServiceResult<ExploreResource>
  addOpportunity: (input: Omit<ExploreOpportunity, 'id' | 'postedByMemberId' | 'createdAt'>) => ServiceResult<ExploreOpportunity>
  createDiscussion: (input: { title: string; topicTag: string; houseId: HouseId | null; body: string }) => ServiceResult<unknown>
  addDiscussionReply: (discussionId: string, body: string) => ServiceResult<unknown>
  verifyMentorship: (sessionId: string) => void
  logMentorship: (menteeMemberId: string, houseId: HouseId, topic: string, summary: string) => ServiceResult<unknown>
  adminAdjustXp: (targetMemberId: string, delta: number, reason: string) => ServiceResult<null>
  togglePermission: (targetMemberId: string, scope: PermissionScope, houseId?: HouseId) => void
  appointAscendancy: (targetMemberId: string, rank: AscendancyRank, note: string) => void
  updateConfig: (config: PlatformConfig) => void
  markAllNotificationsRead: () => void
  markNotificationRead: (id: string) => void
}

export const ArenaContext = createContext<ArenaContextValue | null>(null)

export function useArena(): ArenaContextValue {
  const ctx = useContext(ArenaContext)
  if (!ctx) {
    throw new Error('useArena must be used inside ArenaProvider')
  }
  return ctx
}
