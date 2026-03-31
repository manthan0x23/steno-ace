import Link from "next/link";
import { Button } from "~/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            SD
          </div>
          <span className="hidden text-xl font-bold text-foreground sm:inline">
            Steno Dexter
          </span>
        </div>

        <div className="hidden gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#benefits"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Why Us
          </Link>
          <Link
            href="#courses"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Courses
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            FAQ
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            asChild
            className="hidden sm:inline-flex"
          >
            <Link href="/user">Sign In</Link>
          </Button>
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/user">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
