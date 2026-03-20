import ReportCardClient from "~/components/common/report-card-client";
import { api } from "~/trpc/server";

export default async function Page({ params }: { params: { userId: string } }) {
  const user = await api.user.getUser({
    userId: params.userId,
  });

  return (
    <ReportCardClient
      userId={params.userId}
      isAdmin
      userName={user.name ?? user.email?.split("@")[0] ?? "User"}
    />
  );
}
