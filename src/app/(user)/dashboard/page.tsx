import Link from "next/link";

import { AuthPanel, SignOutButton } from "~/app/_components/auth-panel";
import { LatestPost } from "~/app/_components/post";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";

export default async function UserDashboardPage() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await getSession();

  if (session) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            User Space
          </h1>
          <p className="text-lg text-white/80">
            Pay monthly, attempt stenography tests, and climb the leaderboard.
          </p>

          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-white">
              {hello ? hello.greeting : "Loading tRPC query..."}
            </p>

            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-center text-2xl text-white">
                {session && (
                  <span>
                    Logged in as {session.user?.name ?? session.user?.email}
                  </span>
                )}
              </p>
              {!session ? <AuthPanel /> : <SignOutButton />}
            </div>
          </div>

          {session?.user && <LatestPost />}

          <div className="mt-6 flex gap-4">
            <Link
              href="#tests"
              className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold hover:bg-white/20"
            >
              Explore tests (soon)
            </Link>
            <Link
              href="#leaderboard"
              className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold hover:bg-white/20"
            >
              View leaderboard (soon)
            </Link>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}

