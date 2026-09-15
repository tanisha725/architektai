import { DesignInputForm } from "@/components/design-input-form";
import { Sparkles } from "lucide-react";

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

      <div className="mt-12 w-full max-w-4xl">
        <DesignInputForm />
      </div>
    </div>
  );
}
