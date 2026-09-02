import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { createInMemoryCompanion, type VoiceCompanion } from "../../application/index.js";
import type { SpokenResponse } from "../voice/contract.js";

export const DEFAULT_COMPANION_HOST = "0.0.0.0";
export const DEFAULT_COMPANION_PORT = 8787;
const MAX_BODY_BYTES = 32 * 1024;

export interface CompanionHttpOptions {
  readonly companion?: VoiceCompanion;
  readonly log?: (line: string) => void;
}

export interface BindAddress {
  readonly host: string;
  readonly port: number;
}

export function readBindAddress(
  env: NodeJS.ProcessEnv = process.env,
): BindAddress {
  const host = env.COMPANION_HOST?.trim() || DEFAULT_COMPANION_HOST;
  const portRaw = env.COMPANION_PORT?.trim();
  const port = portRaw === undefined || portRaw === ""
    ? DEFAULT_COMPANION_PORT
    : Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `COMPANION_PORT must be an integer 1-65535, got ${String(portRaw)}`,
    );
  }
  return { host, port };
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;
    const fail = (err: Error): void => {
      if (settled) {
        return;
      }
      settled = true;
      reject(err);
    };
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        fail(new Error("body too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", (err: Error) => {
      fail(err);
    });
  });
}

function parseUtterance(raw: string):
  | { ok: true; text: string; capturedAt: string }
  | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, error: "body must be JSON" };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "body must be an object" };
  }
  const record = parsed as Record<string, unknown>;
  if (typeof record.text !== "string" || record.text.trim() === "") {
    return { ok: false, error: "text is required" };
  }
  if (typeof record.capturedAt !== "string" || record.capturedAt.trim() === "") {
    return { ok: false, error: "capturedAt is required" };
  }
  return { ok: true, text: record.text, capturedAt: record.capturedAt };
}

/**
 * Same-process HTTP presentation adapter around VoiceCompanion.
 * Not a new service. Motion is not read from the request.
 */
export function createCompanionHttpServer(
  options: CompanionHttpOptions = {},
): Server {
  const log =
    options.log ??
    ((line: string) => {
      process.stdout.write(`${line}\n`);
    });
  const companion =
    options.companion ??
    createInMemoryCompanion({
      onTurn: (turn) => {
        log(JSON.stringify(turn));
      },
    });

  return createServer((req, res) => {
    void handleRequest(req, res, companion, log);
  });
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  companion: VoiceCompanion,
  log: (line: string) => void,
): Promise<void> {
  try {
    const url = new URL(req.url ?? "/", "http://companion.local");
    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }
    if (req.method === "POST" && url.pathname === "/utterance") {
      let raw: string;
      try {
        raw = await readBody(req);
      } catch (err) {
        const message = err instanceof Error ? err.message : "bad body";
        if (message === "body too large") {
          sendJson(res, 413, { error: "body too large" });
          return;
        }
        sendJson(res, 400, { error: "could not read body" });
        return;
      }
      const parsed = parseUtterance(raw);
      if (!parsed.ok) {
        sendJson(res, 400, { error: parsed.error });
        return;
      }
      const spoken: SpokenResponse = await companion.handle({
        text: parsed.text,
        capturedAt: parsed.capturedAt,
      });
      sendJson(res, 200, { text: spoken.text });
      return;
    }
    sendJson(res, 404, { error: "not found" });
  } catch (err) {
    log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : "companion failed",
      }),
    );
    sendJson(res, 500, { error: "companion failed" });
  }
}
