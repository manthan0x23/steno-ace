import TestDetailClient from "~/components/common/clients/test-detail-client";

export default function UserTestPage({
  params,
}: {
  params: { testId: string };
}) {
  return <TestDetailClient testId={params.testId} />;
}
