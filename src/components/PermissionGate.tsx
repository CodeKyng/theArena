import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import { getHouseName, PERMISSION_LABELS } from '../domain/constants'
import type { HouseId, PermissionScope } from '../domain/types'

interface PermissionGateProps {
  requiredAny?: PermissionScope[]
  houseId?: HouseId
  requireSignedIn?: boolean
  title?: string
  children: ReactNode
}

export default function PermissionGate({
  requiredAny,
  houseId,
  requireSignedIn = true,
  title = 'Restricted Workspace',
  children,
}: PermissionGateProps) {
  const { state, currentMember, isAuthenticated, can } = useArena()
  const location = useLocation()

  if (requireSignedIn && (!isAuthenticated || !currentMember)) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requiredAny && requiredAny.length > 0) {
    const allowed = requiredAny.some((scope) => can(scope, houseId))
    if (!allowed) {
      const readablePermissions = requiredAny.map((scope) => PERMISSION_LABELS[scope] ?? scope).join(' or ')
      const houseLabel = houseId ? ` for House ${getHouseName(houseId, state.houses)}` : ''
      return (
        <div className="empty-state">
          <span><ShieldAlert size={26} /></span>
          <h3>Permission required: {title}</h3>
          <p>
            Signed in as <strong>{currentMember?.displayName}</strong> ({currentMember?.ascendancyRank}). Access requires {readablePermissions}{houseLabel}.
          </p>
          <p style={{ fontSize: 12 }}>
            In Demo Mode, switch to Maya Kim (Forge Masters), Elena Rostova (Stewardship), or Marcus Vance (Control Room).
          </p>
          <Link className="button button-quiet" to="/dashboard">Back to Dashboard</Link>
        </div>
      )
    }
  }

  return <>{children}</>
}
