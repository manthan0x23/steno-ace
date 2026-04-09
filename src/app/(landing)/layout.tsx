import { Navbar } from "~/components/landing/navbar";
import { Footer } from "~/components/landing/footer";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
