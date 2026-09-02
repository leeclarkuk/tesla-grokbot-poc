export type AgentLifecycleStatus =
  | "idle"
  | "running"
  | "paused"
  | "waiting_approval"
  | "failed"
  | "completed";

export interface AgentSummary {
  readonly id: string;
  readonly displayName: string;
  readonly status: AgentLifecycleStatus;
}

export interface CreateTaskInput {
  readonly agentId: string;
  readonly instruction: string;
}

export interface TaskRef {
  readonly id: string;
  readonly agentId: string;
}

export interface SendInstructionInput {
  readonly agentId: string;
  readonly instruction: string;
}

export interface TaskResult {
  readonly taskId: string;
  readonly summary: string;
}

export interface AgentGateway {
  listAgents(): Promise<readonly AgentSummary[]>;
  getAgentStatus(agentId: string): Promise<AgentSummary>;
  createTask(input: CreateTaskInput): Promise<TaskRef>;
  sendInstruction(input: SendInstructionInput): Promise<void>;
  pauseAgent(agentId: string): Promise<void>;
  resumeAgent(agentId: string): Promise<void>;
  cancelAgent(agentId: string): Promise<void>;
  getResult(taskId: string): Promise<TaskResult>;
  approveAction(actionId: string): Promise<void>;
  rejectAction(actionId: string, reason?: string): Promise<void>;
}

export const AGENT_GATEWAY_OPERATIONS = [
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
] as const satisfies ReadonlyArray<keyof AgentGateway>;
