import ReportCardClient from "~/components/common/clients/report-card-client";
import { api } from "~/trpc/server";

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const user = await api.user.getUser({ userId });

  return (
    <ReportCardClient
      userId={userId}
      isAdmin
      userName={user.name ?? user.email?.split("@")[0] ?? "User"}
    />
  );
}
