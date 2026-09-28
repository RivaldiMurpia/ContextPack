---
doc: spec
status: approved
---

# ContextPack — Technical Spec

## How This Works, In Plain Language

ContextPack is one web page plus one small server helper. The page has connection fields (API Endpoint, API Key, Model selector with "+ Add model", Thinking selector defaulting to Auto) and a text box where you paste messy project notes. When you click Generate, the page sends your endpoint, key, selected model ID, thinking level, and notes to a small helper function on the same site (same-origin `POST /api/generate`). That helper uses your connection details — just for this one request — to call your provider's OpenAI-compatible Chat Completions API with strict JSON Schema structured output, turning the notes into seven fixed sections (Goal, Current State, Key Decisions, Constraints, Open Questions, Missing Context, Next Actions). It checks the answer with Zod, then sends only the structured result back to your page. Your endpoint, key, and model are discarded right after the request; they are never saved, stored, logged, or returned. There is no database, no accounts, no history. Refresh the page and everything — endpoint, key, model list, thinking, context, result — is gone.

Why this shape: the proof of concept only needs to prove one transformation (messy notes → trustworthy structured handoff). A single page plus one same-origin serverless helper is the smallest thing that does that securely, since browsers cannot safely call OpenAI directly with a key.

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`.

1. User opens the page → Vite serves static `index.html` with header, API key field, text area, Generate button, Try example link. Nothing is fetched yet.
2. User enters their provider's API endpoint and API key, adds exact model IDs via "+ Add model" (each auto-selected), optionally sets Thinking → all live only in page memory (JS variables). Never written to localStorage, cookies, or any store.
3. User pastes notes or clicks Try example → client fills only the textarea with predefined demo text. Client validates endpoint URL syntax (http/https), input length (min threshold, 12,000-char max with counter), key presence, and model selection.
4. User clicks Generate ContextPack → client checks endpoint valid, key non-empty and plausibly long, a model selected, and input passes validation. Button disables, label becomes "Analyzing context...", spinner + status message appear.
5. Browser sends same-origin `POST /api/generate` with `{ baseURL, apiKey, model, reasoningEffort, context }` over HTTPS → Vercel Node serverless function receives it. Function never logs endpoint, body, or key. No wildcard CORS — same Vercel project/domain.
6. Function validates the endpoint server-side (production: HTTPS-only, rejects loopback/private/embedded-credentials; dev allows localhost), then calls the provider's Chat Completions API with the caller's baseURL + key + exact model ID, `response_format` strict JSON Schema requesting the seven fixed fields, and `reasoning_effort` only when Thinking is not Auto → provider returns JSON.
7. Function validates the object with Zod against the same shape → on success returns `{ pack: {...} }` to the browser. Connection details discarded when the request ends.
8. Browser renders all seven sections together below the input, scrolls gently to the result. Copy Handoff / Copy for AI buttons build Markdown client-side; toast confirms copy.
9. On any failure (bad key, rate limit, malformed output, network) → function returns a safe error code only; page keeps input intact, shows friendly inline message + Try again. Previous valid result (if any) is kept.

## Stack

- **Vite (latest 5.x/6.x) + vanilla HTML/CSS/JS** — no framework. Zero runtime framework cost, runs anywhere, smallest surface for a single page. Tradeoff accepted: no component system; fine because there is one page and seven static sections. Docs: https://vite.dev
- **Node.js (Vercel serverless, Node runtime)** — one same-origin API route `POST /api/generate`. Familiar Vercel deploy; Node runtime (not Edge) for full OpenAI SDK + Zod support.
- **OpenAI-compatible Chat Completions (`openai` npm package, `chat.completions.create`)** — caller-supplied `baseURL` + exact `model` ID (no hardcoded models, no `/models` discovery). `response_format: { type: "json_schema", json_schema: { name: "context_pack", strict: true, schema } }` plus server Zod. `reasoning_effort` passed only when Thinking is not Auto; Auto omits it entirely. Rationale: works against any compatible provider while keeping one code path. Tradeoff accepted: if the provider/model rejects the reasoning level or Structured Outputs, the user gets a friendly compatibility error instead of a silent fallback. Docs: https://platform.openai.com/docs
- **Zod** — server-side validation of the final model object against the seven-field shape, after Structured Outputs. Defense-in-depth. Docs: https://zod.dev
- **No database, no auth library, no CSS framework** — plain CSS per PRD Look and Feel. Keeps the diff tiny and the styling fully controlled.

## Where It Runs and How Someone Tries It

- **Runtime:** browser (any modern browser) + Vercel Node serverless function for same-origin `/api/generate`.
- **Requirements:** Node 20+ for local dev; user's own OpenAI-compatible endpoint + API key + exact model ID entered in the page (no `OPENAI_API_KEY` env var needed by the app; no server-side secrets at all).
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
  baseURL: string,       // endpoint input value, memory only
  apiKey: string,        // masked input value, memory only
  models: string[],      // manually added exact model IDs, memory only
  selectedModel: string, // currently selected model ID, memory only
  reasoningEffort: "auto" | "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "ultra",
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
{ baseURL: string, apiKey: string, model: string, reasoningEffort: string, context: string }

// success
{ pack: { goal, currentState, keyDecisions, constraints, openQuestions, missingContext, nextActions } }

// error (safe codes only, no internals, never endpoint/key)
{ error: { code: "INVALID_CONNECTION" | "INVALID_API_KEY" | "INVALID_MODEL" | "INVALID_INPUT" | "RATE_OR_QUOTA_LIMIT" | "MODEL_UNAVAILABLE" | "REASONING_UNSUPPORTED" | "STRUCTURED_OUTPUT_UNSUPPORTED" | "BAD_MODEL_OUTPUT" | "GENERATION_FAILED", message: string } }
```

