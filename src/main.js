// ContextPack — Client core: state, validation, fetch, render

import { initCopy } from "./copy.js";
import { DEMO_INPUT } from "./example.js";

const SECTIONS = [
  { id: "goal", label: "Goal", key: "goal", type: "text", emptyText: "No goal identified." },
  { id: "currentState", label: "Current State", key: "currentState", type: "list", emptyText: "No current state found." },
  { id: "keyDecisions", label: "Key Decisions", key: "keyDecisions", type: "list", emptyText: "No key decisions found." },
  { id: "constraints", label: "Constraints", key: "constraints", type: "list", emptyText: "No clear constraints found." },
  { id: "openQuestions", label: "Open Questions", key: "openQuestions", type: "list", emptyText: "No open questions found.", cssClass: "open" },
  { id: "missingContext", label: "Missing Context", key: "missingContext", type: "list", emptyText: "No critical missing context detected.", cssClass: "missing" },
  { id: "nextActions", label: "Next Actions", key: "nextActions", type: "ordered", emptyText: "No next actions generated." },
];

const MIN_CONTEXT_LENGTH = 50;
const MAX_CONTEXT_LENGTH = 12000;
const MIN_KEY_LENGTH = 10;

let state = {
  baseURL: "",
  apiKey: "",
  models: [],
  selectedModel: "",
  reasoningEffort: "auto",
  context: "",
  status: "idle",
  error: null,
  pack: null,
};

const elements = {};

function initElements() {
  elements.baseURL = document.getElementById("base-url");
  elements.apiKey = document.getElementById("api-key");
  elements.modelSelect = document.getElementById("model-select");
  elements.addModelBtn = document.getElementById("add-model-btn");
  elements.addModelInline = document.getElementById("add-model-inline");
  elements.newModelInput = document.getElementById("new-model-input");
  elements.confirmAddModelBtn = document.getElementById("confirm-add-model-btn");
  elements.cancelAddModelBtn = document.getElementById("cancel-add-model-btn");
  elements.thinkingSelect = document.getElementById("thinking-select");
  elements.contextInput = document.getElementById("context-input");
  elements.charCount = document.getElementById("char-count");
  elements.generateBtn = document.getElementById("generate-btn");
  elements.tryExampleBtn = document.getElementById("try-example-btn");
  elements.statusMessage = document.getElementById("status-message");
  elements.errorMessage = document.getElementById("error-message");
  elements.resultBlock = document.getElementById("result-block");
  elements.sectionsContainer = document.getElementById("sections");
  elements.toast = document.getElementById("toast");
}

function validateBaseURL(raw) {
  const value = (raw || "").trim();
  if (!value) {
    showError("Enter a valid API endpoint.");
    return null;
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    showError("Enter a valid API endpoint.");
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    showError("Enter a valid API endpoint.");
    return null;
  }
  return value;
}

function validateInput() {
  clearError();

  const baseURL = validateBaseURL(elements.baseURL.value);
  if (!baseURL) return false;
  state.baseURL = baseURL;

  const apiKey = elements.apiKey.value.trim();
  if (!apiKey) {
    showError("Enter your API key.");
    return false;
  }
  if (apiKey.length < MIN_KEY_LENGTH) {
    showError("That API key doesn't look right. Check it and try again.");
    return false;
  }

  if (!state.selectedModel) {
    showError("Select a model.");
    return false;
  }

  const context = elements.contextInput.value;
  const contextLength = context.length;

  if (!context.trim()) {
    showError("Paste some project context first.");
    return false;
  }
  if (contextLength < MIN_CONTEXT_LENGTH) {
    showError("Add a little more project context so ContextPack has something meaningful to analyze.");
    return false;
  }
  if (contextLength > MAX_CONTEXT_LENGTH) {
    showError("This POC supports up to 12,000 characters at a time. Shorten the context and try again.");
    return false;
  }

  return true;
}

function renderModelSelect() {
  elements.modelSelect.innerHTML = "";
  if (state.models.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.disabled = true;
    opt.selected = true;
    opt.textContent = "Add a model first";
    elements.modelSelect.appendChild(opt);
    state.selectedModel = "";
    return;
  }
  for (const id of state.models) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = id;
    if (id === state.selectedModel) opt.selected = true;
    elements.modelSelect.appendChild(opt);
  }
}

function handleConfirmAddModel() {
  const raw = elements.newModelInput.value.trim();
  if (!raw) {
    showError("Enter a valid model ID.");
    return;
  }
  if (state.models.includes(raw)) {
    showError("That model is already added.");
    return;
  }
  clearError();
  state.models.push(raw);
  state.selectedModel = raw;
  renderModelSelect();
  elements.addModelInline.hidden = true;
  elements.newModelInput.value = "";
  elements.addModelBtn.focus();
}

function handleCancelAddModel() {
  elements.addModelInline.hidden = true;
  elements.newModelInput.value = "";
  clearError();
  elements.addModelBtn.focus();
}

