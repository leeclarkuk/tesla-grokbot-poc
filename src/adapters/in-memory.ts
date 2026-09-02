import type {
  AgentSummary,
  CreateTaskInput,
  TaskRef,
  TaskResult,
} from "../agent-gateway/contract.js";
import type { AgentProviderAdapter } from "./provider.js";

const DEFAULT_AGENT: AgentSummary = {
  id: "agent-companion",
  displayName: "Companion",
  status: "idle",
};

function snapshot(agent: AgentSummary): AgentSummary {
  return { id: agent.id, displayName: agent.displayName, status: agent.status };
}

function shortSummary(instruction: string): string {
  const compact = instruction.trim().replace(/\s+/g, " ");
  if (compact.length <= 80) {
    return compact;
  }
  return `${compact.slice(0, 77)}...`;
}

/**
 * In-process fake provider. No vendor SDK. Tasks complete immediately with a
 * short summary of the instruction. Agent records are copied out so callers
 * cannot mutate internal state.
 */
export class InMemoryAgentProvider implements AgentProviderAdapter {
  readonly providerId = "in-memory";

  private readonly agents = new Map<string, AgentSummary>();
  private readonly tasks = new Map<string, { instruction: string; summary: string }>();
  private nextTask = 1;

  constructor() {
    this.agents.set(DEFAULT_AGENT.id, snapshot(DEFAULT_AGENT));
  }

  async listAgents(): Promise<readonly AgentSummary[]> {
    return [...this.agents.values()].map(snapshot);
  }

  async getAgentStatus(agentId: string): Promise<AgentSummary> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`unknown agent: ${agentId}`);
    }
    return snapshot(agent);
  }

  async createTask(input: CreateTaskInput): Promise<TaskRef> {
    const agent = this.agents.get(input.agentId);
    if (!agent) {
      throw new Error(`unknown agent: ${input.agentId}`);
    }
    const id = `task-${String(this.nextTask)}`;
    this.nextTask += 1;
    this.tasks.set(id, {
      instruction: input.instruction,
      summary: shortSummary(input.instruction),
    });
    this.agents.set(input.agentId, { ...agent, status: "idle" });
    return { id, agentId: input.agentId };
  }

  async getResult(taskId: string): Promise<TaskResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`unknown task: ${taskId}`);
    }
    return { taskId, summary: task.summary };
  }

  async sendInstruction(): Promise<void> {}
  async pauseAgent(): Promise<void> {}
  async resumeAgent(): Promise<void> {}
  async cancelAgent(): Promise<void> {}
  async approveAction(): Promise<void> {}
  async rejectAction(): Promise<void> {}
}
