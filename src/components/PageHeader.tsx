import { Filter, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { pagePath } from '../app/navigation'

export default function PageHeader({ name, description, section, flash }: {
  name: string
  description: string
  section: string
  flash: (message: string) => void
}) {
  const navigate = useNavigate()
  const canCreate = name === 'Opportunities' || name === 'Org Dashboard'
  return (
    <div className="page-intro">
      <div className="intro-text">
        <div className="section-kicker">{section}</div>
        <h1>{name}<span className="intro-period">.</span></h1>
        <p>{description}</p>
      </div>
      <div className="intro-actions">
        {canCreate
          ? <button className="button button-bright" onClick={() => navigate(pagePath('Create Opportunity'))}><Plus size={16} /> Create opportunity</button>
          : <button className="button button-quiet" onClick={() => flash(`${name} preferences opened`)}><Filter size={15} /> Filters</button>}
      </div>
    </div>
  )
}
