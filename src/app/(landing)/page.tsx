import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  ArrowRight,
  Clock,
  Zap,
  Target,
  BarChart3,
  CalendarCheck,
  TrendingUp,
  BookOpen,
  CheckCircle,
  Sparkles,
  Medal,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Steno Dexter – Speed. Precision. Success.",
  description:
    "India's most trusted stenography platform. Master shorthand for SSC, High Court & government exams.",
};

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
    title: "Daily Tests",
    desc: "Consistent assessment every week with detailed score breakdowns.",
  },
  {
    icon: TrendingUp,
    title: "Guaranteed Progress",
    desc: "Visible improvement in 15 days.",
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
    icon: CheckCircle,
    title: "Weekly Tests",
    desc: "Every Sunday — stay consistent.",
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

const govtBodies = [
  "SSC Stenographer",
  "High Court",
  "NHM",
  "State PSC",
  "Rail NTPC",
  "Delhi Police",
];

const successStories = [
  { stat: "900K+", label: "Active Learners" },
  { stat: "98%", label: "Success Rate" },
  { stat: "15 Days", label: "Avg. to Progress" },
];

const whyChoose = [
  {
    icon: Sparkles,
    title: "Precision Engineered",
    desc: "Every course is meticulously designed by certified stenography experts with real government exam experience.",
  },
  {
    icon: Medal,
    title: "Proven Track Record",
    desc: "Thousands of successful selections across SSC, High Court, NHM, and state PSCs.",
  },
  {
    icon: Users,
    title: "Supportive Community",
    desc: "Learn alongside 900K+ students in a platform built for your success.",
  },
  {
    icon: TrendingUp,
    title: "Data-Driven Progress",
    desc: "Real-time analytics show exactly what to improve, ensuring every session counts.",
  },
];

/* ─────────────────── PAGE ─────────────────── */

export default function LandingHome() {
  return (
    <main className="bg-background text-foreground antialiased">
      <Hero />
      <LogoStrip />
      <Features />
      <WhyChoose />
      <Benefits />
      <Testimonial />
      <FAQ />
    </main>
  );
}

/* ─── HERO ─── */
function Hero() {
  return (
    <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-20 text-center">
      {/* ─── BACKGROUND GRADIENTS ─── */}
      <div className="bg-background absolute inset-0 -z-20" />

      {/* Animated background glow elements */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] animate-[driftGlow_12s_ease-in-out_infinite] bg-[radial-gradient(ellipse_80%_60%_at_25%_-10%,hsl(var(--primary)/0.25),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] animate-[driftGlow_16s_ease-in-out_infinite] bg-[radial-gradient(ellipse_70%_50%_at_70%_0%,hsl(var(--secondary)/0.15),transparent)]"
      />
      <div
        aria-hidden
        className="bg-primary/8 pointer-events-none absolute bottom-[-100px] left-1/2 -z-10 h-[300px] w-[600px] -translate-x-1/2 animate-[driftGlow_18s_ease-in-out_infinite] blur-3xl"
      />

      {/* ─── CONTENT ─── */}
      <Badge
        variant="outline"
        className="mb-6 gap-2 rounded-full px-4 py-3 text-xs font-semibold tracking-widest uppercase backdrop-blur-sm"
      >
        <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
        India&apos;s #1 Stenography Platform
      </Badge>

      <h1 className="max-w-4xl text-5xl leading-[1.06] font-extrabold tracking-tight sm:text-6xl md:text-[72px] text-balance">
        Master Stenography.
        <br />
        <span className="from-primary via-primary to-secondary bg-gradient-to-r bg-clip-text text-transparent">
          Land Your Dream Job.
        </span>
      </h1>

      <p className="text-muted-foreground mt-5 text-sm font-semibold tracking-[0.3em] uppercase">
        Speed &nbsp;&middot;&nbsp; Precision &nbsp;&middot;&nbsp; Success
      </p>

      <p className="text-muted-foreground mt-6 max-w-lg text-lg leading-relaxed">
        Structured daily practice, expert courses and weekly assessments — built to get you selected in SSC, High Court &amp; government exams.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button
          size="lg"
          asChild
          className="shadow-primary/20 gap-2 px-7 text-base font-semibold shadow-lg"
        >
          <Link href="/user">
            Start Today <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <Button size="lg" variant="outline" asChild className="px-7 text-base">
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </div>

      {/* Success metrics */}
      <div className="border-border/70 bg-background/50 divide-border mt-16 grid grid-cols-3 divide-x overflow-hidden rounded-2xl border shadow-lg shadow-black/5 backdrop-blur-md">
        {successStories.map((s) => (
          <div
            key={s.label}
            className="bg-muted/20 px-8 py-5 text-center sm:px-12"
          >
            <p className="text-primary text-3xl font-extrabold">{s.stat}</p>
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
    <section className="border-border bg-muted/30 border-y px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-muted-foreground mb-4 text-center text-xs font-semibold tracking-widest uppercase">
          Trusted by students selected in
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {govtBodies.map((item) => (
            <span
              key={item}
              className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
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
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.title}
                className="border-border/60 bg-muted/30 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl">
                    <Icon className="text-primary h-6 w-6" />
                  </div>
                  <p className="font-bold text-base">{f.title}</p>
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

/* ─── WHY CHOOSE US ─── */
function WhyChoose() {
  return (
    <section className="relative overflow-hidden px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          tag="What Sets Us Apart"
          title="Why choose Steno Dexter?"
          sub="Every feature is designed around your success. From curriculum to community."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="border-border/60 bg-gradient-to-br from-muted/40 to-muted/20 transition-all hover:border-primary/40 hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="bg-primary/10 mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg">
                    <Icon className="text-primary h-5 w-5" />
                  </div>
                  <p className="font-semibold text-sm">{item.title}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {item.desc}
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

/* ─── BENEFITS ─── */
function Benefits() {
  return (
    <section id="benefits" className="bg-muted/20 px-4 py-24">
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
                Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <Card
                  key={b.title}
                  className="border-border/60 bg-background hover:border-primary/40 hover:shadow-md p-5 transition-all"
                >
                  <Icon className="text-primary mb-3 h-5 w-5" />
                  <p className="text-sm font-semibold">{b.title}</p>
                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
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

/* ─── TESTIMONIAL SECTION ─── */
function Testimonial() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">
            Success Stories
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight">
            From our community
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-relaxed">
            Real students. Real results. Real success in government exams.
          </p>
        </div>

        <Card className="border-border/60 bg-gradient-to-br from-muted/40 to-muted/20 p-8 md:p-10">
          <div className="mb-6 flex gap-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="text-primary text-xl"
              >
                ★
              </span>
            ))}
          </div>
          <p className="text-lg leading-relaxed mb-6 text-foreground font-medium">
            "I went from 0 to 80 WPM in just 2 months. The structured approach and daily tests kept me accountable. The community support is amazing. I got selected in SSC Stenographer Grade-A!"
          </p>
          <div className="flex items-center gap-3 pt-4 border-t border-border/30">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">A</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Aditya Kumar</p>
              <p className="text-muted-foreground text-xs">SSC Stenographer Grade-A 2024</p>
            </div>
          </div>
        </Card>

        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-2xl font-bold text-primary mb-1">25K+</p>
            <p className="text-muted-foreground text-xs">Selected in 2024</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-2xl font-bold text-primary mb-1">4.8/5</p>
            <p className="text-muted-foreground text-xs">Avg Rating</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-2xl font-bold text-primary mb-1">45 Days</p>
            <p className="text-muted-foreground text-xs">Avg to First Selection</p>
          </div>
        </div>
      </div>
    </section>
  );
}



/* ─── FAQ ─── */
function FAQ() {
  return (
    <section id="faq" className="bg-muted/20 px-4 py-24">
      <div className="mx-auto max-w-2xl">
        <SectionHead
          tag="FAQ"
          title="Common questions"
          sub="Everything you would want to know before enrolling."
          center
        />
        <Accordion type="single" collapsible className="mt-12 w-full">
          {faqs.map((f, i) => (
            <AccordionItem 
              key={i} 
              value={`item-${i}`}
              className="border-border/40"
            >
              <AccordionTrigger className="text-left text-[15px] font-semibold hover:text-primary transition-colors">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">Still have questions?</p>
          <Button size="lg" asChild>
            <Link href="/contact-us">Get in touch with our team</Link>
          </Button>
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
