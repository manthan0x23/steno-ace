import { api } from "~/trpc/server";

export async function PUT(req: Request) {
  const isCron = req.headers.get("x-vercel-cron");

  if (!isCron) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await Promise.all([
      api.crons.expireSubscription(),
      api.crons.sendExpiryReminders(),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    console.error("CRON_ERROR:", error);

    return Response.json({ success: false }, { status: 500 });
  }
}
