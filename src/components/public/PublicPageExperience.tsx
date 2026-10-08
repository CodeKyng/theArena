import { ArrowRight, ArrowUpRight, Download, MessageCircle, Plus, Search, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppState } from '../../app/appStateContext'

const communities = [
  ['Zero Knowledge Collective', 'Proofs, privacy, and people making the math useful.', '2,480', '◈', 'blue'],
  ['Onchain Creators', 'A studio for culture, experiments, and internet-native art.', '1,836', '✳', 'red'],
  ['Base Builders', 'Build in the open. Ship on Base. Bring a friend.', '1,204', 'B', 'pale'],
  ['Women in Web3', 'A generous network of women building what comes next.', '986', 'W', 'deep'],
]

const courses = [
  ['Your first smart contract', 'Solidity basics · 8 lessons', 'BEGINNER', '94%'],
  ['Designing for onchain', 'Product design · 6 lessons', 'ALL LEVELS', '87%'],
  ['Zero knowledge, clearly', 'Cryptography · 12 lessons', 'INTERMEDIATE', '82%'],
]

const organizations = [
  ['Optimism Collective', 'Public goods, built together.', 'Protocol', 'OP'],
  ['Base', 'Bringing the world onchain.', 'Ecosystem', 'B'],
  ['Ethereum Foundation', 'Supporting Ethereum and its community.', 'Foundation', 'Ξ'],
  ['Protocol Labs', 'Advancing the decentralized web.', 'Research', 'PL'],
]

const discussions = [
  ['What would make an onchain identity feel human?', 'A useful identity should tell a story, not just prove a wallet.', '24', '182'],
  ['How are you measuring public goods impact?', 'We have funding data. How do we show the outcomes?', '18', '146'],
  ['What are you building this week?', 'Small demos, rough edges and works in progress welcome.', '37', '318'],
  ['Best practices for a first audit?', 'Looking for a process other small teams can actually use.', '12', '96'],
]

const members = [
  ['01', 'Maya Kim', 'Zero-knowledge engineer', '3,840', 'MK'],
  ['02', 'Jordan Davis', 'Product-minded builder', '2,450', 'JD'],
  ['03', 'Alex Rivera', 'Community architect', '2,180', 'AR'],
  ['04', 'Sam Patel', 'Protocol designer', '1,920', 'SP'],
  ['05', 'Riley Chen', 'Open-source researcher', '1,760', 'RC'],
]

export default function PublicPageExperience({ name }: { name: string }) {
  const { flash } = useAppState()
  if (name === 'Communities') return <CommunityDirectory />
  if (name === 'Learning Hub') return <LearningDirectory />
  if (name === 'Organizations') return <OrganizationDirectory />
  if (name === 'Resources') return <ResourceDirectory />
  if (name === 'Discussions') return <DiscussionBoard />
  if (name === 'Leaderboard') return <Leaderboard />
  return <section className="extra-page-panel"><h2>{name}</h2><p>Find your next step in the Arena.</p><button className="button button-bright" onClick={() => flash(`Exploring ${name}`)}>Explore <ArrowRight size={15} /></button></section>
}

function CommunityDirectory() {
  return <div className="community-experience">
    <section className="community-banner"><div className="community-banner-art"><span>◈</span><i>✳</i><b>⌘</b></div><div><span className="section-kicker">FIND YOUR CORNER OF THE INTERNET</span><h2>Belong to something<br /><em>being built.</em></h2><p>Small rooms. Big ideas. People who show up for each other.</p></div><div className="community-total"><b>284</b><small>COMMUNITIES</small><b>18.2k</b><small>BUILDERS INSIDE</small></div></section>
    <div className="public-toolbar"><span>CURATED FOR BUILDERS</span><button><Search size={15} /> Search communities</button></div>
    <div className="community-grid">{communities.map(([title, description, count, glyph, color], index) => <article className="community-card" key={title}><div className={`community-card-art community-art-${color}`}><span>{glyph}</span><small>COMMUNITY / 0{index + 1}</small></div><h3>{title}<ShieldCheck size={14} /></h3><p>{description}</p><div className="community-card-foot"><span><Users size={13} /> {count} builders</span><Link to="/register">Join community <ArrowUpRight size={14} /></Link></div></article>)}</div>
  </div>
}

