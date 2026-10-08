import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { popularTopics } from '../../data/listings'

export default function CommunitySection() {
  return <section className="builder-section section-wrap" id="community">
    <div className="builder-intro"><div className="section-kicker">A PLACE TO BEGIN</div><h2>Not just a network.<br /><em>Your next chapter.</em></h2><p>Meet the people who get it. Find a project that needs you. Make something that matters.</p><Link className="button button-bright" to="/register">Find your people <ArrowRight size={16} /></Link></div>
    <div className="topic-panel">
      <div className="topic-panel-head"><div><span className="section-kicker">FIND YOUR CORNER</span><h3>What are you into?</h3></div><span className="topic-count">01 — 03</span></div>
      {popularTopics.map((topic, index) => <Link to="/communities" className="topic-row" key={topic.title}>
        <span className={`topic-icon ${topic.color}`}>{topic.icon}</span><span className="topic-name"><b>{topic.title}</b><small>{topic.count}</small></span>
        <span className="topic-index">0{index + 1}</span><ArrowUpRight size={17} />
      </Link>)}
    </div>
  </section>
}
