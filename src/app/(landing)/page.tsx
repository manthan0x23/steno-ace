import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Separator } from "~/components/ui/separator";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  Target,
  BarChart3,
  CalendarCheck,
  Award,
  ShieldCheck,
  TrendingUp,
  BookOpen,
} from "lucide-react";

export const metadata = {
  title: "Steno Dexter – Speed. Precision. Success.",
  description:
    "India's most trusted stenography platform. Master shorthand for SSC, High Court & government exams.",
};

/* ─────────────────── DATA ─────────────────── */

const features = [
  {
    icon: Zap,
    title: "Speed-First Curriculum",
    desc: "Drills engineered to push your WPM — structured, proven, no filler.",
  },
  {
    icon: Target,
    title: "Exam-Mapped Content",
    desc: "Every lesson aligned to SSC, High Court & NHM exam patterns.",
  },
  {
    icon: CalendarCheck,
    title: "Weekly Sunday Tests",
    desc: "Consistent assessment every week with detailed score breakdowns.",
  },
  {
    icon: TrendingUp,
    title: "Guaranteed Progress",
    desc: "Visible improvement in 15 days or your money back — no questions.",
  },
];

const courses = [
  {
    id: 1,
    title: "Beginner Speed Build",
    category: "Fundamentals",
    price: 1499,
    originalPrice: 2499,
    duration: "30 Days",
    students: 2500,
    desc: "Start from zero. Build speed, accuracy and confidence step by step.",
    highlight: false,
  },
  {
    id: 2,
    title: "SSC Court Shorthand",
    category: "Govt Exams",
    price: 399,
    originalPrice: 699,
    duration: "15 Days",
    students: 3200,
    desc: "Fast-track prep for SSC shorthand exams by certified professionals.",
    highlight: true,
  },
  {
    id: 3,
    title: "Advanced Dictation Pack",
    category: "Advanced",
    price: 999,
    originalPrice: 1999,
    duration: "30 Days",
    students: 1800,
    desc: "6 months of real exam-style dictations for serious speed acceleration.",
    highlight: false,
  },
  {
    id: 4,
    title: "High Court Mastery",
    category: "Govt Exams",
    price: 1500,
    originalPrice: 2500,
    duration: "Monthly",
    students: 1200,
    desc: "Comprehensive training mapped to High Court stenographer requirements.",
    highlight: false,
  },
  {
    id: 5,
    title: "1 Year Dictation Bundle",
    category: "Complete Pack",
    price: 1900,
    originalPrice: 2900,
    duration: "12 Months",
    students: 900,
    desc: "Full year of structured dictation materials and practice exercises.",
    highlight: false,
  },
  {
    id: 6,
    title: "Interview Prep Intensive",
    category: "Job Ready",
    price: 999,
    originalPrice: 1499,
    duration: "14 Days",
    students: 1100,
    desc: "Mock tests, expert tips and real scenarios to get you hired faster.",
    highlight: false,
  },
];

const benefits = [
  { icon: Clock, title: "Learn Anytime", desc: "24/7 access on any device." },
  {
    icon: BookOpen,
    title: "Expert-Designed",
    desc: "By certified stenography pros.",
  },
  {
    icon: BarChart3,
    title: "Performance Reports",
    desc: "Know exactly what to improve.",
  },
  {
    icon: CalendarCheck,
    title: "Weekly Tests",
    desc: "Every Sunday — stay consistent.",
  },
  {
    icon: Award,
    title: "Verified Certificate",
    desc: "Issued on course completion.",
  },
  {
    icon: ShieldCheck,
    title: "7-Day Money Back",
    desc: "Risk-free enrollment, always.",
  },
];

