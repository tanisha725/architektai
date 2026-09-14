"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLE_PROMPTS = [
  "Design Instagram for 10 million users. Users can create accounts, upload photos and videos, follow other users, view a feed, like and comment on posts, receive notifications, and send messages.",
  "Design a URL shortener that handles 100 million links with custom aliases and click analytics.",
  "Design a ride-sharing app like Uber for a city of 5 million people, with real-time driver matching and trip tracking.",
];

export function DesignInputForm() {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleExampleClick(example: string) {
    setDescription(example);
    setError(null);
  }

  async function handleSubmit() {
    if (description.trim().length < 10) {
      setError("Describe your idea in a bit more detail first.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    // Wiring to the requirement analyzer API comes in Phase 3-4.
    console.log("Would submit:", description);
    setIsSubmitting(false);
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the product you want to design, e.g. 'Design Instagram for 10 million users...'"
        className="min-h-40 resize-none text-base"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handleExampleClick(example)}
            className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/70"
          >
            {example.slice(0, 40)}...
          </button>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        size="lg"
        className="self-start"
      >
        {isSubmitting ? "Generating..." : "Generate Design"}
      </Button>
    </div>
  );
}
