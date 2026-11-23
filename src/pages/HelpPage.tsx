import { Link } from 'react-router-dom'
import { ArrowRight, Award, BookOpen, HelpCircle, ShieldAlert, Target } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import {
  ASCENDANCY_LADDER,
  DISCUSSION_UNLOCK_LEVEL,
  LEVEL_THRESHOLDS,
} from '../domain/constants'

export default function HelpPage() {
  const { state, currentMember } = useArena()
  const { seasonalCpCaps } = state.config

  return (
    <PageScaffold
      section="Guide"
      name="Help & Arena Guide"
      description="How The Arena progression model, Houses, Missions, and verification policies work."
      actions={
        <Link className="button button-bright" to={currentMember ? '/dashboard' : '/login'}>
          {currentMember ? 'Back to Dashboard' : 'Sign in'} <ArrowRight size={14} />
        </Link>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="dashboard-columns">
          <section className="dashboard-panel">
            <div className="panel-title">
              <h2><Target size={16} style={{ verticalAlign: 'middle' }} /> Getting Started as a Spartan</h2>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--arena-muted)', marginTop: 0 }}>
              Every member starts with a unified Spartan account. Complete the 5-step Dashboard checklist—starting with Orientation &amp; Rules Check (+20 XP), House alignment, Profile setup, your first Academy lesson, and the Intro Mission.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link className="button button-quiet button-small" to="/academy">
                <BookOpen size={14} /> Open Academy
              </Link>
              <Link className="button button-quiet button-small" to="/missions/mis-intro">
                <Target size={14} /> View Intro Mission
              </Link>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-title">
              <h2><ShieldAlert size={16} style={{ verticalAlign: 'middle' }} /> Fair Play &amp; Proof of Work</h2>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--arena-muted)', marginTop: 0 }}>
              Arena rewards require tangible Proof of Work (links, deliverables, structured notes, or steward check-ins). Anti-engagement-farming rules prohibit missions or outreach that reward buying likes, reposts, follows, or artificial views.
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--arena-subtle)', marginBottom: 0 }}>
              Seasonal CP caps: Event attendance ({seasonalCpCaps.eventAttendancePerSeason} CP/season), Community support ({seasonalCpCaps.communitySupportPerSeason} CP/season), and Mentorship ({seasonalCpCaps.mentorshipPairPerSeason} CP/pair/season).
            </p>
          </section>
        </div>

        <div className="dashboard-columns">
          <section className="dashboard-panel">
            <div className="panel-title">
              <h2><Award size={16} style={{ verticalAlign: 'middle' }} /> Progression: XP, Levels &amp; Ascendancy</h2>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: 'var(--arena-ink-soft)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                <b>Lifetime XP &amp; 30 Levels:</b> Monotonic progression from Level 1 (0 XP) up to Level 30 ({LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].toLocaleString()} XP).
              </li>
              <li>
                <b>Spendable XP:</b> Used to fund Missions or commission community Services without lowering your Lifetime XP or Level.
              </li>
              <li>
                <b>Discussions Unlock at Level {DISCUSSION_UNLOCK_LEVEL}:</b> Reaching Level {DISCUSSION_UNLOCK_LEVEL} ({LEVEL_THRESHOLDS[DISCUSSION_UNLOCK_LEVEL - 1].toLocaleString()} Lifetime XP) unlocks creating new Discussions in Explore. All Spartans can read and reply to discussions.
              </li>
              <li>
                <b>Contribution Points (CP):</b> Measure seasonal and all-time verified activity separately from XP.
              </li>
            </ul>
          </section>

          <section className="dashboard-panel">
            <div className="panel-title">
              <h2>Ascendancy Ladder</h2>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--arena-muted)', marginTop: 0 }}>
              Ascendancy ranks are earned through sustained stewardship and leadership rather than XP thresholds alone:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ASCENDANCY_LADDER.map((tier) => (
                <div key={tier.rank} style={{ fontSize: 13, borderTop: '1px solid var(--arena-line)', paddingTop: 6 }}>
                  <b>{tier.rank}:</b> <span style={{ color: 'var(--arena-muted)' }}>{tier.summary}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="dashboard-panel">
          <div className="panel-title">
            <h2><HelpCircle size={16} style={{ verticalAlign: 'middle' }} /> Arena Glossary</h2>
          </div>
          <div className="arena-grid-2">
            {state.glossary.map((entry) => (
              <div key={entry.term} style={{ padding: 12, border: '1px solid var(--arena-line)', borderRadius: 8 }}>
                <b style={{ fontSize: 13.5, color: 'var(--arena-ink)' }}>{entry.term}</b>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--arena-muted)' }}>{entry.definition}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-title">
            <h2>Demo Mode &amp; Local Persistence</h2>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--arena-muted)' }}>
            All actions in this prototype save locally in your browser. Use the Demo Persona switcher in the top utility bar to explore different member levels, Houses, and permissions.
          </p>
        </section>
      </div>
    </PageScaffold>
  )
}
