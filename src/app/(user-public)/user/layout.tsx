import type { Metadata } from "next";
import { ThemeToggle } from "~/components/utils/theme-toggle";

export const metadata: Metadata = {
  title: "StenoDexter User",
  description: "User panel for StenoDexter",
};

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="absolute top-0 left-0 flex w-full items-center justify-between p-4">
        <h2 className="font-extrabold">Steno Dexter</h2>
        <ThemeToggle />
      </div>
      {children}
    </>
  );
}
