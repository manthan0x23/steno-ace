import { requireUser } from "~/server/guards";
import { SubscriptionGate } from "./_components/subcription-gate";
import { UserLayoutClient } from "./_components/user-client-layout";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <SubscriptionGate>
      <UserLayoutClient user={user}>{children}</UserLayoutClient>
    </SubscriptionGate>
  );
}