function updateCharCount() {
  const length = elements.contextInput.value.length;
  elements.charCount.textContent = `${length.toLocaleString()} / ${MAX_CONTEXT_LENGTH.toLocaleString()}`;
  elements.charCount.classList.remove("warning", "error");
  if (length > MAX_CONTEXT_LENGTH * 0.9) {
    elements.charCount.classList.add("warning");
  }
  if (length > MAX_CONTEXT_LENGTH) {
    elements.charCount.classList.add("error");
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    state.status = "loading";
  }

  elements.generateBtn.disabled = isLoading;
  elements.generateBtn.textContent = isLoading
    ? "Analyzing context..."
    : "Generate ContextPack";

  elements.tryExampleBtn.disabled = isLoading;

  elements.statusMessage.hidden = !isLoading;
  elements.statusMessage.textContent = isLoading
    ? "Separating decisions, unresolved questions, and missing context..."
    : "";
}

function showError(message) {
  elements.errorMessage.hidden = false;
  elements.errorMessage.textContent = message;
  state.status = "error";
  state.error = message;
}

function clearError() {
  elements.errorMessage.hidden = true;
  elements.errorMessage.textContent = "";
  state.error = null;
}

function buildSectionCard(section, value) {
  const card = document.createElement("div");
  card.className = `section-card ${section.cssClass || "known"}`;
  card.dataset.section = section.id;

  const label = document.createElement("div");
  label.className = "section-label";
  label.textContent = section.label;
  card.appendChild(label);

  const content = document.createElement("div");
  content.className = "section-content";

  if (section.type === "text") {
    if (value && value.trim()) {
      content.textContent = value.trim();
    } else {
      content.innerHTML = `<span class="empty">${section.emptyText}</span>`;
    }
  } else if (section.type === "list") {
    if (value && Array.isArray(value) && value.length > 0) {
      const ul = document.createElement("ul");
      for (const item of value) {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      }
      content.appendChild(ul);
    } else {
      content.innerHTML = `<span class="empty">${section.emptyText}</span>`;
    }
  } else if (section.type === "ordered") {
    if (value && Array.isArray(value) && value.length > 0) {
      const ol = document.createElement("ol");
      for (const item of value) {
        const li = document.createElement("li");
        li.textContent = item;
        ol.appendChild(li);
      }
      content.appendChild(ol);
    } else {
      content.innerHTML = `<span class="empty">${section.emptyText}</span>`;
    }
  }

  card.appendChild(content);
  return card;
}

function renderResult(pack) {
  elements.sectionsContainer.innerHTML = "";
  for (const section of SECTIONS) {
    const value = pack[section.key];
    const card = buildSectionCard(section, value);
    elements.sectionsContainer.appendChild(card);
  }
  elements.resultBlock.hidden = false;
  elements.resultBlock.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleGenerate() {
  if (!validateInput()) return;

  const baseURL = state.baseURL;
  const apiKey = elements.apiKey.value.trim();
  const model = state.selectedModel;
  const reasoningEffort = state.reasoningEffort;
  const context = elements.contextInput.value;

  setLoading(true);
  clearError();

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseURL, apiKey, model, reasoningEffort, context }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("We couldn't generate your ContextPack. Your notes are safe — try again.");
    }

    if (!response.ok) {
      throw new Error(data.error?.message || "Generation failed.");
    }

    if (!data.pack) {
      throw new Error("Invalid response from server.");
    }

    const requiredKeys = ["goal", "currentState", "keyDecisions", "constraints", "openQuestions", "missingContext", "nextActions"];
    for (const key of requiredKeys) {
      if (!(key in data.pack)) {
        throw new Error("Incomplete response from server.");
      }
    }

    state.pack = data.pack;
    state.status = "success";
    renderResult(data.pack);
  } catch (err) {
    state.status = "error";
    state.error = err.message;
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

function handleTryExample() {
  elements.contextInput.value = DEMO_INPUT;
  updateCharCount();
  clearError();
  elements.contextInput.focus();
}

function init() {
  initElements();

  elements.contextInput.addEventListener("input", updateCharCount);
  updateCharCount();

  elements.generateBtn.addEventListener("click", handleGenerate);
  elements.tryExampleBtn.addEventListener("click", handleTryExample);

  elements.apiKey.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault();
  });

  renderModelSelect();

  elements.modelSelect.addEventListener("change", () => {
    state.selectedModel = elements.modelSelect.value;
    clearError();
  });

  elements.addModelBtn.addEventListener("click", () => {
    elements.addModelInline.hidden = false;
    elements.newModelInput.value = "";
    elements.newModelInput.focus();
  });

  elements.confirmAddModelBtn.addEventListener("click", handleConfirmAddModel);
  elements.newModelInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirmAddModel();
    }
    if (e.key === "Escape") handleCancelAddModel();
  });
  elements.cancelAddModelBtn.addEventListener("click", handleCancelAddModel);

  elements.thinkingSelect.addEventListener("change", () => {
    state.reasoningEffort = elements.thinkingSelect.value;
  });

  initCopy(() => state.pack);

  elements.baseURL.focus();
}

document.addEventListener("DOMContentLoaded", init);
