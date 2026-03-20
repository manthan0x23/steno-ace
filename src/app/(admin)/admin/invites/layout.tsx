import { requireSuperAdmin } from "~/server/guards";

export default async function AdminInvitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  requireSuperAdmin();

  return <>{children}</>;
}
