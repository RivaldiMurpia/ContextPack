---
doc: spec
status: approved
---

# ContextPack — Technical Spec

## How This Works, In Plain Language

ContextPack is one web page plus one small server helper. The page has a text box where you paste messy project notes and a field where you type your own OpenAI API key. When you click Generate, the page sends your notes and your key to a small helper function on the same site (`POST /api/generate`). That helper uses your key — just for this one request — to ask OpenAI (Responses API, Structured Outputs with a strict JSON schema) to turn the notes into seven fixed sections (Goal, Current State, Key Decisions, Constraints, Open Questions, Missing Context, Next Actions). It checks the answer is shaped correctly with Zod, then sends only the structured result back to your page. Your key is discarded right after the request; it is never saved, stored, logged, or returned. There is no database, no accounts, no history. Refresh the page and everything — including the key — is gone.

Why this shape: the proof of concept only needs to prove one transformation (messy notes → trustworthy structured handoff). A single page plus one same-origin serverless helper is the smallest thing that does that securely, since browsers cannot safely call OpenAI directly with a key.

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`.

1. User opens the page → Vite serves static `index.html` with header, API key field, text area, Generate button, Try example link. Nothing is fetched yet.
2. User enters their own OpenAI API key → key lives only in page memory (a JS variable). Never written to localStorage, cookies, or any store.
3. User pastes notes or clicks Try example → client fills text area with predefined demo text. Client validates input length (min threshold, 12,000-char max with counter).
4. User clicks Generate ContextPack → client checks key field is non-empty and plausibly long enough, and input passes validation. Button disables, label becomes "Analyzing context...", spinner + status message appear.
5. Browser sends same-origin `POST /api/generate` with `{ apiKey, context }` over HTTPS → Vercel Node serverless function receives it. Function never logs the body or the key. No wildcard CORS — same Vercel project/domain.
6. Function calls OpenAI Responses API with the user''s key, model `gpt-5.6-luna` (single configurable constant `DEFAULT_MODEL`), Structured Outputs strict JSON Schema requesting the seven fixed fields → OpenAI returns schema-conforming JSON.
7. Function validates the object with Zod against the same shape → on success returns `{ pack: {...} }` to the browser. Key is discarded when the request ends.
8. Browser renders all seven sections together below the input, scrolls gently to the result. Copy Handoff / Copy for AI buttons build Markdown client-side; toast confirms copy.
9. On any failure (bad key, rate limit, malformed output, network) → function returns a safe error code only; page keeps input intact, shows friendly inline message + Try again. Previous valid result (if any) is kept.

## Stack

- **Vite (latest 5.x/6.x) + vanilla HTML/CSS/JS** — no framework. Zero runtime framework cost, runs anywhere, smallest surface for a single page. Tradeoff accepted: no component system; fine because there is one page and seven static sections. Docs: https://vite.dev
- **Node.js (Vercel serverless, Node runtime)** — one same-origin API route `POST /api/generate`. Familiar Vercel deploy; Node runtime (not Edge) for full OpenAI SDK + Zod support.
- **OpenAI API (`openai` npm package, Responses API)** — model default `gpt-5.6-luna` via single constant `DEFAULT_MODEL = "gpt-5.6-luna"`. Uses the current Responses API Structured Outputs pattern (`text.format` with strict JSON schema, or the SDK''s Zod helper if appropriate for the installed version). Rationale: current cost-efficient model with Structured Outputs support, matched to simple extraction/classification workload. Tradeoff accepted: if a user''s account lacks access, they get a friendly error instead of a silent fallback. Docs: https://platform.openai.com/docs
- **Zod** — server-side validation of the final model object against the seven-field shape, after Structured Outputs. Defense-in-depth. Docs: https://zod.dev
- **No database, no auth library, no CSS framework** — plain CSS per PRD Look and Feel. Keeps the diff tiny and the styling fully controlled.

Unverified at spec time: exact installed `openai` SDK version and its Responses-API structured-output call shape for `gpt-5.6-luna` — confirm on first `npm install` and adjust the call before wiring the rest.

## Where It Runs and How Someone Tries It

- **Runtime:** browser (any modern browser) + Vercel Node serverless function for same-origin `/api/generate`.
- **Requirements:** Node 20+ for local dev; user''s own OpenAI API key entered in the page (no `OPENAI_API_KEY` env var needed by the app).
- **Local dev:** `npm install` then `npm run dev` → open the printed localhost URL. API route works via `vercel dev` or the Vite dev proxy (exact wiring confirmed in build step 1).
- **Production:** deploy to Vercel (connect repo, deploy). Frontend and function share the same project/domain, so the browser calls same-origin `POST /api/generate`. No env vars required for the POC. HTTPS is automatic (protects the key in transit). No wildcard CORS.
- **Demo recording:** open the deployed URL (or localhost), enter API key, click Try example, click Generate, show structured result with Missing Context, click Copy Handoff. Submission needs the short demo video + public GitHub repo; deployment is optional but makes the demo easy.

## Look and Feel

Per `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`, translated for build:

- Background: light neutral slightly off-white (e.g. `#faf9f7` / `#f7f6f3`); text dark charcoal/slate (`#1e293b`-ish); single cool accent indigo/blue (`#4f46e5`-ish) for primary button, focus rings, links.
- Semantic treatments: known sections neutral cards; Open Questions muted amber border/background; Missing Context stronger amber/orange (distinctive card + warning icon, not red, not alarming).
- Typography: system sans stack (`-apple-system, "Segoe UI", Inter, Roboto, sans-serif`); hierarchy by size/weight; compact uppercase-ish section labels.
- Layout: centered column, max-width ~720–800px, generous padding; large textarea (min-height ~200px) as hero surface; result as stacked separated cards with subtle border (`1px solid #e5e7eb`) and moderate radius (`8–10px`).
- Copy tone: short, precise, direct. No emojis in UI. API key helper text: "Use your own OpenAI API key. Your key is used only for this request and is not stored."
- Avoid: gradients, shadows beyond subtle, glassmorphism, pills, chatbot bubbles, marketing sections. Plain CSS only.

