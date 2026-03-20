import EditTestClient from "./_components/edit-test-client";

export default async function EditTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  return <EditTestClient testId={testId} />;
}
