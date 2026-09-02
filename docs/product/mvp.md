# Initial MVP

Do not build the whole product. The first vertical has to prove the loop works without turning the car into a workstation.

## In scope for the first vertical

Prove only:

**voice or other input → Agent Gateway → provider adapter → query agent status → delegate a safe bounded task → receive result → concise spoken or text response**

Constraints:

- One fake or in-memory adapter is enough. No vendor SDK.
- The bounded task must be policy-`ALLOW` while moving (status, summary, or a harmless research-style task).
- Response is short. No dashboard.
- No Tesla vehicle commands.

## Likely second slice

Navigation: "find the address and navigate there". Still no vehicle control beyond handing a destination to a navigation adapter.

## Out of scope until later

- Arbitrary Tesla vehicle commands
- Fleet API writes
- Payments, deploys, production shell, permission changes
- Live Postgres (decision is taken; implementation waits)
- Real speech-to-speech provider
- Multi-provider routing
- UI for complex inspection while driving

## First implementation slice

This slice is implemented in `src/application` plus `src/adapters/in-memory.ts`.

1. Accept a text stand-in for voice input (`VoiceUtterance.text`).
2. Classify the request against the policy catalogue with motion `unknown` (treated as moving).
3. Call `AgentGateway.listAgents` / `getAgentStatus` on an in-memory adapter.
4. If allowed, `createTask` for a bounded, non-writing task.
5. `getResult` and return a short `SpokenResponse`.

Stop there. No OAuth, no streaming, no telemetry pipeline, no Tesla SDK, no UI. High-consequence phrasing is classified as that action, not as `delegate_bounded_task`.

## Success for later slices

A slice is done when the four gates pass, safety review has run if needed, and `independent-reviewer` has not returned `DENY`.