## Components

### Page shell (`index.html` + `src/main.js` + `src/styles.css`)

Single page: header, API key field, input block, result block, toast region.
PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`.

- Header: name, tagline, supporting sentence (static).
- API key block: masked `<input type="password">` + helper copy + "not stored" note.
- Input block: `<textarea>` with placeholder, character counter, Generate button, Try example button, inline validation/error area.
- Result block: hidden until success; heading + Copy Handoff + Copy for AI buttons + seven fixed section cards in order.
- Toast region: `aria-live` polite, small non-destructive messages.
- Talks to: same-origin `/api/generate` (POST) only.

### Client logic (`src/main.js` + `src/copy.js` + `src/example.js`)

Validation, fetch, render, copy-to-clipboard.
PRD ref: `prd.md > Features and Behavior > Input and generation`, `> Structured output`, `> Copy actions`, `> States and Boundaries`.

- Validates: key field non-empty and plausibly long (obvious-mistake catch only — no exact prefix/format dependency; real validity comes from OpenAI); context non-empty, above min threshold, ≤ 12,000 chars. Disables Generate appropriately.
- Sends `{ apiKey, context }` to same-origin `/api/generate`; handles loading state (label, spinner, status text).
- Validates response shape lightly before render; renders all seven sections together; explicit "none found" text for empty arrays.
- Builds Markdown (Copy Handoff) and header + Markdown (Copy for AI) client-side from rendered data; `navigator.clipboard.writeText` with fallback error; toast + temporary "Copied" label.
- Keeps input intact on any failure; keeps previous result unless new success arrives.

### Generate endpoint (`api/generate.js`)

Vercel Node serverless function. Receives key + context, calls OpenAI Responses API transiently, validates with Zod, returns pack or safe error.
PRD ref: `prd.md > Features and Behavior`, `> States and Boundaries`.

- Parses `{ apiKey, context }`; rejects missing/invalid without calling OpenAI.
- Enforces server-side length checks (mirror client: min threshold, 12,000 max).
- Calls OpenAI Responses API with caller-supplied key: `new OpenAI({ apiKey })`, Responses call with `model: DEFAULT_MODEL`, input = system instructions + raw context, `text.format` = strict JSON Schema with the seven fixed fields (or SDK Zod helper equivalent).
- Validates the final object with Zod against the seven-field shape; on Zod failure returns controlled `BAD_MODEL_OUTPUT` error (no partial render).
- Maps OpenAI errors: 401/auth failure → `INVALID_API_KEY` with friendly "That API key couldn''t be authenticated. Check the key and try again."; 429 → `RATE_LIMITED`; 404/model-not-found → `MODEL_UNAVAILABLE` (friendly: account lacks access, no silent fallback); timeout/network → `GENERATION_FAILED`. Never exposes upstream error bodies or the submitted key.
- Never logs `apiKey`, `req.body`, or full context. Returns `{ pack }` only — never echoes the key.

## Data Model

No database. No persistence. All state is in-memory page state, cleared on refresh.

```js
// Client page state (JS variables only — never localStorage/cookies)
state = {
  apiKey: string,        // masked input value, memory only
  context: string,       // textarea value, ≤12000 chars
  status: "idle" | "loading" | "success" | "error",
  error: null | { code, message },
  pack: null | {
    goal: string,
    currentState: string[],
    keyDecisions: string[],
    constraints: string[],
    openQuestions: string[],
    missingContext: string[],
    nextActions: string[]
  }
}
```

Server request/response shapes:

```js
// POST /api/generate — request (same-origin)
{ apiKey: string, context: string }

