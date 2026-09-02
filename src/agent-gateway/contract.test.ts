import { describe, expect, it } from "vitest";
import {
  AGENT_GATEWAY_OPERATIONS,
  type AgentGateway,
  type AgentSummary,
  type TaskRef,
  type TaskResult,
} from "./contract.js";

class InMemoryGateway implements AgentGateway {
  async listAgents(): Promise<readonly AgentSummary[]> {
    return [
      { id: "agent-status", displayName: "Status", status: "idle" },
    ];
  }

  async getAgentStatus(agentId: string): Promise<AgentSummary> {
    return { id: agentId, displayName: "Status", status: "idle" };
  }

  async createTask(): Promise<TaskRef> {
    return { id: "task-1", agentId: "agent-status" };
  }

  async sendInstruction(): Promise<void> {}
  async pauseAgent(): Promise<void> {}
  async resumeAgent(): Promise<void> {}
  async cancelAgent(): Promise<void> {}

  async getResult(taskId: string): Promise<TaskResult> {
    return { taskId, summary: "idle" };
  }

  async approveAction(): Promise<void> {}
  async rejectAction(): Promise<void> {}
}

describe("AgentGateway contract", () => {
  it("exposes the stable operation list", () => {
    expect(AGENT_GATEWAY_OPERATIONS).toEqual([
      "listAgents",
      "getAgentStatus",
      "createTask",
      "sendInstruction",
      "pauseAgent",
      "resumeAgent",
      "cancelAgent",
      "getResult",
      "approveAction",
      "rejectAction",
    ]);
  });

  it("can be implemented without a vendor SDK", async () => {
    const gateway: AgentGateway = new InMemoryGateway();
    const agents = await gateway.listAgents();
    expect(agents).toHaveLength(1);
    const status = await gateway.getAgentStatus(agents[0]?.id ?? "");
    expect(status.status).toBe("idle");
  });
});
