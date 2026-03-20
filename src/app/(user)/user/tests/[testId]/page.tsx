import TestDetailClient from "~/components/common/clients/test-detail-client";

export default async function UserTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  return <TestDetailClient testId={testId} />;
}
