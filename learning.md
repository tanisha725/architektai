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

## Phase 6.5 continued — Getting Gemini Actually Working

### Even a cross-verified model name can be stale by the time you call it
- **What**: The model name `gemini-2.5-flash` was cross-checked against three independent GitHub sources (README, sample file, constants file) before being written into the code - and it still turned out to be wrong. The live API returned a 404: "This model is no longer available to new users. Please update your code to use models/gemini-3.6-flash."
- **Why it happened**: Documentation and even a package's own bundled sample code can lag behind what the live API actually accepts, especially for fast-moving model lineups. Cross-checking multiple sources rules out *hallucination* (the first WebFetch attempt) but not *staleness* (every source agreeing, while still being outdated).
- **How it was caught**: Not by more research - by actually calling the real API with a real key and reading the real error message. The error was more authoritative than any documentation, because it came directly from the system being integrated with, not a description of it.
- **Takeaway**: For fast-moving external APIs, "verified against docs" and "actually works" are different claims. The only fully reliable verification is a live call against the real service with real credentials - which is exactly why this phase's fallback design (catch the error, log it, degrade gracefully) mattered in practice, not just in theory: the app kept working (via the rule-based fallback) for every test made *before* the working model name was found, instead of hard-failing.

### Debugging "it should be working but isn't" - checking the obvious layer first
- **What**: After fixing the env var and restarting the dev server, the API still reported `source: "rule-based"` - looked like the key still wasn't being picked up. The actual cause: a stale dev server process was still running on port 3000 from *before* the key was saved, so the freshly-started server (with the correct env) got bumped to port 3001, and all testing was hitting the old, keyless process the whole time.
- **Why it happened**: `npm run dev &` in the background doesn't get cleanly killed by a later `lsof -ti:3000 | xargs kill` if a previous instance is already occupying that port under a different, untracked PID - background processes started in earlier turns can outlive the assumption that "restarting the server" means only one is running.
- **How it was caught**: Read the actual dev server log output rather than assuming the API response was the full picture - it explicitly said "Port 3000 is in use... using available port 3001 instead," which immediately explained the stale result.
- **Takeaway**: When behavior doesn't match a code change you just made, check whether the code you changed is actually the code that's running before debugging the logic itself - a stale process on the expected port is a classic, easy-to-miss version of "it's not picking up my change."

---

## Phase 8 — Interactive Architecture Diagram (React Flow)

### A canvas library needs explicit positions - it doesn't lay anything out for you
- **What**: React Flow renders exactly the nodes/edges you give it, each node at the `{x, y}` you specify. There's no automatic "arrange these nicely" behavior built in.
- **Why here**: `architecture-layout.ts` does a breadth-first search from the client node over the connection graph, assigning each component a "level" (hop-distance from client). Same-level components sit side by side; levels stack vertically. This means the diagram's layout is *derived from the data's shape*, not hand-positioned - it automatically reflows correctly whether an architecture has 3 components or 9, without ever touching layout code again.
- **Takeaway**: Whenever a UI needs to visually reflect a graph/tree structure that changes based on data, compute layout from that structure (BFS/DFS levels, in this case) rather than hardcoding positions - hardcoded positions only work for exactly one dataset.

### Reusing a component across two different presentation shells
- **What**: `ComponentDetail` (what/why/alternatives/trade-offs/failure/scaling) was extracted out of the old button-list `architecture-result.tsx` into its own file, so the new `architecture-diagram.tsx` could reuse it without duplicating that JSX.
- **Why here**: The *data* being displayed (an `ArchitectureComponent`) didn't change between Phase 7 and Phase 8 - only how you *select* one changed (click a button vs. click a diagram node). Separating "how you pick a component" from "how a component's details are displayed" meant Phase 8 only had to write new selection logic, not rebuild the detail view from scratch.
- **Takeaway**: When a UI's presentation shell changes but the underlying data and its detail view don't, extracting the detail view first (rather than copy-pasting it into the new shell) keeps both in sync automatically if the data shape ever changes again.

### Where global CSS is allowed to live in the App Router
- **What**: `@xyflow/react/dist/style.css` (a global stylesheet the library ships) had to be imported in `layout.tsx`, the root layout - importing it directly inside `architecture-diagram.tsx` (a nested Client Component) is not allowed.
- **Why here**: Next.js restricts *global* CSS imports to layout/page files specifically so that style loading order stays predictable across the whole app - if any nested component could import arbitrary global CSS, two components importing conflicting global styles could produce order-dependent, hard-to-debug rendering differences depending on which one happened to render first.
- **Takeaway**: A library's required global stylesheet goes in the root layout, not next to the component that happens to use it - this is a framework-level rule, not a style preference.

---

## Phase 9 — Database Schema Generator

### Normalization: storing facts once, deriving the rest
- **What**: `likes` is a table of individual rows (`user_id`, `post_id`), not a `likes_count` column on `posts`. The count is a `COUNT(*)` query away.
- **Why here**: A counter column can drift from reality (a bug double-increments it, a delete forgets to decrement it) and can't answer "did *this* user like *this* post" without separate tracking anyway. Storing the fact once, in its own table, means the count is always derivable and correct, and the "who" question is answered for free.
- **Takeaway**: The general principle - store each fact in exactly one place, compute everything else - is what "normalization" actually means underneath the textbook term. A denormalized counter is a cache of a fact, and like any cache it can go stale.

