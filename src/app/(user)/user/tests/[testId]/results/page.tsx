import { TestResultsPage } from "~/components/common/clients/user-test-results-client";
import { api } from "~/trpc/server";

export default async function Page() {
  const user = await api.user.me();

  return <TestResultsPage userId={user.id!} isAdmin={false} />;
}
