import { describe, expect, it } from "vitest";
import { classifyRequest } from "./classify.js";

describe("classifyRequest", () => {
  it("reads agent status as a status query", () => {
    expect(classifyRequest("What is the agent status?")).toBe("read_agent_status");
  });

  it("reads 'What are my agents doing?' as status, not a question", () => {
    expect(classifyRequest("What are my agents doing?")).toBe("read_agent_status");
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

  it("classifies inflected merge, deploy, pay, destroy, and window phrasing as those actions", () => {
    expect(classifyRequest("merges the pull request")).toBe(
      "merge_pull_request",
    );
    expect(classifyRequest("deploys production")).toBe("deploy_production");
    expect(classifyRequest("make a payment")).toBe("send_payment");
    expect(classifyRequest("destroys the database")).toBe(
      "destructive_external_write",
    );
    expect(classifyRequest("roll down the windows")).toBe("vehicle_control");
    expect(
      classifyRequest("do a bounded task that merges the pull request"),
    ).toBe("merge_pull_request");
  });
});
