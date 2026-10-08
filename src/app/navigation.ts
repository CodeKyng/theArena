export const PUBLIC_PAGES = [
  'Discover', 'Opportunities', 'Communities', 'Projects', 'Services', 'Events', 'Learning Hub',
  'Grants', 'Hackathons', 'Bounties', 'Organizations', 'Resources', 'Discussions', 'Leaderboard',
]

export const MEMBER_PAGES = [
  'Dashboard', 'Profile', 'Edit Profile', 'My Projects', 'My Services', 'My Applications',
  'Saved Items', 'Messages', 'Notifications', 'Achievements', 'Reputation', 'Settings',
]

export const ORG_PAGES = ['Org Dashboard', 'Create Opportunity', 'Manage Applicants', 'Analytics']
export const ADMIN_PAGES = ['Admin Dashboard', 'Users', 'Content Moderation', 'Analytics']
export const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/onboarding']

export const slug = (name: string) => `/${name.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and')}`

export function pagePath(name: string, scope?: 'organization' | 'admin') {
  if (scope === 'organization') return `/organization${slug(name)}`
  if (scope === 'admin') return `/admin${slug(name)}`
  if (ORG_PAGES.includes(name)) return `/organization${slug(name)}`
  if (ADMIN_PAGES.includes(name)) return `/admin${slug(name)}`
  return slug(name)
}

export function titleForPath(path: string) {
  if (path === '/') return 'Home'
  return path.split('/').filter(Boolean).at(-1)?.split('-')
    .map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ') ?? 'Discover'
}
