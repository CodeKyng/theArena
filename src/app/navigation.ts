import type { HouseId, PermissionGrant } from '../domain/types'
import { memberHasPermission } from '../domain/progression'

export interface NavItem {
  id: string
  path: string
  label: string
  icon:
    | 'home'
    | 'missions'
    | 'houses'
    | 'explore'
    | 'academy'
    | 'events'
    | 'activity'
    | 'profile'
    | 'stewardship'
    | 'control-room'
    | 'leaderboards'
  badge?: number
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'missions', path: '/missions', label: 'Missions', icon: 'missions' },
  { id: 'houses', path: '/houses', label: 'Houses', icon: 'houses' },
  { id: 'explore', path: '/explore', label: 'Explore', icon: 'explore' },
  { id: 'academy', path: '/academy', label: 'Academy', icon: 'academy' },
  { id: 'events', path: '/events', label: 'Events', icon: 'events' },
  { id: 'leaderboards', path: '/leaderboards', label: 'Leaderboards', icon: 'leaderboards' },
]

export const PERSONAL_NAV_ITEMS: NavItem[] = [
  { id: 'activity', path: '/activity', label: 'My Activity', icon: 'activity' },
  { id: 'profile', path: '/profile', label: 'My Profile', icon: 'profile' },
]

export function getGovernanceNavItems(
  memberId: string | null,
  grants: PermissionGrant[],
): NavItem[] {
  if (!memberId) return []
  const items: NavItem[] = []

  const canSteward =
    memberHasPermission(memberId, grants, 'mentor.manage') ||
    memberHasPermission(memberId, grants, 'moderator') ||
    memberHasPermission(memberId, grants, 'house.manage') ||
    memberHasPermission(memberId, grants, 'platform.admin')

  const canControlRoom =
    memberHasPermission(memberId, grants, 'platform.admin') ||
    memberHasPermission(memberId, grants, 'finance.admin')

  if (canSteward) {
    items.push({ id: 'stewardship', path: '/stewardship', label: 'Stewardship', icon: 'stewardship' })
  }
  if (canControlRoom) {
    items.push({ id: 'control-room', path: '/control-room', label: 'Control Room', icon: 'control-room' })
  }
  return items
}

export interface BreadcrumbTrail {
  group: string
  groupTo: string
  page: string
}

export function resolveBreadcrumb(
  pathname: string,
  houseLookup?: (slug: string) => HouseId | undefined,
): BreadcrumbTrail {
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/home')) {
    return { group: 'Arena', groupTo: '/dashboard', page: 'Dashboard' }
  }
  if (pathname.startsWith('/missions/new')) {
    return { group: 'Missions', groupTo: '/missions', page: 'Create Mission' }
  }
  if (pathname.startsWith('/missions/')) {
    return { group: 'Missions', groupTo: '/missions', page: 'Mission Detail' }
  }
  if (pathname.startsWith('/missions')) {
    return { group: 'Arena', groupTo: '/dashboard', page: 'Missions' }
  }
  if (pathname.startsWith('/houses/')) {
    const slug = pathname.replace('/houses/', '').split('/')[0]
    const matched = houseLookup?.(slug)
    return {
      group: 'Houses',
      groupTo: '/houses',
      page: matched ? slug.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'House Workspace',
    }
  }
  if (pathname.startsWith('/houses')) return { group: 'Arena', groupTo: '/dashboard', page: 'Houses' }
  if (pathname.startsWith('/explore')) return { group: 'Arena', groupTo: '/dashboard', page: 'Explore' }
  if (pathname.startsWith('/academy')) return { group: 'Arena', groupTo: '/dashboard', page: 'Academy' }
  if (pathname.startsWith('/events')) return { group: 'Arena', groupTo: '/dashboard', page: 'Events' }
  if (pathname.startsWith('/leaderboards')) return { group: 'Arena', groupTo: '/dashboard', page: 'Leaderboards' }
  if (pathname.startsWith('/notifications')) return { group: 'Personal', groupTo: '/activity', page: 'Notifications' }
  if (pathname.startsWith('/activity')) return { group: 'Personal', groupTo: '/activity', page: 'My Activity' }
  if (pathname.startsWith('/profile')) return { group: 'Personal', groupTo: '/profile', page: 'My Profile' }
  if (pathname.startsWith('/personalization')) return { group: 'Account', groupTo: '/profile', page: 'Personalization' }
  if (pathname.startsWith('/settings')) return { group: 'Account', groupTo: '/profile', page: 'Settings' }
  if (pathname.startsWith('/help')) return { group: 'Arena', groupTo: '/dashboard', page: 'Help' }
  if (pathname.startsWith('/organisations')) return { group: 'Arena', groupTo: '/dashboard', page: 'Organisations' }
  if (pathname.startsWith('/stewardship')) return { group: 'Governance', groupTo: '/stewardship', page: 'Stewardship' }
  if (pathname.startsWith('/control-room')) return { group: 'Governance', groupTo: '/control-room', page: 'Control Room' }
  return { group: 'Arena', groupTo: '/dashboard', page: 'Workspace' }
}

export const LANDING_LINKS = [
  { label: 'Houses', to: '/houses' },
  { label: 'Missions', to: '/missions' },
  { label: 'Explore', to: '/explore' },
  { label: 'Academy', to: '/academy' },
  { label: 'Events', to: '/events' },
]
