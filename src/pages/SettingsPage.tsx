import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, Link2, ShieldCheck } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import PermissionGate from '../components/PermissionGate'

export default function SettingsPage() {
  const { currentMember, updatePrivacy } = useArena()

  const [connectedGithub, setConnectedGithub] = useState(currentMember?.privacy.connectedGithub ?? '')
  const [connectedX, setConnectedX] = useState(currentMember?.privacy.connectedX ?? '')
  const [connectedWallet, setConnectedWallet] = useState(currentMember?.privacy.connectedWallet ?? '')

  const handleSaveHandles = (e: FormEvent) => {
    e.preventDefault()
    updatePrivacy({
      connectedGithub: connectedGithub.trim() || undefined,
      connectedX: connectedX.trim() || undefined,
      connectedWallet: connectedWallet.trim() || undefined,
    })
  }

  return (
    <PageScaffold
      section="Account"
      name="Settings"
      description="Manage directory visibility, leaderboard privacy, alert preferences, and connected account references."
      actions={
        <Link className="button button-quiet" to="/profile">
          Back to Profile
        </Link>
      }
    >
      <PermissionGate title="Settings">
        {currentMember && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="arena-notice arena-notice-info">
              <ShieldCheck size={16} />
              <span>
                <b>Local Prototype Account ({currentMember.email}):</b> Privacy toggles and linked handles are persisted locally in your browser without external OAuth or wallet signing.
              </span>
            </div>

            <div className="dashboard-columns">
              <section className="dashboard-panel">
                <div className="panel-title">
                  <h2><ShieldCheck size={16} style={{ verticalAlign: 'middle' }} /> Privacy &amp; Directory Visibility</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentMember.privacy.publicProfileVisible}
                      onChange={(e) => updatePrivacy({ publicProfileVisible: e.target.checked })}
                    />
                    <span>
                      <b>Show my public Spartan profile</b>
                      <small style={{ display: 'block', color: 'var(--arena-muted)' }}>
                        List your Spartan profile in Explore → People.
                      </small>
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentMember.privacy.showContributionsPublicly}
                      onChange={(e) => updatePrivacy({ showContributionsPublicly: e.target.checked })}
                    />
                    <span>
                      <b>Show verified contributions publicly</b>
                      <small style={{ display: 'block', color: 'var(--arena-muted)' }}>
                        Display approved Proof-of-Work deliverables on public community views.
                      </small>
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentMember.privacy.showOnLeaderboard}
                      onChange={(e) => updatePrivacy({ showOnLeaderboard: e.target.checked })}
                    />
                    <span>
                      <b>Appear on CP Leaderboards</b>
                      <small style={{ display: 'block', color: 'var(--arena-muted)' }}>
                        Include your Seasonal and All-Time CP standing in public rankings.
                      </small>
                    </span>
                  </label>
                </div>
              </section>

              <section className="dashboard-panel">
                <div className="panel-title">
                  <h2><BellRing size={16} style={{ verticalAlign: 'middle' }} /> Notification Preferences</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentMember.privacy.missionAlerts}
                      onChange={(e) => updatePrivacy({ missionAlerts: e.target.checked })}
                    />
                    <span>
                      <b>In-app Mission &amp; Review alerts</b>
                      <small style={{ display: 'block', color: 'var(--arena-muted)' }}>
                        Receive notifications when submissions are reviewed, approved, or disputed.
                      </small>
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentMember.privacy.emailNotifications}
                      onChange={(e) => updatePrivacy({ emailNotifications: e.target.checked })}
                    />
                    <span>
                      <b>Email digest notifications</b>
                      <small style={{ display: 'block', color: 'var(--arena-muted)' }}>
                        Store preference for periodic summaries (simulated in Demo Mode).
                      </small>
                    </span>
                  </label>
                </div>
              </section>
            </div>

            <form className="form-panel" onSubmit={handleSaveHandles}>
              <h2 style={{ marginTop: 0 }}>
                <Link2 size={17} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Connected Accounts &amp; References
              </h2>
              <div className="form-grid">
                <label>
                  GitHub Handle
                  <input
                    value={connectedGithub}
                    onChange={(e) => setConnectedGithub(e.target.value)}
                    placeholder="@handle"
                  />
                </label>
                <label>
                  X Handle
                  <input
                    value={connectedX}
                    onChange={(e) => setConnectedX(e.target.value)}
                    placeholder="@handle"
                  />
                </label>
                <label className="full-field">
                  Wallet Address (read-only reference)
                  <input
                    value={connectedWallet}
                    onChange={(e) => setConnectedWallet(e.target.value)}
                    placeholder="0x..."
                  />
                </label>
              </div>
              <button type="submit" className="button button-bright">
                Save Connected Accounts
              </button>
            </form>
          </div>
        )}
      </PermissionGate>
    </PageScaffold>
  )
}
