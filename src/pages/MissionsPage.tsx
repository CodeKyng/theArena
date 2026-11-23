import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import EmptyState from '../components/EmptyState'
import ListingCard from '../components/ListingCard'
import DirectoryShowcase from '../components/public/DirectoryShowcase'
import {
  formatMissionStatus,
  formatParticipationFormat,
  formatSubmissionStatus,
  getHouseName,
  MISSION_CATEGORIES,
  MISSION_STATUSES,
  PARTICIPATION_FORMATS,
} from '../domain/constants'

type MissionTab = 'discover' | 'mine' | 'submissions' | 'history'

export default function MissionsPage() {
  const { state, currentMember, can, toggleBookmark } = useArena()
  const navigate = useNavigate()

  const [tab, setTab] = useState<MissionTab>('discover')
  const [search, setSearch] = useState('')
  const [houseFilter, setHouseFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formatFilter, setFormatFilter] = useState('all')
  const [bandFilter, setBandFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openOnly, setOpenOnly] = useState(false)
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  const secondaryFilterCount =
    (formatFilter !== 'all' ? 1 : 0) +
    (bandFilter !== 'all' ? 1 : 0) +
    (difficultyFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (openOnly ? 1 : 0)

  const filteredMissions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return state.missions.filter((m) => {
      if (tab === 'discover') {
        if (m.status === 'draft' && m.creatorMemberId !== currentMember?.id) return false
        if (['completed', 'cancelled', 'expired', 'archived'].includes(m.status)) return false
      } else if (tab === 'mine') {
        if (!currentMember) return false
        const participated = state.missionParticipations.some(
          (p) => p.missionId === m.id && p.memberId === currentMember.id,
        )
        const submitted = state.submissions.some(
          (s) => s.missionId === m.id && s.memberId === currentMember.id,
        )
        if (m.creatorMemberId !== currentMember.id && !participated && !submitted) return false
      } else if (tab === 'history') {
        if (!['completed', 'cancelled', 'expired', 'archived'].includes(m.status)) return false
      }

      if (houseFilter !== 'all') {
        if (houseFilter === 'cross_house') {
          if (!m.crossHouseEligible) return false
        } else if (m.houseId !== houseFilter) {
          return false
        }
      }
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false
      if (formatFilter !== 'all' && m.participationFormat !== formatFilter) return false
      if (bandFilter !== 'all' && m.budget.rewardBand !== bandFilter) return false
      if (difficultyFilter !== 'all' && m.difficulty !== difficultyFilter) return false
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (openOnly && !m.participationOpen) return false

      if (q) {
        const hay = `${m.title} ${m.description} ${m.category} ${m.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [
    bandFilter,
    categoryFilter,
    currentMember,
    difficultyFilter,
    formatFilter,
    houseFilter,
    openOnly,
    search,
    state.missionParticipations,
    state.missions,
    state.submissions,
    statusFilter,
    tab,
  ])

  const visibleSubmissions = useMemo(() => {
    if (!currentMember) return []
    return state.submissions.filter((sub) => {
      const mission = state.missions.find((m) => m.id === sub.missionId)
      const isMySub = sub.memberId === currentMember.id
      const isReviewer =
        mission &&
        (mission.creatorMemberId === currentMember.id ||
          mission.assignedReviewerIds.includes(currentMember.id) ||
          can('house.manage', mission.houseId) ||
          can('mission.review', mission.houseId) ||
          can('moderator') ||
          can('platform.admin'))
      return isMySub || Boolean(isReviewer)
    })
  }, [can, currentMember, state.missions, state.submissions])

  const activeCount = state.missions.filter((m) => m.status === 'active').length

  const resetFilters = () => {
    setSearch('')
    setHouseFilter('all')
    setCategoryFilter('all')
    setFormatFilter('all')
    setBandFilter('all')
    setDifficultyFilter('all')
    setStatusFilter('all')
    setOpenOnly(false)
  }

  return (
    <div className="inner-page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DirectoryShowcase
          variant="missions"
          kicker="PROOF OF WORK"
          headline="Missions"
          detail="Join open, application, team, or guided missions across the six Houses. Submit verified work to earn XP and Contribution Points."
          metric={String(activeCount)}
          metricLabel="ACTIVE MISSIONS"
          actionLabel={can('mission.create') ? 'Create Mission' : 'Browse Houses'}
          actionTo={can('mission.create') ? '/missions/new' : '/houses'}
          onActionClick={() => navigate(can('mission.create') ? '/missions/new' : '/houses')}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div className="arena-tabs" role="tablist">
            {(
              [
                ['discover', 'Discover Missions'],
                ['mine', 'My Missions'],
                ['submissions', `Submissions (${visibleSubmissions.length})`],
                ['history', 'History & Completed'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`arena-tab ${tab === id ? 'active' : ''}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {can('mission.create') && (
            <Link className="button button-bright" to="/missions/new">
              <Plus size={15} /> Create Mission
            </Link>
          )}
        </div>

        {tab === 'submissions' ? (
          !currentMember ? (
            <EmptyState name="your submission queue" actionLabel="Sign in to view" onClear={() => navigate('/login')} />
          ) : visibleSubmissions.length === 0 ? (
            <div className="empty-state">
              <h3>No submissions yet</h3>
              <p>Join an active mission and submit Proof of Work to see submissions here.</p>
              <button type="button" className="button button-bright" onClick={() => setTab('discover')}>
                Discover Missions
              </button>
            </div>
          ) : (
            <div className="arena-table-wrap">
              <table className="arena-table">
                <thead>
                  <tr>
                    <th>Mission</th>
                    <th>Contributor</th>
                    <th>Status</th>
                    <th>Version</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSubmissions.map((sub) => {
                    const mission = state.missions.find((m) => m.id === sub.missionId)
                    const contributor = state.members.find((m) => m.id === sub.memberId)
                    return (
                      <tr key={sub.id}>
                        <td><b>{mission?.title ?? sub.missionId}</b></td>
                        <td>{contributor?.displayName ?? sub.memberId}</td>
                        <td><span className="listing-kind">{formatSubmissionStatus(sub.status)}</span></td>
                        <td>v{sub.version}</td>
                        <td>
                          <Link className="button button-quiet button-small" to={`/missions/${sub.missionId}`}>
                            Open Detail
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <>
            <div className="filter-bar">
              <div className="filter-search">
                <Search size={15} color="#70829a" />
                <input
                  type="search"
                  placeholder="Search title, deliverable, or tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select className="filter-select" aria-label="Filter by House" value={houseFilter} onChange={(e) => setHouseFilter(e.target.value)}>
                <option value="all">All Houses</option>
                <option value="cross_house">Cross-House Eligible</option>
                {state.houses.map((h) => (
                  <option key={h.id} value={h.id}>House {h.name}</option>
                ))}
              </select>

              <select className="filter-select" aria-label="Filter by Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {MISSION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button
                type="button"
                className="button button-quiet button-small"
                aria-expanded={showMoreFilters}
                onClick={() => setShowMoreFilters((v) => !v)}
              >
                <SlidersHorizontal size={13} />
                More filters{secondaryFilterCount > 0 ? ` (${secondaryFilterCount})` : ''}
              </button>

              {(secondaryFilterCount > 0 || houseFilter !== 'all' || categoryFilter !== 'all' || search.trim()) && (
                <button type="button" className="button button-quiet button-small" onClick={resetFilters}>
                  Reset
                </button>
              )}
            </div>

            {showMoreFilters && (
              <div className="filter-bar" style={{ paddingTop: 10 }}>
                <select className="filter-select" aria-label="Filter by Format" value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
                  <option value="all">All Formats</option>
                  {PARTICIPATION_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                <select className="filter-select" aria-label="Filter by Reward Band" value={bandFilter} onChange={(e) => setBandFilter(e.target.value)}>
                  <option value="all">All Reward Bands</option>
                  <option value="micro">Micro (25–75 XP)</option>
                  <option value="standard">Standard (100–250 XP)</option>
                  <option value="substantial">Substantial (300–750 XP)</option>
                  <option value="major">Major (800–1,500 XP)</option>
                  <option value="above_major">High-Value (&gt;1,500 XP)</option>
                </select>

                <select className="filter-select" aria-label="Filter by Difficulty" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
                  <option value="all">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>

                <select className="filter-select" aria-label="Filter by Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">Any Status</option>
                  {MISSION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600 }}>
                  <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
                  Open only
                </label>
              </div>
            )}

            {filteredMissions.length === 0 ? (
              <EmptyState name="these mission filters" actionLabel="Reset filters" onClear={resetFilters} />
            ) : (
              <div className="opportunity-grid">
                {filteredMissions.map((m) => {
                  const house = state.houses.find((h) => h.id === m.houseId)
                  const saved = currentMember
                    ? state.savedBookmarks.some(
                        (b) => b.memberId === currentMember.id && b.targetType === 'mission' && b.targetId === m.id,
                      )
                    : false
                  return (
                    <ListingCard
                      key={m.id}
                      glyph={house?.glyph ?? '⌘'}
                      tone={house?.tone ?? 'blue'}
                      kind={formatMissionStatus(m.status)}
                      kindTone={m.status === 'active' ? 'success' : m.status === 'pending_review' ? 'amber' : 'default'}
                      secondaryBadge={m.crossHouseEligible ? 'Cross-House' : undefined}
                      meta={`House ${getHouseName(m.houseId, state.houses)} · ${formatParticipationFormat(m.participationFormat)} · ${m.difficulty}`}
                      title={m.title}
                      description={m.description}
                      tags={m.tags.slice(0, 3)}
                      reward={`+${m.budget.rewardPerContributorXp} XP · +${m.budget.cpTierValue} CP`}
                      saved={saved}
                      onToggleSave={() => toggleBookmark('mission', m.id)}
                      actionLabel="Open"
                      onOpen={() => navigate(`/missions/${m.id}`)}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
