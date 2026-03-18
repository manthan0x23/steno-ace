import type { Metadata } from "next";
import { requireUser } from "~/server/guards";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";
import { UserNavbar } from "~/app/_components/user/common/navbar";
import { UserSidebar } from "~/app/_components/user/common/sidebar";

export const metadata: Metadata = {
  title: "StenoDexter",
  description: "User panel for StenoDexter",
};

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <SidebarProvider>
      <UserSidebar />
      <SidebarInset>
        <UserNavbar user={user} />
        <main className="flex flex-1 flex-col gap-4 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}