import type { ReactNode } from 'react'

export default function PageHeader({
  name,
  description,
  section,
  actions,
}: {
  name: string
  description: string
  section: string
  actions?: ReactNode
}) {
  return (
    <div className="page-intro">
      <div className="intro-text">
        <div className="section-kicker">{section}</div>
        <h1>
          {name}
          <span className="intro-period">.</span>
        </h1>
        <p>{description}</p>
      </div>
      {actions && <div className="intro-actions">{actions}</div>}
    </div>
  )
}
