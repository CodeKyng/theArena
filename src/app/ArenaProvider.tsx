import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { calculateLevelProgress, deriveXpBalance, memberHasPermission } from '../domain/progression'
import type {
  ArenaPrototypeState,
  HouseId,
  PermissionScope,
} from '../domain/types'
import {
  addDiscussionReply,
  addExploreOpportunity,
  addExploreProject,
  addExploreResource,
  addExploreService,
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
  getAuthenticatedMember,
  grantOrRevokePermission,
  joinOrApplyMission,
  logMentorshipSession,
  markAllNotificationsRead,
  markNotificationRead,
  openSubmissionDispute,
  proposeEvent,
  publishDraftMission,
  recordEventAttendanceOrRole,
  registerUnifiedAccount,
  reportMission,
  resolveDispute,
  resubmitMissionWork,
  reviewSubmission,
  rsvpEvent,
  setOrganisationVerification,
  signInDemoByEmail,
  signOutAccount,
  submitMissionWork,
  submitPracticalAssessment,
  switchActiveOrganisation,
  switchDemoPersona,
  toggleBookmark,
  toggleMissionPause,
  updateAccountPrivacy,
  updateMemberHouses,
  updateMemberProfile,
  updatePlatformConfig,
  verifyMentorshipSession,
  type ServiceResult,
} from '../services/arenaService'
import { loadArenaState, resetArenaStorage, saveArenaState } from '../services/arenaStore'
import { ArenaContext, type ArenaContextValue, type QuickCreateKind } from './arenaContext'