function LearningDirectory() {
  return <div className="learning-experience">
    <section className="learning-hero"><div><span className="section-kicker">LEARN IT. BUILD IT. PASS IT ON.</span><h2>Build your next<br /><em>superpower.</em></h2><p>Skill paths made by builders who remember what starting felt like.</p><button className="button button-bright">Explore learning paths <ArrowRight size={15} /></button></div><div className="learning-hero-card"><span className="course-index">LEARNING PATH 01</span><div className="course-glyph">λ</div><span className="course-label">THE ONCHAIN BUILDER</span><b>From first line<br />to first launch.</b><div className="course-path">01 <i /> 02 <i /> 03 <i /> 04</div></div></section>
    <div className="learning-subhead"><div><span className="section-kicker">POPULAR RIGHT NOW</span><h3>Good places to begin.</h3></div><button>Browse all courses <ArrowRight size={14} /></button></div>
    <div className="course-list">{courses.map(([title, details, level, rating], index) => <article className="course-row" key={title}><span className={`course-thumb course-thumb-${index}`}>{['⌘', '◒', '◈'][index]}</span><span className="course-copy"><span className="section-kicker">{level} · {details.split(' · ')[0]}</span><b>{title}</b><small>{details.split(' · ')[1]} · By a builder, for builders</small></span><span className="course-progress"><i style={{ width: rating }} /><small>{rating} learner approval</small></span><button aria-label={`Open ${title}`}><ArrowUpRight size={16} /></button></article>)}</div>
  </div>
}

function OrganizationDirectory() {
  return <div className="organization-experience">
    <section className="organization-banner"><div><span className="section-kicker">THE PEOPLE BEHIND THE PROTOCOLS</span><h2>Meet the teams<br />moving things forward.</h2><p>Find organizations that match what you want to put into the world.</p></div><div className="organization-numbers"><strong>486</strong><span>VERIFIED TEAMS</span><strong>1.2k</strong><span>OPEN ROLES</span></div></section>
    <div className="organization-featured"><span className="section-kicker">FEATURED ECOSYSTEMS</span><div>{['Ethereum', 'Optimism', 'Base', 'Arbitrum'].map((item, index) => <button key={item} className={index === 0 ? 'ecosystem-active' : ''}>{item}</button>)}</div></div>
    <div className="organization-grid">{organizations.map(([name, description, type, initials], index) => <article key={name} className={`organization-card org-card-${index}`}><div className="organization-card-top"><span className={`organization-logo logo-${index}`}>{initials}</span><span className="org-verified"><ShieldCheck size={13} /> VERIFIED</span></div><span className="section-kicker">{type}</span><h3>{name}</h3><p>{description}</p><div className="organization-card-bottom"><span>{index * 3 + 4} open roles <i>·</i> {index * 2 + 3} active projects</span><ArrowUpRight size={16} /></div></article>)}</div>
  </div>
}

