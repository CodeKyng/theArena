import { INITIAL_ARENA_STATE } from '../data/seedData'
import type { ArenaPrototypeState } from '../domain/types'

export const ARENA_STORAGE_KEY = 'arena.prototype.v1'

export function cloneSeedState(): ArenaPrototypeState {
  return structuredClone(INITIAL_ARENA_STATE)
}

export function loadArenaState(): ArenaPrototypeState {
  if (typeof window === 'undefined') return cloneSeedState()
  try {
    const raw = window.localStorage.getItem(ARENA_STORAGE_KEY)
    if (!raw) return cloneSeedState()
    const parsed = JSON.parse(raw) as Partial<ArenaPrototypeState>
    if (!parsed || !Array.isArray(parsed.members) || !Array.isArray(parsed.missions)) {
      return cloneSeedState()
    }
    // Merge top-level defaults in case new keys were added
    const merged: ArenaPrototypeState = {
      ...cloneSeedState(),
      ...parsed,
    }

    const activeMember = merged.currentMemberId
      ? merged.members.find(
          (m) => m.id === merged.currentMemberId && m.membershipStatus === 'spartan',
        )
      : undefined

    if (!activeMember) {
      return {
        ...merged,
        currentMemberId: null,
        activeOrganisationId: null,
      }
    }

    const activeOrgValid = merged.activeOrganisationId
      ? merged.organisations.some(
          (o) =>
            o.id === merged.activeOrganisationId &&
            (o.ownerMemberId === activeMember.id ||
              merged.organisationMemberships.some(
                (om) => om.organisationId === o.id && om.memberId === activeMember.id,
              )),
        )
      : false

    return {
      ...merged,
      currentMemberId: activeMember.id,
      activeOrganisationId: activeOrgValid ? merged.activeOrganisationId : null,
    }
  } catch {
    return cloneSeedState()
  }
}

export function saveArenaState(state: ArenaPrototypeState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ARENA_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage quota errors in constrained previews
  }
}

export function resetArenaStorage(): ArenaPrototypeState {
  const fresh = cloneSeedState()
  saveArenaState(fresh)
  return fresh
}

export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'arena.sidebarCollapsed.v1'

export function loadSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? 'true' : 'false')
  } catch {
    // Ignore storage errors
  }
}
