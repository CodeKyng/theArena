import { RotateCcw, Users } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import { DEMO_PERSONAS } from '../domain/constants'

export default function DemoPersonaBar({ variant = 'workspace' }: { variant?: 'workspace' | 'footer' }) {
  const { currentMember, isAuthenticated, switchPersona, resetPrototype } = useArena()

  if (!isAuthenticated || !currentMember) {
    return null
  }

  const spartanPersonas = DEMO_PERSONAS.filter((p) => p.memberId !== null)

  return (
    <div
      className={`demo-persona-bar ${variant === 'workspace' ? 'demo-persona-bar-workspace' : ''}`}
      role="region"
      aria-label="Frontend simulation controls"
    >
      <div className="demo-persona-bar-left">
        <span className="demo-badge">Demo Mode</span>
        <span>
          <span className="demo-persona-helper">Saved locally · </span>Viewing as{' '}
          <strong>
            {currentMember.displayName} ({currentMember.ascendancyRank})
          </strong>
        </span>
      </div>
      <div className="demo-persona-bar-right">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Users size={14} aria-hidden="true" />
          <span className="demo-persona-label" style={{ fontWeight: 600 }}>Demo Persona:</span>
          <select
            aria-label="Switch Demo Persona"
            className="demo-persona-select"
            value={currentMember.id}
            onChange={(e) => {
              const val = e.target.value
              if (val) switchPersona(val)
            }}
          >
            {spartanPersonas.map((p) => (
              <option key={p.id} value={p.memberId!}>
                {p.label} — {p.shortRole}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button button-quiet button-small"
          onClick={resetPrototype}
          title="Reset all simulated missions, XP, CP, and memberships to default seed data"
        >
          <RotateCcw size={13} /> Reset Data
        </button>
      </div>
    </div>
  )
}
