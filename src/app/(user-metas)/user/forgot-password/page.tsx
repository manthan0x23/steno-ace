import { headers } from "next/headers";
import { auth } from "~/server/better-auth";
import { redirect } from "next/navigation";
import ForgotPasswordPage from "./_client";

export default async function FrogetPasswordPageServer() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/user/login");

  return <ForgotPasswordPage email={session?.user.email} />;
}
