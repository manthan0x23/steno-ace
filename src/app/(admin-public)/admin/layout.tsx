import type { Metadata } from "next";
import { ThemeToggle } from "~/components/utils/theme-toggle";

export const metadata: Metadata = {
  title: "StenoDexter Admin",
  description: "Admin panel for StenoDexter",
};

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {children}
    </>
  );
}
