import { useState, type FormEvent } from 'react'
import { Building2, CheckCircle2, Info, Plus, ShieldCheck } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import PermissionGate from '../components/PermissionGate'
import type { OrganisationProfile } from '../domain/types'

export default function OrganisationsPage() {
  const {
    state,
    currentMember,
    activeOrganisation,
    memberOrganisations,
    createOrg,
    switchOrg,
  } = useArena()

  const [name, setName] = useState('')
  const [kind, setKind] = useState<OrganisationProfile['kind']>('Project')
  const [ecosystem, setEcosystem] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()
    const res = createOrg({ name, kind, ecosystem, tagline, description, website })
    if (res.ok) {
      setName('')
      setEcosystem('')
      setTagline('')
      setDescription('')
      setWebsite('')
    }
  }

  const verifiedCount = state.organisations.filter((o) => o.verificationStatus === 'verified').length

  return (
    <PageScaffold
      section="Account Extension"
      name="Organisations"
      description="Create and represent a Project, Brand, Company, Team, or Initiative under your single Spartan account."
    >
      <PermissionGate title="Organisations">
        <div className="organization-experience">
          <section className="organization-banner">
            <div>
              <span className="section-kicker">UNIFIED ACCOUNT EXTENSION</span>
              <h2>Teams &amp; protocols<br />behind the Arena.</h2>
              <p>
                Any verified Spartan can represent an Organisation under their single account—never inheriting personal XP, Levels, or Ascendancy ranks.
              </p>
            </div>
            <div className="organization-numbers">
              <strong>{String(verifiedCount).padStart(2, '0')}</strong>
              <span>VERIFIED TEAMS</span>
              <strong>{String(state.organisations.length).padStart(2, '0')}</strong>
              <span>DIRECTORY ORGS</span>
            </div>
          </section>

          <div className="arena-notice arena-notice-info">
            <Info size={16} />
            <span>
              <b>Strict Separation Guarantee:</b> New organisations start as <b>unverified</b> and never inherit personal XP, numeric Levels, or Ascendancy ranks from their creator.
            </span>
          </div>

          <div className="dashboard-columns">
            <section className="dashboard-panel">
              <div className="panel-title">
                <h2>Your Organisations &amp; Context Switcher</h2>
              </div>
              {memberOrganisations.length === 0 ? (
                <p style={{ color: 'var(--arena-ink-muted)' }}>You have not created or joined an organisation yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {memberOrganisations.map((org) => {
                    const isActive = activeOrganisation?.id === org.id
                    return (
                      <div key={org.id} style={{ padding: 13, border: '1px solid var(--arena-border)', borderRadius: 9, background: isActive ? '#eef5ff' : '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Building2 size={16} color="#1e5cb5" />
                            <b>{org.name}</b>
                            <span className="tag">{org.kind}</span>
                          </div>
                          <span className={`listing-kind ${org.verificationStatus === 'verified' ? 'kind-success' : 'kind-amber'}`}>
                            {org.verificationStatus.replace('_', ' ')}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0', fontSize: 13, color: 'var(--arena-ink-muted)' }}>{org.tagline} — {org.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--arena-ink-muted)', gap: 8, flexWrap: 'wrap' }}>
                          <span>{org.ecosystem} · Personal XP/Rank Inherited: <b>None (0)</b></span>
                          <button
                            type="button"
                            className={`button button-small ${isActive ? 'button-quiet' : 'button-bright'}`}
                            onClick={() => switchOrg(isActive ? null : org.id)}
                          >
                            {isActive ? <><CheckCircle2 size={13} /> Active Context (Switch to Personal)</> : 'Switch Context'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <h3 style={{ marginTop: 22, marginBottom: 12 }}>All Arena Directory Organisations ({state.organisations.length})</h3>
              <div className="organization-grid">
                {state.organisations.map((org, index) => {
                  const owner = state.members.find((m) => m.id === org.ownerMemberId)
                  const initials = org.name
                    .split(/\s+/)
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                  return (
                    <article key={org.id} className={`organization-card org-card-${index % 4}`}>
                      <div className="organization-card-top">
                        <span className={`organization-logo logo-${index % 4}`}>{initials}</span>
                        {org.verificationStatus === 'verified' ? (
                          <span className="org-verified"><ShieldCheck size={13} /> VERIFIED</span>
                        ) : (
                          <span className="listing-kind kind-amber">{org.verificationStatus.replace('_', ' ')}</span>
                        )}
                      </div>
                      <span className="section-kicker">{org.kind}</span>
                      <h3>{org.name}</h3>
                      <p>{org.tagline || org.description}</p>
                      <div className="organization-card-bottom">
                        <span>Owner: {owner?.displayName ?? 'Spartan'} · {org.ecosystem || 'Arena'}</span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <form className="form-panel" onSubmit={handleCreate}>
              <h2 style={{ marginTop: 0 }}><Plus size={17} style={{ verticalAlign: 'middle' }} /> Create Organisation Profile</h2>
              <p style={{ fontSize: 13, color: 'var(--arena-ink-muted)', marginTop: 0 }}>
                Linked to <b>{currentMember?.displayName}</b>. Starts <code>unverified</code> until approved in Control Room.
              </p>
              <div className="form-grid">
                <label className="full-field">
                  Organisation Name
                  <input required placeholder="e.g. Aegis Research Collective" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label>
                  Organisation Type
                  <select value={kind} onChange={(e) => setKind(e.target.value as OrganisationProfile['kind'])}>
                    <option value="Project">Project</option>
                    <option value="Brand">Brand</option>
                    <option value="Company">Company</option>
                    <option value="Team">Team</option>
                    <option value="Community Initiative">Community Initiative</option>
                  </select>
                </label>
                <label>
                  Ecosystem Focus
                  <input placeholder="e.g. ZK / Developer Tooling" value={ecosystem} onChange={(e) => setEcosystem(e.target.value)} />
                </label>
                <label className="full-field">
                  One-line Tagline
                  <input placeholder="What your organisation builds or supports" value={tagline} onChange={(e) => setTagline(e.target.value)} />
                </label>
                <label className="full-field">
                  Description
                  <textarea rows={3} placeholder="Mission collaboration focus..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
                <label className="full-field">
                  Website URL
                  <input placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} />
                </label>
              </div>
              <div style={{ marginTop: 14 }}>
                <button type="submit" className="button button-bright">Create Unverified Organisation</button>
              </div>
            </form>
          </div>
        </div>
      </PermissionGate>
    </PageScaffold>
  )
}
