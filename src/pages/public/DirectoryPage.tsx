import { useMemo, useState } from 'react'
import { ChevronDown, Filter, Search } from 'lucide-react'
import { useAppState } from '../../app/appStateContext'
import { descriptions } from '../../data/pageContent'
import { listings } from '../../data/listings'
import EmptyState from '../../components/EmptyState'
import ListingCard from '../../components/ListingCard'
import PageScaffold from '../../components/PageScaffold'
import DirectoryShowcase from '../../components/public/DirectoryShowcase'

export default function DirectoryPage({ name }: { name: string }) {
  const [activeFilter, setActiveFilter] = useState('For you')
  const [searchTerm, setSearchTerm] = useState('')
  const { search, flash } = useAppState()
  const pageListings = useMemo(() => {
    const local = searchTerm.trim().toLowerCase()
    const global = search.trim().toLowerCase()
    const filtered = listings.filter((item) => {
      const content = `${item.title} ${item.org} ${item.description} ${item.tags.join(' ')}`.toLowerCase()
      return (!local || content.includes(local)) && (!global || content.includes(global))
    })
    if (name === 'Grants') return filtered.filter((item) => item.kind === 'Grant')
    if (name === 'Bounties') return filtered.filter((item) => item.kind === 'Bounty')
    if (name === 'Hackathons' || name === 'Events') return filtered.filter((item) => item.kind === 'Hackathon')
    if (name === 'Opportunities') return filtered.filter((item) => item.kind === 'Opportunity')
    return filtered
  }, [name, search, searchTerm])

  return <PageScaffold name={name} description={descriptions[name]} section="THE ARENA / EXPLORE" flash={flash}>
    <DirectoryShowcase name={name} />
    <div className="discovery-toolbar">
      <label className="discovery-search"><Search size={17} /><input placeholder={`Search ${name.toLowerCase()}...`} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /><kbd>↵</kbd></label>
      <div className="filter-pills">{['For you', 'Trending', 'Newest'].map((filter) => <button className={activeFilter === filter ? 'selected' : ''} onClick={() => setActiveFilter(filter)} key={filter}>{filter}</button>)}</div>
      <button className="button button-quiet filter-button" onClick={() => flash('Showing all filters')}><Filter size={15} /> All filters <span>2</span></button>
    </div>
    <div className="result-summary">
      <span><b>{pageListings.length === 0 ? 'No' : pageListings.length === listings.length ? '1,284' : pageListings.length} results</b> for builders like you</span>
      <span>Sort: <b>{activeFilter === 'For you' ? 'Best match' : activeFilter} <ChevronDown size={13} /></b></span>
    </div>
    {pageListings.length
      ? <div className="opportunity-grid">{pageListings.map((item) => <ListingCard key={item.title} item={item} flash={flash} />)}</div>
      : <EmptyState name={name} onClear={() => setSearchTerm('')} />}
  </PageScaffold>
}
