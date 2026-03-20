import TestDetailClient from "~/components/common/clients/test-detail-client";

export default async function Page({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  return <TestDetailClient testId={testId} isAdmin />;
}
