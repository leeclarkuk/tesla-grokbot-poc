export const POLICY_DECISIONS = [
  "ALLOW",
  "DENY",
  "REQUIRE_CONFIRMATION",
  "REQUIRE_PARKED_APPROVAL",
  "REQUIRE_EXTERNAL_APPROVAL",
] as const;

export type PolicyDecision = (typeof POLICY_DECISIONS)[number];
