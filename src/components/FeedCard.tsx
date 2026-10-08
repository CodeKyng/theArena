import { ArrowRight, Bookmark } from 'lucide-react'
import { useState } from 'react'

const details = [
  'A thriving corner of the Arena',
  'Posted by a fellow builder · 2h ago',
  'The community is growing fast',
  'A good place to make your next move',
]

export default function FeedCard({ title, index, community, flash }: {
  title: string
  index: number
  community: boolean
  flash: (message: string) => void
}) {
  const [saved, setSaved] = useState(false)
  const logos = ['◈', 'A', '✳', '↗']
  const colors = ['violet', 'blue', 'green', 'red']
  return <article className="feed-card">
    <div className="feed-card-top">
      <span className={`org-mark ${colors[index]}`}>{logos[index]}</span>
      <span><b>{title}</b><small>{details[index]}</small></span>
      <button className={`save-button ${saved ? 'saved' : ''}`} onClick={() => {
        setSaved(!saved)
        flash(saved ? 'Removed from saved items' : 'Saved for later')
      }} aria-label={saved ? 'Unsave item' : 'Save item'}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button>
    </div>
    <p>{community
      ? 'A curious, welcoming group of builders pushing the boundaries of what’s possible. Come share what you’re working on and find people to build alongside.'
      : 'There’s something good happening here. Find out what the community is building, share your ideas, and make a connection that moves things forward.'}</p>
    <div className="feed-footer"><span>◉ &nbsp;{index * 317 + 248} members</span><button onClick={() => flash(`Opening ${title}`)}>Take a look <ArrowRight size={14} /></button></div>
  </article>
}
