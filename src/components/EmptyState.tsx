import { ArrowRight, Compass } from 'lucide-react'
import { useArena } from '../app/arenaContext'

export default function EmptyState({
  name,
  onClear,
  actionLabel = 'Reset filters',
}: {
  name: string
  onClear: () => void
  actionLabel?: string
}) {
  const { currentMember } = useArena()

  return (
    <div className="empty-state">
      <span><Compass size={22} strokeWidth={1.8} /></span>
      <h3>Nothing matching {name}</h3>
      <p>
        {currentMember
          ? 'Try adjusting or clearing your filters to see more items.'
          : 'Try adjusting your filters, or sign in to view personalised items.'}
      </p>
      <button type="button" className="button button-quiet" onClick={onClear}>
        {actionLabel} <ArrowRight size={14} />
      </button>
    </div>
  )
}

