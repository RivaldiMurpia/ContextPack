// ContextPack — Vercel Node serverless function: POST /api/generate
// Provider-agnostic BYOK over OpenAI-compatible Chat Completions.
// Never logs endpoint, API key, or request body.

import OpenAI from "openai";
import { ContextPackSchema, RESPONSE_JSON_SCHEMA } from "./schema.js";
import { SYSTEM_PROMPT } from "./prompt.js";

const MIN_CONTEXT_LENGTH = 50;
const MAX_CONTEXT_LENGTH = 12000;

const ERROR_MAP = {
  INVALID_CONNECTION: "Enter a valid API endpoint.",
  INVALID_API_KEY: "That API key couldn''t be authenticated by the provider. Check the key and try again.",
  INVALID_MODEL: "Select a model.",
  INVALID_INPUT: "Add a little more project context so ContextPack has something meaningful to analyze.",
  RATE_OR_QUOTA_LIMIT: "Your provider account is currently rate-limited or has reached a usage limit. Check your account and try again.",
  MODEL_UNAVAILABLE: "The selected model or endpoint wasn''t found. Check the endpoint and model ID and try again.",
  REASONING_UNSUPPORTED: "The selected thinking level isn''t supported by this model or endpoint. Try a different level or leave Thinking on Auto.",
  STRUCTURED_OUTPUT_UNSUPPORTED: "This model or endpoint doesn''t support the required structured output format. Try a different model.",
  BAD_MODEL_OUTPUT: "ContextPack couldn''t structure this response correctly. Please try again.",
  GENERATION_FAILED: "We couldn''t generate your ContextPack. Your notes are safe — try again.",
};

function safeError(res, status, code, message) {
  res.status(status).json({
    error: { code, message: message || ERROR_MAP[code] || ERROR_MAP.GENERATION_FAILED },
  });
}

function isLoopback(hostname) {
  const h = (hostname || "").toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".localhost");
}

function isPrivateIPv4(hostname) {
  const m = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function validateBaseURL(raw) {
  const value = (raw || "").trim();
  if (!value) return { ok: false };
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { ok: false };
  if (parsed.username || parsed.password) return { ok: false };

  const isDev = process.env.VERCEL_ENV !== "production";
  if (!isDev) {
    if (parsed.protocol !== "https:") return { ok: false };
    if (isLoopback(parsed.hostname)) return { ok: false };
    if (isPrivateIPv4(parsed.hostname)) return { ok: false };
  } else {
    if (isPrivateIPv4(parsed.hostname) && !isLoopback(parsed.hostname)) {
      return { ok: false };
    }
  }
  return { ok: true, value };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } });
    return;
  }

  const { baseURL, apiKey, model, reasoningEffort, context } = req.body || {};

  const urlCheck = validateBaseURL(baseURL);
  if (!urlCheck.ok) {
    safeError(res, 400, "INVALID_CONNECTION");
    return;
  }

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
    safeError(res, 400, "INVALID_API_KEY");
    return;
  }

  if (!model || typeof model !== "string" || !model.trim()) {
    safeError(res, 400, "INVALID_MODEL", "Select a model.");
    return;
  }

  if (!context || typeof context !== "string" || context.trim().length < MIN_CONTEXT_LENGTH) {
    safeError(res, 400, "INVALID_INPUT");
    return;
  }

  if (context.length > MAX_CONTEXT_LENGTH) {
    safeError(res, 400, "INVALID_INPUT", "This POC supports up to 12,000 characters at a time. Shorten the context and try again.");
    return;
  }

  const openai = new OpenAI({ apiKey: apiKey.trim(), baseURL: urlCheck.value });

  const requestBody = {
    model: model.trim(),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: context },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "context_pack", strict: true, schema: RESPONSE_JSON_SCHEMA },
    },
  };

  const effort = (reasoningEffort || "auto").toLowerCase();
  if (effort !== "auto") {
    requestBody.reasoning_effort = effort;
  }

  try {
    const completion = await openai.chat.completions.create(requestBody);
    const content = completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content;

    if (!content) {
      safeError(res, 500, "BAD_MODEL_OUTPUT");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      safeError(res, 500, "BAD_MODEL_OUTPUT");
      return;
    }

    const result = ContextPackSchema.safeParse(parsed);
    if (!result.success) {
      safeError(res, 500, "BAD_MODEL_OUTPUT");
      return;
    }

    res.status(200).json({ pack: result.data });
  } catch (err) {
  // Never log the raw provider error because it may contain request metadata.

  const status = err?.status;
  const message = String(err?.message || "").toLowerCase();
  const code = String(err?.code || err?.cause?.code || "").toUpperCase();

  // Authentication
  if (
    status === 401 ||
    status === 403 ||
    message.includes("invalid api key") ||
    message.includes("authentication") ||
    message.includes("unauthorized")
  ) {
    safeError(res, 401, "INVALID_API_KEY");
    return;
  }

  // Rate / quota
  if (status === 429) {
    safeError(res, 429, "RATE_OR_QUOTA_LIMIT");
    return;
  }

  // Wrong / unavailable model or bad provider route
  const looksLikeModelError =
    message.includes("model not found") ||
    message.includes("unknown model") ||
    message.includes("invalid model") ||
    message.includes("unsupported model") ||
    message.includes("no such model") ||
    message.includes("model does not exist") ||
    message.includes("model_not_found");

  if (
    status === 404 ||
    looksLikeModelError
  ) {
    safeError(res, status === 404 ? 404 : 400, "MODEL_UNAVAILABLE");
    return;
  }

  // Unsupported reasoning level
  if (
    message.includes("reasoning_effort") ||
    message.includes("reasoning effort") ||
    message.includes("reasoning level")
  ) {
    safeError(res, 400, "REASONING_UNSUPPORTED");
    return;
  }

  // Structured Output / JSON Schema unsupported
  if (
    message.includes("response_format") ||
    message.includes("json_schema") ||
    message.includes("json schema") ||
    message.includes("structured output")
  ) {
    safeError(res, 400, "STRUCTURED_OUTPUT_UNSUPPORTED");
    return;
  }

  // Endpoint/network failure
  if (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EHOSTUNREACH" ||
    code === "ETIMEDOUT" ||
    code === "ECONNRESET"
  ) {
    safeError(
      res,
      502,
      "GENERATION_FAILED",
      "ContextPack couldn't reach that API endpoint. Check the endpoint and try again."
    );
    return;
  }

  safeError(res, 500, "GENERATION_FAILED");
  }
 }