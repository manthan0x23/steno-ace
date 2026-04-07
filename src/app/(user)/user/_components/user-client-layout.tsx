"use client";

import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";
import { UserNavbar } from "~/components/common/user/navbar";
import { UserSidebar } from "~/components/common/user/sidebar";
import { useLocalStorage } from "~/hooks/use-local-storage";

export function UserLayoutClient({
  user,
  children,
}: {
  user: any;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useLocalStorage("sidebar-open", true);

  return (
    <SidebarProvider open={isOpen} onOpenChange={setIsOpen}>
      <UserSidebar user={user} />
      <SidebarInset>
        <UserNavbar user={user} />
        <main className="flex flex-1 flex-col gap-4 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
