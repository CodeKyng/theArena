import { Link } from 'react-router-dom'

export default function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link className="brand" to={to}>
      <span className="brand-mark"><span /></span>
      <span className="brand-text">
        the<span className="brand-accent">arena</span>
      </span>
    </Link>
  )
}
