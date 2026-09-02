import type { AgentGateway } from "../agent-gateway/contract.js";
import type { ActionKind } from "../domain/actions.js";
import type { PolicyDecision } from "../policy/decisions.js";
import { evaluate } from "../policy/evaluate.js";
import type { SpokenResponse, VoiceUtterance } from "../presentation/voice/contract.js";
import { classifyRequest, type ClassifiedAction } from "./classify.js";
import { spokenRefusal, spokenUnclassified } from "./refuse.js";

const MOTION_THIS_SLICE = "unknown" as const;

/**
 * Application-layer createTask allowlist.
 *
 * Policy may ALLOW pause, navigation, drafts, and similar while moving. This
 * slice still only calls `createTask` for these three kinds. A missing
 * application branch is not a product success: pause/navigation will speak
 * agent status and must not silently no-op later. Do not expand this list
 * in this slice.
 */
export const CREATE_TASK_ALLOWLIST = [
  "delegate_bounded_task",
  "request_research",
  "ask_question",
] as const satisfies ReadonlyArray<ActionKind>;

export type CreateTaskAllowlistedAction = (typeof CREATE_TASK_ALLOWLIST)[number];

export function isCreateTaskAllowlisted(
  action: ClassifiedAction,
): action is CreateTaskAllowlistedAction {
  return (CREATE_TASK_ALLOWLIST as readonly string[]).includes(action);
}

export interface CompanionTurnLog {
  readonly timestamp: string;
  readonly transcript: string;
  readonly classifiedAction: ClassifiedAction;
  readonly policyDecision: PolicyDecision | null;
  readonly spokenText: string;
  readonly createTaskRan: boolean;
}

export interface VoiceCompanionOptions {
  readonly onTurn?: (log: CompanionTurnLog) => void;
}

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
  private readonly onTurn: ((log: CompanionTurnLog) => void) | undefined;

  constructor(
    private readonly gateway: AgentGateway,
    options: VoiceCompanionOptions = {},
  ) {
    this.onTurn = options.onTurn;
  }

  async handle(utterance: VoiceUtterance): Promise<SpokenResponse> {
    let classifiedAction: ClassifiedAction = "unclassified";
    let policyDecision: PolicyDecision | null = null;
    let createTaskRan = false;
    let spoken: SpokenResponse = speak(spokenUnclassified());

    try {
      classifiedAction = classifyRequest(utterance.text);
      if (classifiedAction === "unclassified") {
        spoken = speak(spokenUnclassified());
        return spoken;
      }

      policyDecision = evaluate(classifiedAction, MOTION_THIS_SLICE);
      if (policyDecision !== "ALLOW") {
        spoken = speak(spokenRefusal(policyDecision));
        return spoken;
      }

      const agents = await this.gateway.listAgents();
      const listed = agents[0];
      if (!listed) {
        spoken = speak("No agents available.");
        return spoken;
      }
      const status = await this.gateway.getAgentStatus(listed.id);

      if (!isCreateTaskAllowlisted(classifiedAction)) {
        spoken = speak(`${status.displayName} is ${status.status}.`);
        return spoken;
      }

      const task = await this.gateway.createTask({
        agentId: listed.id,
        instruction: utterance.text,
      });
      createTaskRan = true;
      const result = await this.gateway.getResult(task.id);
      spoken = speak(result.summary);
      return spoken;
    } finally {
      this.onTurn?.({
        timestamp: new Date().toISOString(),
        transcript: utterance.text,
        classifiedAction,
        policyDecision,
        spokenText: spoken.text,
        createTaskRan,
      });
    }
  }
}
