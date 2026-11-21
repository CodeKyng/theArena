import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CheckCircle2, Clock, Plus, Users, Video } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import DirectoryShowcase from '../components/public/DirectoryShowcase'
import type { EventAttendanceRole, EventKind } from '../domain/types'

const EVENT_FILTERS: ('all' | EventKind | 'past')[] = [
  'all',
  'Arena-Wide',
  'House Session',
  'Workshop',
  'AMA',
  'Onboarding Session',
  'Portfolio Review',
  'past',
]

export default function EventsPage() {
  const { state, currentMember, rsvpEvent, recordEventAttendance, openQuickCreate } = useArena()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | EventKind | 'past'>('all')
  const [roleChoice, setRoleChoice] = useState<Record<string, EventAttendanceRole>>({})

  const filtered = state.events.filter((ev) => {
    if (filter === 'past') return ev.isPast
    if (filter === 'all') return true
    return ev.kind === filter && !ev.isPast
  })

  const upcomingCount = state.events.filter((e) => !e.isPast).length

  const seasonAttendanceCp = currentMember
    ? state.cpEvents
        .filter(
          (e) =>
            e.memberId === currentMember.id &&
            e.seasonId === state.currentSeason.id &&
            e.activityCategory === 'event_attendance',
        )
        .reduce((sum, e) => sum + e.cpAmount, 0)
    : 0

  return (
    <PageScaffold
      section="LIVE SESSIONS & GATHERINGS"
      name="Arena Events"
      description={`RSVP for AMAs, workshops, onboarding welcomes, and portfolio reviews. Attendance awards +${state.config.systemXpValues.eventAttendance} XP (+1 CP, capped at ${state.config.seasonalCpCaps.eventAttendancePerSeason} CP/season); Support (+35 XP/+5 CP) and Host (+75 XP/+10 CP) roles reward active facilitation.`}
      actions={
        currentMember ? (
          <button type="button" className="button button-bright" onClick={() => openQuickCreate('event')}>
            <Plus size={15} /> Propose Event
          </button>
        ) : undefined
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DirectoryShowcase
          variant="events"
          kicker="SHOW UP. MEET YOUR PEOPLE."
          headline="Good conversations change direction."
          detail="Live workshops, House sessions, onboarding welcomes, AMAs, and portfolio review rooms."
          metric={String(upcomingCount)}
          metricLabel="UPCOMING EVENTS"
          actionLabel={currentMember ? 'Propose an Event' : 'Explore Houses'}
          actionTo="/houses"
          onActionClick={() => (currentMember ? openQuickCreate('event') : navigate('/houses'))}
        />

        {currentMember && (
          <div className="arena-notice arena-notice-info">
            <Calendar size={16} />
            <span>
              Your seasonal Event Attendance CP: <b>{seasonAttendanceCp} / {state.config.seasonalCpCaps.eventAttendancePerSeason} CP</b> cap used this season.
            </span>
          </div>
        )}

        <div className="arena-tabs">
          {EVENT_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`arena-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Upcoming & All' : f === 'past' ? 'Past & Recordings' : f}
            </button>
          ))}
        </div>

        <div className="arena-grid-2">
          {filtered.map((ev) => {
            const house = ev.houseId ? state.houses.find((h) => h.id === ev.houseId) : null
            const host = state.members.find((m) => m.id === ev.hostMemberId)
            const rsvps = state.eventParticipations.filter((ep) => ep.eventId === ev.id && ep.status !== 'cancelled')
            const myRsvp = currentMember ? rsvps.find((ep) => ep.memberId === currentMember.id) : undefined
            const selectedRole = roleChoice[ev.id] ?? 'attendee'

            return (
              <article className="listing-card" key={ev.id}>
                <div className="listing-top">
                  <span className="listing-kind kind-featured">{ev.kind}</span>
                  {house && <span className="tag">{house.glyph} House {house.name}</span>}
                  {ev.isPast && <span className="listing-kind"><Video size={12} /> Recording</span>}
                </div>

                <h3>{ev.title}</h3>
                <p>{ev.description}</p>

                <div style={{ fontSize: 12.5, color: '#52647d', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span><Clock size={13} style={{ verticalAlign: 'middle' }} /> {new Date(ev.startsAt).toLocaleString()} ({ev.durationMinutes} min)</span>
                  <span><Users size={13} style={{ verticalAlign: 'middle' }} /> Host: {host?.displayName ?? 'Arena'} · {rsvps.length} / {ev.capacity} registered · {ev.locationOrLink}</span>
                </div>

                {ev.recordingNote && (
                  <div className="arena-notice arena-notice-info" style={{ padding: '8px 10px', fontSize: 12 }}>
                    {ev.recordingNote}
                  </div>
                )}

                <div className="listing-bottom" style={{ flexWrap: 'wrap', gap: 8 }}>
                  {!ev.isPast && currentMember ? (
                    <>
                      <button
                        type="button"
                        className={`button button-small ${myRsvp ? 'button-quiet' : 'button-bright'}`}
                        onClick={() => rsvpEvent(ev.id, 'attendee')}
                      >
                        {myRsvp ? <><CheckCircle2 size={13} /> Registered ({myRsvp.status}) — Cancel</> : 'RSVP Seat'}
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <select
                          aria-label={`Select attendance role for ${ev.title}`}
                          className="filter-select"
                          style={{ height: 32 }}
                          value={selectedRole}
                          onChange={(e) => setRoleChoice((p) => ({ ...p, [ev.id]: e.target.value as EventAttendanceRole }))}
                        >
                          <option value="attendee">Attendee (+5 XP / +1 CP)</option>
                          <option value="support">Support Role (+35 XP / +5 CP)</option>
                          <option value="host">Host Role (+75 XP / +10 CP)</option>
                        </select>
                        <button
                          type="button"
                          className="button button-quiet button-small"
                          onClick={() => recordEventAttendance(ev.id, currentMember.id, selectedRole)}
                        >
                          Verify Attendance
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="listing-reward">{ev.isPast ? 'Archive Session' : 'Sign in to RSVP'}</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </PageScaffold>
  )
}
