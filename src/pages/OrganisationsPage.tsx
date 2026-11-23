import { useState, type FormEvent } from 'react'
import { Building2, CheckCircle2, Info, Plus, ShieldCheck } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PermissionGate from '../components/PermissionGate'
import { formatVerificationStatus } from '../domain/constants'
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
    <div className="inner-page">
      <PermissionGate title="Organisations">
        <div className="organization-experience">
          <section className="organization-banner">
            <div>
              <span className="section-kicker">ORGANISATIONS</span>
              <h2>Teams &amp; protocols<br />across The Arena.</h2>
              <p>
                Represent a project, team, brand, company, or community initiative under your existing account.
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
              Organisations begin unverified until reviewed in the Control Room, and keep separate profiles from your personal XP, Level, and Ascendancy rank.
            </span>
          </div>

          <div className="dashboard-columns">
            <section className="dashboard-panel">
              <div className="panel-title">
                <h2>Your Organisations &amp; Context Switcher</h2>
              </div>
              {memberOrganisations.length === 0 ? (
                <p style={{ color: 'var(--arena-muted)' }}>You have not created or joined an organisation yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {memberOrganisations.map((org) => {
                    const isActive = activeOrganisation?.id === org.id
                    return (
                      <div key={org.id} style={{ padding: 13, border: '1px solid var(--arena-line)', borderRadius: 9, background: isActive ? '#eef5ff' : '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Building2 size={16} color="#1e5cb5" />
                            <b>{org.name}</b>
                            <span className="tag">{org.kind}</span>
                          </div>
                          <span className={`listing-kind ${org.verificationStatus === 'verified' ? 'kind-success' : 'kind-amber'}`}>
                            {formatVerificationStatus(org.verificationStatus)}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0', fontSize: 13, color: 'var(--arena-muted)' }}>{org.tagline} — {org.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--arena-muted)', gap: 8, flexWrap: 'wrap' }}>
                          <span>{org.ecosystem || 'Arena'}</span>
                          <button
                            type="button"
                            className={`button button-small ${isActive ? 'button-quiet' : 'button-bright'}`}
                            onClick={() => switchOrg(isActive ? null : org.id)}
                          >
                            {isActive ? <><CheckCircle2 size={13} /> Active · Switch to Personal account</> : 'Switch to organisation'}
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
                          <span className="listing-kind kind-amber">{formatVerificationStatus(org.verificationStatus)}</span>
                        )}
                      </div>
                      <span className="section-kicker">{org.kind}</span>
                      <h3>{org.name}</h3>
                      <p>{org.tagline || org.description}</p>
                      <div className="organization-card-bottom">
                        <span>Owner: {owner?.displayName ?? 'Member'} · {org.ecosystem || 'Arena'}</span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <form className="form-panel" onSubmit={handleCreate}>
              <h2 style={{ marginTop: 0 }}><Plus size={17} style={{ verticalAlign: 'middle' }} /> Create Organisation Profile</h2>
              <p style={{ fontSize: 13, color: 'var(--arena-muted)', marginTop: 0 }}>
                Managed from <b>{currentMember?.displayName}</b>’s account.
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
                <button type="submit" className="button button-bright">Create Organisation</button>
              </div>
            </form>
          </div>
        </div>
      </PermissionGate>
    </div>
  )
}
