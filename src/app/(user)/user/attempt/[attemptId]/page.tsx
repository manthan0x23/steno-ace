import AttemptResultClient from "~/components/common/clients/attemp-result-client";
import { api, HydrateClient } from "~/trpc/server";

interface Props {
  params: Promise<{ attemptId: string }>;
}

export default async function AttemptResultPage({ params }: Props) {
  const { attemptId } = await params;

  void api.result.getResult.prefetch({ attemptId });

  return (
    <HydrateClient>
      <AttemptResultClient attemptId={attemptId} />
    </HydrateClient>
  );
}