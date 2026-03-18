import type { Metadata } from "next";
import { requireAdmin, requireUser } from "~/server/guards";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";

export const metadata: Metadata = {
  title: "StenoDexter Admin",
  description: "Admin panel for StenoDexter",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <SidebarProvider>
      <SidebarInset>
        <>{JSON.stringify(user)}</>
        <main className="flex flex-1 flex-col gap-4 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
