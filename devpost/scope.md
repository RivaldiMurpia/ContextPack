---
doc: scope
status: approved
---

# ContextPack

One line: an AI tool that turns messy project notes into a structured handoff distinguishing what is known, unresolved, and missing — so another human or AI agent can continue immediately.

## The Unique Kernel

ContextPack does not just summarize project notes — it separates what is known, what is unresolved, and what critical context is missing, then turns that into a handoff someone else can actually continue from. What the user remembers: "It doesn't just tell me what happened. It tells me what the next person or AI still needs to know."

## Who It's For

A solo AI-assisted developer or indie founder building a small software product. They spend their day moving between tools like ChatGPT, Codex, GitHub, notes, and sometimes messages with collaborators. They often work in short sessions, so when they come back later or switch to another AI agent, the project context is fragmented. Today they solve this by manually re-explaining the project — what they are building, what is done, which decisions were made, what is unclear, and what should happen next. Sometimes they paste a huge block of notes into the next AI and hope it figures things out. This wastes time, loses decisions, and lets tentative ideas pass as final ones.

## The Core Loop

Open ContextPack → paste messy project context → click Generate → see structured handoff with GOAL, CURRENT STATE, KEY DECISIONS, CONSTRAINTS, OPEN QUESTIONS, MISSING CONTEXT, NEXT ACTIONS → copy as Markdown or AI-ready prompt → paste into next AI agent or share with a teammate. They come back when they hit the next context-switch moment.

## Inspiration & Identity

Clean, focused, utility-first. No dashboard, no chrome — just the transformation. The emotional beat: "I pasted a messy brain dump, and it understood not only what I said, but also what the next person still needs to know." Tone: confident, precise, trustworthy. No marketing fluff.

## Why This Matters to the Learner

Proving the plan-first workflow: turning a rough product idea into a clear scope, PRD, and technical spec that an agent can build from — and finishing with a working POC that demonstrates the core handoff transformation end-to-end.

## What "Working" Looks Like

User opens the page, pastes the example messy notes, clicks Generate, and sees the structured handoff appear with MISSING CONTEXT and OPEN QUESTIONS sections that correctly flag "maybe supabase?" as undecided, "deploy friday" as incomplete (no exact date), and missing deployment platform. They copy the result and paste it into another AI agent, which immediately understands the project state and continues from the listed next actions. That transformation, working reliably on a few realistic examples, proves the concept.

## The POC Boundary

### IN — must work for the demo

1. One large text input — user pastes messy project context into a single text area.
2. Generate ContextPack — single action sends raw context to AI and returns structured handoff.
3. Structured output with fixed sections: Goal, Current State, Key Decisions, Constraints, Open Questions, Missing Context, Next Actions.
4. Known vs unresolved vs missing distinction — core behavior; avoids treating tentative language ("maybe Supabase") as confirmed decision.
5. Missing-context detection — output explicitly flags important ambiguity or incomplete information rather than inventing an answer.
6. Copy Handoff — user copies structured result as Markdown.
7. Copy for AI — user copies AI-ready version with short instruction header for pasting into another AI agent.
8. Simple polished UI — input-to-output transformation easy to understand in a demo without explanation.
9. One input → one generated handoff at a time — no multi-project workspace, saved history, or collection of ContextPacks.

### LATER — useful, but not needed to prove the idea

- Saving multiple ContextPacks
- Project history
- Editing individual sections
- File upload
- Importing chat transcripts automatically
- GitHub / Slack / Notion / Google Drive integrations
- Export to PDF or other formats
- Custom handoff templates
- Different handoff modes for developer, designer, PM, etc.
- Sharing ContextPacks by link
- Team collaboration
- Automatic context syncing
- Authentication and user accounts
- Comparing two versions of project context

### CUT — intentionally not part of this product for the hackathon

- Full project management features (task boards, Kanban)
- Chat application
- Autonomous coding agent / project execution
- General-purpose document summarization
- Knowledge base / RAG system
- Vector database unless technically necessary for the tiny POC
- Multi-agent orchestration
- Real-time collaboration

Reason: prove one thing clearly — can AI take messy project context and produce a trustworthy handoff that distinguishes known, unresolved, and missing information? If that works, the concept is proven. Everything else comes later.