Where data lives: `baseURL` in the endpoint input + one JS variable; `apiKey` in the password input + one JS variable; `models`/`selectedModel`/`reasoningEffort` in JS variables + selects; `context` in the textarea; `pack` in a JS variable + DOM. Leaving/refreshing clears everything. No localStorage, cookies, database, or persistence anywhere.

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

- **OpenAI-compatible Chat Completions** — via `openai` SDK (`chat.completions.create`) with caller-supplied `baseURL` + key + exact `model`. Request: `messages` = system instructions (grounding/classification rules) + raw context, `response_format` = strict JSON Schema with seven required properties, `reasoning_effort` only when Thinking is not Auto. Response content read from `choices[0].message.content`, JSON-parsed, Zod-validated. Docs: https://platform.openai.com/docs/guides/structured-outputs. Connection details: caller-supplied per request, never stored. Rate limits/cost: borne by the user's own provider account; function maps 429 to a friendly message.
- **Vercel hosting + serverless functions** — serves static page + runs `api/generate.js` (Node runtime) under the same project/domain. No env vars required. No wildcard CORS. Docs: https://vercel.com/docs/functions. Cost: free tier suffices for POC demo volume.
- **npm packages:** `vite` (dev/build), `openai` (server-side SDK), `zod` (server-side validation). No other dependencies.

## Important Failure Modes

- **Invalid endpoint** → "Enter a valid API endpoint." (client syntax; server production rules add HTTPS/loopback/private/credential checks.) Input kept; nothing logged.
- **Invalid / unauthenticated API key** → "That API key couldn't be authenticated by the provider. Check the key and try again." Input kept; no upstream error body, endpoint, or key exposed.
- **Model or endpoint not found (404)** → "The selected model or endpoint wasn't found. Check the endpoint and model ID and try again." No silent fallback.
- **Unsupported reasoning level** → "The selected thinking level isn't supported by this model or endpoint. Try a different level or leave Thinking on Auto." Reasoning never silently stripped.
- **Unsupported strict Structured Outputs** → "This model or endpoint doesn't support the required structured output format. Try a different model." Never silently falls back to plain JSON.
- **Malformed model output (Zod rejects)** → "ContextPack couldn't structure this response correctly. Please try again." No partial render; input kept; previous result kept.

