import TestDetailClient from "~/components/common/test-detail-client";

export default function UserTestPage({
  params,
}: {
  params: { testId: string };
}) {
  return <TestDetailClient testId={params.testId} />;
}
