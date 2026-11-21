import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <span className="section-kicker">ROUTE NOT FOUND</span>
      <h1>404<span>.</span></h1>
      <p>This path does not exist in The Arena prototype (including standalone messaging, which is intentionally deferred from the MVP).</p>
      <div className="inline-actions">
        <Link className="button button-bright" to="/home">Go to Workspace <ArrowRight size={15} /></Link>
        <Link className="button button-quiet" to="/">Back to Landing</Link>
      </div>
    </div>
  )
}

