import type { ActionKind } from "../domain/actions.js";
import type { PolicyDecision } from "./decisions.js";

export interface ActionPolicy {
  readonly whileMoving: PolicyDecision;
  readonly whileParked: PolicyDecision;
}

export const catalogue: Record<ActionKind, ActionPolicy> = {
  read_agent_status: { whileMoving: "ALLOW", whileParked: "ALLOW" },
  read_concise_summary: { whileMoving: "ALLOW", whileParked: "ALLOW" },
  ask_question: { whileMoving: "ALLOW", whileParked: "ALLOW" },
  delegate_bounded_task: { whileMoving: "ALLOW", whileParked: "ALLOW" },
  request_draft: { whileMoving: "ALLOW", whileParked: "ALLOW" },
  pause_agent: { whileMoving: "ALLOW", whileParked: "ALLOW" },
  resume_agent: { whileMoving: "REQUIRE_CONFIRMATION", whileParked: "ALLOW" },
  cancel_agent: { whileMoving: "REQUIRE_CONFIRMATION", whileParked: "ALLOW" },
  request_research: { whileMoving: "ALLOW", whileParked: "ALLOW" },
  request_navigation: { whileMoving: "ALLOW", whileParked: "ALLOW" },
  hear_deferred_alert: { whileMoving: "ALLOW", whileParked: "ALLOW" },
  merge_pull_request: {
    whileMoving: "REQUIRE_PARKED_APPROVAL",
    whileParked: "REQUIRE_CONFIRMATION",
  },
  send_consequential_communication: {
    whileMoving: "REQUIRE_PARKED_APPROVAL",
    whileParked: "REQUIRE_CONFIRMATION",
  },
  destructive_external_write: {
    whileMoving: "DENY",
    whileParked: "REQUIRE_PARKED_APPROVAL",
  },
  deploy_production: {
    whileMoving: "DENY",
    whileParked: "REQUIRE_EXTERNAL_APPROVAL",
  },
  delete_infrastructure: {
    whileMoving: "DENY",
    whileParked: "REQUIRE_EXTERNAL_APPROVAL",
  },
  change_access_permissions: {
    whileMoving: "DENY",
    whileParked: "REQUIRE_EXTERNAL_APPROVAL",
  },
  send_payment: { whileMoving: "DENY", whileParked: "REQUIRE_EXTERNAL_APPROVAL" },
  financial_transfer: {
    whileMoving: "DENY",
    whileParked: "REQUIRE_EXTERNAL_APPROVAL",
  },
  bypass_security_control: { whileMoving: "DENY", whileParked: "DENY" },
  execute_arbitrary_production_shell: { whileMoving: "DENY", whileParked: "DENY" },
  vehicle_control: { whileMoving: "DENY", whileParked: "DENY" },
};
