"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InterviewEvaluation } from "@/lib/schemas/interview-schema";

type Phase = "not-started" | "loading-questions" | "answering" | "evaluating" | "showing-evaluation" | "finished" | "error";

export function InterviewTab({ designSummary }: { designSummary: string }) {
  const [phase, setPhase] = useState<Phase>("not-started");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function startInterview() {
    setPhase("loading-questions");
    setError(null);
    try {
      const response = await fetch("/api/interview/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designSummary }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Failed to generate questions.");
      setQuestions(data.questions);
      setCurrentIndex(0);
      setScores([]);
      setPhase("answering");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setPhase("error");
    }
  }

  async function submitAnswer() {
    if (answer.trim().length < 5) return;
    setPhase("evaluating");
    setEvaluationError(null);
    try {
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designSummary, question: questions[currentIndex], answer }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Evaluation failed.");

      if (data.evaluation) {
        setEvaluation(data.evaluation);
        setScores((prev) => [...prev, data.evaluation.score]);
      } else {
        setEvaluationError(data.error ?? "AI evaluation unavailable.");
        setEvaluation(null);
      }
      setPhase("showing-evaluation");
    } catch (err) {
      setEvaluationError(err instanceof Error ? err.message : "Unexpected error.");
      setEvaluation(null);
      setPhase("showing-evaluation");
    }
  }

  function nextQuestion() {
    setAnswer("");
    setEvaluation(null);
    setEvaluationError(null);
    if (currentIndex + 1 >= questions.length) {
      setPhase("finished");
    } else {
      setCurrentIndex((i) => i + 1);
      setPhase("answering");
    }
  }

  if (phase === "not-started") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          Gemini will ask you questions grounded in the specific design you just generated, then evaluate your
          answers on correctness, depth, trade-off awareness, and communication.
        </p>
        <Button onClick={startInterview}>Start Interview</Button>
      </div>
    );
  }

  if (phase === "loading-questions") {
    return <p className="text-sm text-muted-foreground">Preparing interview questions...</p>;
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={startInterview}>Retry</Button>
      </div>
    );
  }

  if (phase === "finished") {
    const average = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return (
      <div className="flex flex-col items-start gap-3">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base">Interview complete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {average !== null
                ? `Average score: ${average}/100 across ${scores.length} question${scores.length === 1 ? "" : "s"}.`
                : "No AI-scored answers this round (AI evaluation was unavailable)."}
            </p>
          </CardContent>
        </Card>
        <Button onClick={startInterview}>Start a new round</Button>
      </div>
    );
  }

  // phase is "answering" | "evaluating" | "showing-evaluation"
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Question {currentIndex + 1} of {questions.length}
      </p>
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium">{questions[currentIndex]}</p>
        </CardContent>
      </Card>

      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer..."
        className="min-h-32 resize-none"
        disabled={phase !== "answering"}
      />

      {phase === "answering" && (
        <Button onClick={submitAnswer} disabled={answer.trim().length < 5} className="self-start">
          Submit Answer
        </Button>
      )}

      {phase === "evaluating" && <p className="text-sm text-muted-foreground">Evaluating your answer...</p>}

      {phase === "showing-evaluation" && (
        <div className="flex flex-col gap-3">
          {evaluation ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score: {evaluation.score}/100</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <EvalRow label="Correctness" value={evaluation.correctness} />
                <EvalRow label="Depth" value={evaluation.depth} />
                <EvalRow label="Trade-off awareness" value={evaluation.tradeoffAwareness} />
                <EvalRow label="Communication" value={evaluation.communication} />
                <EvalRow label="Overall feedback" value={evaluation.overallFeedback} />
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">{evaluationError}</p>
          )}
          <Button onClick={nextQuestion} className="self-start">
            {currentIndex + 1 >= questions.length ? "Finish" : "Next Question"}
          </Button>
        </div>
      )}
    </div>
  );
}

function EvalRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}
