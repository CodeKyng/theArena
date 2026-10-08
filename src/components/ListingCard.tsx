import { useState } from 'react'
import { ArrowUpRight, Bookmark } from 'lucide-react'
import type { Listing } from '../data/listings'

export default function ListingCard({ item, flash }: { item: Listing; flash: (message: string) => void }) {
  const [saved, setSaved] = useState(false)
  return (
    <article className="listing-card">
      <div className="listing-top">
        <span className={`org-mark ${item.color}`}>{item.logo}</span>
        <span className={`listing-kind ${item.featured ? 'kind-featured' : ''}`}>{item.featured && <i />}{item.kind}</span>
        <button className={`save-button ${saved ? 'saved' : ''}`} onClick={() => {
          setSaved(!saved)
          flash(saved ? 'Removed from saved items' : 'Saved for later')
        }} aria-label={saved ? 'Unsave listing' : 'Save listing'}>
          <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <span className="listing-org">{item.org}</span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <div className="tag-row">{item.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      <div className="listing-bottom">
        <span className="listing-reward">{item.reward}</span>
        <button className="arrow-button" onClick={() => flash(`Opening ${item.title}`)} aria-label={`View ${item.title}`}>
          <ArrowUpRight size={18} />
        </button>
      </div>
    </article>
  )
}
