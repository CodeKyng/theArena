import type { UserRole } from './authContext'

export function homeForRole(role: UserRole) {
  if (role === 'admin') return '/admin/admin-dashboard'
  if (role === 'organization') return '/organization/org-dashboard'
  return '/dashboard'
}