### Composite primary keys as a constraint, not just an ID choice
- **What**: `likes` and `follows` use a composite primary key (`user_id` + `post_id`, or `follower_id` + `followee_id`) instead of a separate auto-generated `id` column.
- **Why here**: This isn't just "fewer columns" - the composite key makes "duplicate like" a constraint violation at the database level. The schema itself enforces "one like per user per post," rather than relying on application code to check-then-insert (which has its own race-condition risk under concurrent requests).
- **Takeaway**: A primary key choice can encode a business rule directly into the data model - worth considering composite keys specifically for join/junction tables representing "at most one of this relationship," not just as a way to save a column.

### A second instance of the same "known limitation" pattern from Phase 3-4
- **What**: If a description mentions "comment" without any post-related keyword, the generator would produce a `comments` table with a foreign key to a `posts` table that doesn't exist in the output.
- **Why it's acceptable for now**: This mirrors the Phase 3-4 "photos and videos" splitting gap - a rule-based v1 has known, explainable edges. In practice this specific case is unlikely (comments almost always co-occur with posts/content in real descriptions), and documenting the limitation is more valuable right now than adding defensive code for an edge case that may never actually trigger.
- **Takeaway**: Recognizing and naming a limitation explicitly (rather than silently shipping it or over-engineering around a rare case) is itself the right level of rigor for a rule-based first pass - the same judgment call made twice now in this project, which suggests it's a genuine pattern worth having, not a one-off shortcut.

---

## Phase 10 — API Design Generator

### A three-layer traceable chain: requirements -> schema -> API
- **What**: `generateApiEndpoints()` doesn't re-read the requirements text to decide which tables exist - it loops the *already-generated* `schema.tables` from Phase 9, and maps each table to its CRUD endpoints via a lookup catalog (`TABLE_ENDPOINTS`), the same shape as the schema generator's own `ENTITY_TEMPLATES`.
- **Why here**: This means API design is derived from database design, which was derived from requirements - one consistent chain, not three independent guesses at the same underlying facts. If a table wouldn't exist (e.g. no "follow" keyword), no follow-related endpoints get generated either, automatically, with no extra logic needed to keep them in sync.
- **Takeaway**: When two generated artifacts describe the same underlying thing from different angles (a database table and the API that operates on it), deriving the second directly from the first's *output* - not from the same raw input a second time - is what guarantees they never drift apart.

