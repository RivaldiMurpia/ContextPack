// ContextPack — Server-side schemas
// Zod schema for validation + strict JSON Schema for OpenAI Responses API Structured Outputs.

import { z } from "zod";

const NonEmptyText = z.string().trim().min(1);

export const ContextPackSchema = z
  .object({
    goal: NonEmptyText,
    currentState: z.array(NonEmptyText),
    keyDecisions: z.array(NonEmptyText),
    constraints: z.array(NonEmptyText),
    openQuestions: z.array(NonEmptyText),
    missingContext: z.array(NonEmptyText),
    nextActions: z.array(NonEmptyText),
  })
  .strict();

export const RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "goal",
    "currentState",
    "keyDecisions",
    "constraints",
    "openQuestions",
    "missingContext",
    "nextActions",
  ],
  properties: {
    goal: { type: "string" },
    currentState: {
      type: "array",
      items: { type: "string" },
    },
    keyDecisions: {
      type: "array",
      items: { type: "string" },
    },
    constraints: {
      type: "array",
      items: { type: "string" },
    },
    openQuestions: {
      type: "array",
      items: { type: "string" },
    },
    missingContext: {
      type: "array",
      items: { type: "string" },
    },
    nextActions: {
      type: "array",
      items: { type: "string" },
    },
  },
};