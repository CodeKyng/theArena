import { ArrowRight, ArrowUpRight, CalendarDays, CircleDollarSign, Flame, Sparkles, Trophy, Users, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import nexusHeroBackground from '../../assets/NexusHeroBg.jpg'
import nexusHero from '../../assets/NexusHero.png'

const spotlight: Record<string, { kicker: string; headline: string; detail: string; metric: string; metricLabel: string; icon: ReactNode; action: string }> = {
  Discover: { kicker: 'YOUR NEXT MOVE STARTS HERE', headline: 'The right door is closer than you think.', detail: 'A living map of people, projects, and ways to get involved.', metric: '1,284', metricLabel: 'FRESH PATHS IN', icon: <Sparkles size={21} />, action: 'See what’s moving' },
  Opportunities: { kicker: 'YOUR WORK DESERVES A BIGGER STAGE', headline: 'Find the work that finds you.', detail: 'Real roles with real teams. Make your next move count.', metric: '86', metricLabel: 'NEW THIS WEEK', icon: <Zap size={21} />, action: 'View featured roles' },
  Projects: { kicker: 'OPEN IDEAS, OPEN DOORS', headline: 'Find a problem worth your weekends.', detail: 'Join a team with momentum, or bring a skill they’re missing.', metric: '327', metricLabel: 'PROJECTS SEEKING BUILDERS', icon: <Users size={21} />, action: 'Meet the teams' },
  Services: { kicker: 'GOOD PEOPLE. GREAT WORK.', headline: 'Find the specialist your build needs.', detail: 'A trusted network of independent Web3 talent.', metric: '642', metricLabel: 'VERIFIED SPECIALISTS', icon: <Sparkles size={21} />, action: 'Browse services' },
  Grants: { kicker: 'FUND THE WORK THAT MATTERS', headline: 'Make the idea fundable.', detail: 'Funding programs from the ecosystems that need your work.', metric: '$4.8m', metricLabel: 'OPEN FUNDING', icon: <CircleDollarSign size={21} />, action: 'Explore funding programs' },
  Bounties: { kicker: 'SKILL IN. IMPACT OUT.', headline: 'Solve something. Get rewarded.', detail: 'Clear scopes, fair rewards, and work the ecosystem actually needs.', metric: '38', metricLabel: 'BOUNTIES OPEN NOW', icon: <Flame size={21} />, action: 'Pick a challenge' },
  Hackathons: { kicker: 'YOUR NEXT ALL-NIGHTER, WITH PURPOSE', headline: 'One weekend can change everything.', detail: 'Find your team, pick a track, and ship something real.', metric: '$520k', metricLabel: 'PRIZES ON THE LINE', icon: <Trophy size={21} />, action: 'See the hackathons' },
  Events: { kicker: 'SHOW UP. MEET YOUR PEOPLE.', headline: 'Good conversations change direction.', detail: 'Builder meetups, working sessions, and ecosystem gatherings.', metric: '24', metricLabel: 'EVENTS THIS MONTH', icon: <CalendarDays size={21} />, action: 'Find your next room' },
}

export default function DirectoryShowcase({ name }: { name: string }) {
  const content = spotlight[name] ?? spotlight.Discover
  return <section className={`directory-showcase directory-${name.toLowerCase().replaceAll(' ', '-')}`}>
    <img className="directory-showcase-background" src={nexusHeroBackground} alt="" aria-hidden="true" />
    <img className="directory-showcase-hero" src={nexusHero} alt="Nexus digital builder" />
    <div className="directory-showcase-main"><span className="section-kicker">{content.kicker}</span><h2>{content.headline}</h2><p>{content.detail}</p><Link to={name === 'Projects' ? '/communities' : '/register'}>{content.action} <ArrowRight size={15} /></Link></div>
    <div className="directory-showcase-side"><span className="showcase-symbol">{content.icon}</span><strong>{content.metric}</strong><small>{content.metricLabel}</small><button aria-label={`Explore ${name}`}><ArrowUpRight size={17} /></button></div>
    <div className="showcase-ornament" aria-hidden="true"><i /><i /><i /></div>
  </section>
}
