import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useArena } from '../app/arenaContext'

export default function RequireAuth({ children }: { children?: ReactNode }) {
  const { isAuthenticated, currentMember, logoutRedirectTo } = useArena()
  const location = useLocation()

  if (!isAuthenticated || !currentMember || currentMember.membershipStatus !== 'spartan') {
    if (logoutRedirectTo) {
      return <Navigate to={logoutRedirectTo} replace />
    }
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children ? <>{children}</> : <Outlet />
}
