import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bookmark,
  BookOpen,
  Briefcase,
  FolderGit2,
  MessageSquare,
  Plus,
  Search,
  Send,
  UserPen,
  Users,
  Wrench,
} from 'lucide-react'
import { useArena } from '../app/arenaContext'
import ListingCard from '../components/ListingCard'
import DirectoryShowcase from '../components/public/DirectoryShowcase'
import { DISCUSSION_UNLOCK_LEVEL, getHouseName } from '../domain/constants'

type ExploreTab = 'opportunities' | 'people' | 'projects' | 'services' | 'resources' | 'discussions'

const VALID_EXPLORE_TABS: ExploreTab[] = ['opportunities', 'people', 'projects', 'services', 'resources', 'discussions']

const TAB_PRIMARY_ACTION: Record<
  ExploreTab,
  { label: string; kind: 'create'; target: 'opportunity' | 'project' | 'service' | 'resource' | 'discussion' } | { label: string; kind: 'profile' }
> = {
  opportunities: { label: 'Post Opportunity', kind: 'create', target: 'opportunity' },
  people: { label: 'Edit Profile', kind: 'profile' },
  projects: { label: 'Add Project', kind: 'create', target: 'project' },
  services: { label: 'Offer Service', kind: 'create', target: 'service' },
  resources: { label: 'Share Resource', kind: 'create', target: 'resource' },
  discussions: { label: 'Start Discussion', kind: 'create', target: 'discussion' },
}

