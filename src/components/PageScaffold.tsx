import type { ReactNode } from 'react'
import PageHeader from './PageHeader'

export default function PageScaffold({ name, description, section, flash, children }: {
  name: string
  description: string
  section: string
  flash: (message: string) => void
  children: ReactNode
}) {
  return <div className="inner-page">
    <PageHeader name={name} description={description} section={section} flash={flash} />
    {children}
  </div>
}
