import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bell, Check, CheckCheck, Megaphone } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import PageScaffold from '../components/PageScaffold'
import PermissionGate from '../components/PermissionGate'

type NotificationFilter = 'all' | 'unread' | 'personal' | 'announcements'

export default function NotificationsPage() {
  const {
    state,
    currentMember,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useArena()

  const [filter, setFilter] = useState<NotificationFilter>('all')

  const allMine = currentMember
    ? state.notifications.filter((n) => n.memberId === currentMember.id)
    : []

  const filtered = allMine.filter((item) => {
    if (filter === 'unread') return !item.read
    if (filter === 'personal') return item.category !== 'announcement'
    if (filter === 'announcements') return item.category === 'announcement'
    return true
  })

  return (
    <PageScaffold
      section="Personal"
      name="Notifications"
      description="Personal mission, review, XP, and achievement updates alongside official Arena announcements."
      actions={
        currentMember && unreadNotificationsCount > 0 ? (
          <button
            type="button"
            className="button button-quiet"
            onClick={markAllNotificationsRead}
          >
            <CheckCheck size={15} /> Mark all read
          </button>
        ) : undefined
      }
    >
      <PermissionGate title="Notifications">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="arena-tabs" role="tablist" aria-label="Filter notifications">
            {(
              [
                ['all', `All (${allMine.length})`],
                ['unread', `Unread (${unreadNotificationsCount})`],
                ['personal', `Personal (${allMine.filter((n) => n.category !== 'announcement').length})`],
                ['announcements', `Announcements (${allMine.filter((n) => n.category === 'announcement').length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                className={`arena-tab ${filter === id ? 'active' : ''}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <span><Bell size={24} /></span>
              <h3>No notifications in this view</h3>
              <p>Updates about your missions, reviews, progression, and Arena announcements appear here.</p>
              <Link className="button button-bright" to="/dashboard">
                Back to Dashboard <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((item) => {
                const isAnnouncement = item.category === 'announcement'
                return (
                  <div
                    key={item.id}
                    className={`notification-row ${item.read ? '' : 'notification-unread'}`}
                  >
                    <span className={`alert-icon ${isAnnouncement ? 'alert-red' : ''}`}>
                      {isAnnouncement ? <Megaphone size={16} /> : <Bell size={16} />}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span className={`listing-kind ${isAnnouncement ? 'kind-featured' : ''}`}>
                          {isAnnouncement ? 'Announcement' : item.category}
                        </span>
                        <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                        {!item.read && (
                          <span className="listing-kind kind-amber">Unread</span>
                        )}
                      </div>
                      <b style={{ display: 'block', fontSize: 14 }}>{item.title}</b>
                      <p style={{ margin: '4px 0 0' }}>{item.body}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {!item.read && (
                        <button
                          type="button"
                          className="button button-quiet button-small"
                          onClick={() => markNotificationRead(item.id)}
                        >
                          <Check size={13} /> Mark read
                        </button>
                      )}
                      {item.linkPath && (
                        <Link
                          className="button button-bright button-small"
                          to={item.linkPath}
                          onClick={() => {
                            if (!item.read) markNotificationRead(item.id)
                          }}
                        >
                          Open <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PermissionGate>
    </PageScaffold>
  )
}
