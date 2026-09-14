# Learning Log — ArchitektAI

Running record of concepts learned while building this project, in the order we hit them.
Each entry: **what it is**, **why we needed it here**, **key takeaway**.

---

## Phase 0 — Planning & Architecture Decisions

### Why we're keeping our own app simple
- **What**: We deliberately chose a single Next.js app + single PostgreSQL database instead of microservices, Redis, Kafka, Kubernetes, etc.
- **Why here**: None of those technologies solve a problem our app actually has (our traffic, our data shape, our background-job needs don't justify them). Adding them anyway would be resume-padding, not engineering.
- **Takeaway**: A senior engineering signal is choosing the *simplest system that satisfies the requirements*, then being able to explain exactly what would force you to add complexity later. This is also literally what the app teaches users to do for the systems *they* design — "architecture evolution" (Phase 15).

### The distinction between "the system we build" vs. "the systems our system can design"
- **What**: Our app itself stays simple (Next.js + Postgres). But it must be able to *reason about and explain* complex architectures (Kafka, sharded databases, CDNs, etc.) for the designs it generates.
- **Why here**: This shapes the knowledge base and prompt design — the AI needs facts about many technologies without our infrastructure needing to use them.
- **Takeaway**: A tool that designs systems doesn't need to be built out of every system it can describe.

### Why AI output must be schema-constrained (preview — full lesson in Phase 6)
- **What**: Instead of letting the LLM return free-form text, we define Zod/TypeScript schemas (e.g., `SystemDesign`) and validate every AI response against them before rendering.
- **Why here**: Free-form LLM text is unpredictable in structure — it can't be reliably rendered into UI components, diagrams, or stored in a database. An unvalidated response can also silently be wrong in a way that just looks like normal prose.
- **Takeaway**: Structured output turns "hope the AI formats it right" into "the AI's response either matches the contract or we catch it and handle the error" — this is the difference between a demo and a product.

---

## Phase 1 — Next.js + TypeScript Setup

### Next.js vs. plain React
- **What**: Next.js bundles a UI layer (React) and a server layer (API routes under `app/api/.../route.ts`) into one project.
- **Why here**: Plain React (e.g. via Vite) only gives you the UI — you'd need a separate backend project/server for anything server-side. Next.js is the actual reason we don't need a separate backend service for this project.
- **Takeaway**: "One deployable app" isn't a simplification we imposed on top of the stack — it's a property Next.js gives us by design.

### The App Router
- **What**: Next.js's current routing system — folders under `src/app/` map directly to URL paths, and a folder can hold `page.tsx` (UI for that route) and `route.ts` (an API endpoint at that route) side by side.
- **Why here**: This is what lets `src/app/api/analyze/route.ts` (Phase 4) sit right next to `src/app/design/[id]/page.tsx` (the workspace UI) in a way that's easy to navigate.
- **Takeaway**: File location *is* the routing config — no separate router file to maintain.

### Why TypeScript here specifically
- **What**: Static types checked at compile time instead of discovering shape mismatches at runtime.
- **Why here**: We're about to define strict schemas for AI output (`SystemDesign`, etc. — Phase 6). TypeScript is what makes "the AI response must match this shape" enforceable and autocomplete-able throughout the codebase, not just at the validation boundary.
- **Takeaway**: TypeScript isn't a style preference in this project — later phases assume it exists.

### Tailwind CSS
- **What**: Utility-first CSS — compose styles with classes in markup (`className="flex items-center gap-2"`) instead of writing separate `.css` files with custom class names.
- **Why here**: Avoids context-switching between markup and stylesheet files, and avoids accumulating dead/unused CSS as the UI evolves across many phases.
- **Takeaway**: Trades "readable class names" for "co-located, impossible-to-orphan styles."

### shadcn/ui (concept only — not installed yet)
- **What**: Unlike a typical component library installed as an opaque `node_modules` dependency, shadcn/ui's CLI copies component source directly into `src/components/ui/` — you own and can edit the code.
- **Why here**: We'll need to customize components for the diagram nodes and explanation panels (Phase 8–9) in ways a black-box library would fight us on.
- **Takeaway**: "Library" here means "starting point you edit," not "dependency you configure around."

### Practical scaffolding note
- Used `create-next-app` with `--typescript --tailwind --app --src-dir --eslint` flags to get everything pre-wired instead of configuring each tool by hand — confirmed working with a production build (`npm run build`) and a dev server request, not just "it installed."

### Checkpoint — dynamic route segments
- **What**: `[id]` in a path like `src/app/design/[id]/page.tsx` is a dynamic route segment — it matches any value in that URL position (`/design/123`, `/design/abc`, ...).
- **Why here**: Confirmed understanding of file-based routing, but the piece worth remembering explicitly: the matched value is passed into the page component as `params.id`, which is how `design/[id]/page.tsx` will know which saved design to fetch from Postgres and render in the workspace.
- **Takeaway**: The bracket syntax isn't just "any value here" — it's the mechanism that turns a URL into a variable your component code can use.

---

## Phase 2 — Basic UI (shadcn/ui + home page)

### Server Components vs. Client Components
- **What**: In the App Router, every component is a Server Component by default — it renders once on the server and ships as plain HTML, with no JavaScript for that component sent to the browser. Adding `"use client"` as the first line of a file opts that component (and everything it imports) into rendering in the browser instead.
- **Why here**: `src/app/page.tsx` stays a Server Component (it's just static layout). `src/components/design-input-form.tsx` needs `useState` and `onClick`/`onChange` handlers — none of which exist on a server, so it needs `"use client"`.
- **Takeaway**: The default is server-rendered; you opt *into* client-side JS per-component, not per-page. This keeps the JS bundle small — only the interactive pieces ship code to the browser.

### Controlled inputs in React
- **What**: A form input whose displayed value is driven by React state (`value={description}`) rather than by the DOM's own internal state, with every change routed back through `onChange` into `setDescription`.
- **Why here**: This is what makes "click an example prompt" and "type in the box" behave identically — both just call `setDescription` with a string. The UI doesn't need to know which one happened.
- **Takeaway**: Controlled inputs are how React keeps a single source of truth for form data instead of having to read the DOM to find out what's in a field.

### shadcn/ui in practice
- **What**: `npx shadcn@latest init` adds `components.json` (config), a `cn()` utility (merges Tailwind classes safely), and rewrites `globals.css` with CSS custom properties (colors, radius) that the copied components reference. `npx shadcn add <name>` then copies that component's source into `src/components/ui/`.
- **Why here**: Confirmed the "you own the code" model from Phase 1 — `button.tsx` uses `class-variance-authority` (cva) to precompute class strings per `variant`/`size` combo, fully readable and editable, not hidden in `node_modules`.
- **Takeaway**: shadcn's CLI is a code generator, not a package manager entry — which is also why it can introduce real bugs into your codebase (see below), not just abstract library bugs you can't see.

### Real bug caught by actually running the app, not just building it
- **What**: After scaffolding, the page's heading rendered in a browser-default serif font instead of the intended Geist Sans. `npm run build` and `npm run lint` both passed clean — this bug was invisible to both.
- **Why it happened**: shadcn's init CLI wrote `--font-sans: var(--font-sans);` in `globals.css` — a CSS custom property referencing itself. A self-reference like this is invalid and resolves to nothing, so Tailwind's `font-sans` utility fell through to the browser's default font. The actual font variable Next.js's `next/font` had set up was named `--font-geist-sans` (visible in `layout.tsx`), which the generated CSS never pointed to.
- **How it was caught**: Ran the dev server, drove it with headless Chromium (Playwright), and took a screenshot — the wrong font was visible immediately, even though every automated check (build, lint, TypeScript) was green.
- **Takeaway**: Type checks and linters verify code *compiles*, not that it *looks or behaves right*. This is exactly the "test the golden path in a real browser" principle — a passing build is necessary but not sufficient evidence a UI change works.

### Checkpoint — uncontrolled vs. controlled inputs, precisely
- **What**: Removing `value={description}` from the textarea (while keeping `onChange`) doesn't break typing — the DOM handles that natively either way. What actually breaks: state updates that originate *outside* user typing (like the example-prompt buttons calling `setDescription(example)`) would no longer be reflected on screen, since nothing binds the textarea's displayed value back to React state anymore.
- **Why it matters**: The bug from an uncontrolled input isn't always "nothing works" — it can be "the thing that programmatically sets the value stops working while direct typing looks fine," which is a sneakier failure mode to debug.
- **Takeaway**: "Controlled" specifically means state is the source of truth in *both directions* — reads (what's displayed) and writes (what typing produces). Losing the read direction breaks anything that sets the value programmatically, not the input itself.

---

## Phase 3 + 4 — Requirement Input Wiring & Rule-Based Analyzer

### Deferring AI, deliberately
- **What**: Built the requirement analyzer as a pure heuristic function (regex + keyword matching) instead of calling an LLM, even though the master plan's "Requirement Analyzer" phase comes before its "Structured AI Output" phase.
- **Why here**: A genuinely good analyzer needs an LLM, but front-loading LLM integration would mean setting up API keys and cost/latency concerns before the rest of the pipeline (UI → API route → structured display) is even proven to work end-to-end. Building the dumb version first de-risks the plumbing.
- **Takeaway**: When a "smart" component and its surrounding pipeline are both unproven, build a fake/simple version of the smart part first to validate the pipeline, then swap the internals. The interface (`AnalyzedRequirements` type, `/api/analyze` route) doesn't need to change when Phase 6 swaps regex for an LLM call.

### Facts vs. assumptions as a first-class data shape
- **What**: Every `RequirementItem` carries a `source: "user-stated" | "assumed"` tag, not just text.
- **Why here**: This is a core product requirement — the app must visibly distinguish what the user actually said from what the system inferred. Baking it into the type from day one (rather than bolting it on later) means the UI, the future LLM prompt, and the schema (Phase 6) all agree on this distinction from the start.
- **Takeaway**: Encoding a product requirement directly into a type is cheaper than enforcing it by convention — TypeScript won't let a new code path silently produce an item without a `source`.

### Pure functions as an architecture choice
- **What**: `analyzeRequirements()` in `requirement-analyzer.ts` takes a string, returns structured data, and does no I/O (no fetch, no DB, no console output).
- **Why here**: The API route (`route.ts`) handles all HTTP concerns (parsing the request, validating input, returning status codes); the analyzer only handles the text-to-structure logic. This separation is what makes it trivial to unit test later (Phase 19) and trivial to replace with an LLM call in Phase 6 without touching the route's error handling.
- **Takeaway**: Keeping "business logic" and "I/O/framework glue" in separate functions is a general pattern, not a Next.js-specific one — it pays off any time you expect a piece to be tested or swapped independently.

### try/catch/finally for async UI state
- **What**: `handleSubmit` wraps the `fetch` call in `try { ... } catch (err) { setError(...) } finally { setIsSubmitting(false) }`.
- **Why here**: `finally` guarantees the loading spinner turns off whether the request succeeds, fails with a bad status code, or the network fails entirely — there's no path that leaves the button stuck saying "Analyzing...".
- **Takeaway**: For any async operation tied to UI state, the "did it work" state and the "are we still waiting" state are separate concerns — `finally` is specifically for the second one, and it's easy to forget when you only think about the success case.

### API input validation order
- **What**: The route parses JSON first (catching malformed request bodies), *then* checks the parsed `description` field's type and length, *then* calls the pure analyzer function.
- **Why here**: Validate the outer shape before the inner content — trying to check `description.length` before confirming `body` is even valid JSON would throw an unhandled exception instead of a clean 400 response.
- **Takeaway**: Input validation is layered from "is this even parseable" outward to "is this semantically valid" — checking them in the wrong order turns a bad request into a server crash instead of a handled error.

### Real limitation observed by testing, not just imagined
- **What**: Ran the analyzer against "upload photos and videos" and "like and comment on posts" — the clause-splitting on "and" cut them into "Upload photos" (kept) + "videos" (dropped, no verb) and "Like" (bare) + "Comment on posts" (kept).
- **Why it matters**: This is naive text splitting hitting its ceiling — it has no concept that "videos" is a second object of the same verb "upload." Confirmed concretely (via curl, not just reasoning about the regex) exactly the kind of gap an LLM-based analyzer (Phase 6) will close, since an LLM understands compound objects and conjunctions contextually rather than splitting blindly on the word "and."
- **Takeaway**: Testing against real input surfaces concrete, demonstrable gaps — useful both for prioritizing the Phase 6 upgrade and for a good "before/after" story if this project comes up in an interview.

---

## Phase 5 — Scale Estimator

### The back-of-envelope formula chain
- **What**: Total users -> DAU (% of total) -> daily requests (DAU x requests/user/day) -> average QPS (daily requests / 86,400 seconds) -> peak QPS (average QPS x peak multiplier) -> storage/day and storage/year.
- **Why here**: This is the actual sequence used in system design interviews to go from "10 million users" to "how many servers do we need." Each step is one multiplication or division — the skill isn't the math, it's knowing which quantities to multiply and in what order, and being explicit about which numbers are assumptions vs. given facts.
- **Takeaway**: Peak QPS, not average QPS, is what determines provisioning — a system sized for average load falls over during real traffic spikes (launches, viral moments, daily peak hours). The peak multiplier (commonly 2x-5x) is itself an assumption, not something you can compute from average alone without real traffic data.

### Editable assumptions as a design principle
- **What**: Every number feeding the calculation (DAU %, requests/user/day, peak multiplier, avg upload size) is a live input, not a hardcoded constant — changing one instantly recomputes all downstream numbers via `useMemo`.
- **Why here**: Back-of-envelope numbers are only as good as their assumptions, and different reasonable engineers will pick different multipliers. Hiding these as constants would make the tool feel authoritative about numbers that are genuinely debatable — surfacing them as editable fields is what makes the output honest.
- **Takeaway**: This mirrors the "user-stated vs. assumed" distinction from Phase 3-4 at a different layer — there, we tagged *requirements*; here, we expose the *assumptions behind a calculation* directly as UI, rather than a label.

### React's `key` prop controls identity, not just rendering
- **What**: `<ScaleEstimator key={approxUserCount ?? "default"} .../>` — changing the `key` forces React to treat it as a brand-new component instance (fresh `useState`), instead of reusing the existing one across re-renders.
- **Why here**: `useState(initialValue)` only reads `initialValue` on the component's first mount, ever - passing a new `initialTotalUsers` prop on a second "Generate Design" click wouldn't reset the field, because React would just re-render the *same* instance with its already-initialized state.
- **Takeaway**: When a component's internal state should reset in response to a prop changing, the fix is usually a `key`, not more `useEffect` logic to sync props into state. This is a common gotcha specific to how React decides "is this the same component or a new one."

### Verifying math independently of the UI
- **What**: Before wiring the formulas into a component, ran the calculation as a standalone script against hand-computed expected values (2,000,000 DAU, 100,000,000 daily requests, ~1,157 avg QPS, ~5,787 peak QPS for the 10M-user example) and asserted equality.
- **Why here**: A UI screenshot only proves numbers *appeared* - it doesn't prove they're *correct*. Checking the pure function's output against independently hand-calculated values is a stronger form of verification, and it's exactly why keeping the math in a pure function (no React, no fetch) mattered - it can be tested completely separately from the browser.
- **Takeaway**: For any calculation-heavy feature, verify the numbers before verifying the pixels. A pretty UI showing a wrong number is worse than an ugly one showing a right number.

---

## Phase 6 — Structured AI Output + Validation

### Zod schemas vs. TypeScript interfaces
- **What**: A TypeScript `interface` is a compile-time-only contract - it's erased when the code actually runs, so it can't stop bad data at runtime. A Zod schema (`z.object({...})`) is a real object your code can call `.parse()` on against actual data, and `z.infer<typeof Schema>` generates the TypeScript type from it.
- **Why here**: An LLM can return malformed or unexpected JSON no matter how carefully you prompt it. `AnalyzedRequirementsSchema` in `requirements-schema.ts` replaced the old hand-written `interface` from Phase 3-4 - one definition now serves as both the runtime validator and the type source, so they can't drift out of sync the way two separate definitions could.
- **Takeaway**: "Structured AI output" isn't a prompting technique - it's a runtime validation discipline. The type system alone was never going to be enough once external, non-deterministic input (the LLM) entered the picture.

### Structured outputs at the API level
- **What**: `client.messages.parse({ output_config: { format: zodOutputFormat(schema) } })` constrains Claude's response to match the schema, and returns `response.parsed_output` - already validated, or `null` if it didn't parse.
- **Why here**: This is stronger than "ask the model to return JSON in the prompt and hope." The schema is passed as part of the actual API request, not just prose instructions the model could ignore or drift from.
- **Takeaway**: When an SDK offers a structured-output mode, prefer it over prompt-engineering your way to reliable JSON - it moves the guarantee from "the model usually complies" to "the API enforces the shape."

### Graceful degradation instead of a hard dependency
- **What**: `/api/analyze` checks for `ANTHROPIC_API_KEY` before attempting the AI call, and falls back to the Phase 3-4 rule-based analyzer both when no key is set and when the AI call throws for any reason (network failure, malformed response, rate limit).
- **Why here**: This let Phase 6 ship and be fully tested (build, lint, the fallback path end-to-end in a real browser) before an API key existed - the app was never in a broken state waiting on external setup. It also means a transient API outage in production degrades the analyzer's quality instead of taking the whole feature down.
- **Takeaway**: When a feature depends on an external service, design the "service unavailable" path as a first-class case from the start, not an afterthought - it's what let this phase be built and verified incrementally instead of blocking on credentials.

### `.gitignore` patterns can be too broad
- **What**: The scaffold's `.gitignore` had `.env*`, which also matched `.env.local.example` - a template file that's *supposed* to be committed (it documents which env vars the project needs, with no real secret in it).
- **Why it matters**: Caught this before committing by running `git check-ignore -v` and `git status` on the new file, rather than assuming the pattern was fine. A negation rule (`!.env.local.example`) fixed it.
- **Takeaway**: A broad ignore pattern can silently swallow files you actually want tracked - worth explicitly checking `git status` on new files rather than trusting `git add -A` did the right thing, especially right after scaffolding tools write their own `.gitignore`.

---

## Phase 6.5 — Switching AI Providers (Anthropic -> Gemini)

### Neither Anthropic nor OpenAI has an ongoing free API tier
- **What**: Both are pay-per-token, sometimes with a limited trial credit for new accounts. Google's Gemini API (via Google AI Studio) is the provider that offers a genuinely free, ongoing tier with rate limits instead of a credit that runs out.
- **Why here**: Wanting a free option for a portfolio project is reasonable - just worth knowing "free" and "has a free trial credit" aren't the same claim, and worth checking a provider's actual pricing page rather than assuming based on which one is more talked-about.
- **Takeaway**: When cost is a real constraint, verify the actual billing model before choosing a provider, not just its reputation.

### Verifying unfamiliar API documentation instead of trusting the first result
- **What**: Fetched Google's structured-output docs page for the Gemini SDK and got back a plausible-looking but fabricated API shape (`client.interactions.create()`, model name `gemini-3.8-flash`) - it read confidently and consistently, but didn't match the SDK's own GitHub README, which clearly showed `ai.models.generateContent()`.
- **Why it happened**: The doc-fetching tool renders the page through a summarizing model, and that page apparently couldn't be rendered cleanly - rather than reporting failure, the summarizer produced a fluent, wrong answer. Nothing about the output *looked* uncertain.
- **How it was caught**: Cross-checked against a second, independent source (the SDK's own GitHub repository) before writing any code. The mismatch was immediately obvious - real SDKs don't casually rename their core method between one doc page and their own README.
- **Takeaway**: Confident, detailed, fluent output is not the same as correct output - this applies to AI-generated documentation lookups exactly as much as it applies to the app we're building (this is the entire premise of Phase 6's "validate AI output" lesson, just experienced firsthand as the one relying on an AI tool rather than the one building one). When a claim is checkable, check it before it becomes code - a second independent source with a track record (the project's own GitHub repo, in this case) is worth more than how confident the first answer sounded.
- **Follow-up verification**: After the mismatch, fetched three more targeted, narrow queries against the actual GitHub source (a directory listing, a real sample file, a constants file) rather than one broad summarized question - each one was checkable against the others and all agreed, which is what made the final API shape (`responseMimeType`/`responseSchema` fields, a `Type` enum for the schema, `response.text` for output) trustworthy enough to write into real code.

### Keeping the provider swap contained
- **What**: Swapping Anthropic for Gemini touched exactly three files with real logic changes: `analyze-with-ai.ts` (the actual API call), `route.ts` (one line - the env var name checked), and the UI label. Everything else - the Zod schema, the rule-based fallback, the API route's error handling shape - stayed untouched.
- **Why it was this contained**: This is the payoff of the Phase 6 architecture - `analyzeWithAI()` was already isolated behind a single function with a fixed input/output contract (`string in, AnalyzedRequirements out, throws on failure`). The caller (`route.ts`) never knew or cared which provider was behind that function.
- **Takeaway**: Isolating "the AI call" behind one function with a stable contract is what makes a provider swap a contained, mechanical change instead of a rewrite - this is the same reasoning as keeping business logic separate from I/O (Phase 3-4), applied one layer up.

---

## Phase 7 — Architecture Generator + Technology Knowledge Base

### A knowledge base as a guardrail on AI freedom
- **What**: `technologies.ts` hand-defines ~11 real technologies (strengths, weaknesses, use cases, scaling/consistency/latency/cost) as a fixed dataset. The planner selects and justifies *from* this set rather than generating technology facts freely.
- **Why here**: This is what the original project brief meant by "the AI should NOT have complete freedom to invent architectures" - constraining the vocabulary before any reasoning (rule-based now, AI-based later) happens over it. A wrong fact about PostgreSQL in a hand-curated 11-entry table is easy to catch and fix; a wrong fact buried in a free-form LLM explanation is not.
- **Takeaway**: Constraining what an AI (or a rule-based stand-in for one) can say is often more valuable than making it smarter - a small, correct, curated dataset beats a large, ungrounded one for this kind of task.

### Tracing every decision back to its trigger
- **What**: Every component in `planArchitecture()` is added behind an explicit, named boolean (`hasMedia`, `needsLowLatency`, `isLargeScale`, ...) derived directly from the requirements/scale data - never a hardcoded "always include Redis."
- **Why here**: This is the actual system-design interview skill - not knowing that Redis exists, but being able to say *why* it belongs in *this* design and not another one. Building the planner this way forced every component to have a traceable justification, the same discipline the finished product is meant to teach its users.
- **Takeaway**: When a feature's whole purpose is "explain the reasoning," the code implementing it should make that reasoning inspectable in its own structure, not just in generated text output.

### Catching my own fragile code before it shipped
- **What**: A first draft of the client -> gateway -> load-balancer -> backend wiring mutated connection objects by array index (`connections[connections.length-1].from = ...`) to conditionally splice in the load balancer. It happened to compute the right answer, but was hard to verify just by reading it - correctness depended on exact index arithmetic staying in sync with which components were conditionally present.
- **Why it mattered**: Rewrote it as: build an explicit ordered list of "front door" component ids (`frontChain`), conditionally push onto it, then connect each consecutive pair in one loop. Same output, but now correct by inspection - no index tracing needed to trust it.
- **Takeaway**: "It produces the right output" and "it's obviously correct by reading it" are different bars. Array-index mutation tricks are a common way to satisfy the first while failing the second - worth noticing that gap and refactoring toward explicit, orderable data (a list you build and then connect) instead of positional mutation, especially in code with conditional branches.

### Lifting state up through a callback, not merging components
- **What**: `ScaleEstimator` reports its live-computed estimates to `DesignInputForm` via an `onEstimatesChange` callback (fired in a `useEffect`), rather than `DesignInputForm` reimplementing the scale calculation or `ScaleEstimator` reaching down into an architecture-planning concern it shouldn't know about.
- **Why here**: This kept `ScaleEstimator` unaware that architecture generation exists at all - it just reports what it computed, and the parent decides what to do with that. Adding a new consumer of scale estimates later (e.g. a future "cost estimator") would mean another prop on the parent, not a change to `ScaleEstimator` itself.
- **Takeaway**: When a child component computes something a sibling or parent needs, the callback-reports-up pattern keeps components single-purpose - the alternative (merging two features into one component, or duplicating the calculation) trades a small amount of prop-wiring for real coupling.

---

## How to use this file
- We add an entry **after** each concept is introduced and you've had the checkpoint questions, not before — so this reflects what you've actually learned, not just what was planned.
- Entries stay even if we later change the implementation — this is a *learning* record, not a design doc (that's what the README and code comments are for).
