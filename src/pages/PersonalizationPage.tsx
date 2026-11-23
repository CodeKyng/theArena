import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Flame, LayoutPanelLeft, Sparkles, Tag } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import PermissionGate from '../components/PermissionGate'
import type { HouseId } from '../domain/types'
import { loadSidebarCollapsed, saveSidebarCollapsed } from '../services/arenaStore'

export default function PersonalizationPage() {
  const { state, currentMember, flash, updateProfile, updateHouses } = useArena()

  const [interests, setInterests] = useState<string[]>(currentMember?.interests ?? [])
  const [customInterest, setCustomInterest] = useState('')
  const [primaryHouse, setPrimaryHouse] = useState<string>(currentMember?.primaryHouseId ?? '')
  const [secondaryHouse, setSecondaryHouse] = useState<string>(currentMember?.secondaryHouseId ?? '')
  const [sidebarDefaultCollapsed, setSidebarDefaultCollapsed] = useState<boolean>(() =>
    loadSidebarCollapsed(),
  )

  const suggestedTopics = Array.from(
    new Set(state.houses.flatMap((h) => h.focusAreas)),
  ).slice(0, 18)

  const toggleInterest = (topic: string) => {
    setInterests((prev) =>
      prev.some((i) => i.toLowerCase() === topic.toLowerCase())
        ? prev.filter((i) => i.toLowerCase() !== topic.toLowerCase())
        : [...prev, topic],
    )
  }

  const addCustomInterests = (e: FormEvent) => {
    e.preventDefault()
    const parsed = customInterest
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parsed.length === 0) return
    setInterests((prev) => {
      const existing = new Set(prev.map((i) => i.toLowerCase()))
      const additions = parsed.filter((item) => !existing.has(item.toLowerCase()))
      return [...prev, ...additions]
    })
    setCustomInterest('')
  }

  const handleSaveInterests = () => {
    updateProfile({ interests })
  }

  const handleSaveHouses = () => {
    const p = (primaryHouse || null) as HouseId | null
    const s = (secondaryHouse || null) as HouseId | null
    updateHouses(p, s === p ? null : s)
  }

  const handleToggleSidebarPreference = (checked: boolean) => {
    setSidebarDefaultCollapsed(checked)
    saveSidebarCollapsed(checked)
    window.dispatchEvent(new CustomEvent('arena:sidebar-collapse', { detail: checked }))
    flash(checked ? 'Sidebar collapsed by default on desktop.' : 'Sidebar expanded by default on desktop.')
  }

  return (
    <PageScaffold
      section="Account"
      name="Personalization"
      description="Tune your topic interests, House alignment for mission recommendations, and workspace navigation layout."
      actions={
        <Link className="button button-quiet" to="/profile">
          View My Profile
        </Link>
      }
    >
      <PermissionGate title="Personalization">
        {currentMember && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section className="dashboard-panel">
              <div className="panel-title">
                <h2><Tag size={16} style={{ verticalAlign: 'middle' }} /> Topic Interests</h2>
              </div>
              <p style={{ fontSize: 13, color: 'var(--arena-muted)', marginTop: 0 }}>
                Select or add topics you follow to personalize your Spartan profile and discovery focus.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {suggestedTopics.map((topic) => {
                  const selected = interests.some((i) => i.toLowerCase() === topic.toLowerCase())
                  return (
                    <button
                      key={topic}
                      type="button"
                      className={`button button-small ${selected ? 'button-bright' : 'button-quiet'}`}
                      onClick={() => toggleInterest(topic)}
                      aria-pressed={selected}
                    >
                      {topic}
                    </button>
                  )
                })}
              </div>

              <form onSubmit={addCustomInterests} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <input
                  type="text"
                  className="arena-input"
                  style={{ flex: '1 1 240px' }}
                  placeholder="Add custom interests (comma-separated)..."
                  aria-label="Custom interests"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                />
                <button type="submit" className="button button-quiet">Add Interest</button>
              </form>

              {interests.length > 0 && (
                <div className="tag-row" style={{ marginBottom: 14 }}>
                  {interests.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="tag"
                      style={{ cursor: 'pointer', background: '#eef5ff' }}
                      onClick={() => toggleInterest(item)}
                      title={`Remove ${item}`}
                    >
                      {item} ×
                    </button>
                  ))}
                </div>
              )}

              <button type="button" className="button button-bright" onClick={handleSaveInterests}>
                <Sparkles size={15} /> Save Interests
              </button>
            </section>

            <div className="dashboard-columns">
              <section className="dashboard-panel">
                <div className="panel-title">
                  <h2><Flame size={16} style={{ verticalAlign: 'middle' }} /> House Recommendations</h2>
                </div>
                <p style={{ fontSize: 13, color: 'var(--arena-muted)', marginTop: 0 }}>
                  Your Primary and Secondary Houses prioritize matching Missions on your Dashboard and Houses view.
                </p>
                <div className="form-grid" style={{ marginBottom: 14 }}>
                  <label>
                    Primary House
                    <select
                      aria-label="Primary House Preference"
                      value={primaryHouse}
                      onChange={(e) => {
                        const next = e.target.value
                        setPrimaryHouse(next)
                        if (!next || next === secondaryHouse) setSecondaryHouse('')
                      }}
                    >
                      <option value="">None</option>
                      {state.houses.map((h) => (
                        <option key={h.id} value={h.id}>House {h.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Secondary House
                    <select
                      aria-label="Secondary House Preference"
                      value={secondaryHouse}
                      onChange={(e) => setSecondaryHouse(e.target.value)}
                    >
                      <option value="">None</option>
                      {state.houses
                        .filter((h) => h.id !== primaryHouse)
                        .map((h) => (
                          <option key={h.id} value={h.id}>House {h.name}</option>
                        ))}
                    </select>
                  </label>
                </div>
                <button type="button" className="button button-bright" onClick={handleSaveHouses}>
                  Save House Alignment
                </button>
              </section>

              <section className="dashboard-panel">
                <div className="panel-title">
                  <h2><LayoutPanelLeft size={16} style={{ verticalAlign: 'middle' }} /> Workspace Navigation</h2>
                </div>
                <p style={{ fontSize: 13, color: 'var(--arena-muted)', marginTop: 0 }}>
                  Choose whether the desktop sidebar starts collapsed for wider reading and review surfaces. Stored locally in your browser.
                </p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sidebarDefaultCollapsed}
                    onChange={(e) => handleToggleSidebarPreference(e.target.checked)}
                  />
                  Collapse desktop sidebar by default
                </label>
              </section>
            </div>
          </div>
        )}
      </PermissionGate>
    </PageScaffold>
  )
}
