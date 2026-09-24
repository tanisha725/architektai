import Link from "next/link";
import { GlossaryExplorer } from "@/components/glossary-explorer";
import { ResourcesList } from "@/components/resources-list";
import { TECHNOLOGIES } from "@/lib/knowledge-base/technologies";
import { CONCEPTS } from "@/lib/knowledge-base/concepts";
import { RESOURCES } from "@/lib/resources";

export const metadata = {
  title: "Learn System Design | ArchitektAI",
};

export default function LearnPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-16">
      <div className="flex w-full max-w-4xl flex-col gap-2">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to ArchitektAI
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Learn System Design</h1>
        <p className="text-muted-foreground">
          Plain-language explanations of the concepts and technologies behind every design ArchitektAI generates -
          no prompt needed, just click around.
        </p>
      </div>

      <div className="mt-10 w-full max-w-4xl">
        <GlossaryExplorer technologies={TECHNOLOGIES} concepts={CONCEPTS} />
      </div>

      <div className="mt-12 w-full max-w-4xl border-t border-border pt-8">
        <h2 className="text-lg font-semibold">Go deeper</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Well-known, hand-picked resources if you want to keep learning beyond this glossary.
        </p>
        <div className="mt-4">
          <ResourcesList resources={RESOURCES} />
        </div>
      </div>
    </div>
  );
}
