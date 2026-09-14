import { DesignInputForm } from "@/components/design-input-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-24">
      <div className="flex w-full max-w-2xl flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">ArchitektAI</h1>
        <p className="text-muted-foreground">
          Design systems. Understand decisions. Build with confidence.
        </p>
      </div>

      <div className="mt-12 w-full max-w-4xl">
        <DesignInputForm />
      </div>
    </div>
  );
}
