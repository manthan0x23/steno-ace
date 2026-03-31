import { AttemptsClient } from "~/components/common/clients/user-attempts-client";

export default async function AdminUserAttemptsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <AttemptsClient adminUserId={userId} />;
}
