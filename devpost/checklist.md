---
doc: checklist
status: draft
---

# ContextPack — Build Checklist

Build mode: learn (guided, one step at a time, verify + commit each slice)

## Slices

- [x] **1. Project init** — `package.json`, Vite config, basic `index.html` skeleton with header, API key field, textarea, buttons, result containers, toast region. No logic yet.
- [x] **2. Client styles** — `src/styles.css` implementing PRD Look and Feel: off-white background, charcoal text, indigo accent, amber semantics for Open Questions / Missing Context, system sans, centered column ~720-800px, generous whitespace, moderate card radius, subtle borders.
- [x] **3. Client core** — `src/main.js` state machine (idle/loading/success/error), validation (key non-empty + plausible length, context min/max 12k chars + counter), same-origin `POST /api/generate` fetch, loading UI (button label, spinner, status text), render seven fixed sections with explicit "none found" text, gentle scroll to result, keep input on failure, keep previous result unless new success.
- [x] **4. Copy logic** — `src/copy.js` builds clean Markdown and AI-header Markdown from rendered data, `navigator.clipboard.writeText` with fallback, toast + temporary "Copied" label (1-2s), error handling.
- [x] **5. Example data** — `src/example.js` exports the predefined demo input text for "Try example" button.
- [x] **6. Server prompt** — `api/prompt.js` exports the system instructions: extraction/classification rules (never invent, tentative ≠ decided, missing → missing), output seven fixed fields.
- [x] **7. Server schema** — `api/schema.js` exports Zod schema for the seven-field object and the strict JSON Schema for OpenAI-compatible Chat Completions Structured Outputs. Unchanged by the provider-agnostic revision.
- [x] **8. Server function** — `api/generate.js` Vercel Node function: validates endpoint/key/model/context, calls provider Chat Completions with caller `baseURL` + key + exact `model`, strict JSON Schema structured output, conditional `reasoning_effort` (omitted on Auto), Zod validates final object, returns `{ pack }` or safe error codes. Never logs endpoint/key/body. Production endpoint security enforced. Maps 401→auth error, 429→rate/quota, 404→model/endpoint not found, reasoning→compatibility error, structured-output→compatibility error, Zod fail→bad output.
- [ ] **9. Integration + verify (vercel dev)** — provider-agnostic connection (endpoint + key + manual model + Thinking), Try example fills context only, Generate → seven sections render together, copy actions with toasts. Live-tested: endpoint/key/model/thinking validation, Try example, empty/tiny/over-limit guards, full generate with demo input, copy Handoff + copy for AI, refresh clears all, mobile layout. Static-only (not reproduced live): unsupported-reasoning compatibility error, unsupported-structured-output compatibility error. npm build: [record result here].

## Git

Each slice committed after mechanical verification. `.gitignore` already excludes `devpost/learner-profile.md`, `.env`, `.env.*` (allows `.env.example`). No secrets staged.

## Final Review

- [ ] All acceptance criteria from PRD satisfied
- [ ] All failure modes from spec handled
- [ ] Code tour and app map complete

## Revisions

- **Provider-agnostic revision (pre-Slice-9):** replaced OpenAI Responses API + hardcoded `gpt-5.6-luna` default with caller-supplied OpenAI-compatible endpoint + manual exact model IDs + Thinking selector (Auto default, Auto omits `reasoning_effort`). Backend moved to `chat.completions.create` with `response_format` strict JSON Schema, content read from `choices[0].message.content`. Added production endpoint security. Copy is provider-agnostic. `api/prompt.js` gained source grounding, conservative inference, Open Questions vs Missing Context dedup, and time/sequence grounding. `api/schema.js`, `src/copy.js`, `src/example.js` unchanged.

## Code Tour and App Map

(Completed after final review)

