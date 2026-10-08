import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Sparkles, Users, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listings } from '../data/listings'
import StatCard from './StatCard'

export default function WorkspaceOverview({ flash, title = 'Picked for you', link = '/opportunities' }: {
  flash: (message: string) => void
  title?: string
  link?: string
}) {
  return <>
    <div className="stats-row">
      <StatCard label="Your reputation" value="2,450" change="+12.8%" icon={<Sparkles size={17} />} />
      <StatCard label="Applications" value="08" change="2 new" icon={<BriefcaseBusiness size={17} />} />
      <StatCard label="People in your orbit" value="1,204" change="+28 this week" icon={<Users size={17} />} />
      <StatCard label="Your projects" value="03" change="1 looking for you" icon={<Zap size={17} />} />
    </div>
    <div className="dashboard-columns">
      <section className="dashboard-panel">
        <div className="panel-title"><div><span className="section-kicker">MADE FOR YOUR NEXT MOVE</span><h2>{title}</h2></div><Link to={link}>See all <ArrowRight size={14} /></Link></div>
        {listings.slice(0, 3).map((item) => <div className="compact-listing" key={item.title}>
          <span className={`org-mark ${item.color}`}>{item.logo}</span><span><b>{item.title}</b><small>{item.org} · {item.kind}</small></span>
          <button onClick={() => flash(`Opening ${item.title}`)} aria-label={`Open ${item.title}`}><ArrowUpRight size={17} /></button>
        </div>)}
      </section>
      <section className="dashboard-panel activity-panel">
        <div className="panel-title"><div><span className="section-kicker">YOUR MOMENTUM</span><h2>Small wins add up.</h2></div></div>
        <div className="progress-copy"><span>Level 8 · Builder</span><b>82%</b></div><div className="progress-track"><i /></div>
        <p>You’re <b>550 XP</b> away from your next level. Keep showing up.</p>
        <Link to="/achievements" className="text-link">See your achievements <ArrowRight size={14} /></Link>
      </section>
    </div>
  </>
}

export function RecordTable({ name, records }: { name: string; records: string[] }) {
  return <section className="dashboard-panel record-panel">
    <div className="panel-title"><div><span className="section-kicker">LATEST ACTIVITY</span><h2>{name}</h2></div><button className="text-link">View all <ArrowRight size={14} /></button></div>
    {records.map((record, index) => <div className="compact-listing" key={record}>
      <span className={`org-mark ${['blue', 'red', 'green', 'purple'][index]}`}>{String(index + 1).padStart(2, '0')}</span>
      <span><b>{record}</b><small>{['Updated just now', 'Updated 2 hours ago', 'Updated yesterday', 'Updated this week'][index]}</small></span>
      <span className={`record-state state-${index}`}>{['Active', 'In review', 'Published', 'Complete'][index]}</span>
    </div>)}
  </section>
}
