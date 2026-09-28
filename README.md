# ContextPack

> Turn scattered project context into a handoff anyone — human or AI — can continue from.

ContextPack turns messy project notes, chat fragments, TODOs, tentative decisions, and unresolved questions into a structured project handoff.

Instead of only summarizing what happened, ContextPack separates what is **known**, **unresolved**, **missing**, and **what should happen next**.

---

## ✨ What ContextPack Generates

Every input is transformed into seven sections:

1. **Goal**
2. **Current State**
3. **Key Decisions**
4. **Constraints**
5. **Open Questions**
6. **Missing Context**
7. **Next Actions**

The core idea:

> **ContextPack doesn’t just tell you what happened. It tells the next human or AI what they still need to know.**

---

## 🤔 Why ContextPack?

AI-assisted projects quickly become scattered across:

- ChatGPT conversations
- coding agents
- GitHub
- notes
- TODO lists
- team discussions
- half-finished decisions

A normal summary can tell you what was discussed, but it often fails to distinguish between:

- something that was actually decided
- something that is only being considered
- something that is still unresolved
- information that is genuinely missing

ContextPack is designed specifically around that distinction.

---

## 🧪 Example

### Input

```text
landing page done
need auth
maybe supabase?
mobile first
deploy friday
payment later
use openai for generation
john still checking pricing
need to fix onboarding copy
```

### ContextPack interprets this conservatively

For example:

- `maybe supabase?` remains an **Open Question**, not a Key Decision
- `john still checking pricing` remains a separate pricing issue and is not automatically connected to Supabase
- `deploy friday` can reveal that the exact calendar date is still missing
- `payment later` is not silently rewritten into a more specific phase such as `post-launch`
- confirmed decisions remain separate from assumptions and missing information

The result is a handoff that another human or AI can continue from without inventing context.

---

## 🚀 Features

- Provider-agnostic BYOK
- User-provided OpenAI-compatible API endpoint
- Manual model ID selection
- Configurable Thinking / Reasoning level
- Strict structured output with JSON Schema
- Zod validation
- Seven-section project handoff
- Copy Handoff as Markdown
- Copy for AI with continuation instructions
- Conservative source grounding
- Missing-context detection
- No accounts
- No database
- No saved API credentials
- No local persistence

---

## 🧠 Source Grounding

ContextPack is intentionally conservative.

It follows several grounding rules:

### Source Grounding

Generated statements should be traceable to the supplied project notes.

Separate notes are not automatically connected unless the relationship is explicitly stated or clearly supported.

### Conservative Inference

When multiple interpretations are possible, ContextPack prefers the narrower interpretation supported by the source.

### Open Questions vs Missing Context

An issue should not appear in both sections unless the meanings are genuinely different.

If something is explicitly undecided, tentative, deferred, or awaiting input, it belongs primarily in **Open Questions**.

**Missing Context** is reserved for important information that is absent or incomplete.

### Time / Sequence Grounding

Vague timing is not silently converted into a more specific milestone.

For example:

```text
payment later
```

should not automatically become:

```text
payment after launch
```

unless the original notes actually support that conclusion.

---

## 🔄 How It Works

```text
Messy Project Context
        │
        ▼
OpenAI-Compatible
Chat Completions API
        │
        ▼
Structured JSON Schema Output
        │
        ▼
Zod Validation
        │
        ▼
ContextPack
        │
        ▼
Goal
Current State
Key Decisions
Constraints
Open Questions
Missing Context
Next Actions
```

---

## 🔌 Bring Your Own Provider

ContextPack does not hardcode a specific AI provider or model.

You provide:

- **API Endpoint**
- **API Key**
- **Model ID**
- **Thinking level**

Example endpoint:

```text
https://api.example.com/v1
```

Example model ID:

```text
cx/gpt-5.6-luna(xhigh)
```

ContextPack uses an **OpenAI-compatible Chat Completions API**.

The model list starts empty. Users manually add the exact model ID they want to use.

---

## 💭 Thinking / Reasoning

Available options:

- Auto
- None
- Minimal
- Low
- Medium
- High
- XHigh
- Max
- Ultra

When **Auto** is selected, ContextPack does not send a `reasoning_effort` parameter.

