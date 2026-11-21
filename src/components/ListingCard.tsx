import { ArrowUpRight, Bookmark } from 'lucide-react'

export interface ArenaListingCardProps {
  glyph: string
  tone?: 'blue' | 'red' | 'slate' | 'deep' | 'purple' | 'green'
  kind: string
  kindTone?: 'default' | 'featured' | 'success' | 'amber'
  secondaryBadge?: string
  meta: string
  title: string
  description: string
  tags?: string[]
  reward?: string
  saved?: boolean
  onToggleSave?: () => void
  actionLabel?: string
  onOpen?: () => void
}

export default function ListingCard({
  glyph,
  tone = 'blue',
  kind,
  kindTone = 'default',
  secondaryBadge,
  meta,
  title,
  description,
  tags = [],
  reward,
  saved = false,
  onToggleSave,
  actionLabel,
  onOpen,
}: ArenaListingCardProps) {
  const kindClass =
    kindTone === 'featured'
      ? 'listing-kind kind-featured'
      : kindTone === 'success'
        ? 'listing-kind kind-success'
        : kindTone === 'amber'
          ? 'listing-kind kind-amber'
          : 'listing-kind'

  return (
    <article className="listing-card">
      <div className="listing-top">
        <span className={`org-mark ${tone}`}>{glyph}</span>
        <span className={kindClass}>
          {kindTone === 'featured' && <i aria-hidden="true" />}
          {kind}
        </span>
        {secondaryBadge && (
          <span className="listing-kind kind-featured">{secondaryBadge}</span>
        )}
        {onToggleSave && (
          <button
            type="button"
            className={`save-button ${saved ? 'saved' : ''}`}
            onClick={onToggleSave}
            aria-label={saved ? 'Remove bookmark' : 'Save bookmark'}
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <span className="listing-org">{meta}</span>
      <h3>{title}</h3>
      <p>{description}</p>

      {tags.length > 0 && (
        <div className="tag-row">
          {tags.slice(0, 4).map((tag) => (
            <span className="tag" key={tag}>{tag}</span>
          ))}
        </div>
      )}

      {(reward || onOpen) && (
        <div className="listing-bottom">
          <span className="listing-reward">{reward ?? ''}</span>
          {onOpen && (
            <button
              type="button"
              className="arrow-button"
              onClick={onOpen}
              aria-label={`Open ${title}`}
            >
              {actionLabel && <span>{actionLabel}</span>}
              <ArrowUpRight size={16} />
            </button>
          )}
        </div>
      )}
    </article>
  )
}