const faqs = [
  {
    q: "How quickly will I see results?",
    a: "Most students notice measurable improvement within 15–30 days of consistent daily practice. Full proficiency typically takes 3–6 months.",
  },
  {
    q: "Are courses designed for government exams?",
    a: "Yes — SSC, High Court, NHM and more. Every course is pattern-mapped by experts with real selection track records.",
  },
  {
    q: "Can I access the platform on mobile?",
    a: "Fully responsive. Works seamlessly on phone, tablet, and desktop.",
  },
  {
    q: "What is the refund policy?",
    a: "7-day money-back guarantee on all courses. No questions asked.",
  },
  {
    q: "Do I get a certificate on completion?",
    a: "Yes — a verified completion certificate for every course. Advanced professional certifications are also available.",
  },
  {
    q: "I'm a complete beginner — where do I start?",
    a: "Beginner Speed Build is built for you. It starts from zero and takes you step by step to professional-level accuracy.",
  },
];

const trustPoints = [
  "7-day money-back guarantee",
  "No credit card required to start",
  "Cancel anytime",
];

const govtBodies = [
  "SSC Stenographer",
  "High Court",
  "NHM",
  "State PSC",
  "Rail NTPC",
  "Delhi Police",
];

/* ─────────────────── PAGE ─────────────────── */

export default function LandingHome() {
  return (
    <main className="bg-background text-foreground antialiased">
      <Hero />
      <LogoStrip />
      <Features />
      <Courses />
      <Benefits />
      <FAQ />
      <CTABanner />
    </main>
  );
}

