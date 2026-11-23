import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  Compass,
  FolderGit2,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Target,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useArena } from '../app/arenaContext'
import { DISCUSSION_UNLOCK_LEVEL } from '../domain/constants'
import type { EventKind, ExploreOpportunity, ExploreProject, ExploreResource, HouseId } from '../domain/types'

export default function GlobalModals() {
  const {
    state,
    currentMember,
    levelProgress,
    can,
    searchModalOpen,
    setSearchModalOpen,
    quickCreateKind,
    openQuickCreate,
    addProject,
    addService,
    addResource,
    addOpportunity,
    proposeEvent,
    createDiscussion,
  } = useArena()
  const navigate = useNavigate()
  const isSpartan = currentMember?.membershipStatus === 'spartan'
  const canCreateDiscussion = Boolean(isSpartan && levelProgress.level >= DISCUSSION_UNLOCK_LEVEL)

  const [query, setQuery] = useState('')

  // Quick Create shared form state
  const [title, setTitle] = useState('')
  const [houseId, setHouseId] = useState<HouseId>(currentMember?.primaryHouseId ?? 'forge-masters')
  const [summary, setSummary] = useState('')
  const [secondaryText, setSecondaryText] = useState('')
  const [xpRate, setXpRate] = useState('200')
  const [projectStatus, setProjectStatus] = useState<ExploreProject['status']>('Building')
  const [oppKind, setOppKind] = useState<ExploreOpportunity['kind']>('Role')
  const [resKind, setResKind] = useState<ExploreResource['kind']>('Field Guide')
  const [eventKind, setEventKind] = useState<EventKind>('Workshop')
  const [eventDate, setEventDate] = useState('2026-12-05T17:00')

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (s: string) => !q || s.toLowerCase().includes(q)

    const missions = state.missions
      .filter((m) => match(`${m.title} ${m.category} ${m.tags.join(' ')} ${m.houseId}`))
      .slice(0, 4)
    const houses = state.houses
      .filter((h) => match(`${h.name} ${h.tagline} ${h.focusAreas.join(' ')}`))
      .slice(0, 3)
    const people = state.members
      .filter((m) => (m.privacy.publicProfileVisible || m.id === currentMember?.id) && match(`${m.displayName} ${m.username} ${m.headline} ${m.skills.join(' ')}`))
      .slice(0, 4)
    const paths = state.academyPaths
      .filter((p) => match(`${p.title} ${p.subtitle} ${p.track}`))
      .slice(0, 3)
    const events = state.events
      .filter((e) => match(`${e.title} ${e.kind} ${e.description}`))
      .slice(0, 3)
    const projects = state.projects
      .filter((p) => match(`${p.title} ${p.tagline} ${p.tags.join(' ')}`))
      .slice(0, 3)

    return { missions, houses, people, paths, events, projects }
  }, [query, state, currentMember?.id])

  const resetForm = () => {
    setTitle('')
    setSummary('')
    setSecondaryText('')
    setXpRate('200')
  }

  const handleQuickCreateSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!currentMember) {
      navigate('/login')
      openQuickCreate(null)
      return
    }

    if (quickCreateKind === 'project') {
      const res = addProject({
        title,
        tagline: secondaryText || summary.slice(0, 80),
        description: summary,
        houseId,
        status: projectStatus,
        tags: [houseId, projectStatus],
        repoOrDemoUrl: 'https://github.com/thearena-demo/project',
        teamSize: 1,
      })
      if (res.ok) {
        resetForm()
        openQuickCreate(null)
        navigate('/explore?tab=projects')
      }
    } else if (quickCreateKind === 'service') {
      const res = addService({
        title,
        categoryLabel: secondaryText || 'Builder Service',
        description: summary,
        houseId,
        suggestedXpRate: Math.max(25, Number(xpRate) || 150),
        tags: [houseId, 'Service'],
      })
      if (res.ok) {
        resetForm()
        openQuickCreate(null)
        navigate('/explore?tab=services')
      }
    } else if (quickCreateKind === 'resource') {
      const res = addResource({
        title,
        kind: resKind,
        houseId,
        summary,
        formatLabel: secondaryText || `${resKind.toUpperCase()} · MARKDOWN`,
      })
      if (res.ok) {
        resetForm()
        openQuickCreate(null)
        navigate('/explore?tab=resources')
      }
    } else if (quickCreateKind === 'opportunity') {
      const res = addOpportunity({
        title,
        organisationName: secondaryText || 'Independent Ecosystem Partner',
        houseId,
        kind: oppKind,
        compensationLabel: 'Grant / Mission Stipend',
        description: summary,
        tags: [oppKind, houseId],
      })
      if (res.ok) {
        resetForm()
        openQuickCreate(null)
        navigate('/explore?tab=opportunities')
      }
    } else if (quickCreateKind === 'event') {
      const res = proposeEvent({
        title,
        description: summary,
        kind: eventKind,
        houseId,
        startsAt: new Date(eventDate).toISOString(),
        durationMinutes: 60,
        locationOrLink: secondaryText || 'Arena Virtual Hall',
        capacity: 40,
      })
      if (res.ok) {
        resetForm()
        openQuickCreate(null)
        navigate('/events')
      }
    } else if (quickCreateKind === 'discussion') {
      const res = createDiscussion({
        title,
        topicTag: secondaryText || 'Community',
        houseId,
        body: summary,
      })
      if (res.ok) {
        resetForm()
        openQuickCreate(null)
        navigate('/explore?tab=discussions')
      }
    }
  }

  return (
    <>
      {searchModalOpen && (
        <div
          className="arena-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Global Arena Search"
          onClick={() => setSearchModalOpen(false)}
        >
          <div className="arena-modal" onClick={(e) => e.stopPropagation()}>
            <div className="arena-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <Search size={18} color="#1e5cb5" />
                <input
                  autoFocus
                  type="search"
                  className="arena-input"
                  placeholder="Search missions, Houses, members, Academy, events, or projects..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setSearchModalOpen(false)}
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {searchResults.missions.length > 0 && (
                <div>
                  <div className="section-kicker" style={{ marginBottom: 6 }}>Missions</div>
                  {searchResults.missions.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="button button-quiet"
                      style={{ width: '100%', justifyContent: 'space-between', marginBottom: 6 }}
                      onClick={() => {
                        setSearchModalOpen(false)
                        navigate(`/missions/${m.id}`)
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Target size={14} color="#1e5cb5" /> {m.title}
                      </span>
                      <span className="listing-kind">{m.budget.rewardPerContributorXp} XP</span>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.houses.length > 0 && (
                <div>
                  <div className="section-kicker" style={{ marginBottom: 6 }}>Houses</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {searchResults.houses.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        className="button button-quiet button-small"
                        onClick={() => {
                          setSearchModalOpen(false)
                          navigate(`/houses/${h.slug}`)
                        }}
                      >
                        {h.glyph} House {h.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.people.length > 0 && (
                <div>
                  <div className="section-kicker" style={{ marginBottom: 6 }}>People</div>
                  {searchResults.people.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="button button-quiet"
                      style={{ width: '100%', justifyContent: 'space-between', marginBottom: 6 }}
                      onClick={() => {
                        setSearchModalOpen(false)
                        navigate(`/explore?tab=people&q=${encodeURIComponent(p.displayName)}`)
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Users size={14} color="#1e5cb5" /> {p.displayName} (@{p.username})
                      </span>
                      <span className="tag">{p.ascendancyRank}</span>
                    </button>
                  ))}
                </div>
              )}

              {(searchResults.paths.length > 0 || searchResults.events.length > 0 || searchResults.projects.length > 0) && (
                <div>
                  <div className="section-kicker" style={{ marginBottom: 6 }}>Academy, Events & Projects</div>
                  {searchResults.paths.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="button button-quiet"
                      style={{ width: '100%', justifyContent: 'space-between', marginBottom: 6 }}
                      onClick={() => {
                        setSearchModalOpen(false)
                        navigate('/academy')
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={14} color="#1e5cb5" /> {p.title}
                      </span>
                      <span className="tag">Academy</span>
                    </button>
                  ))}
                  {searchResults.events.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      className="button button-quiet"
                      style={{ width: '100%', justifyContent: 'space-between', marginBottom: 6 }}
                      onClick={() => {
                        setSearchModalOpen(false)
                        navigate('/events')
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={14} color="#1e5cb5" /> {ev.title}
                      </span>
                      <span className="tag">{ev.kind}</span>
                    </button>
                  ))}
                  {searchResults.projects.map((pr) => (
                    <button
                      key={pr.id}
                      type="button"
                      className="button button-quiet"
                      style={{ width: '100%', justifyContent: 'space-between', marginBottom: 6 }}
                      onClick={() => {
                        setSearchModalOpen(false)
                        navigate('/explore?tab=projects')
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <FolderGit2 size={14} color="#1e5cb5" /> {pr.title}
                      </span>
                      <span className="tag">{pr.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {quickCreateKind && (
        <div
          className="arena-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Quick Create in The Arena"
          onClick={() => openQuickCreate(null)}
        >
          <div className="arena-modal" onClick={(e) => e.stopPropagation()}>
            <div className="arena-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color="#1e5cb5" />
                <h3>Quick Create</h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => openQuickCreate(null)}
                aria-label="Close Quick Create"
              >
                <X size={18} />
              </button>
            </div>

            <div className="arena-tabs" style={{ marginBottom: 16 }}>
              {can('mission.create') && (
                <button
                  type="button"
                  className="arena-tab"
                  onClick={() => {
                    openQuickCreate(null)
                    navigate('/missions/new')
                  }}
                >
                  <Target size={14} /> Mission Wizard
                </button>
              )}
              {(
                [
                  ['project', 'Project', FolderGit2],
                  ['service', 'Service', Wrench],
                  ['resource', 'Resource', Compass],
                  ['opportunity', 'Opportunity', Sparkles],
                  ['event', 'Event', Calendar],
                  ['discussion', 'Discussion', MessageSquare],
                ] as const
              ).map(([kind, label, Icon]) => {
                const tabDisabled = kind === 'discussion' && !canCreateDiscussion
                return (
                  <button
                    key={kind}
                    type="button"
                    disabled={tabDisabled}
                    className={`arena-tab ${quickCreateKind === kind ? 'active' : ''}`}
                    title={tabDisabled ? `Discussion creation unlocks at Level ${DISCUSSION_UNLOCK_LEVEL}.` : undefined}
                    onClick={() => {
                      if (!tabDisabled) openQuickCreate(kind)
                    }}
                  >
                    <Icon size={14} /> {label}
                  </button>
                )
              })}
            </div>

            {quickCreateKind === 'mission' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 13.5, color: '#52647d' }}>
                  Missions use a guided 7-step setup with Spendable XP rewards and review criteria.
                </p>
                {can('mission.create') ? (
                  <button
                    type="button"
                    className="button button-bright"
                    onClick={() => {
                      openQuickCreate(null)
                      navigate('/missions/new')
                    }}
                  >
                    Open Mission Wizard
                  </button>
                ) : (
                  <div className="arena-notice arena-notice-warn">
                    Your account does not have Mission Creator permission yet. In Demo Mode, switch to Jordan Davis or Maya Kim, or ask a Control Room admin.
                  </div>
                )}
              </div>
            ) : (
              <form className="form-grid" onSubmit={handleQuickCreateSubmit}>
                <label className="full-field">
                  Title
                  <input
                    required
                    placeholder={`Enter ${quickCreateKind} title`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>

                <label>
                  Primary House
                  <select value={houseId} onChange={(e) => setHouseId(e.target.value as HouseId)}>
                    {state.houses.map((h) => (
                      <option key={h.id} value={h.id}>
                        House {h.name}
                      </option>
                    ))}
                  </select>
                </label>

                {quickCreateKind === 'project' && (
                  <label>
                    Project Stage
                    <select value={projectStatus} onChange={(e) => setProjectStatus(e.target.value as ExploreProject['status'])}>
                      <option value="Idea">Idea</option>
                      <option value="Building">Building</option>
                      <option value="Beta">Beta</option>
                      <option value="Live">Live</option>
                    </select>
                  </label>
                )}

                {quickCreateKind === 'service' && (
                  <label>
                    Suggested Commission Rate (XP)
                    <input type="number" min={25} max={1500} value={xpRate} onChange={(e) => setXpRate(e.target.value)} />
                  </label>
                )}

                {quickCreateKind === 'opportunity' && (
                  <label>
                    Opportunity Type
                    <select value={oppKind} onChange={(e) => setOppKind(e.target.value as ExploreOpportunity['kind'])}>
                      <option value="Role">Role</option>
                      <option value="Grant">Grant</option>
                      <option value="Collaboration">Collaboration</option>
                      <option value="Commission">Commission</option>
                    </select>
                  </label>
                )}

                {quickCreateKind === 'resource' && (
                  <label>
                    Resource Format
                    <select value={resKind} onChange={(e) => setResKind(e.target.value as ExploreResource['kind'])}>
                      <option value="Field Guide">Field Guide</option>
                      <option value="Toolkit">Toolkit</option>
                      <option value="Template">Template</option>
                      <option value="Safety Brief">Safety Brief</option>
                      <option value="Ecosystem Map">Ecosystem Map</option>
                    </select>
                  </label>
                )}

                {quickCreateKind === 'event' && (
                  <>
                    <label>
                      Event Type
                      <select value={eventKind} onChange={(e) => setEventKind(e.target.value as EventKind)}>
                        <option value="Workshop">Workshop</option>
                        <option value="House Session">House Session</option>
                        <option value="AMA">AMA</option>
                        <option value="Onboarding Session">Onboarding Session</option>
                        <option value="Portfolio Review">Portfolio Review</option>
                        <option value="Arena-Wide">Arena-Wide</option>
                      </select>
                    </label>
                    <label>
                      Starts At
                      <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                    </label>
                  </>
                )}

                <label className={quickCreateKind === 'discussion' ? '' : 'full-field'}>
                  {quickCreateKind === 'project'
                    ? 'One-line Tagline'
                    : quickCreateKind === 'service'
                      ? 'Service Category Label'
                      : quickCreateKind === 'opportunity'
                        ? 'Organisation / Team Name'
                        : quickCreateKind === 'discussion'
                          ? 'Topic Tag'
                          : quickCreateKind === 'event'
                            ? 'Location or Link'
                            : 'File or Format Label'}
                  <input
                    placeholder="Short label"
                    value={secondaryText}
                    onChange={(e) => setSecondaryText(e.target.value)}
                  />
                </label>

                <label className="full-field">
                  Description / Details
                  <textarea
                    required
                    rows={3}
                    placeholder="Add clear details for members..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </label>

                {quickCreateKind === 'discussion' && !canCreateDiscussion && (
                  <div className="full-field arena-notice arena-notice-warn" role="status">
                    <span>
                      <b>Discussion creation unlocks at Level {DISCUSSION_UNLOCK_LEVEL}.</b>{' '}
                      {isSpartan
                        ? `You are currently Level ${levelProgress.level}. You can still read and reply to discussions in Explore.`
                        : 'Sign in as a Spartan and reach Level 15 to create discussions.'}
                    </span>
                  </div>
                )}

                <div className="full-field" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="button button-quiet" onClick={() => openQuickCreate(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button button-bright"
                    disabled={quickCreateKind === 'discussion' && !canCreateDiscussion}
                  >
                    Publish {quickCreateKind}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
