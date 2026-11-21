import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Lock, ShieldAlert } from 'lucide-react'
import { useArena } from '../app/arenaContext'
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
  const { currentMember, can } = useArena()

  if (requireSignedIn && !currentMember) {
    return (
      <div className="empty-state">
        <span><Lock size={26} /></span>
        <h3>Sign in required for {title}</h3>
        <p>
          You are browsing as a public Visitor. Sign in or switch to a Spartan demo persona in the simulation switcher to access this screen.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link className="button button-bright" to="/login">Sign in to The Arena</Link>
          <Link className="button button-quiet" to="/home">Return Home</Link>
        </div>
      </div>
    )
  }

  if (requiredAny && requiredAny.length > 0) {
    const allowed = requiredAny.some((scope) => can(scope, houseId))
    if (!allowed) {
      return (
        <div className="empty-state">
          <span><ShieldAlert size={26} /></span>
          <h3>Permission required: {title}</h3>
          <p>
            Signed in as <strong>{currentMember?.displayName}</strong> ({currentMember?.ascendancyRank}). This area enforces scoped RBAC permissions ({requiredAny.join(', ')}
            {houseId ? ` for House ${houseId}` : ''}).
          </p>
          <p style={{ fontSize: 12 }}>
            Frontend prototype note: you can switch to an authorised demo persona (e.g. Maya Kim for Forge Masters, Elena Rostova for Stewardship, or Marcus Vance for Control Room) in the simulation switcher.
          </p>
          <Link className="button button-quiet" to="/home">Return to Home</Link>
        </div>
      )
    }
  }

  return <>{children}</>
}