function ResourceDirectory() {
  const resources = [
    ['FIELD GUIDE', 'The first 30 days of building in public', 'A practical playbook for getting your work in front of the right people.', '8 MIN READ'],
    ['TOOLKIT', 'A no-drama DAO launch checklist', 'Governance, treasury, contributor onboarding — in the right order.', 'DOWNLOAD'],
    ['ECOSYSTEM MAP', 'Where public goods funding lives', 'A map of grants, retro funding rounds, and open calls.', 'INTERACTIVE'],
    ['TEMPLATE', 'Contributor onboarding that feels human', 'Help new collaborators find the work, people, and context they need.', 'COPY TEMPLATE'],
  ]
  const { flash } = useAppState()
  return <div className="resource-experience"><section className="resource-feature"><span className="resource-feature-mark">R/</span><div><span className="section-kicker">THE OPEN BUILDER LIBRARY</span><h2>Useful things.<br /><em>No gatekeeping.</em></h2><p>Field notes, tools, templates, and hard-won lessons from people doing the work.</p></div><span className="resource-count">01—24<br /><small>GOOD RESOURCES</small></span></section><div className="resource-toolbar"><span>THE COMMUNITY’S TOOLBOX</span><button><Search size={14} /> Find a resource</button></div><div className="resource-list">{resources.map(([type, title, description, format], index) => <article key={title} className="resource-row"><span className="resource-number">0{index + 1}</span><span className={`resource-stamp stamp-${index}`}>{['↗', '☷', '◉', '⌘'][index]}</span><div><span className="section-kicker">{type}</span><h3>{title}</h3><p>{description}</p></div><span className="resource-format">{format}</span><button onClick={() => flash(`${title} opened`)} aria-label={`Open ${title}`}>{index === 1 || index === 3 ? <Download size={16} /> : <ArrowUpRight size={16} />}</button></article>)}</div></div>
}

function DiscussionBoard() {
  return <div className="discussion-experience"><section className="discussion-hero"><span className="discussion-glyph">?</span><div><span className="section-kicker">THE ROOM WHERE IDEAS GET BETTER</span><h2>Ask the question.<br /><em>Start the conversation.</em></h2><p>Thoughtful builders, honest answers, no stupid questions.</p></div><button className="button button-bright"><Plus size={15} /> Start a discussion</button></section><div className="discussion-controls"><span>TODAY IN THE ARENA <i /> 248 builders talking</span><div><button className="discussion-active">For you</button><button>Unanswered</button><button>Popular</button></div></div><div className="discussion-list">{discussions.map(([title, excerpt, replies, views], index) => <article key={title} className="discussion-row"><span className={`discussion-votes vote-${index}`}><b>{Number(views) + 2}</b><small>VOTES</small></span><div className="discussion-copy"><span className="section-kicker">{['IDENTITY & PRIVACY', 'PUBLIC GOODS', 'BUILD IN PUBLIC', 'SECURITY'][index]} · {index + 1}H AGO</span><h3>{title}</h3><p>{excerpt}</p><div className="discussion-meta"><span className="mini-avatar">{['MK', 'JD', 'AR', 'SP'][index]}</span><b>{['Maya Kim', 'Jordan Davis', 'Alex Rivera', 'Sam Patel'][index]}</b><span>·</span><span>{index + 3} min read</span></div></div><span className="discussion-replies"><MessageCircle size={14} /> {replies}<small>replies</small></span><ArrowUpRight className="discussion-go" size={16} /></article>)}</div></div>
}

function Leaderboard() {
  return <div className="leaderboard-experience"><section className="leaderboard-hero"><div><span className="section-kicker">REPUTATION, EARNED IN PUBLIC</span><h2>Good work<br />gets noticed.</h2><p>Celebrating the builders who make the whole ecosystem better.</p><div className="leaderboard-period"><button className="period-active">This month</button><button>All time</button><button>Rising</button></div></div><div className="podium"><div className="podium-person podium-second"><span>MK</span><b>Maya</b><small>3,840 XP</small><i>02</i></div><div className="podium-person podium-first"><span>AR</span><b>Alex</b><small>4,120 XP</small><i>01</i></div><div className="podium-person podium-third"><span>JD</span><b>Jordan</b><small>2,450 XP</small><i>03</i></div></div></section><div className="rank-list">{members.map(([rank, name, role, score, initials], index) => <article className={`rank-row ${index === 1 ? 'rank-you' : ''}`} key={rank}><span className="rank-number">{rank}</span><span className={`rank-avatar rank-${index}`}>{initials}</span><span className="rank-person"><b>{name}{index === 1 && <i>YOU</i>}</b><small>{role}</small></span><span className="rank-meter"><i style={{ width: `${100 - index * 13}%` }} /></span><strong>{score}<small> XP</small></strong><span className="rank-change"><ArrowUpRight size={14} /> {index + 2}.4%</span></article>)}</div></div>
}
