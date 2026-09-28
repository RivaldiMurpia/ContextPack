---
doc: checklist
status: draft
---

# ContextPack — Build Checklist

Build mode: learn (guided, one step at a time, verify + commit each slice)

## Slices

- [x] **1. Project init** — `package.json`, Vite config, basic `index.html` skeleton with header, API key field, textarea, buttons, result containers, toast region. No logic yet.
- [ ] **2. Client styles** — `src/styles.css` implementing PRD Look and Feel: off-white background, charcoal text, indigo accent, amber semantics for Open Questions / Missing Context, system sans, centered column ~720-800px, generous whitespace, moderate card radius, subtle borders.
- [ ] **3. Client core** — `src/main.js` state machine (idle/loading/success/error), validation (key non-empty + plausible length, context min/max 12k chars + counter), same-origin `POST /api/generate` fetch, loading UI (button label, spinner, status text), render seven fixed sections with explicit "none found" text, gentle scroll to result, keep input on failure, keep previous result unless new success.
- [ ] **4. Copy logic** — `src/copy.js` builds clean Markdown and AI-header Markdown from rendered data, `navigator.clipboard.writeText` with fallback, toast + temporary "Copied" label (1-2s), error handling.
- [ ] **5. Example data** — `src/example.js` exports the predefined demo input text for "Try example" button.
- [ ] **6. Server prompt** — `api/prompt.js` exports the system instructions: extraction/classification rules (never invent, tentative ≠ decided, missing → missing), output seven fixed fields.
- [ ] **7. Server schema** — `api/schema.js` exports Zod schema for the seven-field object and the strict JSON Schema for OpenAI Responses API Structured Outputs.
- [ ] **8. Server function** — `api/generate.js` Vercel Node function: validates input, calls OpenAI Responses API with caller key + `DEFAULT_MODEL = "gpt-5.6-luna"`, Structured Outputs strict JSON Schema, Zod validates final object, returns `{ pack }` or safe error codes. Never logs key/body. Maps 401→friendly auth error, 429→rate limited, 404/model→model unavailable, Zod fail→bad model output.
- [ ] **9. Integration + verify (vercel dev)** — run `vercel dev` (or equivalent local Vercel workflow), open the dev URL, enter a valid OpenAI API key, click Try example, click Generate, verify all seven sections render correctly with Missing Context populated, click Copy Handoff and Copy for AI, verify toast + clipboard. Full same-origin flow tested end-to-end.

## Git

Each slice committed after mechanical verification. `.gitignore` already excludes `devpost/learner-profile.md`, `.env`, `.env.*` (allows `.env.example`). No secrets staged.

## Final Review

- [ ] All acceptance criteria from PRD satisfied
- [ ] All failure modes from spec handled
- [ ] Code tour and app map complete

## Revisions

(Record any agreed changes here)

## Code Tour and App Map

(Completed after final review)

