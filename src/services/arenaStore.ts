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
    return {
      ...cloneSeedState(),
      ...parsed,
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
