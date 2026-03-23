import { TestResultsPage } from "~/components/common/clients/user-test-results-client";

export default function Page({ params }: { params: { userId: string } }) {
  return <TestResultsPage userId={params.userId} isAdmin={true} />;
}
