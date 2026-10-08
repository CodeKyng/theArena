import { useAppState } from '../../app/appStateContext'
import { descriptions } from '../../data/pageContent'
import PageScaffold from '../../components/PageScaffold'
import PublicPageExperience from '../../components/public/PublicPageExperience'

export default function GeneralPage({ name }: { name: string }) {
  const { flash } = useAppState()
  return <PageScaffold name={name} description={descriptions[name]} section="THE ARENA / EXPLORE" flash={flash}>
    <PublicPageExperience name={name} />
  </PageScaffold>
}
