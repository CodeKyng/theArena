import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CheckCircle2, ShieldCheck, Users } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import type { HouseId } from '../domain/types'

export default function HousesPage() {
  const { state, currentMember, updateHouses } = useArena()
  const [primary, setPrimary] = useState<string>(currentMember?.primaryHouseId ?? '')
  const [secondary, setSecondary] = useState<string>(currentMember?.secondaryHouseId ?? '')

  return (
    <PageScaffold
      section="THE SIX CANONICAL HOUSES"
      name="Arena Houses"
      description="Every Spartan aligns with one Primary House and an optional Secondary House (0 XP for House selection). House Echoes serves both as a canonical outreach House and as a cross-House capability under strict anti-farming policy."
    >
      <div className="community-experience" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <section className="community-banner">
          <div className="community-banner-art" aria-hidden="true">
            <span>◈</span>
            <i>✳</i>
            <b>⌘</b>
          </div>
          <div>
            <span className="section-kicker">FIND YOUR DISCIPLINE</span>
            <h2>
              Belong to something
              <br />
              <em>being built.</em>
            </h2>
            <p>
              Six focused craft houses spanning writing, hosting, design, compliant outreach, engineering, and ecosystem intelligence.
            </p>
          </div>
          <div className="community-total">
            <b>0{state.houses.length}</b>
            <small>CANONICAL HOUSES</small>
            <b>{state.members.length}</b>
            <small>ACTIVE SPARTANS</small>
          </div>
        </section>

        {currentMember && (
          <section className="dashboard-panel" aria-label="House affiliation selector">
            <div className="panel-title">
              <div>
                <span className="section-kicker">YOUR HOUSE AFFILIATION</span>
                <h2>Primary &amp; Secondary House Selection (0 XP)</h2>
              </div>
              {currentMember.primaryHouseId && (
                <span className="listing-kind kind-success">
                  <CheckCircle2 size={13} /> Primary: {state.houses.find((h) => h.id === currentMember.primaryHouseId)?.name}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label className="arena-field" style={{ flex: '1 1 200px' }}>
                Primary House
                <select
                  className="arena-select"
                  value={primary || currentMember.primaryHouseId || ''}
                  onChange={(e) => setPrimary(e.target.value)}
                >
                  <option value="">Choose Primary House...</option>
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
                  value={secondary || currentMember.secondaryHouseId || ''}
                  onChange={(e) => setSecondary(e.target.value)}
                >
                  <option value="">None</option>
                  {state.houses
                    .filter((h) => h.id !== (primary || currentMember.primaryHouseId))
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
                  const p = (primary || currentMember.primaryHouseId || null) as HouseId | null
                  const s = (secondary || currentMember.secondaryHouseId || null) as HouseId | null
                  updateHouses(p, s === p ? null : s)
                }}
              >
                Update Houses (0 XP)
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
                    <Users size={13} /> {membersCount} Spartans · {activeMissions} open missions
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
    </PageScaffold>
  )
}
