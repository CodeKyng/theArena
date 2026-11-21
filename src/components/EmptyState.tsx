import { ArrowRight, Compass } from 'lucide-react'

export default function EmptyState({
  name,
  onClear,
  actionLabel = 'Reset / Continue',
}: {
  name: string
  onClear: () => void
  actionLabel?: string
}) {
  return (
    <div className="empty-state">
      <span><Compass size={22} strokeWidth={1.8} /></span>
      <h3>Nothing matching {name}</h3>
      <p>Adjust your filters or sign in to view personalised queues.</p>
      <button type="button" className="button button-quiet" onClick={onClear}>
        {actionLabel} <ArrowRight size={14} />
      </button>
    </div>
  )
}