export default function ExplorePage() {
  const {
    state,
    currentMember,
    xpBalance,
    levelProgress,
    toggleBookmark,
    commissionService,
    addDiscussionReply,
    openQuickCreate,
  } = useArena()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const paramTab = searchParams.get('tab') as ExploreTab | null
  const tab: ExploreTab = paramTab && VALID_EXPLORE_TABS.includes(paramTab) ? paramTab : 'opportunities'
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [houseFilter, setHouseFilter] = useState('all')

  const [commissionTargetId, setCommissionTargetId] = useState<string | null>(null)
  const [commissionBrief, setCommissionBrief] = useState('')
  const [commissionXp, setCommissionXp] = useState('200')
  const [replyText, setReplyText] = useState<Record<string, string>>({})

  const changeTab = (next: ExploreTab) => {
    setSearchParams({ tab: next })
  }

  const q = query.trim().toLowerCase()
  const matchesHouse = (hId: string | null) => houseFilter === 'all' || hId === houseFilter
  const matchesQuery = (text: string) => !q || text.toLowerCase().includes(q)

  const primaryAction = TAB_PRIMARY_ACTION[tab]
  const isSpartan = currentMember?.membershipStatus === 'spartan'
  const canReplyDiscussion = Boolean(isSpartan)
  const canCreateDiscussion = Boolean(isSpartan && levelProgress.level >= DISCUSSION_UNLOCK_LEVEL)
  const isDiscussionActionBlocked =
    primaryAction.kind === 'create' && primaryAction.target === 'discussion' && !canCreateDiscussion

  const handlePrimaryAction = () => {
    if (primaryAction.kind === 'profile') {
      navigate('/profile')
    } else if (primaryAction.target === 'discussion' && !canCreateDiscussion) {
      return
    } else {
      openQuickCreate(primaryAction.target)
    }
  }

  return (
    <div className="inner-page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DirectoryShowcase
          variant="explore"
          kicker="COMMUNITY DIRECTORY"
          headline="Explore The Arena"
          detail="Discover open opportunities, connect with members, browse community projects, commission services, read guides, and join discussions."
          metric={String(state.opportunities.length + state.projects.length + state.resources.length)}
          metricLabel="LIVE DIRECTORY ITEMS"
          actionLabel="View active Missions"
          actionTo="/missions"
          onActionClick={() => navigate('/missions')}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div className="arena-tabs" role="tablist">
            {(
              [
                ['opportunities', 'Opportunities', Briefcase],
                ['people', 'People', Users],
                ['projects', 'Projects', FolderGit2],
                ['services', 'Services', Wrench],
                ['resources', 'Resources', BookOpen],
                ['discussions', 'Discussions', MessageSquare],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`arena-tab ${tab === id ? 'active' : ''}`}
                onClick={() => changeTab(id)}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {currentMember && (
            <button
              type="button"
              className="button button-bright"
              disabled={isDiscussionActionBlocked}
              title={isDiscussionActionBlocked ? `Discussion creation unlocks at Level ${DISCUSSION_UNLOCK_LEVEL}.` : undefined}
              onClick={handlePrimaryAction}
            >
              {primaryAction.kind === 'profile' ? <UserPen size={15} /> : <Plus size={15} />}
              {primaryAction.label}
            </button>
          )}
        </div>

        <div className="filter-bar">
          <div className="filter-search">
            <Search size={15} color="#70829a" />
            <input
              type="search"
              placeholder={`Search ${tab}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="filter-select" aria-label="Filter Explore by House" value={houseFilter} onChange={(e) => setHouseFilter(e.target.value)}>
            <option value="all">All Houses</option>
            {state.houses.map((h) => (
              <option key={h.id} value={h.id}>House {h.name}</option>
            ))}
          </select>
        </div>

        {tab === 'opportunities' && (
          <div className="opportunity-grid">
            {state.opportunities
              .filter((o) => matchesHouse(o.houseId) && matchesQuery(`${o.title} ${o.organisationName} ${o.description} ${o.tags.join(' ')}`))
              .map((opp) => {
                const house = state.houses.find((h) => h.id === opp.houseId)
                const saved = currentMember
                  ? state.savedBookmarks.some((b) => b.memberId === currentMember.id && b.targetType === 'opportunity' && b.targetId === opp.id)
                  : false
                return (
                  <ListingCard
                    key={opp.id}
                    glyph={house?.glyph ?? '◈'}
                    tone={house?.tone ?? 'blue'}
                    kind={opp.kind}
                    kindTone="featured"
                    meta={`${opp.organisationName} · House ${getHouseName(opp.houseId, state.houses)}`}
                    title={opp.title}
                    description={opp.description}
                    tags={opp.tags}
                    reward={opp.compensationLabel}
                    saved={saved}
                    onToggleSave={() => toggleBookmark('opportunity', opp.id)}
                    actionLabel="Related Missions"
                    onOpen={() => navigate('/missions')}
                  />
                )
              })}
          </div>
        )}

        {tab === 'people' && (
          <div className="opportunity-grid">
            {state.members
              .filter((m) => m.privacy.publicProfileVisible || m.id === currentMember?.id)
              .filter((m) => matchesHouse(m.primaryHouseId) && matchesQuery(`${m.displayName} ${m.username} ${m.headline} ${m.skills.join(' ')}`))
              .map((m) => (
                <article className="listing-card" key={m.id}>
                  <div className="listing-top">
                    <span className="avatar avatar-small" style={{ width: 38, height: 38 }}>{m.avatarInitials}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{m.displayName}</div>
                      <div style={{ fontSize: 12, color: '#52647d' }}>@{m.username}</div>
                    </div>
                    <span className="listing-kind" style={{ marginLeft: 'auto' }}>{m.ascendancyRank}</span>
                  </div>
                  <p><b>{m.headline}</b> — {m.bio}</p>
                  <div className="tag-row">
                    {m.primaryHouseId && <span className="tag">House {getHouseName(m.primaryHouseId, state.houses)}</span>}
                    {m.skills.slice(0, 3).map((s) => <span className="tag" key={s}>{s}</span>)}
                  </div>
                  {currentMember?.id === m.id && (
                    <div className="listing-bottom">
                      <span className="listing-reward">Your public profile</span>
                      <button
                        type="button"
                        className="button button-quiet button-small"
                        onClick={() => navigate('/profile')}
                      >
                        Edit Profile
                      </button>
                    </div>
                  )}
                </article>
              ))}
          </div>
        )}

        {tab === 'projects' && (
          <div className="project-grid">
            {state.projects
              .filter((p) => matchesHouse(p.houseId) && matchesQuery(`${p.title} ${p.tagline} ${p.description} ${p.tags.join(' ')}`))
              .map((proj) => {
                const owner = state.members.find((m) => m.id === proj.ownerMemberId)
                const house = state.houses.find((h) => h.id === proj.houseId)
                const saved = currentMember
                  ? state.savedBookmarks.some((b) => b.memberId === currentMember.id && b.targetType === 'project' && b.targetId === proj.id)
                  : false
                return (
                  <article className="listing-card" key={proj.id}>
                    <div className="listing-top">
                      <span className={`org-mark ${house?.tone ?? 'blue'}`}>{house?.glyph ?? '⌘'}</span>
                      <span className="listing-kind kind-success">{proj.status}</span>
                      <span className="tag">House {getHouseName(proj.houseId, state.houses)}</span>
                      <button
                        type="button"
                        className={`save-button ${saved ? 'saved' : ''}`}
                        onClick={() => toggleBookmark('project', proj.id)}
                        aria-label="Save project"
                      >
                        <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <span className="listing-org">By {owner?.displayName ?? 'Spartan'} · Team of {proj.teamSize}</span>
                    <h3>{proj.title}</h3>
                    <p>{proj.description}</p>
                    <div className="tag-row">
                      {proj.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                    </div>
                  </article>
                )
              })}
          </div>
        )}

        {tab === 'services' && (
          <>
            <div className="service-list">
              {state.services
                .filter((s) => matchesHouse(s.houseId) && matchesQuery(`${s.title} ${s.categoryLabel} ${s.description}`))
                .map((srv) => {
                  const provider = state.members.find((m) => m.id === srv.providerMemberId)
                  const house = state.houses.find((h) => h.id === srv.houseId)
                  return (
                    <article className="listing-card" key={srv.id}>
                      <div className="listing-top">
                        <span className={`org-mark ${house?.tone ?? 'blue'}`}>{house?.glyph ?? '✳'}</span>
                        <span className="listing-kind kind-featured">{srv.categoryLabel}</span>
                        <span className="tag">House {getHouseName(srv.houseId, state.houses)}</span>
                      </div>
                      <span className="listing-org">Provided by {provider?.displayName ?? 'Specialist'}</span>
                      <h3>{srv.title}</h3>
                      <p>{srv.description}</p>
                      <div className="listing-bottom">
                        <span className="listing-reward">Suggested: {srv.suggestedXpRate} XP</span>
                        <button
                          type="button"
                          className="button button-bright button-small"
                          onClick={() => {
                            setCommissionTargetId(srv.id)
                            setCommissionXp(String(srv.suggestedXpRate))
                            setCommissionBrief(srv.description)
                          }}
                        >
                          Commission Mission
                        </button>
                      </div>
                    </article>
                  )
                })}
            </div>

            {commissionTargetId && (
              <div className="arena-modal-backdrop" onClick={() => setCommissionTargetId(null)}>
                <div className="arena-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="arena-modal-header">
                    <h3>Commission Service as Mission</h3>
                    <button type="button" className="button button-quiet button-small" onClick={() => setCommissionTargetId(null)}>Close</button>
                  </div>
                  <p style={{ fontSize: 13.5, color: '#52647d', marginTop: 0 }}>
                    Commissioning reserves Spendable XP upfront for this mission (Your Spendable XP: <b>{xpBalance.spendableXp} XP</b>).
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label className="arena-field">
                      XP Reward
                      <input type="number" min={25} max={1500} className="arena-input" value={commissionXp} onChange={(e) => setCommissionXp(e.target.value)} />
                    </label>
                    <label className="arena-field">
                      Commission Brief
                      <textarea rows={3} className="arena-textarea" value={commissionBrief} onChange={(e) => setCommissionBrief(e.target.value)} />
                    </label>
                    <button
                      type="button"
                      className="button button-bright"
                      onClick={() => {
                        const res = commissionService(commissionTargetId, commissionBrief, Number(commissionXp) || 150)
                        if (res.ok) {
                          setCommissionTargetId(null)
                          navigate(`/missions/${res.data.id}`)
                        }
                      }}
                    >
                      Reserve XP &amp; Create Service Mission
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'resources' && (
          <div className="opportunity-grid">
            {state.resources
              .filter((r) => matchesHouse(r.houseId) && matchesQuery(`${r.title} ${r.kind} ${r.summary}`))
              .map((res) => {
                const house = res.houseId ? state.houses.find((h) => h.id === res.houseId) : null
                const saved = currentMember
                  ? state.savedBookmarks.some((b) => b.memberId === currentMember.id && b.targetType === 'resource' && b.targetId === res.id)
                  : false
                return (
                  <ListingCard
                    key={res.id}
                    glyph={house?.glyph ?? '✎'}
                    tone={house?.tone ?? 'blue'}
                    kind={res.kind}
                    meta={res.formatLabel}
                    title={res.title}
                    description={res.summary}
                    tags={house ? [`House ${house.name}`] : ['Arena-Wide']}
                    saved={saved}
                    onToggleSave={() => toggleBookmark('resource', res.id)}
                  />
                )
              })}
          </div>
        )}

        {tab === 'discussions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!canCreateDiscussion && (
              <div className="arena-notice arena-notice-info" role="status">
                <span>
                  <b>Discussion creation unlocks at Level {DISCUSSION_UNLOCK_LEVEL}.</b>{' '}
                  {isSpartan
                    ? `Your account is currently Level ${levelProgress.level}. You can read and reply to any discussion below.`
                    : 'Sign in as a Spartan to reply, or reach Level 15 to start a new discussion.'}
                </span>
              </div>
            )}
            {state.discussions
              .filter((d) => matchesHouse(d.houseId) && matchesQuery(`${d.title} ${d.topicTag} ${d.body}`))
              .map((disc) => {
                const author = state.members.find((m) => m.id === disc.authorMemberId)
                return (
                  <article className="dashboard-panel" key={disc.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className="listing-kind kind-featured">{disc.topicTag}</span>
                      {disc.houseId && <span className="tag">House {getHouseName(disc.houseId, state.houses)}</span>}
                      <span style={{ fontSize: 12, color: '#52647d' }}>Started by <b>{author?.displayName ?? 'Spartan'}</b></span>
                    </div>
                    <h3 style={{ margin: '0 0 6px' }}>{disc.title}</h3>
                    <p style={{ margin: '0 0 12px', fontSize: 13.5, color: '#344760' }}>{disc.body}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10, borderTop: '1px solid #e6edf6' }}>
                      {disc.replies.map((rep) => {
                        const repAuthor = state.members.find((m) => m.id === rep.authorMemberId)
                        return (
                          <div key={rep.id} style={{ padding: '8px 11px', background: '#f8faff', borderRadius: 7, fontSize: 13 }}>
                            <b>{repAuthor?.displayName ?? 'Spartan'}:</b> {rep.body}
                          </div>
                        )
                      })}

                      {canReplyDiscussion && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <input
                            className="arena-input"
                            placeholder="Write a constructive reply..."
                            value={replyText[disc.id] ?? ''}
                            onChange={(e) => setReplyText((p) => ({ ...p, [disc.id]: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="button button-bright button-small"
                            onClick={() => {
                              const res = addDiscussionReply(disc.id, replyText[disc.id] ?? '')
                              if (res.ok) setReplyText((p) => ({ ...p, [disc.id]: '' }))
                            }}
                          >
                            <Send size={13} /> Reply
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
