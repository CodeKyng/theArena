import type { ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Compass, Flame, GraduationCap, Sparkles, Target, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import nexusHeroBackground from '../../assets/NexusHeroBg.jpg'
import nexusHero from '../../assets/NexusHero.png'

export interface DirectoryShowcaseProps {
  variant?: 'missions' | 'houses' | 'explore' | 'academy' | 'events'
  kicker: string
  headline: string
  detail: string
  metric: string
  metricLabel: string
  actionLabel: string
  actionTo: string
  icon?: ReactNode
  onActionClick?: () => void
}

const DEFAULT_ICONS: Record<NonNullable<DirectoryShowcaseProps['variant']>, ReactNode> = {
  missions: <Target size={21} />,
  houses: <Flame size={21} />,
  explore: <Compass size={21} />,
  academy: <GraduationCap size={21} />,
  events: <CalendarDays size={21} />,
}

export default function DirectoryShowcase({
  variant = 'explore',
  kicker,
  headline,
  detail,
  metric,
  metricLabel,
  actionLabel,
  actionTo,
  icon,
  onActionClick,
}: DirectoryShowcaseProps) {
  return (
    <section className={`directory-showcase directory-${variant}`}>
      <img
        className="directory-showcase-background"
        src={nexusHeroBackground}
        alt=""
        aria-hidden="true"
      />
      <img
        className="directory-showcase-hero"
        src={nexusHero}
        alt="The Arena Spartan builder"
      />
      <div className="directory-showcase-main">
        <span className="section-kicker">{kicker}</span>
        <h2>{headline}</h2>
        <p>{detail}</p>
        <Link to={actionTo}>
          {actionLabel} <ArrowRight size={15} />
        </Link>
      </div>
      <div className="directory-showcase-side">
        <span className="showcase-symbol">{icon ?? DEFAULT_ICONS[variant] ?? <Sparkles size={21} />}</span>
        <strong>{metric}</strong>
        <small>{metricLabel}</small>
        <button
          type="button"
          onClick={onActionClick}
          aria-label={actionLabel}
        >
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="showcase-ornament" aria-hidden="true"><i /><i /><i /></div>
    </section>
  )
}
