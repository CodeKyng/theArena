import WorkspacePageContent from '../../components/WorkspacePageContent'

export default function MemberPage({ name }: { name: string }) {
  return <WorkspacePageContent name={name} section="YOUR WORKSPACE" mode="member" />
}
