---
doc: prd
status: approved
---

# ContextPack — Product Requirements

One line: ContextPack is a single-page AI tool for solo AI-assisted developers and indie founders that turns messy project notes into a structured handoff distinguishing what is known, unresolved, and missing — so another human or AI agent can continue immediately.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It Is For`, `scope.md > The Core Loop`, `scope.md > The POC Boundary`.

## The Core Journey

1. User opens ContextPack and sees the header (name, tagline, supporting sentence) and one large text area with a "Try example" secondary action.
2. User pastes messy project notes or clicks "Try example" to fill the predefined demo example.
3. User clicks "Generate ContextPack".
4. Button becomes disabled with label "Analyzing context..."; spinner and status message ("Separating decisions, unresolved questions, and missing context...") appear; input remains visible and intact.
5. Structured handoff with seven fixed sections appears below the input; page gently scrolls to the result.
6. User reviews the result, especially Open Questions and Missing Context.
7. User clicks "Copy Handoff" (clean Markdown) or "Copy for AI" (Markdown with instruction header).
8. Toast confirms copy ("Handoff copied" / "AI handoff copied"); button label temporarily shows "Copied" for 1-2 seconds.
9. User pastes the handoff into the next AI agent or shares it with a teammate, which can immediately continue from the listed Next Actions.

## Screens and Layout

Single page, single surface. No navigation, sidebar, dashboard, account UI, or project list.

- **Header:** ContextPack logo/name, tagline ("Turn messy project context into a handoff anyone can continue."), supporting sentence ("Paste scattered notes, decisions, TODOs, and questions. ContextPack will organize what is known, unresolved, missing, and next.").
- **Input block:** one large multiline text area with placeholder showing short messy example; character counter near the text area; primary button "Generate ContextPack"; small secondary action "Try example" that fills the input with a predefined demo example.
- **Result block:** appears below the input after successful generation. Heading near top with "Copy Handoff" (primary) and "Copy for AI" (secondary) actions aligned nearby. Seven sections in fixed order: 1. Goal, 2. Current State, 3. Key Decisions, 4. Constraints, 5. Open Questions, 6. Missing Context, 7. Next Actions. Each section renders even when empty, with explicit text like "No clear constraints found." or "No critical missing context detected."

## Look and Feel

Clean, focused, utility-first, slightly technical — a trustworthy workspace for important project context, not a marketing website. Reference: "a focused developer tool crossed with a clean document editor."

- Color: light neutral slightly off-white background; dark charcoal/slate text; one restrained cool accent (indigo or blue) for primary actions and focus states. Subtle semantic colors: known info neutral/subtle positive; open questions muted amber; missing context slightly stronger amber/orange (distinctive but not alarming). No gradients, neon, or excessive color coding.
- Typography: clean modern sans-serif; hierarchy through size/weight; slightly technical compact section labels; handoff content prioritizes readability.
- Layout: generous whitespace; centered column with comfortable max width; large input as main starting surface; consistent cards or clearly separated blocks for output; subtle borders, moderate radius.
- Output hierarchy: Goal prominent; known info calm/stable; Open Questions communicates uncertainty; Missing Context most visually distinctive (warning-style icon or stronger treatment, not alarming); Next Actions last, scannable and actionable.
- Interaction: subtle transitions only; responsive deliberate buttons; calm informative loading; lightweight unobtrusive copy confirmation; no unnecessary animations.
- Copy tone: short, precise, direct. No hype, emojis, or playful copy.
- Explicitly avoid: dashboard sidebars, glassmorphism, heavy shadows, large gradients, overly rounded pills, decorative illustrations, chatbot message bubbles, futuristic AI aesthetics, too many icons, marketing sections (testimonials, pricing, feature grids, hero artwork).

## Features and Behavior

### Input and generation

- One large multiline text area accepts pasted messy project context.
- Placeholder shows a short messy example (e.g. "landing page done / need auth / maybe supabase? / deploy friday...").
- "Try example" secondary action fills the input with a predefined demo example for easy testing and demonstration.
- Primary button "Generate ContextPack" sends raw context to AI and returns one structured handoff.
- One input → one generated handoff at a time. No multi-project workspace, saved history, or collection.

  - [ ] Paste notes, click Generate, structured handoff with all seven fixed sections appears below input
  - [ ] "Try example" fills input with predefined demo example
  - [ ] Generating a new handoff replaces the previous result only on success

### Structured output

- Output always uses seven fixed sections in fixed order: Goal, Current State, Key Decisions, Constraints, Open Questions, Missing Context, Next Actions. No custom templates or configurable structure.
- All seven sections appear together once the AI response is complete (no progressive streaming).
- Known vs unresolved vs missing distinction is the core behavior. Tentative language ("maybe Supabase") must not appear as a confirmed decision.
- Missing-context detection explicitly flags ambiguity or incomplete information (e.g. "deploy friday" missing exact date; missing deployment platform) rather than inventing an answer. Never invent content to fill a section.
- Each section renders even when empty, with explicit text such as "No clear constraints found." or "No critical missing context detected."

  - [ ] Seven sections appear together in fixed order after generation
  - [ ] Tentative items appear under Open Questions, not Key Decisions
  - [ ] Ambiguous/incomplete items appear under Missing Context with what is missing named
  - [ ] Empty sections show explicit "none found" text, never invented content

### Copy actions

- "Copy Handoff" (primary) copies the full structured result as clean Markdown with `# ContextPack` heading and `##` section headings, bullets for lists, numbered items for Next Actions.
- "Copy for AI" (secondary) copies the same Markdown preceded by a short instruction header: "You are continuing an existing project. Use the ContextPack below as the current source of truth. Treat Key Decisions as confirmed unless the context explicitly says otherwise. Do not assume answers for items marked Open Questions or Missing Context. If missing information blocks progress, ask for clarification. Continue from the listed Next Actions."
- Both actions copy the entire handoff. No per-section copy. No custom editing of the instruction header in the POC.
- On copy: small toast ("Handoff copied" / "AI handoff copied"), button label temporarily "Copied" for 1-2 seconds, then restored. On clipboard failure: small non-destructive error message, user can retry.

  - [ ] Copy Handoff produces clean full Markdown matching the rendered result
  - [ ] Copy for AI prepends the instruction header before the same Markdown
  - [ ] Toast + temporary "Copied" label confirm success; clipboard failure shows retryable error

