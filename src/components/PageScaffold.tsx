import type { ReactNode } from 'react'
import PageHeader from './PageHeader'

export default function PageScaffold({
  name,
  description,
  section,
  actions,
  children,
}: {
  name: string
  description?: string
  section: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="inner-page">
      <PageHeader name={name} description={description} section={section} actions={actions} />
      {children}
    </div>
  )
}