// success
{ pack: { goal, currentState, keyDecisions, constraints, openQuestions, missingContext, nextActions } }

// error (safe codes only, no internals, never the key)
{ error: { code: "INVALID_API_KEY" | "RATE_LIMITED" | "MODEL_UNAVAILABLE" | "BAD_MODEL_OUTPUT" | "GENERATION_FAILED" | "INVALID_INPUT", message: string } }
```

Where data lives: `apiKey` in the password input + one JS variable; `context` in the textarea; `pack` in a JS variable + DOM. Leaving/refreshing clears everything.

## File Structure

```
contextpack/
├── index.html            # page shell: header, key field, textarea, buttons, result containers, toast
├── package.json          # vite, openai, zod (+ dev deps)
├── vite.config.js        # dev server + /api proxy or Vercel dev wiring
├── .gitignore            # node_modules, dist, .vercel (devpost/learner-profile.md already ignored)
├── src/
│   ├── main.js           # state, validation, fetch /api/generate, render, loading/error states
│   ├── copy.js           # build Markdown + AI-header Markdown, clipboard, toast
│   ├── example.js        # predefined demo input text (Try example)
│   ├── prompt.js         # (shared) system prompt text — client does NOT call OpenAI; server imports
│   └── styles.css        # PRD look and feel: off-white, charcoal, indigo accent, amber semantics
├── api/
│   └── generate.js       # Vercel Node function: validate input, call OpenAI Responses API with caller key,
│                         #   strict JSON Schema structured output, Zod validate, return pack or safe error.
│                         #   DEFAULT_MODEL = "gpt-5.6-luna" lives here (single place).
├── devpost/              # Devpost learning workspace (learner-profile, scope, prd, spec, checklist)
└── .agents/skills/       # course material (ignored for progress purposes)
```

No test framework files in the POC tree beyond a single self-check (see build). No `dist/` committed.

## External Services and Dependencies

- **OpenAI Responses API** — via `openai` SDK with caller-supplied BYOK key. Request: `model: "gpt-5.6-luna"`, input = system instructions (extraction/classification rules: never invent, tentative ≠ decided, missing → missing) + raw context, `text.format` = strict JSON Schema with seven required properties (or SDK Zod helper equivalent). Response: JSON object matching the shape. Docs: https://platform.openai.com/docs/guides/structured-outputs. Keys required: caller-supplied key per request, never stored. Rate limits/cost: borne by the user''s own OpenAI account; function maps 429 to a friendly message.
- **Vercel hosting + serverless functions** — serves static page + runs `api/generate.js` (Node runtime) under the same project/domain. No env vars required. No wildcard CORS. Docs: https://vercel.com/docs/functions. Cost: free tier suffices for POC demo volume.
- **npm packages:** `vite` (dev/build), `openai` (server-side SDK), `zod` (server-side validation). No other dependencies.

## Important Failure Modes

- **Invalid / unauthenticated API key** → inline message "That API key couldn''t be authenticated. Check the key and try again." Input kept; no upstream error body or key exposed.
- **Model unavailable to caller''s account (404 / model_not_found)** → "The configured model (gpt-5.6-luna) isn''t available on your API account. Check your account access and try again." No silent model switch.
- **Malformed model output (Zod rejects)** → "ContextPack couldn''t structure this response correctly. Please try again." No partial render; input kept; previous result kept.

## What Was Simplified and Why

- **BYOK caller key** instead of app-owned key + billing — no secrets to manage, no cost to the builder, no accounts. The fuller version would need key management, usage metering, billing, and abuse controls.
- **Single same-origin serverless function** instead of a backend service — one endpoint, no servers to run, no CORS surface, Vercel free tier. A fuller version would add queues, retries, and observability.
- **No persistence (memory-only state)** instead of history/projects — refresh clears everything. The fuller version would need a database, auth, and data-retention policy.
- **Fixed seven-section strict JSON Schema** instead of templates/modes — predictable output, one prompt, one validator. Custom templates would multiply prompts and validators.
- **No model picker** instead of provider/model choice — one constant `DEFAULT_MODEL`. A picker would add compatibility testing per model.
- **Client-side Markdown building** instead of server-rendered export — copy logic is pure string building from validated data; no extra endpoint. PDF/export would need rendering infrastructure.

## Decisions and Open Issues

- **Vite + vanilla (learner-agreed direction)** — smallest thing that satisfies single-page + Vercel deploy. Tradeoff: hand-written DOM rendering; accepted because the page is one input + seven static sections.
- **Vercel Node serverless, same-origin `/api/generate` (learner-agreed)** — keeps the key off the client-to-OpenAI path and gives a place for Zod validation; no wildcard CORS. Tradeoff: cold starts add ~1s occasionally; accepted for POC.
- **BYOK, memory-only, refresh clears (learner requirement)** — key sent per-request, never stored/logged/returned. Client checks non-empty + plausible length only; real validity comes from OpenAI. Tradeoff: user must paste key every session; accepted — matches no-auth, no-persistence boundary.
- **OpenAI Responses API + strict JSON Schema + server Zod (learner requirement)** — schema enforcement plus independent validation of the final object. Tradeoff: tied to OpenAI''s Responses structured-output API; accepted — legacy parsing is more fragile.
- **Default model `gpt-5.6-luna`, single constant, no picker, friendly error on no access (learner requirement)** — current low-cost default without silent fallback. Tradeoff: callers without access cannot use the POC until they gain access or the constant is changed; accepted explicitly.
- **Genuine uncertainty discussed:** exact `openai` SDK call shape for Responses-API structured output with `gpt-5.6-luna` at build time — SDK versions move fast. Agreed small investigation during build: after `npm install`, verify the `text.format` / Zod-helper pattern against the installed SDK, and adjust the call before wiring the rest.
- **Open from PRD:** none blocking. Remaining: confirm local `/api` wiring (`vercel dev` vs Vite proxy) in the first build step.
