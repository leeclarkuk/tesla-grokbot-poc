import type { AgentGateway } from "../agent-gateway/contract.js";

/**
 * Vendor SDKs stay behind this port. Core domain and policy must not import
 * Tesla, Grok, OpenAI, Anthropic, or any other provider package.
 */
export interface AgentProviderAdapter extends AgentGateway {
  readonly providerId: string;
}
