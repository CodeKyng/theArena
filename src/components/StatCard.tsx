import type { ReactNode } from 'react'

export default function StatCard({ label, value, change, icon }: {
  label: string
  value: string
  change: string
  icon: ReactNode
}) {
  return <div className="stat-card">
    <div className="stat-top">{label}<span>{icon}</span></div>
    <strong>{value}</strong>
    <small><i /> {change}</small>
  </div>
}
