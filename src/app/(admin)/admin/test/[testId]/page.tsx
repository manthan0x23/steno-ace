import TestDetailClient from "~/components/common/test-detail-client";

export default function Page({ params }: { params: { testId: string } }) {
  return <TestDetailClient testId={params.testId} isAdmin />;
}
