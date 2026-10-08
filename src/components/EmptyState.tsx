import { ArrowRight } from 'lucide-react'
import IconForPage from './IconForPage'

export default function EmptyState({ name, onClear }: { name: string; onClear: () => void }) {
  return <div className="empty-state">
    <span><IconForPage name={name} size={22} /></span>
    <h3>Nothing here just yet</h3>
    <p>Try another search — the right opportunity is out there.</p>
    <button className="button button-quiet" onClick={onClear}>Clear search <ArrowRight size={14} /></button>
  </div>
}
