import type { AgentGateway } from "../agent-gateway/contract.js";
import { evaluate } from "../policy/evaluate.js";
import type { SpokenResponse, VoiceUtterance } from "../presentation/voice/contract.js";
import { classifyRequest } from "./classify.js";
import { spokenRefusal, spokenUnclassified } from "./refuse.js";

const MOTION_THIS_SLICE = "unknown" as const;

function speak(text: string): SpokenResponse {
  const compact = text.trim().replace(/\s+/g, " ");
  if (compact.length <= 140) {
    return { text: compact };
  }
  return { text: `${compact.slice(0, 137)}...` };
}

/**
 * Smallest loop above policy, Agent Gateway, and the voice contract.
 * Voice is input only. Motion is unknown (treated as moving). Callers cannot
 * supply parked until a trusted motion source exists.
 */
export class VoiceCompanion {
  constructor(private readonly gateway: AgentGateway) {}

  async handle(utterance: VoiceUtterance): Promise<SpokenResponse> {
    const action = classifyRequest(utterance.text);
    if (action === "unclassified") {
      return speak(spokenUnclassified());
    }

    const decision = evaluate(action, MOTION_THIS_SLICE);
    if (decision !== "ALLOW") {
      return speak(spokenRefusal(decision));
    }

    const agents = await this.gateway.listAgents();
    const listed = agents[0];
    if (!listed) {
      return speak("No agents available.");
    }
    const status = await this.gateway.getAgentStatus(listed.id);

    if (action === "read_agent_status" || action === "read_concise_summary") {
      return speak(`${status.displayName} is ${status.status}.`);
    }

    if (
      action !== "delegate_bounded_task" &&
      action !== "request_research" &&
      action !== "ask_question"
    ) {
      return speak(`${status.displayName} is ${status.status}.`);
    }

    const task = await this.gateway.createTask({
      agentId: listed.id,
      instruction: utterance.text,
    });
    const result = await this.gateway.getResult(task.id);
    return speak(result.summary);
  }
}
