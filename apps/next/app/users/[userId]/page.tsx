import { Page_admin_user_detail } from 'app/features/admin/Page_admin_user_detail'

interface UserDetailPageProps {
  params: Promise<{ userId: string }> | { userId: string }
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params

  return <Page_admin_user_detail userId={userId} />
}
