import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Award, Building2, Flame, Sliders, Sparkles } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import PermissionGate from '../components/PermissionGate'
import { FEATURE_FLAGS, formatVerificationStatus, getHouseName } from '../domain/constants'
import type { HouseId } from '../domain/types'

type ProfileTab = 'identity' | 'membership' | 'portfolio' | 'recognition'

export default function ProfilePage() {
  const {
    state,
    currentMember,
    xpBalance,
    levelProgress,
    memberOrganisations,
    updateProfile,
    updateHouses,
  } = useArena()

  const [tab, setTab] = useState<ProfileTab>('identity')
  const [displayName, setDisplayName] = useState(currentMember?.displayName ?? '')
  const [headline, setHeadline] = useState(currentMember?.headline ?? '')
  const [bio, setBio] = useState(currentMember?.bio ?? '')
  const [skillsText, setSkillsText] = useState(currentMember?.skills.join(', ') ?? '')
  const [linksText, setLinksText] = useState(currentMember?.publicLinks.join('\n') ?? '')
  const [primaryHouse, setPrimaryHouse] = useState<string>(currentMember?.primaryHouseId ?? '')
  const [secondaryHouse, setSecondaryHouse] = useState<string>(currentMember?.secondaryHouseId ?? '')

  return (
    <PageScaffold
      section="Profile"
      name="My Profile"
      description="Your public Spartan identity, House affiliation, verified Proof-of-Work portfolio, and unlocked badges."
    >
      <PermissionGate title="My Profile">
        {currentMember && (() => {
          const myProjects = state.projects.filter((p) => p.ownerMemberId === currentMember.id)
          const myApprovedSubs = state.submissions.filter(
            (s) => s.memberId === currentMember.id && s.status === 'approved',
          )
          const myAchievements = state.memberAchievements.filter((ma) => ma.memberId === currentMember.id)
          const mySeasonCp = state.cpEvents
            .filter((e) => e.memberId === currentMember.id && e.seasonId === state.currentSeason.id)
            .reduce((sum, e) => sum + e.cpAmount, 0)

          const saveIdentity = (e: FormEvent) => {
            e.preventDefault()
            updateProfile({
              displayName: displayName || currentMember.displayName,
              headline,
              bio,
              skills: skillsText.split(',').map((s) => s.trim()).filter(Boolean),
              publicLinks: linksText.split('\n').map((s) => s.trim()).filter(Boolean),
            })
          }

          return (
            <div className="profile-experience">
              <section className="profile-hero-card">
                <div className="profile-cover">
                  <span className="cover-orbit cover-orbit-one" aria-hidden="true" />
                  <span className="cover-orbit cover-orbit-two" aria-hidden="true" />
                  <span className="profile-level">LEVEL {String(levelProgress.level).padStart(2, '0')} · {currentMember.ascendancyRank.toUpperCase()}</span>
                </div>
                <div className="profile-identity">
                  <span className="profile-avatar">{currentMember.avatarInitials}</span>
                  <div>
                    <h2>{currentMember.displayName}</h2>
                    <p>@{currentMember.username} · {currentMember.headline}</p>
                  </div>
                  <div className="profile-identity-actions">
                    <Link className="button button-quiet" to="/personalization">
                      <Sparkles size={14} /> Personalization
                    </Link>
                    <Link className="button button-quiet" to="/settings">
                      <Sliders size={14} /> Settings
                    </Link>
                  </div>
                </div>
                <div className="profile-stats">
                  <div>
                    <b>{xpBalance.lifetimeXp.toLocaleString()} XP</b>
                    <small>Lifetime XP</small>
                  </div>
                  <div>
                    <b>{mySeasonCp} CP</b>
                    <small>Season CP</small>
                  </div>
                  <div>
                    <b>{myAchievements.length} / {state.achievements.length}</b>
                    <small>Achievements</small>
                  </div>
                  <div>
                    <b>{currentMember.primaryHouseId ? `House ${getHouseName(currentMember.primaryHouseId, state.houses)}` : 'Unassigned'}</b>
                    <small>Primary House</small>
                  </div>
                </div>
              </section>

              <div className="arena-tabs" role="tablist">
                {(
                  [
                    ['identity', 'Public Identity'],
                    ['membership', FEATURE_FLAGS.organisationsEnabled ? 'Houses & Organisations' : 'Houses'],
                    ['portfolio', `Proof-of-Work Portfolio (${myApprovedSubs.length + myProjects.length})`],
                    ['recognition', `Recognition (${myAchievements.length})`],
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

              {tab === 'identity' && (
                <form className="form-panel" onSubmit={saveIdentity}>
                  <h2 style={{ marginTop: 0 }}>Edit Public Spartan Identity</h2>
                  <div className="form-grid">
                    <label>
                      Display Name
                      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </label>
                    <label>
                      Headline
                      <input value={headline} onChange={(e) => setHeadline(e.target.value)} />
                    </label>
                    <label className="full-field">
                      Bio
                      <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
                    </label>
                    <label>
                      Skills (comma-separated)
                      <input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
                    </label>
                    <label>
                      Public Links (one URL per line)
                      <textarea rows={2} value={linksText} onChange={(e) => setLinksText(e.target.value)} />
                    </label>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button type="submit" className="button button-bright">Save Public Profile</button>
                  </div>
                </form>
              )}

              {tab === 'membership' && (
                <div className={FEATURE_FLAGS.organisationsEnabled ? 'dashboard-columns' : undefined}>
                  <section className="dashboard-panel">
                    <div className="panel-title">
                      <h2><Flame size={16} style={{ verticalAlign: 'middle' }} /> House Alignment</h2>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--arena-muted)', marginTop: 0 }}>
                      Choose your Primary House and optional Secondary House. Changing Houses updates recommendations without awarding XP.
                    </p>
                    <div className="form-grid">
                      <label>
                        Primary House
                        <select
                          aria-label="Primary House"
                          value={primaryHouse}
                          onChange={(e) => {
                            const next = e.target.value
                            setPrimaryHouse(next)
                            if (!next || next === secondaryHouse) setSecondaryHouse('')
                          }}
                        >
                          <option value="">None</option>
                          {state.houses.map((h) => (
                            <option key={h.id} value={h.id}>{h.glyph} House {h.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Secondary House
                        <select
                          aria-label="Secondary House"
                          value={secondaryHouse}
                          onChange={(e) => setSecondaryHouse(e.target.value)}
                        >
                          <option value="">None</option>
                          {state.houses
                            .filter((h) => h.id !== primaryHouse)
                            .map((h) => (
                              <option key={h.id} value={h.id}>{h.glyph} House {h.name}</option>
                            ))}
                        </select>
                      </label>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        className="button button-bright"
                        onClick={() => {
                          const p = (primaryHouse || null) as HouseId | null
                          const s = (!p || secondaryHouse === p ? null : (secondaryHouse || null)) as HouseId | null
                          updateHouses(p, s)
                        }}
                      >
                        Save House Alignment
                      </button>
                    </div>
                  </section>

                  {FEATURE_FLAGS.organisationsEnabled && (
                    <section className="dashboard-panel">
                      <div className="panel-title">
                        <h2><Building2 size={16} style={{ verticalAlign: 'middle' }} /> Linked Organisations</h2>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--arena-muted)', marginTop: 0 }}>
                        Organisations remain separate profiles from your personal XP, Level, and Ascendancy rank.
                      </p>
                      {memberOrganisations.length === 0 ? (
                        <Link className="button button-quiet button-small" to="/organisations">Create Organisation Profile</Link>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {memberOrganisations.map((org) => (
                            <div key={org.id} style={{ padding: 10, border: '1px solid var(--arena-line)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <b>{org.name}</b>
                                <div style={{ fontSize: 12, color: 'var(--arena-muted)' }}>{org.kind} · {org.ecosystem}</div>
                              </div>
                              <span className="listing-kind">{formatVerificationStatus(org.verificationStatus)}</span>
                            </div>
                          ))}
                          <Link className="text-link" to="/organisations">Manage Organisations →</Link>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}

              {tab === 'portfolio' && (
                <div className="arena-grid-2">
                  <section className="dashboard-panel">
                    <div className="panel-title"><h2>Approved Mission Proof of Work</h2></div>
                    {myApprovedSubs.length === 0 ? (
                      <p style={{ color: 'var(--arena-muted)', margin: 0 }}>No approved mission submissions yet.</p>
                    ) : (
                      myApprovedSubs.map((s) => {
                        const m = state.missions.find((x) => x.id === s.missionId)
                        return (
                          <div key={s.id} style={{ padding: 10, borderTop: '1px solid var(--arena-line)' }}>
                            <b>{m?.title}</b>
                            <p style={{ margin: '4px 0', fontSize: 13, color: 'var(--arena-muted)' }}>{s.summary}</p>
                          </div>
                        )
                      })
                    )}
                  </section>
                  <section className="dashboard-panel">
                    <div className="panel-title"><h2>Published Projects</h2></div>
                    {myProjects.length === 0 ? (
                      <p style={{ color: 'var(--arena-muted)', margin: 0 }}>No projects published yet. Add one via Explore → Projects.</p>
                    ) : (
                      myProjects.map((p) => (
                        <div key={p.id} style={{ padding: 10, borderTop: '1px solid var(--arena-line)' }}>
                          <b>{p.title}</b> <span className="tag">{p.status}</span>
                          <p style={{ margin: '4px 0', fontSize: 13, color: 'var(--arena-muted)' }}>{p.tagline}</p>
                        </div>
                      ))
                    )}
                  </section>
                </div>
              )}

              {tab === 'recognition' && (
                <div className="dashboard-panel">
                  <div className="panel-title">
                    <h2><Award size={16} style={{ verticalAlign: 'middle' }} /> Ascendancy &amp; Unlocked Badges</h2>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--arena-muted)', marginTop: 0 }}>
                    Current Ascendancy Rank: <b>{currentMember.ascendancyRank}</b> (appointed separately from XP levels).
                  </p>
                  <div className="achievement-grid">
                    {myAchievements.map((ma, idx) => {
                      const def = state.achievements.find((a) => a.id === ma.achievementId)
                      if (!def) return null
                      return (
                        <div className="achievement-card achievement-earned" key={ma.id}>
                          <span className="badge-number">{String(idx + 1).padStart(2, '0')}</span>
                          <span className="badge-glyph" aria-hidden="true"><Award size={16} /></span>
                          <h3>{def.title}</h3>
                          <p>{def.description}</p>
                          <small>Earned</small>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </PermissionGate>
    </PageScaffold>
  )
}
