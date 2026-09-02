import { describe, expect, it } from "vitest";
import { ACTION_KINDS } from "../domain/actions.js";
import { catalogue } from "./catalogue.js";
import { evaluate } from "./evaluate.js";

describe("policy catalogue", () => {
  it("classifies every action kind", () => {
    for (const kind of ACTION_KINDS) {
      expect(catalogue[kind]).toEqual({
        whileMoving: expect.any(String),
        whileParked: expect.any(String),
      });
    }
  });

  it("allows reading agent status while moving", () => {
    expect(evaluate("read_agent_status", "moving")).toBe("ALLOW");
  });

  it("treats unknown motion as moving", () => {
    expect(evaluate("merge_pull_request", "unknown")).toBe(
      evaluate("merge_pull_request", "moving"),
    );
    expect(evaluate("merge_pull_request", "unknown")).toBe(
      "REQUIRE_PARKED_APPROVAL",
    );
  });

  it("does not allow production deploys from a moving vehicle", () => {
    expect(evaluate("deploy_production", "moving")).toBe("DENY");
  });

  it("never allows a security-control bypass", () => {
    expect(evaluate("bypass_security_control", "parked")).toBe("DENY");
    expect(evaluate("vehicle_control", "parked")).toBe("DENY");
  });
});
