import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { InMemoryAgentProvider } from "../../adapters/in-memory.js";
import type { CreateTaskInput, TaskRef } from "../../agent-gateway/contract.js";
import { VoiceCompanion, type CompanionTurnLog } from "../../application/companion.js";
import {
  createCompanionHttpServer,
  DEFAULT_COMPANION_HOST,
  DEFAULT_COMPANION_PORT,
  readBindAddress,
} from "./server.js";

class RecordingProvider extends InMemoryAgentProvider {
  readonly createTaskCalls: CreateTaskInput[] = [];

  override async createTask(input: CreateTaskInput): Promise<TaskRef> {
    this.createTaskCalls.push(input);
    return super.createTask(input);
  }
}

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        }),
    ),
  );
});

async function listen(server: Server): Promise<string> {
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve();
    });
  });
  const addr = server.address() as AddressInfo;
  return `http://127.0.0.1:${String(addr.port)}`;
}

async function postUtterance(
  base: string,
  body: unknown,
): Promise<{ status: number; json: unknown }> {
  const response = await fetch(`${base}/utterance`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, json: (await response.json()) as unknown };
}

describe("companion HTTP presentation adapter", () => {
  it("defaults bind to all interfaces, not loopback", () => {
    expect(readBindAddress({})).toEqual({
      host: DEFAULT_COMPANION_HOST,
      port: DEFAULT_COMPANION_PORT,
    });
    expect(DEFAULT_COMPANION_HOST).toBe("0.0.0.0");
    expect(readBindAddress({ COMPANION_HOST: "127.0.0.1", COMPANION_PORT: "9" })).toEqual({
      host: "127.0.0.1",
      port: 9,
    });
  });

  it("returns SpokenResponse for a full transcript and logs the turn", async () => {
    const turns: CompanionTurnLog[] = [];
    const provider = new RecordingProvider();
    const companion = new VoiceCompanion(provider, {
      onTurn: (turn) => {
        turns.push(turn);
      },
    });
    const server = createCompanionHttpServer({ companion, log: () => {} });
    const base = await listen(server);

    const { status, json } = await postUtterance(base, {
      text: "What are my agents doing?",
      capturedAt: "2026-09-02T12:00:00.000Z",
    });

    expect(status).toBe(200);
    expect(json).toEqual({ text: expect.stringMatching(/Companion is idle/i) });
    expect(provider.createTaskCalls).toHaveLength(0);
    expect(turns).toHaveLength(1);
    expect(turns[0]?.classifiedAction).toBe("read_agent_status");
    expect(turns[0]?.policyDecision).toBe("ALLOW");
    expect(turns[0]?.createTaskRan).toBe(false);
    expect(turns[0]?.transcript).toBe("What are my agents doing?");
  });

  it("does not createTask for mixed research-plus-merge", async () => {
    const turns: CompanionTurnLog[] = [];
    const provider = new RecordingProvider();
    const companion = new VoiceCompanion(provider, {
      onTurn: (turn) => {
        turns.push(turn);
      },
    });
    const server = createCompanionHttpServer({ companion, log: () => {} });
    const base = await listen(server);
    const text =
      "Tell the agent to research that deployment problem and then merge the fix.";

    const { status, json } = await postUtterance(base, {
      text,
      capturedAt: "2026-09-02T12:00:00.000Z",
    });

    expect(status).toBe(200);
    expect(json).toEqual({ text: expect.stringMatching(/not allowed/i) });
    expect(provider.createTaskCalls).toEqual([]);
    expect(turns[0]?.createTaskRan).toBe(false);
    expect(turns[0]?.classifiedAction).toBe("deploy_production");
    expect(turns[0]?.policyDecision).toBe("DENY");
  });

  it("ignores caller-supplied parked motion", async () => {
    const provider = new RecordingProvider();
    const companion = new VoiceCompanion(provider);
    const server = createCompanionHttpServer({ companion, log: () => {} });
    const base = await listen(server);

    const { status, json } = await postUtterance(base, {
      text: "Merge the pull request",
      capturedAt: "2026-09-02T12:00:00.000Z",
      motion: "parked",
    });

    expect(status).toBe(200);
    expect(json).toEqual({
      text: expect.stringMatching(/parked and approve/i),
    });
    expect(json).not.toEqual({
      text: expect.stringMatching(/separate confirmation/i),
    });
    expect(provider.createTaskCalls).toEqual([]);
  });

  it("rejects a body without text", async () => {
    const server = createCompanionHttpServer({ log: () => {} });
    const base = await listen(server);
    const { status, json } = await postUtterance(base, {
      capturedAt: "2026-09-02T12:00:00.000Z",
    });
    expect(status).toBe(400);
    expect(json).toEqual({ error: "text is required" });
  });

  it("logs a JSON turn from the default in-memory companion", async () => {
    const lines: string[] = [];
    const server = createCompanionHttpServer({
      log: (line) => {
        lines.push(line);
      },
    });
    const base = await listen(server);
    const { status } = await postUtterance(base, {
      text: "What are my agents doing?",
      capturedAt: "2026-09-02T12:00:00.000Z",
    });
    expect(status).toBe(200);
    expect(lines).toHaveLength(1);
    const turn = JSON.parse(lines[0] ?? "") as CompanionTurnLog;
    expect(turn.classifiedAction).toBe("read_agent_status");
    expect(turn.createTaskRan).toBe(false);
    expect(turn.spokenText.length).toBeGreaterThan(0);
  });
});