## What Was Simplified and Why

- **Provider-agnostic BYOK (endpoint + key + manual model IDs)** instead of app-owned key + billing — no secrets to manage, no cost to the builder, no accounts. The fuller version would need key management, usage metering, billing, and abuse controls.
- **Manual model add/select** instead of `/models` discovery or hardcoded IDs — a select plus inline input keeps the POC compatible with any endpoint. Discovery would add fetch logic, capability detection, and caching.
- **Thinking selector with Auto default** instead of hidden reasoning controls — one select; Auto omits `reasoning_effort`, other values pass through. Per-model reasoning UIs would add capability matrices.
- **Single same-origin serverless function** instead of a backend service — one endpoint, no servers to run, no CORS surface, Vercel free tier. A fuller version would add queues, retries, and observability.
- **No persistence (memory-only state)** instead of history/projects — refresh clears endpoint, key, models, thinking, context, result. The fuller version would need a database, auth, and data-retention policy.
- **Fixed seven-section strict JSON Schema** instead of templates/modes — predictable output, one prompt, one validator. Custom templates would multiply prompts and validators.
- **Client-side Markdown building** instead of server-rendered export — copy logic is pure string building from validated data; no extra endpoint. PDF/export would need rendering infrastructure.

## Decisions and Open Issues

- **Vite + vanilla (learner-agreed direction)** — smallest thing that satisfies single-page + Vercel deploy. Tradeoff: hand-written DOM rendering; accepted because the page is one input + seven static sections.
- **Vercel Node serverless, same-origin `/api/generate` (learner-agreed)** — keeps the key off the client-to-OpenAI path and gives a place for Zod validation; no wildcard CORS. Tradeoff: cold starts add ~1s occasionally; accepted for POC.
- **Provider-agnostic BYOK, memory-only, refresh clears (learner requirement)** — endpoint + key + models + thinking sent per-request, never stored/logged/returned. Client validates endpoint syntax + key presence; real validity comes from the provider. Tradeoff: user must re-enter connection every session; accepted — matches no-auth, no-persistence boundary.
- **Manual model add/select, no discovery or hardcoded IDs (learner requirement)** — exact IDs typed by the user, deduped, auto-selected, memory-only. Tradeoff: no convenience of a model list; accepted — discovery adds fetch/caching/capability surface.
- **Thinking selector, Auto omits reasoning (learner requirement)** — Auto sends no `reasoning_effort`; other values pass through verbatim; gateways encoding reasoning in the model ID (e.g. `cx/gpt-5.6-luna(xhigh)`) use Auto. Tradeoff: unsupported levels error instead of adapting; accepted — silent adjustment hides provider behavior.
- **OpenAI-compatible Chat Completions + strict JSON Schema + server Zod (learner requirement)** — schema enforcement plus independent validation of the final object, read from `choices[0].message.content`. Tradeoff: providers without strict structured-output support get a friendly incompatibility error; accepted — plain-JSON parsing is more fragile.
- **Grounding rules — source traceability, conservative inference, no Open Questions/Missing Context duplication, time/sequence grounding (learner requirement)** — the prompt forbids linking unrelated notes (e.g. Supabase vs John/pricing), forbids specificity beyond the notes (e.g. "payment later" stays deferred), and routes already-unresolved items to Open Questions rather than duplicating them as Missing Context.
- **Production endpoint security (learner requirement)** — HTTPS-only, rejects loopback/private/embedded-credentials; dev allows localhost gateways. Never logs endpoint, key, or body.
- **Open from PRD:** none blocking.
