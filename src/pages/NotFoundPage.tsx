import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useArena } from '../app/arenaContext'

export default function NotFoundPage() {
  const { isAuthenticated } = useArena()

  return (
    <div className="not-found">
      <span className="section-kicker">PAGE NOT FOUND</span>
      <h1>404<span>.</span></h1>
      <p>This page doesn’t exist in The Arena. Use the links below to head back.</p>
      <div className="inline-actions">
        {isAuthenticated ? (
          <>
            <Link className="button button-bright" to="/dashboard">Go to Dashboard <ArrowRight size={15} /></Link>
            <Link className="button button-quiet" to="/">Back to Landing</Link>
          </>
        ) : (
          <>
            <Link className="button button-bright" to="/">Back to Landing <ArrowRight size={15} /></Link>
            <Link className="button button-quiet" to="/login">Sign in</Link>
          </>
        )}
      </div>
    </div>
  )
}

