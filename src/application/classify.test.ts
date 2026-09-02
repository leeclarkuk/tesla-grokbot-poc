import { describe, expect, it } from "vitest";
import { classifyRequest } from "./classify.js";

describe("classifyRequest", () => {
  it("reads agent status as a status query", () => {
    expect(classifyRequest("What is the agent status?")).toBe("read_agent_status");
  });

  it("treats harmless lookup as bounded work, not a write", () => {
    expect(
      classifyRequest("Look up nearby charging tips. Do not change anything."),
    ).toBe("delegate_bounded_task");
  });

  it("does not let merge phrasing hide behind bounded delegation", () => {
    expect(
      classifyRequest("Delegate a bounded task to merge the pull request"),
    ).toBe("merge_pull_request");
  });

  it("classifies deploy, pay, destroy, and vehicle control as those actions", () => {
    expect(classifyRequest("Deploy to production")).toBe("deploy_production");
    expect(classifyRequest("Pay the invoice")).toBe("send_payment");
    expect(classifyRequest("Destroy the database")).toBe(
      "destructive_external_write",
    );
    expect(classifyRequest("Unlock the car")).toBe("vehicle_control");
  });
});
