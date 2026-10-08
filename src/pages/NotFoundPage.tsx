import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <div className="not-found">
    <span className="section-kicker">THIS ISN’T THE WAY</span>
    <h1>404<span>.</span></h1>
    <p>Looks like this path hasn’t been built yet.</p>
    <Link className="button button-bright" to="/">Back to the Arena <ArrowRight size={15} /></Link>
  </div>
}
