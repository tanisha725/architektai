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

---

## How to use this file
- We add an entry **after** each concept is introduced and you've had the checkpoint questions, not before — so this reflects what you've actually learned, not just what was planned.
- Entries stay even if we later change the implementation — this is a *learning* record, not a design doc (that's what the README and code comments are for).
