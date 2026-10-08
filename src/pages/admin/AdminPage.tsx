import WorkspacePageContent from '../../components/WorkspacePageContent'

export default function AdminPage({ name }: { name: string }) {
  return <WorkspacePageContent name={name} section="ARENA ADMIN" mode="admin" />
}