/* ─── HERO ─── */
function Hero() {
  return (
    <section className="relative isolate flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-20 text-center">
      {/* subtle top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,hsl(var(--primary)/0.13),transparent)]"
      />

      <Badge
        variant="outline"
        className="mb-6 gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase"
      >
        <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
        India&apos;s #1 Stenography Platform
      </Badge>

      <h1 className="max-w-4xl text-5xl leading-[1.06] font-extrabold tracking-tight sm:text-6xl md:text-[72px]">
        Master Stenography.{" "}
        <span className="text-primary">Land Your Dream Job.</span>
      </h1>

      {/* motto */}
      <p className="text-muted-foreground mt-5 text-sm font-semibold tracking-[0.3em] uppercase">
        Speed &nbsp;&middot;&nbsp; Precision &nbsp;&middot;&nbsp; Success
      </p>

      <p className="text-muted-foreground mt-5 max-w-lg text-lg leading-relaxed">
        Structured daily practice, expert courses and weekly assessments — built
        to get you selected in SSC, High Court &amp; government exams.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          size="lg"
          asChild
          className="gap-2 px-7 text-base font-semibold"
        >
          <Link href="/user">
            Start Free Today <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild className="px-7 text-base">
          <Link href="#courses">Browse Courses</Link>
        </Button>
      </div>

      {/* stats strip */}
      <div className="border-border divide-border mt-16 grid grid-cols-3 divide-x overflow-hidden rounded-2xl border">
        {[
          { value: "900K+", label: "Active Learners" },
          { value: "98%", label: "Success Rate" },
          { value: "15 Days", label: "Guaranteed Progress" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-muted/30 px-8 py-5 text-center sm:px-12"
          >
            <p className="text-primary text-3xl font-extrabold">{s.value}</p>
            <p className="text-muted-foreground mt-1 text-xs">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── LOGO STRIP ─── */
function LogoStrip() {
  return (
    <div className="border-border bg-muted/20 border-y px-4 py-5">
      <p className="text-muted-foreground mb-3 text-center text-[10px] font-semibold tracking-widest uppercase">
        Our students selected in
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {govtBodies.map((item) => (
          <span
            key={item}
            className="text-muted-foreground/70 text-sm font-medium"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── FEATURES ─── */
function Features() {
  return (
    <section id="features" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          tag="Why Steno Dexter"
          title="Built for real results"
          sub="Everything on this platform is purpose-built for one outcome — getting you selected."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.title}
                className="border-border transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="bg-primary/10 mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg">
                    <Icon className="text-primary h-5 w-5" />
                  </div>
                  <p className="font-bold">{f.title}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── COURSES ─── */
function Courses() {
  return (
    <section id="courses" className="bg-muted/30 px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead
            tag="Courses"
            title="Pick your path"
            sub="Choose a course matched to your current level and target exam."
          />
          <p className="text-muted-foreground shrink-0 pb-1 text-xs">
            All prices include lifetime access
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Card
              key={c.id}
              className={`flex flex-col transition-shadow hover:shadow-md ${
                c.highlight
                  ? "border-primary ring-primary/30 ring-1"
                  : "border-border"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={c.highlight ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {c.category}
                  </Badge>
                  {c.highlight && (
                    <Badge className="border-primary/20 bg-primary/10 text-primary text-[10px] font-semibold">
                      Most Popular
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-[17px] leading-snug font-bold">
                  {c.title}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {c.desc}
                </p>
              </CardHeader>

              <CardContent className="flex-1 pb-0">
                <div className="text-muted-foreground flex items-center gap-5 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {c.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />{" "}
                    {c.students.toLocaleString()} students
                  </span>
                </div>
              </CardContent>

              <Separator className="mt-5" />

              <CardFooter className="flex items-center justify-between pt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold">
                    ₹{c.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-sm line-through">
                    ₹{c.originalPrice.toLocaleString()}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={c.highlight ? "default" : "outline"}
                  asChild
                >
                  <Link href="/user">Enroll Now</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── BENEFITS ─── */
function Benefits() {
  return (
    <section id="benefits" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHead
              tag="What You Get"
              title={
                <>
                  Everything you need
                  <br />
                  <span className="text-primary">to get selected.</span>
                </>
              }
              sub="One platform. All the structure, material and support — from beginner to job-ready."
            />
            <Button className="mt-8 gap-2" asChild>
              <Link href="/user">
                Start Learning Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <Card
                  key={b.title}
                  className="hover:border-primary/40 p-4 transition-colors"
                >
                  <Icon className="text-primary mb-3 h-5 w-5" />
                  <p className="text-sm font-semibold">{b.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {b.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  return (
    <section id="faq" className="bg-muted/30 px-4 py-24">
      <div className="mx-auto max-w-2xl">
        <SectionHead
          tag="FAQ"
          title="Common questions"
          sub="Everything you would want to know before enrolling."
          center
        />
        <Accordion type="single" collapsible className="mt-10 w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-[15px] font-semibold">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─── CTA BANNER ─── */
function CTABanner() {
  return (
    <section className="border-border relative isolate overflow-hidden border-t px-4 py-24 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[400px] bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,hsl(var(--primary)/0.1),transparent)]"
      />
      <div className="mx-auto max-w-xl">
        <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
          Speed &nbsp;&middot;&nbsp; Precision &nbsp;&middot;&nbsp; Success
        </p>
        <h2 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
          Your selection starts
          <br />
          here, today.
        </h2>
        <p className="text-muted-foreground mt-4">
          Join 900,000+ learners who chose Steno Dexter to clear their exams.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild className="gap-2 px-7 font-semibold">
            <Link href="/user">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="px-7">
            <Link href="#courses">See All Courses</Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
          {trustPoints.map((t) => (
            <span
              key={t}
              className="text-muted-foreground flex items-center gap-1.5 text-sm"
            >
              <CheckCircle2 className="text-primary h-4 w-4 shrink-0" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SHARED ─── */
function SectionHead({
  tag,
  title,
  sub,
  center = false,
}: {
  tag: string;
  title: React.ReactNode;
  sub?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      <p className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">
        {tag}
      </p>
      <h2 className="text-4xl leading-tight font-extrabold tracking-tight">
        {title}
      </h2>
      {sub && (
        <p
          className={`text-muted-foreground mt-3 leading-relaxed ${
            center ? "mx-auto max-w-md" : "max-w-md"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