### Recognizing a UI problem from its own evidence
- **What**: A full-page screenshot of the generated design came back 6182 pixels tall - six major sections (requirements, scale, architecture, database, API) all stacked in one continuous scroll.
- **Why it mattered**: This was the concrete evidence that turned a vague "the UI could be nicer" request into a specific, justified problem: too many sections in one flat scroll, not a lack of decoration. The fix that actually addresses this (tabs/sections, from the original plan's "Design Workspace" concept) is a usability fix, not a cosmetic one - which is also why it doesn't conflict with the project's "don't add complexity without justification" principle the way an unrelated feature (e.g. 3D visualization) would have.
- **Takeaway**: When asked for vague improvement ("make the UI better"), look for concrete, measurable evidence of an actual problem (a screenshot's dimensions, in this case) before deciding what "better" means - it turns a subjective request into an objective one.

---

## Phase 10.5 — Tabbed Workspace (UI restructure)

### Saying no to scope that doesn't fit, with a concrete reason
- **What**: The user asked about adding 3D visualization. Rather than building it, the response was a recommendation against it (no clear problem it solves that the 2D diagram doesn't) plus a concrete alternative (fix the actual UI issue - a 6000px scroll) that better served the same underlying "make this more impressive" intent.
- **Why here**: This mirrors the project's own stated principle from Phase 0 - don't add a technology without a specific reason. Redirecting toward evidence of a real problem (the screenshot height) turned a vague ask into a well-justified, scoped piece of work instead of an unjustified dependency.
- **Takeaway**: When a request risks violating a project's own stated principles, it's worth naming the tension directly and proposing the alternative that still serves the underlying goal - not just complying, and not just refusing.

### `keepMounted` and the danger of conditionally-rendered state producers
- **What**: Radix/Base-UI-style tab panels unmount inactive content by default (`keepMounted` defaults false). `ScaleEstimator` reports its computed estimates to the parent via a `useEffect` on mount/change - but if its tab panel isn't mounted, that effect never runs, so `scaleEstimates` stays `null`, and everything derived from it (architecture, database schema's endpoint list wasn't affected, but architecture and the Overview stats were) silently stayed empty until the user happened to click the Scale tab.
- **Why it happened**: The bug wasn't in the derived-data logic at all (`planArchitecture`, `generateApiEndpoints` were all still correct) - it was a side effect of *where* a stateful child component was mounted, which changed silently when the surrounding layout was refactored into tabs.
- **How it was caught**: Verified with a headless browser script that deliberately generated a design and immediately checked the Overview tab's stat cards *without* visiting the Scale tab first - exactly the path a real user would take by default (Overview is the default tab). A screenshot alone wouldn't have caught this as reliably as scripting the exact interaction sequence a user would actually perform.
- **Takeaway**: When a component that computes shared state gets moved into a conditionally-rendered container (a tab, an accordion, a modal), check whether "conditionally rendered" also means "conditionally mounted" - and whether anything else in the app was relying on it always being mounted. This is a new instance of the same underlying lesson as the Phase 6.5 stale-dev-server bug: behavior silently depending on something being "already running" that a refactor can invalidate.

---

## Real-world incident — 44-second fallback delay

### A live failure surfaced a real gap in the "graceful fallback" design
- **What**: While using the app for real, Gemini returned a transient `503 UNAVAILABLE` ("high demand"). The Phase 6 fallback design worked correctly - it caught the error and fell back to the rule-based analyzer - but the *whole request* took 44 seconds before that fallback kicked in, leaving the "Analyzing..." button stuck for a very long time.
- **Why it happened**: The `@google/genai` SDK defaults to 5 retry attempts with exponential backoff (1s, 2s, 4s, 8s, 16s...) on retryable status codes (408, 429, 5xx). Our own try/catch/fallback logic was correct, but it only runs *after* the SDK exhausts its own retries - the fallback was fast, the thing it was waiting on wasn't.
- **How it was caught**: Not by testing - by the user pasting a real dev server log from actually using the app. This is a different verification channel than anything used so far in the project (not a build, not a browser screenshot, not a curl test) - live usage surfaced a failure mode that no deliberate test had been designed to trigger (a transient upstream 503 is hard to reproduce on demand).
- **How it was fixed**: Checked the SDK's actual installed type definitions (`node_modules/@google/genai/dist/node/node.d.ts`) rather than guessing - confirmed `config.httpOptions.timeout` and `config.httpOptions.retryOptions.attempts` both exist on `GenerateContentConfig`. Set `timeout: 10_000` and `attempts: 2`, bounding the worst case to roughly 10-20 seconds instead of 44+.
- **A wrong guess caught immediately by the compiler**: First attempt put `retryOptions` as a sibling of `httpOptions` in the config object - TypeScript's `TS2353: Object literal may only specify known properties` caught it instantly, revealing `retryOptions` actually nests *inside* `httpOptions`. This is exactly why writing the code and letting the compiler point at the real shape (rather than fully researching every nested field before writing anything) is the faster and just as reliable path when working against typed SDKs.
- **Takeaway**: A fallback mechanism being *correct* and a fallback mechanism being *fast enough* are two different properties - the first was verified in Phase 6.5, the second only surfaced under a real transient failure in production-like conditions. Reading actual SDK type definitions (ground truth) resolved this faster and more reliably than another round of doc-fetching would have, continuing the pattern from Phase 6.5's model-name lesson: when available, prefer checking the real, installed artifact over any description of it.

---

## Phase 12 — AI Interview Mode

### When "no rule-based fallback" is the honest design, not a gap
- **What**: Every previous AI feature (requirement analysis) had a real rule-based fallback that still did useful work. Interview Mode's *evaluation* step has no equivalent - there's no sensible pattern-matching way to grade free-text reasoning quality. The fallback here is honest instead: `evaluation: null` plus a self-assessment prompt, not a fake score from keyword matching.
- **Why here**: A fake rule-based score (e.g. "answer contains the word 'trade-off', +10 points") would be worse than no score - it would look authoritative while being meaningless, actively misleading a user trying to learn from the feedback.
- **Takeaway**: Not every AI feature needs a "dumb but functional" fallback - sometimes the honest degrade path is admitting the AI-only capability isn't available right now, rather than manufacturing a lower-quality substitute that pretends to be the same thing.

### Grounding AI output in generated data, not just user input
- **What**: `buildDesignSummary()` feeds the interview prompts a compact description built from the *outputs* of four earlier generators (requirements, architecture, database schema, scale estimates) - not the user's raw original text.
- **Why here**: This is why the AI-generated question referenced "likes, comments, and follow relationships" specifically - those are exact table names from the Database tab, not paraphrased user input. Grounding in structured, already-validated data produces sharper, more specific prompts than grounding in free text would.
- **Takeaway**: When a pipeline has already turned messy input into clean structured data, later stages should build on that structured data, not re-derive context from the original raw text - each stage's output is higher-signal than what came before it.

### A state machine beats a pile of booleans for multi-step async UI
- **What**: `InterviewTab` uses one `phase` variable with six named values instead of separate `isLoadingQuestions`, `isSubmittingAnswer`, `isEvaluating` booleans.
- **Why here**: With independent booleans, the type system allows nonsensical combinations (what does `isLoadingQuestions && isSubmittingAnswer` both true even mean?) that have to be prevented by careful code elsewhere. A single `phase` string makes invalid combinations structurally impossible - only one phase is ever "current" by definition.
- **Takeaway**: Any UI with more than two or three sequential async steps (start -> load -> act -> evaluate -> repeat/finish) is a good candidate for a named-phase state variable instead of boolean flags - it gets more valuable as the number of steps grows, since booleans scale combinatorially while a phase enum scales linearly.

### Real infrastructure limits surfaced by continued live use
- **What**: During testing, Gemini's free tier returned 503s repeatedly across multiple independent calls (analyze, questions, evaluate) in the same session - not a one-off blip like the earlier incident, but sustained pressure suggesting the free tier's rate limits are being hit under this session's testing load.
- **Why it matters**: Every layer of the app degraded correctly under this real, sustained failure condition - which is a stronger validation of the fallback design than any single deliberate test could have provided, since it exercised the actual failure mode (not a simulated one) across multiple independent endpoints at once.
- **Takeaway**: A free-tier API key comes with real operational limits worth knowing about going in, not just a cost of zero - "free" doesn't mean "unlimited," and a resume-ready project should be able to say plainly what happens when the AI provider is unavailable, because eventually it will be.

---

## Phase 13 — Architecture Evolution (and a real `keepMounted` regression)

### Reusing a planner across synthetic inputs to tell a story
- **What**: `generateArchitectureEvolution()` calls the *existing* `planArchitecture()` three times with fixed scale tiers (10K/1M/10M users), diffing each stage's component set against the previous one to compute what was added and why.
- **Why here**: No new decision logic was needed - the "why does architecture change with scale" story falls directly out of the same threshold (`isLargeScale`) already driving the single Architecture tab. Running it at three different inputs and diffing the outputs turns one generator into a narrative for free.
- **Takeaway**: When a generator's output already depends on a threshold, sweeping that generator across representative inputs and diffing consecutive outputs is a cheap way to visualize *when* a threshold matters, without writing any new business logic.

### A wrong fix that looked plausible, verified empirically instead of assumed
- **What**: The Evolution tab's diagrams rendered cropped/broken - only fragments of nodes visible, mostly empty space. First fix attempt: add an `onInit` handler that re-calls `fitView()` on a `requestAnimationFrame` tick, on the theory that layout just hadn't settled yet at mount. Rebuilt, re-tested - **still broken**, identically.
- **Why the first fix failed**: The real cause was `keepMounted` rendering the tab panel while it was inactive (hidden via `display: none` or similar) - a hidden element has a zero-size layout box *regardless of timing*. No amount of delayed retry fixes a measurement taken against an element with no layout at all; the fix needed to address *visibility*, not *timing*.
- **How the real cause was found**: Instead of trying more timing-based patches, went back to first principles - checked whether the *already-verified-working* single Architecture tab was secretly broken too, under the same conditions. It was. That ruled out "Evolution-specific" theories and pointed straight at `keepMounted` (the one thing common to both, added in the immediately preceding phase).
- **The actual fix**: Removed `keepMounted` from every tab whose content doesn't need to be mounted-while-hidden for a real reason - re-examining each tab's actual requirement (not just leaving Phase 10.5's blanket fix in place) showed only Scale (must mount to report estimates upward) and Interview (preserves in-progress state across tab switches) genuinely need it. Architecture, Database, API, Roadmap, Requirements, and Evolution all derive their content from the parent's already-computed state regardless of whether their tab panel is mounted - removing `keepMounted` from them cost nothing and let React Flow mount into a real, visible, correctly-sized container.
- **Takeaway**: When a first fix attempt doesn't work, that's a signal the mental model of the bug is wrong, not that the fix needs more tuning (a longer delay, a second retry). Re-verifying "is the thing I thought was working actually working, under the same conditions as the thing that's broken" is a fast way to find the real shared cause - faster than iterating on a fix built on an unconfirmed theory. This is also a case where applying a fix too broadly (Phase 10.5's blanket `keepMounted` on every tab) created a new bug two phases later - worth periodically re-examining whether an earlier broad fix is still the narrowest fix that solves the original problem.

---

## Phase 14 — Persistence (PostgreSQL via Neon + Prisma)

### What an ORM is actually for
- **What**: Prisma generates a fully-typed database client from one schema file (`schema.prisma`), and manages versioned migrations that transform the real database as that schema changes - instead of hand-writing SQL strings and manually keeping a database in sync with code.
- **Why here**: This is the same "single source of truth generates multiple things" idea as Zod (one schema -> runtime validation + TypeScript type) and the architecture planner (one knowledge base -> selection + explanation text) - here, one schema file drives both the TypeScript types *and* the actual Postgres table structure.
- **Takeaway**: A recurring shape in this project: whenever two things need to stay in sync (a type and a validator, a database and its migrations, a UI and the state driving it), look for a way to generate one from the other rather than maintaining both by hand.

### JSON columns as a deliberate, justified simplification
- **What**: The `Design` model stores `requirements`, `architecture`, `databaseSchema`, etc. as JSON columns in one row, rather than normalizing them into a dozen relational tables mirroring the TypeScript types.
- **Why here**: This data is generated output that's always fetched and rendered as a complete whole (by design ID) - never queried piece-by-piece ("find all designs using Redis"). Matching storage shape to actual access pattern is the same reasoning as Phase 9's normalization discussion, applied in the opposite direction: normalize when you need to query pieces independently, denormalize (JSON blob) when you always read/write the whole thing together.
- **Takeaway**: "Normalize everything" isn't a universal rule - it's a tool for a specific access pattern (independent querying of parts). When that pattern doesn't apply, a JSON column is the honest, simpler choice, not a shortcut.

### A real, current-generation breaking change hit head-on
- **What**: Prisma 7 removed the `url` field from the schema file's `datasource` block entirely - a genuine breaking change from the version most tutorials and training data describe. The CLI's own error message named the fix directly: pass a connection `adapter` to the `PrismaClient` constructor instead.
- **How it was resolved without guessing**: Read the actual installed adapter package's own README (`node_modules/@prisma/adapter-neon/README.md`) for the exact real usage (`PrismaNeon`, `neonConfig.webSocketConstructor`), rather than trying to recall or infer the pattern - continuing the same discipline from the Gemini model-name incident: check the artifact itself, not a description of it.
- **Takeaway**: Fast-moving tools (Prisma just had a major version bump) will diverge from training-data patterns in ways that are individually surprising but structurally predictable - config surface moves, defaults change, patterns get replaced. The fix is never to guess harder; it's to read the actual error, then the actual installed source, and let those be more authoritative than memory.

### Pinning versions is worth doing proactively, not just reactively
- **What**: `npm install prisma` alone resolved to an unstable `8.0.0-rc.15` release candidate for the CLI, while `@prisma/client` correctly resolved to stable `7.10.0` - a silent major-version mismatch between two packages meant to work together, caught by comparing the actual installed versions before writing any code against them.
- **Why it mattered**: An RC CLI paired with a stable client is exactly the kind of mismatch that produces confusing, hard-to-diagnose errors down the line - not because either package is broken, but because they were never meant to be paired.
- **Takeaway**: When installing a multi-package toolchain (a CLI + its runtime library), verify both resolved to compatible, intentional versions before building anything on top - `npm view <pkg> versions` and a quick diff of `package.json` takes seconds and prevents debugging a problem that isn't really in your code at all.

### Scaffolding tools can install more than you asked for
- **What**: `prisma init` silently added `.claude/skills/`, `.windsurf/skills/`, `.agents/skills/`, and `skills-lock.json` to the repo - AI-coding-assistant reference documentation, unrelated to the database setup that was actually requested.
- **Why it mattered here specifically**: One of those directories (`.claude/`) directly conflicted with an explicit standing instruction never to mention Claude anywhere in this repo - the kind of thing that's easy to miss if you don't actually read what a scaffolding command touched.
- **Takeaway**: Same lesson as Phase 1's `CLAUDE.md` deletion, recurring with a different tool - always check `git status` after running a project-generator command, not just the files you expected it to create. Tools increasingly bundle their own AI-agent tooling by default, and it's worth an explicit decision whether to keep it, not an assumption that "init" only does the one thing it was invoked for.

---

## Phase A — Domain-Aware AI Architecture Generation

### Finding the actual root cause before touching code
- **What**: A large improvement request ("designs are too generic") could have been attacked from many angles - more rule-based keyword triggers, a bigger knowledge base, better prompts elsewhere. The actual audit found one precise root cause: architecture generation was the *only* major generator in the whole pipeline that never got the AI upgrade every other generator (requirements) already had - it was still 100% six-regex rule matching from Phase 7.
- **Why this mattered**: Naming the exact root cause turned an open-ended, 30-section improvement request into one well-scoped, highest-leverage change (Phase A) instead of many scattered small tweaks that wouldn't have fixed the actual complaint.
- **Takeaway**: When a request lists many possible symptoms, look for the one structural gap that explains most of them, rather than patching each symptom independently - an audit that names a precise cause is worth more than a long list of possible improvements.

### Separating "facts" from "analysis" as a schema-level design choice
- **What**: `toComponent()` deliberately sources different fields from different places for infrastructure components: `purpose`, `alternatives`, and `tradeoffs` always come from the verified knowledge base (never the AI's text, even though the AI's schema technically includes a `purpose` field it ends up not using for these); `reason`, `scalingStrategy`, and `failureBehavior` always come from the AI, since those are inherently product-specific analysis, not universal facts about a technology.
- **Why here**: This directly implements the "distinguish verified fact from recommendation" requirement without needing a separate labeling system in the UI - the distinction is architectural (which field, which source), not cosmetic (a badge saying "verified" vs "AI-generated" next to arbitrary text).
- **Takeaway**: When a system needs to keep two kinds of information distinct (fact vs. inference, verified vs. assumed), encoding the distinction in *where data comes from* is more robust than encoding it in a label that has to be manually kept accurate - a label can drift from the truth; a hard-coded data source cannot.

### A Zod enum as a hallucination guardrail, verified directly
- **What**: `technologyId` in the AI's response schema is a Zod `.enum()` built dynamically from `TECHNOLOGIES.map(t => t.id)` - not a free string. Tested directly (no live API call needed) that a fabricated technology id throws a `ZodError` rather than silently passing through.
- **Why this is stronger than a prompt instruction**: The system prompt also tells the model "you cannot invent a technology outside this list" - but a schema-level constraint doesn't rely on the model reliably following that instruction. If it doesn't, the enum catches it and the existing fallback-on-validation-failure path (already built for the requirement analyzer) handles it automatically, no new logic needed.
- **Takeaway**: Prefer constraining what a model's output *can structurally be* over instructing what it *should* produce, whenever the schema can express the constraint - instructions are a request, a schema enum is a guarantee.

### Verifying without the resource you'd normally verify with
- **What**: Live end-to-end testing against the actual Gemini API was blocked mid-session by hitting the free tier's daily quota (20 requests/day) - discovered from a real `429 RESOURCE_EXHAUSTED` error, not assumed. Rather than stopping verification entirely, fell back to two things that don't consume quota: (1) hand-crafting a realistic AI-response-shaped object and running it through the actual Zod schema and `toArchitecture()` conversion function, and (2) hand-crafting a deliberately invalid response to confirm the hallucination guardrail actually rejects it.
- **Why this was still real verification, not a compromise**: The code paths being tested (schema validation, KB-grounding logic, fallback triggering) are exactly the same code that runs on a live response - only the *source* of the input JSON changed (hand-written vs. model-generated). What couldn't be verified this way is prompt quality itself (does the model actually reason domain-first) - that remains genuinely untested until the quota resets.
- **Takeaway**: When the resource needed for full verification is unavailable, look for what part of the system can still be tested with a substitute input, and be explicit about exactly which part remains unverified - "verified the code, not yet the model's actual behavior" is an honest, precise status, not a workaround pretending to be complete.

---

## Phase B — Domain-Aware Database & API Generation

### One AI call reused, not a second one added
- **What**: Rather than a dedicated LLM call for database schema generation, the existing architecture-generation call was extended to also return domain entities in the same response - `generateDatabaseSchemaFromEntities()` and `generateApiEndpointsFromEntities()` are then pure, deterministic functions over that data, no additional AI round-trip.
- **Why here**: The architecture-generation prompt already reasons about the domain in depth - asking it to also name the data entities it implies costs a handful of extra output tokens, not a whole extra request's worth of latency and cost. This directly serves the "avoid unnecessary AI calls" cost-control principle from the audit.
- **Takeaway**: Before adding a new AI call for a new piece of structured output, check whether an *existing* call already has the context needed to produce it - extending one well-grounded prompt is usually cheaper and more consistent than a second independent one that has to re-derive the same domain understanding.

### A regression caught by re-examining an old assumption, not a new bug report
- **What**: `roadmap-generator.ts` matched conditional phases against `component.id` values like `"cache"` and `"message-queue"` - ids the rule-based planner happened to assign predictably. Once Phase A let the AI name components freely (e.g. "redis-cache-layer"), those checks would have silently stopped matching, and roadmap phases like "Caching Layer" would never appear again even when Redis clearly was in the architecture.
- **How it was found**: Not from testing the roadmap directly - from re-reading `roadmap-generator.ts` while working on a related file and recognizing that "match by id" was an assumption Phase A had quietly invalidated. No error, no failing test - just a hidden coupling between two files that had drifted out of sync.
- **The fix, and why it's more robust going forward**: Switched to matching against `technologyId` - which is guaranteed to be one of the fixed knowledge-base ids (`"redis"`, `"message-queue"`, etc.) regardless of what a human or an AI names the component around it. This decouples "what the component is called" from "what the component's phase-relevant category is."
- **Takeaway**: When one generator's output feeds another generator's logic (architecture -> roadmap), a change that only touches the *producer* (letting the AI choose component ids) can silently break the *consumer* (roadmap's keyword matching) without either file's own tests failing. Worth deliberately re-checking every downstream consumer of a data shape whenever a producer's freedom expands - not just checking that the producer itself still validates.

### Encoding a state machine directly in the schema, not as prose
- **What**: An entity field can be `type: "ENUM"` with an explicit `enumValues` array in the order they occur (e.g. an order's `status`: `CREATED, PAYMENT_PENDING, PAID, ..., DELIVERED`) - this shows up as a real typed column (`ENUM(CREATED, PAYMENT_PENDING, ...)`) in the generated schema, not just a sentence describing that orders "have a lifecycle."
- **Why here**: This is what turns "the system should model an order state machine" from a design *idea* into a design *artifact* someone could actually build against - a column definition with explicit valid states is directly actionable, a paragraph about state machines isn't.
- **Takeaway**: When a domain concept has a natural structured representation (an enum, a foreign key, a required field), encode it in the structured data the AI already produces, rather than leaving it as unstructured explanatory text elsewhere - structured output should carry as much of the actual meaning as the schema can express, not just the parts that map cleanly onto existing fields.

---

## Phase E — UI Polish

### Grouping by a stable property, not a display property
- **What**: `getComponentGroup()` groups diagram nodes by `kind` (AI-generated) or by `technologyId` (rule-based fallback) - never by `name`, which is the one field guaranteed to vary (an AI might call the same thing "Order Service" or "Order Management Service" across two runs).
- **Why here**: This is the same lesson as the Phase B roadmap-generator fix, applied to a new piece of code before it could become a new bug - group/categorize by the most stable, most-constrained field available, not the most human-readable one. `kind` is a fixed Zod enum; `technologyId` is a fixed knowledge-base id; `name` is free text the AI can phrase differently every time.
- **Takeaway**: Once you've been bitten by matching on a freely-generated field, it's worth auditing new code for the same mistake before it ships, not just fixing the one instance that broke - the same category of bug tends to recur in sibling code written under the same assumptions.

### A visual system that degrades gracefully across two very different data sources
- **What**: The same grouping/coloring code has to work correctly whether the architecture came from the AI (which sets `kind` explicitly) or the rule-based fallback (which never sets `kind` at all, only `technologyId`). `getComponentGroup()` handles both without the calling component (`ArchitectureDiagram`) needing to know or care which source produced the data.
- **Why this mattered**: The entire app has run on a "two sources, one shape" principle since Phase 6 (AI vs. rule-based, always converging on the same TypeScript type) - this is the same discipline extended into a new dimension (visual presentation, not just data shape). The diagram doesn't have an "AI mode" and a "fallback mode" - it has one rendering path that happens to receive slightly different inputs.
- **Takeaway**: When a system already has two data sources that must produce structurally identical output, new features built on top of that output (like a color-coding scheme) should stay agnostic to which source produced it - a feature that only works for one source is a sign the earlier "unify the sources" work didn't go far enough, or that the new feature reached past the unified interface for something it shouldn't have.

---

## Phase C + D — Prominent Rationale, Failure/Bottleneck/10x-Scale Analysis

### A third extension of the same AI call, and where that pattern stops paying off
- **What**: Failure scenarios, bottlenecks, and 10x-scale analysis were added as three more fields on the *same* architecture-generation response - the third time this session a new piece of structured output was folded into one existing call instead of a new one (after entities in Phase B).
- **Why this kept working**: All three genuinely need the same context the architecture call already has (domain, scale, the chosen components) - there was no new information to fetch, just more reasoning to ask for from data already in hand.
- **Where the pattern would stop working**: If a future feature needed context the architecture call *doesn't* have (e.g. something scoped to a single component a user clicks on, evaluated on demand, or requiring a live external lookup), bolting it onto this same call would mean fetching a full architecture reasoning pass just to answer a narrow question - at that point a separate, smaller call would be the right the call, not more fields on this one.
- **Takeaway**: "Extend the existing call" is a good default when the new output is a natural extension of context the call already has - it stops being the right choice once the new feature's information need diverges from what triggered the original call in the first place. Worth checking that divergence explicitly before reflexively bolting on one more field.

### An honest empty state instead of a hidden feature
- **What**: `AnalysisResult` explicitly detects when there's nothing to show and explains *why* ("requires the AI-generated architecture... rule-based fallback doesn't produce this") and *what to do about it* ("Regenerate" once AI is available) - rather than an empty tab, a generic "no data," or hiding the tab entirely when there's nothing to show.
- **Why this mattered in practice**: This tab was verified live, in-browser, against the rule-based fallback exclusively (Gemini quota still exhausted all session) - and that's precisely the state most users would hit on a fresh, keyless setup. An empty state that doesn't explain itself would look like a bug to exactly the audience most likely to see it first.
- **Takeaway**: For a feature that has a real "not available in this mode" state (not just "still loading"), writing that state's copy deserves the same care as the feature's main content - it's not a fallback to add later, it's the state a meaningful fraction of users will actually encounter.

### Verification method held steady across three phases under the same real constraint
- **What**: Phase C/D was verified the same way as Phase A and B: Zod schema validation against hand-crafted realistic data (including deliberately re-triggering the `.min(3)` components constraint to confirm it's actually enforced, not just declared), plus a live in-browser check of the fallback path end-to-end.
- **Why this is worth naming again**: The Gemini quota didn't reset once across three full phases of work in one extended session. Rather than treating that as a blocker to work around once, the same two-track verification approach (schema-level correctness now, live model behavior later) was applied consistently each time new AI-touching code shipped - which is what made it possible to keep building with real confidence instead of either stalling or shipping unverified code.
- **Takeaway**: A verification strategy that survives a real, sustained external constraint (not just a single outage) is worth recognizing as a durable pattern, not a one-off workaround - it's the same "test what you can, name what you can't" discipline that's been consistent since the first Gemini incident, now proven across multiple consecutive features under the same blocking condition.

---

## Visual Polish Pass (second round)

### One base-component change beats many per-page changes
- **What**: The single highest-leverage edit in this pass was adding a real shadow to the base `Card` component (`src/components/ui/card.tsx`) - one file, and every card across the entire app (Overview stats, requirements, database tables, component detail panels, failure scenarios) picked up the improvement simultaneously, with zero risk of inconsistency between pages.
- **Why this mattered**: The alternative - adding shadow classes to each individual `<Card>` usage across a dozen files - would have taken longer, and almost certainly produced subtly different shadows in different places as an artifact of copy-paste drift, undermining the "consistent visual system" goal specifically.
- **Takeaway**: Before making a repeated visual change across many call sites, check whether it can instead be made once at the shared component definition - this is the same "single source of truth" principle already used for data (Zod schemas, the knowledge base) applied to visual design instead.

### Restrained color reused across two different features
- **What**: The stat-card icon colors on the Overview tab intentionally reuse hues adjacent to (though not identical to) the architecture diagram's group-coloring palette from the earlier UI pass - both draw from the same small, restrained set of muted colors rather than each feature picking its own arbitrary palette.
- **Why here**: A visual system reads as deliberate when the same handful of colors recur with consistent meaning across the app, rather than every new feature introducing new colors - this is what separates "looks designed" from "looks like features were added independently over time," which is exactly the gap between a resume-project feel and a product feel.
- **Takeaway**: When adding color to a new part of the UI, check what palette the rest of the app is already using before picking new hues - consistency of a small palette reads as more intentional than a wider one, even if the wider one is technically "prettier" component by component.

---

## First Live Verification - the Zomato Acceptance Test

### Two distinct failure modes discovered by finally reaching live traffic
- **What**: Once the daily quota reset, live testing immediately surfaced two real, previously-invisible problems: a *per-minute* rate limit (5 requests/minute) separate from the daily cap, hit by a test script firing requests back-to-back; and genuine `503`/`504` errors from Gemini's own infrastructure - not quota, not a bug in this app, just the free-tier model occasionally overloaded or the response genuinely taking longer than the tuned timeout allowed.
- **Why these were invisible until now**: Every prior verification pass (Phases A-D) used hand-crafted Zod-validated data specifically because live calls were quota-blocked - which correctly verified the *code paths* but had no way to reveal timing behavior, rate limits, or infrastructure flakiness, since none of those exist in a hand-crafted JSON object.
- **Takeaway**: Schema/logic verification and live-traffic verification catch categorically different classes of bugs - one validates "does the code handle this shape of data correctly," the other validates "does the system behave correctly under real latency, real rate limits, real intermittent failures." Neither substitutes for the other; a long quota-blocked stretch means real verification debt is quietly accumulating even while confidence feels reasonably high.

### A timeout tuned for a small response silently became wrong as the response grew
- **What**: The 15s (later 30s) timeout on architecture generation was tuned back when the response was just architecture + entities. By the time failure scenarios, bottlenecks, and 10x-scale analysis were added on top (Phase C/D), the same call could legitimately need 35+ seconds to complete - and nothing about adding those fields felt like it should have touched the timeout, so it wasn't revisited until a live 504 forced the question.
- **How it was fixed correctly, not just patched**: Before just cranking the number up, checked whether Vercel's own function timeout would become the new binding constraint - looked it up rather than assuming, and learned Fluid Compute's Hobby-tier default (300s) has enormous headroom, so extending our own timeout to 45s was safe with room to spare.
- **Takeaway**: A timeout, retry count, or rate limit tuned for one version of a call is a piece of configuration that silently drifts out of correctness as the call's actual workload grows - it's not "set once," it's coupled to how much work the call does, and deserves re-examination whenever that scope expands materially (the same lesson as Phase B's roadmap-generator id-matching bug, in a different guise: an earlier decision's assumptions quietly invalidated by later feature growth).

### The payoff of a long quota-blocked stretch, seen all at once
- **What**: The Zomato acceptance test succeeded completely on the first true attempt once the timeout was fixed: domain-specific service names (Order Processing Service, not "Backend"), correct technology grounding (PostgreSQL for ACID order consistency, a geospatial index for driver matching, a message queue for event-driven state, an external payment provider), domain-specific entities (User/Restaurant/MenuItem/Order/Payment, not generic posts/likes), failure scenarios tied to the actual domain (payment outage during dinner rush, not "the database goes down"), and a 10x-scale analysis reasoning about database sharding by region and gRPC streaming for location updates - not a single generic statement anywhere in the output.
- **Why this validates the whole session's approach, not just this one feature**: Every piece of this - the knowledge-base grounding, the fact/analysis split, the entity-to-schema conversion, the Zod hallucination guardrail - had only ever been verified against hand-crafted data until this moment. Seeing it all cohere correctly on a real, unscripted model response is the actual confirmation that the architecture built across Phases A-D was sound, not just internally consistent.
- **Takeaway**: A verification strategy built entirely on substitutes (hand-crafted data, code-path checks, graceful fallbacks) can carry a project a very long way, but it's provisional confidence, not final confidence - the first real end-to-end success is still a distinct, meaningful milestone worth recognizing as different in kind from everything that came before it, not just "one more test that passed."

---

## Phase F — Interview Mode Re-grounding

### A feature that "still worked" but was silently leaving value on the table
- **What**: `buildDesignSummary()` compiled without errors, the Interview tab rendered fine, and interview questions were still generated successfully throughout Phases A-E - nothing was actually *broken*. But the function simply never read `architecture.domain`, `designRationale`, `failureScenarios`, `bottlenecks`, or `tenXScale`, even after all of those became real, available data. The audit item ("re-verify Interview mode against the new architecture shape") wasn't chasing a bug - it was catching a feature that had quietly stopped keeping pace with what the rest of the app could now do.
- **Why this matters as its own category of issue, distinct from a bug**: Nothing would have surfaced this without deliberately asking "does this still make full use of what's available," since there was no error, no failing test, no visibly wrong output - just an opportunity the code wasn't taking. This is a different failure mode than the roadmap-generator id-matching bug or the too-short timeout - those broke something; this just under-used something.
- **Takeaway**: When a data shape a feature depends on grows richer over time (as `Architecture` did across Phases A-D), it's worth deliberately re-reading every consumer of that shape and asking "would this be meaningfully better if it used the new fields," not just "does it still compile against them" - the second question a type checker answers for free; the first one doesn't get asked unless someone asks it.

### Deliberately pointing one AI call at another AI call's prior output
- **What**: The interview prompt now explicitly instructs the model to build questions from the "Known bottlenecks"/"Known failure scenarios"/"10x scale" facts already present in the design summary, rather than reasoning about bottlenecks and failures independently a second time.
- **Why this is worth doing deliberately, not just implicitly hoping the context gets used**: An LLM given relevant facts in its context doesn't reliably center its response on them unless told to - it can just as easily generate a plausible-sounding but different bottleneck than the one already shown to the user on the Analysis tab, which would look like an inconsistency bug even though both answers might individually be reasonable engineering opinions.
- **Takeaway**: When one AI-generated artifact is meant to build on another AI-generated artifact's conclusions (not just its raw data), say so explicitly in the prompt - "use these specific facts" is a different, stronger instruction than "here is some context," and the gap between them is exactly where two AI outputs can quietly contradict each other.

---

## How to use this file
- We add an entry **after** each concept is introduced and you've had the checkpoint questions, not before — so this reflects what you've actually learned, not just what was planned.
- Entries stay even if we later change the implementation — this is a *learning* record, not a design doc (that's what the README and code comments are for).