For other selections, the chosen value is passed to the provider.

Provider compatibility may vary.

ContextPack does not silently fall back to another reasoning level.

---

## 🛠 Tech Stack

- **Vite**
- **Vanilla HTML**
- **Vanilla CSS**
- **Vanilla JavaScript**
- **Vercel Serverless Functions**
- **OpenAI JavaScript SDK**
- **OpenAI-compatible Chat Completions API**
- **JSON Schema Structured Output**
- **Zod**

---

## 📦 Run Locally

Clone the repository:

```bash
git clone https://github.com/RivaldiMurpia/ContextPack.git
cd ContextPack
```

Install dependencies:

```bash
npm install
```

Run using Vercel Dev so the `/api/generate` serverless route is available:

```bash
npx vercel dev
```

Open the local URL shown in the terminal.

---

## ▶️ Using ContextPack

1. Enter an OpenAI-compatible **API Endpoint**
2. Enter your **API Key**
3. Click **+ Add model**
4. Enter an exact model ID
5. Choose a **Thinking** level or leave it on **Auto**
6. Paste project context or click **Try example**
7. Click **Generate ContextPack**
8. Review all seven sections
9. Use **Copy Handoff** or **Copy for AI**

---

## 🖥 Local AI Gateways

During local development, ContextPack can connect to localhost-based OpenAI-compatible gateways.

For example:

```text
http://127.0.0.1:20128/v1
```

Localhost endpoints are allowed during development.

A publicly deployed Vercel application cannot access a user's local `127.0.0.1` service.

For production use, the selected provider endpoint must be publicly reachable over HTTPS.

---

## 🔐 Privacy

ContextPack keeps connection and project state transient.

It does not intentionally persist:

- API endpoints
- API keys
- model selections
- Thinking selections
- project context
- generated handoffs

There is no:

- account system
- database
- history
- `localStorage` persistence

Refreshing the page resets the current session state.

---

## 🛡 Endpoint Safety

Production endpoints are restricted to public HTTPS URLs.

ContextPack rejects unsafe endpoint patterns such as:

- localhost
- loopback addresses
- private network addresses
- link-local addresses
- embedded URL credentials

Localhost HTTP endpoints remain available during local development for compatible local gateways.

---

## ⚠️ Provider Compatibility

Not every OpenAI-compatible provider supports every feature.

A provider or model may reject:

- `reasoning_effort`
- strict JSON Schema structured output
- a particular model ID

ContextPack returns a friendly compatibility error instead of silently changing the request.

---

## 🎯 Project Scope

ContextPack is intentionally a focused proof of concept.

### Included

- one-page workflow
- one project-context input
- one generated handoff
- seven fixed output sections
- BYOK provider configuration
- model selection
- Thinking selection
- Markdown copy
- AI continuation copy

### Not Included

- accounts
- project history
- database storage
- collaboration
- OAuth
- automatic model discovery
- provider routing
- automatic fallback
- pricing metadata
- model capability detection
- dashboards
- integrations

The goal is to demonstrate one workflow well:

> **messy project context → trustworthy handoff**

---

## 🧩 Project Structure

```text
ContextPack/
├── api/
│   ├── generate.js
│   ├── prompt.js
│   └── schema.js
│
├── devpost/
│   ├── app-map.html
│   ├── checklist.md
│   ├── prd.md
│   └── spec.md
│
├── src/
│   ├── copy.js
│   ├── example.js
│   ├── main.js
│   └── styles.css
│
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🏗 Build

Production build:

```bash
npm run build
```

The production output is generated in:

```text
dist/
```

---

## 📋 Demo Flow

The core demo is intentionally simple:

```text
Add endpoint + API key + model
            ↓
       Try Example
            ↓
         Generate
            ↓
     Seven Sections
            ↓
Open Questions + Missing Context
            ↓
       Copy for AI
```

The key moment is the **Missing Context** reveal: ContextPack surfaces information the next human or AI would otherwise have to guess.

---

## 🏆 Built For

**Build With AI: Basics**

ContextPack was created as a focused AI-assisted project handoff proof of concept.

---

## 📄 Repository

GitHub:

https://github.com/RivaldiMurpia/ContextPack
