import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CheckCircle2, Clock, Plus, Users, Video } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import DirectoryShowcase from '../components/public/DirectoryShowcase'
import { getHouseName } from '../domain/constants'
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
  const { state, currentMember, can, rsvpEvent, recordEventAttendance, openQuickCreate } = useArena()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | EventKind | 'past'>('all')
  const [roleChoice, setRoleChoice] = useState<Record<string, EventAttendanceRole>>({})
  const [targetMemberChoice, setTargetMemberChoice] = useState<Record<string, string>>({})

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
    <div className="inner-page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DirectoryShowcase
          variant="events"
          kicker="LIVE SESSIONS & GATHERINGS"
          headline="Arena Events"
          detail="Join workshops, House sessions, onboarding welcomes, AMAs, and portfolio review rooms. Attendance earns +5 XP and +1 CP (up to 10 CP per season); Support and Host roles reward active facilitation."
          metric={String(upcomingCount)}
          metricLabel="UPCOMING EVENTS"
          actionLabel={currentMember ? 'Propose Event' : 'Explore Houses'}
          actionTo="/houses"
          onActionClick={() => (currentMember ? openQuickCreate('event') : navigate('/houses'))}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {currentMember ? (
            <div className="arena-notice arena-notice-info" style={{ flex: '1 1 300px', margin: 0 }}>
              <Calendar size={16} />
              <span>
                Seasonal Event Attendance CP used: <b>{seasonAttendanceCp} / {state.config.seasonalCpCaps.eventAttendancePerSeason} CP</b>
              </span>
            </div>
          ) : (
            <div />
          )}

          {currentMember && (
            <button type="button" className="button button-bright" onClick={() => openQuickCreate('event')}>
              <Plus size={15} /> Propose Event
            </button>
          )}
        </div>

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
            const selectedMemberId = targetMemberChoice[ev.id] ?? currentMember?.id ?? state.members[0]?.id ?? ''
            const canVerifyEvent = Boolean(
              currentMember &&
                (can('event.manage', ev.houseId ?? undefined) ||
                  (ev.houseId ? can('house.manage', ev.houseId) : false) ||
                  can('moderator') ||
                  can('platform.admin')),
            )

            return (
              <article className="listing-card" key={ev.id}>
                <div className="listing-top">
                  <span className="listing-kind kind-featured">{ev.kind}</span>
                  {house && <span className="tag">{house.glyph} House {getHouseName(house.id, state.houses)}</span>}
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

                <div className="listing-bottom" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                  {!ev.isPast && currentMember ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        {myRsvp?.status === 'attended' ? (
                          <span className="listing-kind kind-success">
                            <CheckCircle2 size={13} /> Attendance verified
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={`button button-small ${myRsvp ? 'button-quiet' : 'button-bright'}`}
                            onClick={() => rsvpEvent(ev.id, 'attendee')}
                          >
                            {myRsvp ? <><CheckCircle2 size={13} /> Registered · Cancel RSVP</> : 'RSVP Seat'}
                          </button>
                        )}
                      </div>

                      {canVerifyEvent && (
                        <div style={{ paddingTop: 10, borderTop: '1px solid #e6edf6', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#52647d' }}>
                            Steward Check-In (Simulated)
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <select
                              aria-label={`Select member for ${ev.title}`}
                              className="filter-select"
                              style={{ height: 32 }}
                              value={selectedMemberId}
                              onChange={(e) => setTargetMemberChoice((p) => ({ ...p, [ev.id]: e.target.value }))}
                            >
                              {state.members.map((m) => (
                                <option key={m.id} value={m.id}>{m.displayName}</option>
                              ))}
                            </select>
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
                              onClick={() => recordEventAttendance(ev.id, selectedMemberId, selectedRole)}
                            >
                              Mark Verified (Simulated)
                            </button>
                          </div>
                          <small style={{ fontSize: 11, color: '#70829a' }}>
                            Demo check-in — production attendance verification requires server-side authorisation.
                          </small>
                        </div>
                      )}
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
    </div>
  )
}
