import { useState } from 'react'
import {
  ArrowRight, ArrowUpRight, Bell, Check, ChevronRight,
  FileCheck2, MessageCircle, Plus, Send, ShieldAlert,
  Sparkles, Star, Users, Wallet, Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/authContext'
import { useAppState } from '../../app/appStateContext'
import { listings } from '../../data/listings'
import StatCard from '../StatCard'
import ProfileForm from '../ProfileForm'
import WorkspaceOverview, { RecordTable } from '../WorkspaceOverview'

const projects = [
  { name: 'Open identity protocol', description: 'Portable, user-owned identity for every chain.', status: 'Building', team: 5, tags: ['Identity', 'Solidity'] },
  { name: 'Public goods dashboard', description: 'Make ecosystem impact visible and measurable.', status: 'Seeking teammates', team: 3, tags: ['Impact', 'Data'] },
  { name: 'DeFi risk visualizer', description: 'A clearer view of protocol risk, before it matters.', status: 'Idea', team: 2, tags: ['DeFi', 'Frontend'] },
]

const services = [
  { name: 'Smart contract architecture', category: 'ENGINEERING', price: 'From $1,200', initials: 'JD', rating: '4.9', tint: 'service-blue' },
  { name: 'Protocol identity & brand', category: 'DESIGN', price: 'From $800', initials: 'MK', rating: '5.0', tint: 'service-red' },
  { name: 'Community launch sprint', category: 'GROWTH', price: 'From $600', initials: 'AR', rating: '4.8', tint: 'service-slate' },
]

const messages = [
  { person: 'Maya Kim', initials: 'MK', preview: 'I’d love to help with the identity layer.', time: '10:42', active: true },
  { person: 'Optimism Collective', initials: 'OC', preview: 'Thanks for your application, Jordan.', time: 'Yesterday', active: false },
  { person: 'Alex Rivera', initials: 'AR', preview: 'Are you joining the build sprint?', time: 'Mon', active: false },
]

const alerts = [
  { icon: FileCheck2, title: 'Application viewed', text: 'Optimism Collective viewed your application.', when: '12 min ago', color: 'blue' },
  { icon: MessageCircle, title: 'A new message from Maya', text: '“I’d love to help with the identity layer.”', when: '1 hour ago', color: 'red' },
  { icon: Sparkles, title: 'You earned 50 reputation points', text: 'Your contribution to Open Identity was recognized.', when: 'Yesterday', color: 'gold' },
  { icon: Users, title: 'You have 3 new collaborators', text: 'Builders working in zero knowledge found your profile.', when: 'Yesterday', color: 'blue' },
]

export default function WorkspaceExperience({ name, mode }: { name: string; mode: 'member' | 'organization' | 'admin' }) {
  if (name === 'Edit Profile' || name === 'Settings' || name === 'Create Opportunity') return <ProfileForm name={name} />
  if (name === 'Profile') return <ProfileExperience />
  if (name === 'My Projects') return <ProjectExperience />
  if (name === 'My Services') return <ServiceExperience />
  if (name === 'My Applications') return <ApplicationExperience saved={false} />
  if (name === 'Saved Items') return <ApplicationExperience saved />
  if (name === 'Messages') return <MessagesExperience />
  if (name === 'Notifications') return <NotificationExperience />
  if (name === 'Achievements') return <AchievementExperience />
  if (name === 'Reputation') return <ReputationExperience />
  if (name === 'Manage Applicants') return <ApplicantExperience />
  if (name === 'Users') return <RecordTable name="Users" records={['Jordan Davis · Member', 'Arena Studio · Organization', 'Maya Kim · Member', 'Alex Rivera · Member']} />
  if (name === 'Content Moderation') return <ModerationExperience />
  if (name === 'Analytics') return <AnalyticsExperience mode={mode} />
  if (name === 'Admin Dashboard') return <AdminDashboard />
  if (name === 'Org Dashboard') return <OrganizationDashboard />
  return <WorkspaceOverview flash={() => undefined} title="Picked for you" />
}

function ProfileExperience() {
  const { user } = useAuth()
  return <div className="profile-experience">
    <section className="profile-hero-card">
      <div className="profile-cover"><span className="cover-orbit cover-orbit-one" /><span className="cover-orbit cover-orbit-two" /><span className="profile-level">LEVEL 08 · BUILDER</span></div>
      <div className="profile-identity"><span className="profile-avatar">{user?.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() ?? 'JD'}</span><div><h2>{user?.name ?? 'Jordan Davis'}</h2><p>Web3 builder · {user?.focus ?? 'Building in public, one useful thing at a time.'}</p></div><Link to="/edit-profile" className="button button-quiet">Edit profile</Link></div>
      <div className="profile-stats"><span><b>2,450</b><small>REPUTATION</small></span><span><b>18</b><small>CONTRIBUTIONS</small></span><span><b>327</b><small>IN YOUR ORBIT</small></span><span><b>3</b><small>PROJECTS</small></span></div>
    </section>
    <div className="profile-lower"><section className="dashboard-panel profile-about"><span className="section-kicker">THE SHORT VERSION</span><h2>Building tools that make the open internet feel more human.</h2><p>Currently exploring identity, public goods, and the small details that make software feel welcoming. Always happy to pair with thoughtful people.</p><div className="tag-row"><span className="tag">Solidity</span><span className="tag">Product</span><span className="tag">Community</span><span className="tag">Base</span></div></section><section className="dashboard-panel"><span className="section-kicker">RECENT MOMENTUM</span><div className="profile-milestone"><span className="milestone-icon"><Zap size={15} /></span><span><b>Joined Open identity protocol</b><small>3 days ago · Project contributor</small></span></div><div className="profile-milestone"><span className="milestone-icon milestone-red"><Star size={15} /></span><span><b>Recognized by the community</b><small>Last week · 50 reputation</small></span></div></section></div>
  </div>
}

function ProjectExperience() {
  const { flash } = useAppState()
  return <div className="project-experience"><div className="project-summary"><div><span className="section-kicker">THE THINGS YOU’RE MAKING</span><h2>Ideas become real here.</h2></div><button className="button button-bright" onClick={() => flash('Project draft created')}><Plus size={15} /> Start a project</button></div><div className="project-grid">{projects.map((project, index) => <article className={`project-card project-card-${index}`} key={project.name}><div className="project-card-head"><span className="project-glyph">{['◈', '↗', '⌘'][index]}</span><span className={`project-status status-${index}`}>{project.status}</span></div><h3>{project.name}</h3><p>{project.description}</p><div className="tag-row">{project.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><div className="project-card-foot"><span><Users size={14} /> {project.team} builders</span><button onClick={() => flash(`Opening ${project.name}`)} aria-label={`Open ${project.name}`}><ArrowUpRight size={16} /></button></div></article>)}</div></div>
}

function ServiceExperience() {
  const { flash } = useAppState()
  return <div className="service-experience"><div className="service-callout"><div><span className="section-kicker">YOUR WORK, OUT IN THE WORLD</span><h2>Make your skills<br />easy to find.</h2><p>Clear offers help the right projects find the right people.</p></div><button className="button button-bright" onClick={() => flash('Service listing editor opened')}><Plus size={15} /> Add a service</button></div><div className="service-list">{services.map((service) => <article className="service-card" key={service.name}><div className={`service-art ${service.tint}`}><span>{service.initials}</span><i>{service.category}</i></div><div className="service-details"><span className="section-kicker">{service.category}</span><h3>{service.name}</h3><div className="service-rating"><Star size={13} fill="currentColor" /> {service.rating} <span>· 12 reviews</span></div><div className="service-bottom"><b>{service.price}</b><button className="button button-quiet" onClick={() => flash(`Editing ${service.name}`)}>Manage</button></div></div></article>)}</div></div>
}

function ApplicationExperience({ saved }: { saved: boolean }) {
  return <div className="application-experience"><div className="application-banner"><span className="section-kicker">{saved ? 'YOUR SHORTLIST' : 'YOUR NEXT CHAPTER'}</span><h2>{saved ? 'Worth another look.' : 'Every big move starts somewhere.'}</h2><p>{saved ? 'A shortlist of things you don’t want to lose track of.' : 'A clear view of every conversation you’ve started.'}</p></div><div className="application-list">{listings.slice(saved ? 1 : 0, saved ? 4 : 3).map((item, index) => <article className="application-row" key={item.title}><span className={`org-mark ${item.color}`}>{item.logo}</span><div className="application-copy"><span className="section-kicker">{item.org}</span><h3>{item.title}</h3><small>{saved ? `Saved ${index + 1} days ago` : `Submitted ${index + 1} days ago`}</small></div><span className={`application-state application-state-${index}`}>{saved ? 'Saved' : ['In review', 'Viewed', 'Shortlisted'][index]}</span><button aria-label={`View ${item.title}`}><ArrowUpRight size={17} /></button></article>)}</div></div>
}

function MessagesExperience() {
  const [selected, setSelected] = useState(0)
  const [message, setMessage] = useState('')
  const { flash } = useAppState()
  return <div className="messages-experience"><aside className="inbox-list"><div className="inbox-heading"><div><span className="section-kicker">YOUR PEOPLE</span><h2>Inbox</h2></div><button onClick={() => flash('New message started')} aria-label="New message"><Plus size={17} /></button></div><label className="inbox-search">⌕ &nbsp; Search conversations</label>{messages.map((item, index) => <button className={`conversation ${selected === index ? 'conversation-selected' : ''}`} key={item.person} onClick={() => setSelected(index)}><span className={`conversation-avatar conversation-${index}`}>{item.initials}</span><span><b>{item.person}</b><small>{item.preview}</small></span><time>{item.time}</time></button>)}</aside><section className="chat-window"><div className="chat-top"><span className="conversation-avatar conversation-0">MK</span><span><b>{messages[selected].person}</b><small>Builder · active today</small></span><button aria-label="Conversation details">···</button></div><div className="chat-content"><span className="chat-date">TODAY · 10:42 AM</span><div className="chat-bubble chat-theirs">Hey Jordan! I saw your project update. I’d love to help with the identity layer.</div><div className="chat-bubble chat-mine">That would be great. We’re mapping out contributor roles this week.</div><div className="chat-bubble chat-theirs">Perfect — send me the brief when you have it.</div></div><form className="chat-compose" onSubmit={(event) => { event.preventDefault(); if (message.trim()) flash('Message sent'); setMessage('') }}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a thoughtful reply…" /><button aria-label="Send message"><Send size={16} /></button></form></section></div>
}

function NotificationExperience() {
  const [unread, setUnread] = useState(true)
  return <div className="notification-experience"><div className="notification-hero"><span className="notification-hero-icon"><Bell size={21} /></span><div><span className="section-kicker">THE SIGNAL</span><h2>You’re in the loop.</h2><p>Relevant updates from the builders around you.</p></div><button className="button button-quiet" onClick={() => setUnread(false)}>Mark all as read</button></div>{alerts.map((alert, index) => { const Icon = alert.icon; return <article className={`notification-row ${unread && index < 2 ? 'notification-unread' : ''}`} key={alert.title}><span className={`alert-icon alert-${alert.color}`}><Icon size={17} /></span><div><b>{alert.title}</b><p>{alert.text}</p><small>{alert.when}</small></div>{unread && index < 2 && <i />}</article> })}</div>
}

function AchievementExperience() {
  const badges = [
    ['First Build', 'You shipped your first onchain project.', '01', true],
    ['Open Source', 'You made your first public contribution.', '02', true],
    ['Good Neighbor', 'You helped another builder move forward.', '03', true],
    ['Signal Booster', 'You shared work that inspired the community.', '04', false],
    ['Team Builder', 'You helped bring five contributors together.', '05', false],
    ['Ecosystem Pioneer', 'You made a lasting ecosystem contribution.', '06', false],
  ] as const
  return <div className="achievement-experience"><div className="achievement-hero"><div><span className="section-kicker">PROOF OF SHOWING UP</span><h2>Keep making<br />good things happen.</h2><p>Your work leaves a mark. These are some of them.</p></div><div className="achievement-total"><strong>03</strong><span>OF 06 EARNED</span></div></div><div className="achievement-grid">{badges.map(([title, description, number, earned]) => <article className={`achievement-card ${earned ? 'achievement-earned' : 'achievement-locked'}`} key={title}><span className="badge-number">{number}</span><span className="badge-glyph">{earned ? '✳' : '◌'}</span><h3>{title}</h3><p>{description}</p><small>{earned ? 'EARNED · VERIFIED' : 'LOCKED · KEEP BUILDING'}</small></article>)}</div></div>
}

function ReputationExperience() {
  const points = [34, 45, 39, 58, 52, 72, 64, 84, 77, 92, 78, 100]
  return <div className="reputation-experience"><div className="rep-hero"><div><span className="section-kicker">YOUR IMPACT, OVER TIME</span><h2>Trust is built<br />one contribution at a time.</h2><p>Your reputation reflects what the community has seen you do.</p></div><div className="rep-score"><strong>2,450</strong><span>REPUTATION POINTS</span><small><ArrowUpRight size={14} /> +12.8% this month</small></div></div><section className="dashboard-panel reputation-chart"><div className="panel-title"><div><span className="section-kicker">LAST 12 WEEKS</span><h2>Consistent work compounds.</h2></div><span className="chart-label">+ 280 pts</span></div><div className="chart-area"><div className="chart-y"><span>2.5k</span><span>2.0k</span><span>1.5k</span><span>1.0k</span></div><div className="chart-bars">{points.map((point, index) => <span key={index} style={{ height: `${point}%` }} />)}</div></div><div className="chart-x"><span>12 weeks ago</span><span>6 weeks ago</span><span>Today</span></div></section><div className="rep-sources"><div><Zap size={16} /><b>Project contributions</b><span>1,280 pts</span></div><div><Users size={16} /><b>Community recognition</b><span>720 pts</span></div><div><FileCheck2 size={16} /><b>Verified skills</b><span>450 pts</span></div></div></div>
}

function ApplicantExperience() {
  const applicants = [
    ['Maya Kim', 'Smart contract engineer', '98%', 'Top match'],
    ['Alex Rivera', 'Developer relations', '91%', 'New'],
    ['Sam Patel', 'Product designer', '86%', 'Reviewed'],
    ['Riley Chen', 'Protocol researcher', '82%', 'New'],
  ]
  return <div className="applicant-experience"><div className="applicant-highlight"><span className="section-kicker">TALENT IS ALREADY HERE</span><h2>Meet your next great teammate.</h2><p>12 builders applied across your active roles.</p><div><b>04</b><span>OPEN ROLES</span><b>12</b><span>NEW APPLICANTS</span><b>03</b><span>SHORTLISTED</span></div></div><section className="dashboard-panel applicant-table"><div className="panel-title"><div><span className="section-kicker">BEST FIT, FIRST</span><h2>Applicants</h2></div><button className="button button-quiet"><ChevronRight size={14} /> All roles</button></div>{applicants.map(([person, role, match, status], index) => <div className="applicant-row" key={person}><span className={`avatar applicant-avatar applicant-${index}`}>{person.split(' ').map((part) => part[0]).join('')}</span><span><b>{person}</b><small>{role}</small></span><span className="match-score">{match}<small>MATCH</small></span><span className={`record-state state-${index}`}>{status}</span><button aria-label={`Open ${person}'s profile`}><ArrowUpRight size={16} /></button></div>)}</section></div>
}

function AdminDashboard() {
  const { flash } = useAppState()
  return <div className="admin-experience"><div className="admin-banner"><div><span className="section-kicker">ARENA OPERATIONS · TUESDAY, OCTOBER 6</span><h2>Good morning.<br /><em>The Arena is moving.</em></h2><p>Here’s what needs your attention today.</p></div><div className="admin-seal"><ShieldAlert size={25} /><b>TRUST<br />CENTER</b></div></div><div className="stats-row"><StatCard label="Members this month" value="12.4k" change="+18.6%" icon={<Users size={17} />} /><StatCard label="Live opportunities" value="384" change="42 new this week" icon={<Zap size={17} />} /><StatCard label="Reports to review" value="06" change="2 urgent" icon={<ShieldAlert size={17} />} /><StatCard label="Platform health" value="99.9%" change="All systems operational" icon={<Check size={17} />} /></div><div className="dashboard-columns"><section className="dashboard-panel"><div className="panel-title"><div><span className="section-kicker">TRIAGE FIRST</span><h2>Needs a human look</h2></div><Link to="/admin/content-moderation">Review queue <ArrowRight size={14} /></Link></div><div className="moderation-teaser"><span className="alert-icon alert-red"><ShieldAlert size={17} /></span><span><b>Community report · Project listing</b><small>Reported for inaccurate funding claims</small></span><button onClick={() => flash('Moderation case opened')}>Review</button></div><div className="moderation-teaser"><span className="alert-icon alert-gold"><MessageCircle size={17} /></span><span><b>Spam pattern · Discussion thread</b><small>4 similar reports in the last hour</small></span><button onClick={() => flash('Moderation case opened')}>Review</button></div></section><section className="admin-uptime"><span className="section-kicker">THE ARENA, RIGHT NOW</span><div className="uptime-ring"><strong>99.9<small>%</small></strong><span>UPTIME</span></div><p>Everything is running smoothly.<br /><b>Thank you for keeping it that way.</b></p></section></div></div>
}

function OrganizationDashboard() {
  return <div className="org-dashboard-experience"><div className="org-banner"><div className="org-monogram">A</div><div><span className="section-kicker">ORGANIZATION STUDIO</span><h2>Arena Studio</h2><p>Your hiring, partnerships, and ecosystem activity — all together.</p></div><Link className="button button-bright" to="/organization/create-opportunity"><Plus size={15} /> Create opportunity</Link></div><div className="stats-row"><StatCard label="Active opportunities" value="04" change="2 roles closing soon" icon={<Zap size={17} />} /><StatCard label="New applicants" value="12" change="+6 since Monday" icon={<Users size={17} />} /><StatCard label="Applications viewed" value="86%" change="Above ecosystem average" icon={<FileCheck2 size={17} />} /><StatCard label="Grant funds deployed" value="$48k" change="Across 9 builders" icon={<Wallet size={17} />} /></div><div className="org-action-row"><div><span className="section-kicker">YOUR NEXT STEP</span><h3>12 builders are waiting to hear from you.</h3></div><Link className="button button-quiet" to="/organization/manage-applicants">Meet your applicants <ArrowRight size={15} /></Link></div></div>
}

function AnalyticsExperience({ mode }: { mode: 'member' | 'organization' | 'admin' }) {
  const data = mode === 'admin'
    ? { label: 'PLATFORM HEALTH', title: 'A healthier Arena, every week.', metrics: [['12.4k', 'Active members'], ['384', 'Opportunities'], ['99.9%', 'Uptime'], ['06', 'Reports pending']], values: [40, 52, 48, 66, 72, 62, 84, 77, 94, 82, 100, 92] }
    : { label: 'YOUR ECOSYSTEM SIGNAL', title: 'Good work travels further.', metrics: [['1,284', 'Opportunity views'], ['86%', 'Applicant response'], ['4.8', 'Organization rating'], ['$48k', 'Funds deployed']], values: [30, 38, 44, 35, 56, 49, 71, 65, 83, 76, 92, 100] }
  return <div className="analytics-experience"><div className="analytics-hero"><span className="section-kicker">{data.label}</span><h2>{data.title}</h2><p>THE LAST 12 WEEKS <span>·</span> LIVE DATA PREVIEW</p></div><div className="analytics-metrics">{data.metrics.map(([value, label]) => <div key={label}><span>{label}</span><b>{value}</b><small><ArrowUpRight size={13} /> Trending up</small></div>)}</div><section className="dashboard-panel analytics-chart"><div className="panel-title"><div><span className="section-kicker">GROWTH, NOT JUST NUMBERS</span><h2>More builders finding their place.</h2></div><button className="button button-quiet">Last 12 weeks <ChevronRight size={14} /></button></div><div className="analytics-plot"><div className="plot-lines"><i /><i /><i /><i /></div><div className="plot-bars">{data.values.map((value, index) => <span key={index} style={{ height: `${value}%` }}><i /></span>)}</div></div><div className="chart-x"><span>Jul 14</span><span>Aug 11</span><span>Sep 08</span><span>Oct 06</span></div></section></div>
}

function ModerationExperience() {
  const [resolved, setResolved] = useState<string[]>([])
  const reports = [
    ['Misleading opportunity', 'A funding amount appears inconsistent with the project brief.', 'HIGH', 'Opportunity · 18 min ago'],
    ['Repeated promotional links', 'Same link posted in 5 discussions by a new account.', 'MEDIUM', 'Discussion · 42 min ago'],
    ['Impersonation concern', 'Community reported an organization profile using copied branding.', 'HIGH', 'Organization · 1 hr ago'],
    ['Low-quality project content', 'Listing may be missing required project information.', 'LOW', 'Project · 3 hr ago'],
  ]
  return <div className="moderation-experience"><div className="moderation-banner"><span className="moderation-icon"><ShieldAlert size={23} /></span><div><span className="section-kicker">KEEPING THE ARENA HUMAN</span><h2>Context before clicks.</h2><p>Every report deserves a thoughtful review.</p></div><div className="queue-count"><b>{reports.length - resolved.length}</b><span>IN QUEUE</span></div></div>{reports.filter(([title]) => !resolved.includes(title)).map(([title, text, severity, meta], index) => <article className="report-card" key={title}><div className={`report-severity severity-${severity.toLowerCase()}`}>{severity}</div><div className="report-content"><h3>{title}</h3><p>{text}</p><small>{meta}</small></div><button className="button button-quiet" onClick={() => setResolved([...resolved, title])}><Check size={14} /> Resolve</button><button className="report-open" aria-label={`Open ${title}`}><ArrowUpRight size={17} /></button><span className="report-number">0{index + 1}</span></article>)}{resolved.length === reports.length && <div className="moderation-clear"><Check size={18} /> Queue cleared. Good work.</div>}</div>
}
