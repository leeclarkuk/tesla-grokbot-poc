import { InMemoryAgentProvider } from "../adapters/in-memory.js";
import {
  VoiceCompanion,
  type VoiceCompanionOptions,
} from "./companion.js";

export function createInMemoryCompanion(
  options: VoiceCompanionOptions = {},
): VoiceCompanion {
  return new VoiceCompanion(new InMemoryAgentProvider(), options);
}

export { VoiceCompanion } from "./companion.js";
export {
  CREATE_TASK_ALLOWLIST,
  isCreateTaskAllowlisted,
} from "./companion.js";
export type {
  CompanionTurnLog,
  CreateTaskAllowlistedAction,
  VoiceCompanionOptions,
} from "./companion.js";
export { classifyRequest } from "./classify.js";
export type { ClassifiedAction } from "./classify.js";
