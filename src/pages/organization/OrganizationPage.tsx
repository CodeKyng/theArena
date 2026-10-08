import WorkspacePageContent from '../../components/WorkspacePageContent'

export default function OrganizationPage({ name }: { name: string }) {
  return <WorkspacePageContent name={name} section="ORGANIZATION WORKSPACE" mode="organization" />
}