export function ArenaProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [state, setState] = useState<ArenaPrototypeState>(() => loadArenaState())
  const [toast, setToast] = useState<string | null>(null)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [quickCreateKind, setQuickCreateKind] = useState<QuickCreateKind | null>(null)
  const [logoutIntent, setLogoutIntent] = useState<{ target: string; fromPathname: string } | null>(null)
  const timerRef = useRef<number | null>(null)

  const logoutRedirectTo =
    logoutIntent && location.pathname === logoutIntent.fromPathname
      ? logoutIntent.target
      : null

  const flash = useCallback((msg: string) => {
    setToast(msg)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setToast(null), 3600)
  }, [])

  useEffect(() => {
    saveArenaState(state)
  }, [state])

  const currentMember = useMemo(
    () => getAuthenticatedMember(state, state.currentMemberId),
    [state],
  )
  const isAuthenticated = Boolean(currentMember)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (!isAuthenticated) return
        e.preventDefault()
        setSearchModalOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false)
        setQuickCreateKind(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAuthenticated])

  const applyResult = useCallback(
    <T,>(res: ServiceResult<T>, silent = false): ServiceResult<T> => {
      if (res.ok) {
        setState(res.state)
        if (!silent) flash(res.message)
      } else {
        flash(res.error)
      }
      return res
    },
    [flash],
  )

  const xpBalance = useMemo(
    () =>
      currentMember
        ? deriveXpBalance(currentMember.id, state.xpTransactions)
        : { memberId: 'guest', lifetimeXp: 0, spendableXp: 0, reservedXp: 0 },
    [currentMember, state.xpTransactions],
  )

  const levelProgress = useMemo(
    () => calculateLevelProgress(xpBalance.lifetimeXp, state.config.levelThresholds),
    [xpBalance.lifetimeXp, state.config.levelThresholds],
  )

  const unreadNotificationsCount = useMemo(
    () =>
      currentMember
        ? state.notifications.filter((n) => n.memberId === currentMember.id && !n.read).length
        : 0,
    [currentMember, state.notifications],
  )

  const memberOrganisations = useMemo(() => {
    if (!currentMember) return []
    const orgIds = new Set(
      state.organisationMemberships
        .filter((om) => om.memberId === currentMember.id)
        .map((om) => om.organisationId),
    )
    return state.organisations.filter((o) => o.ownerMemberId === currentMember.id || orgIds.has(o.id))
  }, [currentMember, state.organisationMemberships, state.organisations])

  const activeOrganisation = useMemo(
    () =>
      currentMember && state.activeOrganisationId
        ? memberOrganisations.find((o) => o.id === state.activeOrganisationId) ?? null
        : null,
    [currentMember, memberOrganisations, state.activeOrganisationId],
  )

  const can = useCallback(
    (scope: PermissionScope, houseId?: HouseId) =>
      memberHasPermission(currentMember?.id ?? null, state.permissionGrants, scope, houseId),
    [currentMember, state.permissionGrants],
  )

  const getMemberBalance = useCallback(
    (memberId: string) => deriveXpBalance(memberId, state.xpTransactions),
    [state.xpTransactions],
  )

  const getMemberById = useCallback(
    (memberId: string) => state.members.find((m) => m.id === memberId),
    [state.members],
  )

  const safeSetSearchModalOpen = useCallback(
    (open: boolean) => {
      if (!isAuthenticated) {
        setSearchModalOpen(false)
        return
      }
      setSearchModalOpen(open)
    },
    [isAuthenticated],
  )

  const safeOpenQuickCreate = useCallback(
    (kind: QuickCreateKind | null) => {
      if (!isAuthenticated) {
        setQuickCreateKind(null)
        return
      }
      setQuickCreateKind(kind)
    },
    [isAuthenticated],
  )

  const value = useMemo<ArenaContextValue>(
    () => ({
      state,
      currentMember,
      isAuthenticated,
      logoutRedirectTo,
      xpBalance,
      levelProgress,
      unreadNotificationsCount,
      activeOrganisation,
      memberOrganisations,
      toast,
      flash,
      can,
      getMemberBalance,
      getMemberById,
      searchModalOpen: isAuthenticated ? searchModalOpen : false,
      setSearchModalOpen: safeSetSearchModalOpen,
      quickCreateKind: isAuthenticated ? quickCreateKind : null,
      openQuickCreate: safeOpenQuickCreate,

      switchPersona: (memberId) => {
        setLogoutIntent(null)
        applyResult(switchDemoPersona(state, memberId))
      },
      signInByEmail: (email) => {
        setLogoutIntent(null)
        return applyResult(signInDemoByEmail(state, email))
      },
      registerAccount: (input) => {
        setLogoutIntent(null)
        return applyResult(registerUnifiedAccount(state, input))
      },
      signOut: (options) => {
        setLogoutIntent(
          options?.redirectTo ? { target: options.redirectTo, fromPathname: location.pathname } : null,
        )
        setSearchModalOpen(false)
        setQuickCreateKind(null)
        applyResult(signOutAccount(state))
      },
      resetPrototype: () => {
        setLogoutIntent(null)
        setSearchModalOpen(false)
        setQuickCreateKind(null)
        const fresh = resetArenaStorage()
        setState(fresh)
        flash('Prototype state reset to clean Season 2 baseline.')
      },
      completeOrientation: () => {
        if (!currentMember) return flash('Sign in first.')
        applyResult(completeOrientationAndRules(state, currentMember.id))
      },
      updateHouses: (primary, secondary) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(updateMemberHouses(state, currentMember.id, primary, secondary))
      },
      updateProfile: (patch) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(updateMemberProfile(state, currentMember.id, patch))
      },
      updatePrivacy: (patch) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(updateAccountPrivacy(state, currentMember.id, patch))
      },
      createOrg: (input) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(createOrganisation(state, currentMember.id, input))
      },
      setOrgVerification: (orgId, status) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(setOrganisationVerification(state, currentMember.id, orgId, status))
      },
      switchOrg: (orgId) => {
        if (!currentMember) {
          flash('Sign in as a Spartan first.')
          return
        }
        applyResult(switchActiveOrganisation(state, orgId, currentMember.id))
      },
      createMission: (input) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(createMission(state, currentMember.id, input))
      },
      publishDraft: (missionId) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(publishDraftMission(state, currentMember.id, missionId))
      },
      approveHighValue: (missionId) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(approveHighValueMission(state, currentMember.id, missionId))
      },
      toggleMissionPause: (missionId) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(toggleMissionPause(state, currentMember.id, missionId))
      },
      cancelOrExpireMission: (missionId, status) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(cancelOrExpireMission(state, currentMember.id, missionId, status))
      },
      joinOrApplyMission: (missionId, note, teamName) => {
        if (!currentMember) return flash('Sign in as a Spartan to join missions.')
        applyResult(joinOrApplyMission(state, currentMember.id, missionId, note, teamName))
      },
      decideApplication: (participationId, decision) => {
        if (!currentMember) return flash('Sign in first.')
        applyResult(decideMissionApplication(state, currentMember.id, participationId, decision))
      },
      submitMissionWork: (missionId, summary, evidenceItems) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(submitMissionWork(state, currentMember.id, missionId, summary, evidenceItems))
      },
      resubmitMissionWork: (submissionId, summary, evidenceItems) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(resubmitMissionWork(state, currentMember.id, submissionId, summary, evidenceItems))
      },
      reviewSubmission: (submissionId, decision, comment) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(reviewSubmission(state, currentMember.id, submissionId, decision, comment))
      },
      openDispute: (submissionId, reason) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(openSubmissionDispute(state, currentMember.id, submissionId, reason))
      },
      resolveDispute: (disputeId, resolution, note) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(resolveDispute(state, currentMember.id, disputeId, resolution, note))
      },
      reportMission: (missionId, reason) => {
        if (!currentMember) return flash('Sign in first.')
        applyResult(reportMission(state, currentMember.id, missionId, reason))
      },
      completeLesson: (lessonId, selectedIndex) => {
        if (!currentMember) return { ok: false, error: 'Sign in to earn XP & CP for Academy progress.' }
        return applyResult(completeAcademyLesson(state, currentMember.id, lessonId, selectedIndex))
      },
      submitAssessment: (assessmentId, responseText) => {
        if (!currentMember) return { ok: false, error: 'Sign in to submit an assessment.' }
        return applyResult(submitPracticalAssessment(state, currentMember.id, assessmentId, responseText))
      },
      rsvpEvent: (eventId, role = 'attendee') => {
        if (!currentMember) return flash('Sign in as a Spartan to RSVP for events.')
        applyResult(rsvpEvent(state, currentMember.id, eventId, role))
      },
      recordEventAttendance: (eventId, memberId, role) => {
        if (!currentMember) return flash('Sign in first.')
        applyResult(recordEventAttendanceOrRole(state, currentMember.id, eventId, memberId, role))
      },
      proposeEvent: (input) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(proposeEvent(state, currentMember.id, input))
      },
      toggleBookmark: (targetType, targetId) => {
        if (!currentMember) return flash('Sign in to save items to My Activity.')
        applyResult(toggleBookmark(state, currentMember.id, targetType, targetId))
      },
      addProject: (input) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(addExploreProject(state, currentMember.id, input))
      },
      addService: (input) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(addExploreService(state, currentMember.id, input))
      },
      commissionService: (serviceId, brief, xpReward) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(commissionServiceAsMission(state, currentMember.id, serviceId, brief, xpReward))
      },
      addResource: (input) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(addExploreResource(state, currentMember.id, input))
      },
      addOpportunity: (input) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(addExploreOpportunity(state, currentMember.id, input))
      },
      createDiscussion: (input) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(createDiscussion(state, currentMember.id, input))
      },
      addDiscussionReply: (discussionId, body) => {
        if (!currentMember) return { ok: false, error: 'Sign in to reply.' }
        return applyResult(addDiscussionReply(state, currentMember.id, discussionId, body))
      },
      verifyMentorship: (sessionId) => {
        if (!currentMember) return flash('Sign in first.')
        applyResult(verifyMentorshipSession(state, currentMember.id, sessionId))
      },
      logMentorship: (menteeMemberId, houseId, topic, summary) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(logMentorshipSession(state, currentMember.id, menteeMemberId, houseId, topic, summary))
      },
      adminAdjustXp: (targetMemberId, delta, reason) => {
        if (!currentMember) return { ok: false, error: 'Sign in first.' }
        return applyResult(adminAdjustXp(state, currentMember.id, targetMemberId, delta, reason))
      },
      togglePermission: (targetMemberId, scope, houseId) => {
        if (!currentMember) return flash('Sign in first.')
        applyResult(grantOrRevokePermission(state, currentMember.id, targetMemberId, scope, houseId))
      },
      appointAscendancy: (targetMemberId, rank, note) => {
        if (!currentMember) return flash('Sign in first.')
        applyResult(appointAscendancy(state, currentMember.id, targetMemberId, rank, note))
      },
      updateConfig: (config) => {
        if (!currentMember) return flash('Sign in first.')
        applyResult(updatePlatformConfig(state, currentMember.id, config))
      },
      markAllNotificationsRead: () => {
        if (!currentMember) return
        applyResult(markAllNotificationsRead(state, currentMember.id))
      },
      markNotificationRead: (id) => {
        if (!currentMember) return
        setState((prev) => {
          const res = markNotificationRead(prev, id, currentMember.id)
          return res.ok ? res.state : prev
        })
      },
    }),
    [
      activeOrganisation,
      applyResult,
      can,
      currentMember,
      flash,
      getMemberBalance,
      getMemberById,
      isAuthenticated,
      levelProgress,
      location.pathname,
      logoutRedirectTo,
      memberOrganisations,
      quickCreateKind,
      safeOpenQuickCreate,
      safeSetSearchModalOpen,
      searchModalOpen,
      state,
      toast,
      unreadNotificationsCount,
      xpBalance,
    ],
  )

  return <ArenaContext.Provider value={value}>{children}</ArenaContext.Provider>
}
