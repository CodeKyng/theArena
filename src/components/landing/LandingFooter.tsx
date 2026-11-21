import { Link } from 'react-router-dom'
import Brand from '../Brand'

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <Brand />
      <span>The Arena — A Community for Becoming.</span>
      <div>
        <Link to="/houses">Houses</Link>
        <Link to="/academy">Academy</Link>
        <Link to="/missions">Missions</Link>
        <Link to="/events">Events</Link>
        <Link to="/explore">Explore</Link>
      </div>
      <small>Frontend Prototype · Local Simulation</small>
    </footer>
  )
}
