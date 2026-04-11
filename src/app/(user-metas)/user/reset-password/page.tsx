import { headers } from "next/headers";
import { auth } from "~/server/better-auth";
import { redirect } from "next/navigation";
import ResetPasswordPage from "./_client";

export default async function ResetPasswordResetPageServer() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/user/login");

  return <ResetPasswordPage />;
}