## States and Boundaries

- **First use** — header, empty text area with placeholder example, Generate button, Try example link. No result block yet.
- **Empty input** — Generate disabled when input is empty or whitespace-only. If validation triggers anyway, show "Paste some project context first."
- **Tiny input** — non-empty but too short to be useful: do not call AI. Show lightweight message "Add a little more project context so ContextPack has something meaningful to analyze." Simple minimum character threshold.
- **Over-limit input** — client-side limit of 12,000 characters with visible counter. If exceeded: disable Generate, show "This POC supports up to 12,000 characters at a time. Shorten the context and try again." Never silently truncate.
- **Loading** — input remains visible with original text; Generate disabled, label "Analyzing context..."; spinner/subtle indicator plus status "Separating decisions, unresolved questions, and missing context..." No fake multi-step progress.
- **Success** — full structured handoff renders below input; page gently scrolls to result. New successful generation replaces previous result.
- **Generation failure** — original input preserved exactly; previous valid result (if any) kept. Inline error near Generate: "We couldn''t generate your ContextPack. Your notes are safe — try again." with "Try again" action. No raw API errors exposed.
- **Malformed AI response** — treated as generation failure; no partially broken ContextPack displayed. Response validated for expected structure before rendering. Message: "ContextPack couldn''t structure this response correctly. Please try again." No automatic retry.
- **Persistence** — none. Refresh resets input and output. No local storage, saved history, or server persistence. Failed attempts never lose pasted input.

## Product Decisions

- Single-page, one-input → one-handoff POC — prove the core transformation, not a workspace or project management system.
- Core distinction is known vs unresolved vs missing — what makes ContextPack more useful than a normal summarizer.
- Seven fixed sections, fixed order — predictable for humans and AI agents, keeps POC small.
- All sections appear together, not streamed — the complete transformation (especially Open Questions + Missing Context reveal) is the demo moment.
- Never invent missing information — trustworthiness over complete-looking output; unknown stays unresolved or missing.
- Copy actions operate on whole handoff — product is about transferring complete context; per-section copy adds unneeded complexity.
- Two copy modes (clean Markdown / Markdown + instruction header) — cover the two destinations (human/workspace, AI agent) without integrations.
- No persistence across refresh — saved projects, accounts, history, storage are outside the core experiment.
- Explicit validation + character limit, no silent truncation — silently removing context could make the handoff unreliable.
- UI feels like focused developer utility / clean document editor, not chatbot or marketing site — the structured handoff is the visual focus.

## What We''re Building

- Single-page app: header, large text area with placeholder + counter, Generate button, Try example action.
- AI generation producing seven fixed structured sections with known/unresolved/missing distinction and explicit missing-context detection.
- Result rendering with visual hierarchy (Goal prominent, Missing Context most distinctive, Next Actions last and actionable); empty sections show explicit "none found" text.
- Copy Handoff (Markdown) and Copy for AI (header + Markdown) with toast confirmation and clipboard-failure handling.
- Loading, empty, tiny-input, over-limit, failure, and malformed-response states as defined above; input never lost on failure; no persistence.
- Look and feel per above: light neutral, charcoal text, single cool accent, subtle amber semantics, clean sans-serif, centered column, generous whitespace, subtle transitions.

## Deferred From the POC

Per `scope.md > The POC Boundary`: saving multiple ContextPacks, project history, editing individual sections, file upload, automatic chat-transcript import, GitHub/Slack/Notion/Google Drive integrations, PDF/other exports, custom templates, per-role handoff modes, share links, team collaboration, auto-sync, auth/accounts, comparing context versions — all implied by a mature product but out of this proof of concept. Why: they do not prove the kernel.

## Possible Later Enhancements

Covered by the deferred list above; revisit only after the core transformation is proven and demoed.

## Non-Goals

Per `scope.md > CUT`: full project management (task boards, Kanban), chat application, autonomous coding agent/execution, general-purpose summarization, knowledge base/RAG, vector database (unless technically necessary), multi-agent orchestration, real-time collaboration. Plus: per-section copy, editable AI header, progressive section streaming, silent truncation, persistence, marketing/dashboard/chrome.

## Open Questions

None blocking. Technical decisions intentionally deferred to `4-spec`: AI provider/model, structured-response enforcement and validation, application framework and API architecture, deployment approach.
