import { Link } from 'react-router-dom'
import Brand from '../Brand'

export default function LandingFooter() {
  return <footer className="landing-footer">
    <Brand /><span>A better internet is a team effort.</span>
    <div><Link to="/resources">About</Link><Link to="/discussions">Community</Link><a href="mailto:hello@thearena.xyz">Contact</a></div>
    <small>© 2025 The Arena</small>
  </footer>
}
