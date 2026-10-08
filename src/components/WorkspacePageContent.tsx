import { useAppState } from '../app/appStateContext'
import { descriptions } from '../data/pageContent'
import PageScaffold from './PageScaffold'
import WorkspaceExperience from './workspace/WorkspaceExperiences'

export default function WorkspacePageContent({ name, section, mode }: {
  name: string
  section: 'YOUR WORKSPACE' | 'ORGANIZATION WORKSPACE' | 'ARENA ADMIN'
  mode: 'member' | 'organization' | 'admin'
}) {
  const { flash } = useAppState()
  const description = descriptions[name] ?? `${name} for your workspace.`
  return <PageScaffold name={name} description={description} section={section} flash={flash}>
    <WorkspaceExperience name={name} mode={mode} />
  </PageScaffold>
}
