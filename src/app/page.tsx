import { Navbar } from "~/components/landing/navbar";
import { Hero } from "~/components/landing/hero";
import { Features } from "~/components/landing/features";
import { Benefits } from "~/components/landing/benefits";
import { Courses } from "~/components/landing/courses";
import { FAQ } from "~/components/landing/faq";
import { Footer } from "~/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Features />
      <Benefits />
      <Courses />
      <FAQ />
      <Footer />
    </main>
  );
}
