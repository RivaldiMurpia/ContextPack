// ContextPack — Copy logic: Markdown builders, clipboard, toast

const AI_INSTRUCTION_HEADER = `You are continuing an existing project.

Use the ContextPack below as the current source of truth.
Treat Key Decisions as confirmed unless the context explicitly says otherwise.
Do not assume answers for items marked Open Questions or Missing Context.
If missing information blocks progress, ask for clarification.
Continue from the listed Next Actions.
`;

const SECTION_ORDER = [
  { key: "goal", label: "Goal", type: "text" },
  { key: "currentState", label: "Current State", type: "list" },
  { key: "keyDecisions", label: "Key Decisions", type: "list" },
  { key: "constraints", label: "Constraints", type: "list" },
  { key: "openQuestions", label: "Open Questions", type: "list" },
  { key: "missingContext", label: "Missing Context", type: "list" },
  { key: "nextActions", label: "Next Actions", type: "ordered" },
];

function formatSection(section, value) {
  if (section.type === "text") {
    return value && value.trim() ? value.trim() : "";
  }
  if (section.type === "list") {
    if (value && Array.isArray(value) && value.length > 0) {
      return value.map((v) => `- ${v}`).join("\n");
    }
    return "";
  }
  if (section.type === "ordered") {
    if (value && Array.isArray(value) && value.length > 0) {
      return value.map((v, i) => `${i + 1}. ${v}`).join("\n");
    }
    return "";
  }
  return "";
}

export function buildMarkdown(pack) {
  const lines = ["# ContextPack", ""];
  for (const section of SECTION_ORDER) {
    const value = pack[section.key];
    const formatted = formatSection(section, value);
    lines.push(`## ${section.label}`);
    lines.push("");
    if (formatted) {
      lines.push(formatted);
    } else {
      // Empty section: use the explicit empty text from the PRD
      const emptyTexts = {
        goal: "No goal identified.",
        currentState: "No current state found.",
        keyDecisions: "No key decisions found.",
        constraints: "No clear constraints found.",
        openQuestions: "No open questions found.",
        missingContext: "No critical missing context detected.",
        nextActions: "No next actions generated.",
      };
      lines.push(`_${emptyTexts[section.key] || "None."}_`);
    }
    lines.push("");
  }
  return lines.join("\n").trim() + "\n";
}

export function buildAiMarkdown(pack) {
  return `${AI_INSTRUCTION_HEADER}\n\n${buildMarkdown(pack)}`;
}

async function copyWithFeedback(button, text, successMessage) {
  const originalText = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
    button.disabled = true;
    showToast(successMessage);
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1500);
  } catch (err) {
    showToast("Copy failed. Please select and copy manually.");
    console.error("Clipboard error:", err);
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => { toast.hidden = true; }, 200);
  }, 2000);
}

export function initCopy(packGetter) {
  const copyHandoffBtn = document.getElementById("copy-handoff-btn");
  const copyAiBtn = document.getElementById("copy-ai-btn");

  if (copyHandoffBtn) {
    copyHandoffBtn.addEventListener("click", () => {
      const pack = packGetter();
      if (!pack) return;
      const markdown = buildMarkdown(pack);
      copyWithFeedback(copyHandoffBtn, markdown, "Handoff copied");
    });
  }

  if (copyAiBtn) {
    copyAiBtn.addEventListener("click", () => {
      const pack = packGetter();
      if (!pack) return;
      const markdown = buildAiMarkdown(pack);
      copyWithFeedback(copyAiBtn, markdown, "AI handoff copied");
    });
  }
}
