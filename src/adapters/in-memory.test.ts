import { describe, expect, it } from "vitest";
import { InMemoryAgentProvider } from "./in-memory.js";

describe("InMemoryAgentProvider", () => {
  it("implements the adapter without a vendor SDK", async () => {
    const provider = new InMemoryAgentProvider();
    expect(provider.providerId).toBe("in-memory");
    const agents = await provider.listAgents();
    expect(agents).toHaveLength(1);
    const listed = agents[0];
    expect(listed).toBeDefined();
    if (!listed) {
      throw new Error("expected a seeded agent");
    }
    const status = await provider.getAgentStatus(listed.id);
    expect(status.status).toBe("idle");
    const task = await provider.createTask({
      agentId: listed.id,
      instruction: "Look up nearby charging tips.",
    });
    const result = await provider.getResult(task.id);
    expect(result.taskId).toBe(task.id);
    expect(result.summary).toMatch(/charging/i);
  });

  it("keeps existing agents and tasks when a later call looks up a missing id", async () => {
    const provider = new InMemoryAgentProvider();
    const agents = await provider.listAgents();
    const listed = agents[0];
    expect(listed).toBeDefined();
    if (!listed) {
      throw new Error("expected a seeded agent");
    }
    const task = await provider.createTask({
      agentId: listed.id,
      instruction: "Look up nearby charging tips.",
    });

    await expect(provider.getAgentStatus("missing-agent")).rejects.toThrow(
      /unknown agent/,
    );
    await expect(provider.getResult("missing-task")).rejects.toThrow(
      /unknown task/,
    );

    expect(await provider.listAgents()).toEqual(agents);
    expect(await provider.getResult(task.id)).toEqual({
      taskId: task.id,
      summary: "Look up nearby charging tips.",
    });
  });
});
