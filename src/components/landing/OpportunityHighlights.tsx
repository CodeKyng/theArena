import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listings } from '../../data/listings'
import { useAppState } from '../../app/appStateContext'
import ListingCard from '../ListingCard'

export default function OpportunityHighlights() {
  const { flash } = useAppState()
  return <section className="discover-section section-wrap">
    <div className="section-heading">
      <div><div className="section-kicker">YOUR NEXT MOVE</div><h2>Find where you <em>fit.</em></h2><p>Good things happen when the right people find each other.</p></div>
      <Link className="text-link" to="/discover">Explore everything <ArrowRight size={16} /></Link>
    </div>
    <div className="opportunity-grid">{listings.slice(0, 3).map((item) => <ListingCard key={item.title} item={item} flash={flash} />)}</div>
  </section>
}
