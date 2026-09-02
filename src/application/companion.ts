import type { AgentGateway } from "../agent-gateway/contract.js";
import type { MotionState } from "../domain/motion.js";
import { evaluate } from "../policy/evaluate.js";
import type { SpokenResponse, VoiceUtterance } from "../presentation/voice/contract.js";
import { classifyRequest } from "./classify.js";
import { spokenRefusal, spokenUnclassified } from "./refuse.js";

const DEFAULT_MOTION: MotionState = "unknown";

function speak(text: string): SpokenResponse {
  const compact = text.trim().replace(/\s+/g, " ");
  if (compact.length <= 140) {
    return { text: compact };
  }
  return { text: `${compact.slice(0, 137)}...` };
}

/**
 * Smallest loop above policy, Agent Gateway, and the voice contract.
 * Voice is input only. Motion defaults to unknown (treated as moving).
 */
export class VoiceCompanion {
  constructor(private readonly gateway: AgentGateway) {}

  async handle(
    utterance: VoiceUtterance,
    motion: MotionState = DEFAULT_MOTION,
  ): Promise<SpokenResponse> {
    const action = classifyRequest(utterance.text);
    if (action === "unclassified") {
      return speak(spokenUnclassified());
    }

    const decision = evaluate(action, motion);
    if (decision !== "ALLOW") {
      return speak(spokenRefusal(decision));
    }

    const agents = await this.gateway.listAgents();
    const listed = agents[0];
    if (!listed) {
      return speak("No agents available.");
    }
    const status = await this.gateway.getAgentStatus(listed.id);

    const task = await this.gateway.createTask({
      agentId: listed.id,
      instruction: utterance.text,
    });
    const result = await this.gateway.getResult(task.id);

    if (action === "read_agent_status" || action === "read_concise_summary") {
      return speak(`${status.displayName} is ${status.status}.`);
    }

    return speak(result.summary);
  }
}
