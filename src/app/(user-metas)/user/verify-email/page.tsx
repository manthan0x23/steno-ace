import { headers } from "next/headers";
import { auth } from "~/server/better-auth";
import VerifyEmailPage from "./_client";
import { redirect } from "next/navigation";

export default async function VerifyEmailPageServer() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log("USER SESSION", session);

  if (!session || !session.user.email) redirect("/user/login");

  return <VerifyEmailPage userEmail={session?.user.email} />;
}
