import { RotateCcw, Users } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import { DEMO_PERSONAS } from '../domain/constants'

export default function DemoPersonaBar({ variant = 'workspace' }: { variant?: 'workspace' | 'footer' }) {
  const { currentMember, switchPersona, resetPrototype } = useArena()
  const activeValue = currentMember ? currentMember.id : 'visitor'

  return (
    <div
      className={`demo-persona-bar ${variant === 'workspace' ? 'demo-persona-bar-workspace' : ''}`}
      role="region"
      aria-label="Frontend simulation controls"
    >
      <div className="demo-persona-bar-left">
        <span className="demo-badge">Client Simulation</span>
        <span>
          Local browser persistence only · Active view:{' '}
          <strong>
            {currentMember
              ? `${currentMember.displayName} (${currentMember.ascendancyRank})`
              : 'Visitor (Public)'}
          </strong>
        </span>
      </div>
      <div className="demo-persona-bar-right">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Users size={14} aria-hidden="true" />
          <span style={{ fontWeight: 600 }}>Demo Persona:</span>
          <select
            aria-label="Switch Demo Persona"
            className="demo-persona-select"
            value={activeValue}
            onChange={(e) => {
              const val = e.target.value
              switchPersona(val === 'visitor' ? null : val)
            }}
          >
            {DEMO_PERSONAS.map((p) => (
              <option key={p.id} value={p.memberId ?? 'visitor'}>
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
