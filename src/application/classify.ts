import type { ActionKind } from "../domain/actions.js";

/**
 * Utterance-to-action mapping lives here, not in policy. Policy only decides
 * once the action kind is known. High-consequence phrasing wins so "do a
 * bounded task to merge the PR" cannot sneak through as delegation.
 */
export type ClassifiedAction = ActionKind | "unclassified";

interface ClassificationRule {
  readonly action: ActionKind;
  readonly patterns: readonly RegExp[];
}

const HIGH_CONSEQUENCE_RULES: readonly ClassificationRule[] = [
  {
    action: "vehicle_control",
    patterns: [
      /\bvehicle control\b/i,
      /\bunlock\b.*\b(car|vehicle|doors?)\b/i,
      /\block\b.*\b(car|vehicle|doors?)\b/i,
      /\bopen\b.*\b(windows?|boot|trunk|frunk|charge port)\b/i,
      /\bhonk\b/i,
      /\bsummon\b/i,
      /\bautopilot\b/i,
      /\bclimate\b/i,
      /\bsteer\b/i,
      /\baccelerate\b/i,
      /\bbrake the (car|vehicle)\b/i,
      /\bstart the (car|vehicle)\b/i,
    ],
  },
  {
    action: "bypass_security_control",
    patterns: [/\bbypass\b.*\b(security|auth|policy|control)\b/i],
  },
  {
    action: "execute_arbitrary_production_shell",
    patterns: [/\b(run|execute)\b.*\b(shell|bash|production)\b/i],
  },
  {
    action: "send_payment",
    patterns: [/\bsend (a |the )?payment\b/i, /\bpay\b/i, /\binvoice\b/i],
  },
  {
    action: "financial_transfer",
    patterns: [/\btransfer (money|funds)\b/i, /\bwire transfer\b/i],
  },
  {
    action: "deploy_production",
    patterns: [/\bdeploy\b/i],
  },
  {
    action: "delete_infrastructure",
    patterns: [
      /\bdelete (the )?(infra|infrastructure|cluster|kubernetes|k8s)\b/i,
    ],
  },
  {
    action: "destructive_external_write",
    patterns: [/\bdestroy\b/i, /\bdelete production\b/i, /\bdrop (the )?database\b/i],
  },
  {
    action: "change_access_permissions",
    patterns: [/\bchange (access )?permissions\b/i, /\bgrant admin\b/i],
  },
  {
    action: "merge_pull_request",
    patterns: [/\bmerge\b/i],
  },
  {
    action: "send_consequential_communication",
    patterns: [
      /\bsend (the )?(email|mail|message) to (the )?(team|all|everyone|company)\b/i,
    ],
  },
];

const ALLOW_CANDIDATE_RULES: readonly ClassificationRule[] = [
  {
    action: "read_agent_status",
    patterns: [
      /\bagent status\b/i,
      /\bstatus of (the |my )?agent\b/i,
      /\bhow is (the |my )?agent\b/i,
    ],
  },
  {
    action: "request_research",
    patterns: [/\bresearch\b/i],
  },
  {
    action: "delegate_bounded_task",
    patterns: [
      /\bbounded\b/i,
      /\blook up\b/i,
      /\bfind out\b/i,
      /\bsummarise\b/i,
      /\bsummarize\b/i,
      /\bharmless\b/i,
    ],
  },
  {
    action: "ask_question",
    patterns: [
      /^\s*(what|who|when|where|why|how|is|are|can|could|should|does|do|did)\b/i,
    ],
  },
];

function firstMatch(
  text: string,
  rules: readonly ClassificationRule[],
): ActionKind | undefined {
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return rule.action;
    }
  }
  return undefined;
}

export function classifyRequest(text: string): ClassifiedAction {
  const consequential = firstMatch(text, HIGH_CONSEQUENCE_RULES);
  if (consequential) {
    return consequential;
  }
  return firstMatch(text, ALLOW_CANDIDATE_RULES) ?? "unclassified";
}
