import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CheckCircle2, ShieldCheck, Users } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import { getHouseName } from '../domain/constants'
import type { HouseId } from '../domain/types'

export default function HousesPage() {
  const { state, currentMember, updateHouses } = useArena()
  const [primary, setPrimary] = useState<string>(currentMember?.primaryHouseId ?? '')
  const [secondary, setSecondary] = useState<string>(currentMember?.secondaryHouseId ?? '')

  return (
    <div className="inner-page">
      <div className="community-experience" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <section className="community-banner">
          <div className="community-banner-art" aria-hidden="true">
            <span>◈</span>
            <i>✳</i>
            <b>⌘</b>
          </div>
          <div>
            <span className="section-kicker">THE SIX HOUSES</span>
            <h2>
              Belong to something
              <br />
              <em>being built.</em>
            </h2>
            <p>
              Choose a Primary House and an optional Secondary House across writing, hosting, design, compliant outreach, engineering, and ecosystem research.
            </p>
          </div>
          <div className="community-total">
            <b>0{state.houses.length}</b>
            <small>ARENA HOUSES</small>
            <b>{state.members.length}</b>
            <small>MEMBERS</small>
          </div>
        </section>

        {currentMember && (
          <section className="dashboard-panel" aria-label="House affiliation selector">
            <div className="panel-title">
              <div>
                <span className="section-kicker">YOUR HOUSE AFFILIATION</span>
                <h2>Primary &amp; Secondary House Selection</h2>
              </div>
              {currentMember.primaryHouseId && (
                <span className="listing-kind kind-success">
                  <CheckCircle2 size={13} /> Primary: House {getHouseName(currentMember.primaryHouseId, state.houses)}
                </span>
              )}
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#52647d' }}>
              Your Houses personalise mission and learning recommendations. Choosing or changing Houses awards 0 XP.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label className="arena-field" style={{ flex: '1 1 200px' }}>
                Primary House
                <select
                  className="arena-select"
                  value={primary}
                  onChange={(e) => {
                    const next = e.target.value
                    setPrimary(next)
                    if (!next || next === secondary) setSecondary('')
                  }}
                >
                  <option value="">None</option>
                  {state.houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.glyph} House {h.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="arena-field" style={{ flex: '1 1 200px' }}>
                Secondary House (optional)
                <select
                  className="arena-select"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                >
                  <option value="">None</option>
                  {state.houses
                    .filter((h) => h.id !== primary)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.glyph} House {h.name}
                      </option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                className="button button-bright"
                onClick={() => {
                  const p = (primary || null) as HouseId | null
                  const s = (!p || secondary === p ? null : (secondary || null)) as HouseId | null
                  updateHouses(p, s)
                }}
              >
                Save Houses
              </button>
            </div>
          </section>
        )}

        <div className="community-grid">
          {state.houses.map((house, index) => {
            const activeMissions = state.missions.filter((m) => m.houseId === house.id && m.status === 'active').length
            const membersCount = state.members.filter(
              (m) => m.primaryHouseId === house.id || m.secondaryHouseId === house.id,
            ).length
            const isPrimary = currentMember?.primaryHouseId === house.id
            const isSecondary = currentMember?.secondaryHouseId === house.id
            const artVariant = house.tone === 'red' ? 'red' : house.tone === 'slate' ? 'purple' : 'blue'

            return (
              <article className="community-card" key={house.id}>
                <div className={`community-card-art community-art-${artVariant}`}>
                  <span>{house.glyph}</span>
                  <small>
                    HOUSE / 0{index + 1}
                    {house.supportsCrossHouseOutreach ? ' · CROSS-HOUSE' : ''}
                  </small>
                </div>
                <h3>
                  House {house.name} <ShieldCheck size={14} />
                  {isPrimary && <span className="listing-kind kind-success">Primary</span>}
                  {isSecondary && <span className="listing-kind kind-amber">Secondary</span>}
                </h3>
                <p>{house.description}</p>
                <div className="tag-row" style={{ marginBottom: 12 }}>
                  {house.focusAreas.slice(0, 3).map((area) => (
                    <span className="tag" key={area}>{area}</span>
                  ))}
                </div>
                <div className="community-card-foot">
                  <span>
                    <Users size={13} /> {membersCount} members · {activeMissions} open missions
                  </span>
                  <Link to={`/houses/${house.slug}`}>
                    Enter House <ArrowUpRight size={14} />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
