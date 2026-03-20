"use client";
import LeaderboardClient from "~/components/common/leaderboard-client";
import { trpc } from "~/trpc/react";

export default function Page() {
  const [me] = trpc.user.me.useSuspenseQuery();
  return <LeaderboardClient currentUserId={me.id} />;
}
