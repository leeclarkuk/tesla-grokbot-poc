import { describe, expect, it } from "vitest";
import { InMemoryAgentProvider } from "../adapters/in-memory.js";
import type { CreateTaskInput, TaskRef } from "../agent-gateway/contract.js";
import { evaluate } from "../policy/evaluate.js";
import type { VoiceUtterance } from "../presentation/voice/contract.js";
import { classifyRequest } from "./classify.js";
import {
  CREATE_TASK_ALLOWLIST,
  VoiceCompanion,
} from "./companion.js";

class RecordingProvider extends InMemoryAgentProvider {
  readonly createTaskCalls: CreateTaskInput[] = [];
  readonly createdTasks: TaskRef[] = [];

  override async createTask(input: CreateTaskInput): Promise<TaskRef> {
    this.createTaskCalls.push(input);
    const created = await super.createTask(input);
    this.createdTasks.push(created);
    return created;
  }
}

function utterance(text: string): VoiceUtterance {
  return { text, capturedAt: "2026-09-02T11:00:00.000Z" };
}

describe("voice companion loop", () => {
  it("allows a status query while motion is unknown and speaks agent status", async () => {
    const provider = new RecordingProvider();
    const companion = new VoiceCompanion(provider);
    const text = "What is the agent status?";

    expect(classifyRequest(text)).toBe("read_agent_status");
    expect(evaluate("read_agent_status", "unknown")).toBe("ALLOW");

    const response = await companion.handle(utterance(text));

    expect(response.text).toMatch(/Companion is idle/i);
    expect(response.text.length).toBeLessThanOrEqual(140);
    expect(provider.createTaskCalls).toHaveLength(0);
  });

  it("treats 'What are my agents doing?' as status and does not createTask", async () => {
    const provider = new RecordingProvider();
    const companion = new VoiceCompanion(provider);
    const text = "What are my agents doing?";

    expect(classifyRequest(text)).toBe("read_agent_status");
    expect(evaluate("read_agent_status", "unknown")).toBe("ALLOW");
    expect(CREATE_TASK_ALLOWLIST).not.toContain("read_agent_status");

    const response = await companion.handle(utterance(text));

    expect(response.text).toMatch(/Companion is idle/i);
    expect(provider.createTaskCalls).toHaveLength(0);
  });

  it("refuses mixed research-plus-merge without createTask", async () => {
    const provider = new RecordingProvider();
    const companion = new VoiceCompanion(provider);
    const text =
      "Tell the agent to research that deployment problem and then merge the fix.";

    const action = classifyRequest(text);
    expect(action).not.toBe("request_research");
    expect(action).not.toBe("delegate_bounded_task");
    expect(action).not.toBe("ask_question");
    // High-consequence rules stay first. "deployment" matches deploy before merge.
    expect(action).toBe("deploy_production");
    expect(evaluate("deploy_production", "unknown")).toBe("DENY");

    const response = await companion.handle(utterance(text));

    expect(provider.createTaskCalls).toEqual([]);
    expect(response.text).toMatch(/not allowed/i);
  });

  it("keeps the createTask allowlist to three application kinds", () => {
    expect([...CREATE_TASK_ALLOWLIST]).toEqual([
      "delegate_bounded_task",
      "request_research",
      "ask_question",
    ]);
  });

  it("allows a bounded non-writing task while motion is unknown", async () => {
    const provider = new RecordingProvider();
    const companion = new VoiceCompanion(provider);
    const text = "Look up nearby charging tips. Do not change anything.";

    expect(classifyRequest(text)).toBe("delegate_bounded_task");
    expect(evaluate("delegate_bounded_task", "unknown")).toBe("ALLOW");

    const response = await companion.handle(utterance(text));

    expect(provider.createTaskCalls).toHaveLength(1);
    expect(provider.createTaskCalls[0]?.instruction).toBe(text);
    const created = provider.createdTasks[0];
    expect(created).toBeDefined();
    if (!created) {
      throw new Error("expected createTask to return a task");
    }
    const result = await provider.getResult(created.id);
    expect(result.summary.length).toBeGreaterThan(0);
    expect(response.text).toBe(result.summary);
    expect(response.text.length).toBeLessThanOrEqual(140);
  });

  it("refuses merge, deploy, pay, and vehicle-control phrasing without creating those tasks", async () => {
    const cases = [
      {
        text: "Merge the pull request",
        action: "merge_pull_request" as const,
        decision: "REQUIRE_PARKED_APPROVAL" as const,
        spoken: /parked and approve/i,
      },
      {
        text: "Deploy to production",
        action: "deploy_production" as const,
        decision: "DENY" as const,
        spoken: /not allowed/i,
      },
      {
        text: "Pay the invoice",
        action: "send_payment" as const,
        decision: "DENY" as const,
        spoken: /not allowed/i,
      },
      {
        text: "Unlock the car",
        action: "vehicle_control" as const,
        decision: "DENY" as const,
        spoken: /not allowed/i,
      },
      {
        text: "merges the pull request",
        action: "merge_pull_request" as const,
        decision: "REQUIRE_PARKED_APPROVAL" as const,
        spoken: /parked and approve/i,
      },
      {
        text: "deploys production",
        action: "deploy_production" as const,
        decision: "DENY" as const,
        spoken: /not allowed/i,
      },
      {
        text: "make a payment",
        action: "send_payment" as const,
        decision: "DENY" as const,
        spoken: /not allowed/i,
      },
      {
        text: "destroys the database",
        action: "destructive_external_write" as const,
        decision: "DENY" as const,
        spoken: /not allowed/i,
      },
      {
        text: "roll down the windows",
        action: "vehicle_control" as const,
        decision: "DENY" as const,
        spoken: /not allowed/i,
      },
      {
        text: "do a bounded task that merges the pull request",
        action: "merge_pull_request" as const,
        decision: "REQUIRE_PARKED_APPROVAL" as const,
        spoken: /parked and approve/i,
      },
    ];

    for (const row of cases) {
      const provider = new RecordingProvider();
      const companion = new VoiceCompanion(provider);

      expect(classifyRequest(row.text)).toBe(row.action);
      expect(evaluate(row.action, "unknown")).toBe(row.decision);

      const response = await companion.handle(utterance(row.text));

      expect(provider.createTaskCalls, row.text).toEqual([]);
      expect(response.text, row.text).toMatch(row.spoken);
    }
  });

  it("does not create a task for unclassified text", async () => {
    const provider = new RecordingProvider();
    const companion = new VoiceCompanion(provider);
    const text = "Please note this.";

    expect(classifyRequest(text)).toBe("unclassified");

    const response = await companion.handle(utterance(text));

    expect(provider.createTaskCalls).toEqual([]);
    expect(response.text.length).toBeGreaterThan(0);
    expect(response.text.length).toBeLessThanOrEqual(140);
  });

  it("does not corrupt in-memory agent state on a replayed second call", async () => {
    const provider = new RecordingProvider();
    const companion = new VoiceCompanion(provider);

    const first = await companion.handle(
      utterance("Look up nearby charging tips. Do not change anything."),
    );
    const agentsAfterFirst = await provider.listAgents();
    const firstCreated = provider.createdTasks[0];
    expect(firstCreated).toBeDefined();
    if (!firstCreated) {
      throw new Error("expected first createTask");
    }
    const firstResult = await provider.getResult(firstCreated.id);

    const replay = await companion.handle(
      utterance("Look up nearby charging tips. Do not change anything."),
    );
    const denied = await companion.handle(utterance("Merge the pull request"));

    const agentsAfterReplay = await provider.listAgents();
    expect(agentsAfterReplay.map((agent) => agent.id)).toEqual(
      agentsAfterFirst.map((agent) => agent.id),
    );
    expect(agentsAfterReplay.map((agent) => agent.status)).toEqual(
      agentsAfterFirst.map((agent) => agent.status),
    );
    expect(await provider.getResult(firstCreated.id)).toEqual(firstResult);
    expect(provider.createTaskCalls).toHaveLength(2);
    expect(provider.createTaskCalls[1]?.instruction).not.toMatch(/merge/i);
    expect(denied.text).toMatch(/parked and approve/i);
    expect(first.text.length).toBeGreaterThan(0);
    expect(replay.text.length).toBeGreaterThan(0);
  });
});
