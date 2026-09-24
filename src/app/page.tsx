import Link from "next/link";
import { DesignInputForm } from "@/components/design-input-form";
import { Sparkles, BookOpen, MousePointerClick, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-6 py-20 sm:py-28">
      {/* Subtle background texture - a soft radial glow behind the hero plus a
          fine dot grid, restrained enough to read as "product", not "flashy". */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--foreground) 6%, transparent) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, black 40%, transparent 90%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklch, var(--primary) 12%, transparent), transparent)" }}
      />

      <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
          <Sparkles className="size-3.5 text-primary" />
          AI-powered system design, reasoned from first principles
        </span>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">ArchitektAI</h1>
        <p className="max-w-lg text-balance text-muted-foreground sm:text-lg">
          Design systems. Understand decisions. Build with confidence.
        </p>
      </div>

      <Link
        href="/learn"
        className="group mt-12 flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl border border-border bg-card/80 px-6 py-6 text-center shadow-sm backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-card sm:flex-row sm:justify-between sm:text-left"
      >
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center justify-center gap-2 text-base font-semibold sm:justify-start">
            <BookOpen className="size-4.5 text-primary" />
            New to system design? Learn it here first.
          </h2>
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
            <MousePointerClick className="size-3.5 shrink-0" />
            No prompt needed - just click around and learn, with diagrams for every concept.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform group-hover:translate-x-0.5">
          Click here to learn system design
          <ArrowRight className="size-4" />
        </span>
      </Link>

      <div className="mt-8 w-full max-w-4xl">
        <DesignInputForm />
      </div>
    </div>
  );
}
