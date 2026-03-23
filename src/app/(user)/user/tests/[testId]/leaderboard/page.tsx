import { TestLeaderboardPage } from "~/components/common/clients/test-leaderboard-client";
import { api } from "~/trpc/server";

export default async function UserLeaderboardPage() {
  const user = await api.user.me();

  return (
    <TestLeaderboardPage isAdmin={false} currentUserId={user.id ?? null} />
  );
}

// // ─── app/admin/test/[testId]/leaderboard/page.tsx ────────────────────────────

// import { TestLeaderboardPage } from "~/components/common/test-leaderboard-page";

// export default function AdminLeaderboardPage() {
//   return <TestLeaderboardPage isAdmin={true} />;
// }
