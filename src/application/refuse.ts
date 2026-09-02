import type { PolicyDecision } from "../policy/decisions.js";

export function spokenRefusal(decision: PolicyDecision): string {
  switch (decision) {
    case "DENY":
      return "No. That is not allowed.";
    case "REQUIRE_PARKED_APPROVAL":
      return "That has to wait until you are parked and approve it.";
    case "REQUIRE_CONFIRMATION":
      return "I need a separate confirmation. Not this request.";
    case "REQUIRE_EXTERNAL_APPROVAL":
      return "That needs approval outside voice.";
    case "ALLOW":
      return "No. That is not allowed.";
  }
}

export function spokenUnclassified(): string {
  return "I did not catch a request I can run while driving.";
}
