import TestDetailClient from "~/components/common/clients/test-detail-client";

export default function Page({ params }: { params: { testId: string } }) {
  return <TestDetailClient testId={params.testId} isAdmin />;
}
