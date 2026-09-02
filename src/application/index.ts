import { InMemoryAgentProvider } from "../adapters/in-memory.js";
import { VoiceCompanion } from "./companion.js";

export function createInMemoryCompanion(): VoiceCompanion {
  return new VoiceCompanion(new InMemoryAgentProvider());
}

export { VoiceCompanion } from "./companion.js";
export { classifyRequest } from "./classify.js";
export type { ClassifiedAction } from "./classify.js";
