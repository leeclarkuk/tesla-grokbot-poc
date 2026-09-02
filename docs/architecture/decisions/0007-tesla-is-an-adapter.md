# ADR-0007: Tesla is an adapter, not a core dependency

## Status

Accepted

## Context

Tesla is the first vehicle integration. Bluetooth audio, and later Fleet API or Fleet Telemetry, will matter. If domain types are Tesla command names, a second vehicle or a phone-only mode becomes a fork.

The product is a driver companion for autonomous agents. Tesla is how the first driver talks to it.

## Decision

Tesla sits behind adapters. Core domain models motion, driver intent, agents, approvals, and external actions. It does not model Tesla vehicles as the aggregate root.

Do not take a dependency on Tesla SDKs, Fleet API, or vehicle command lists in `src/domain`, `src/policy`, or `src/agent-gateway`.

Arbitrary vehicle commands are out of the initial MVP.

## Consequences

- Audio input from the car is presentation, same as any other microphone path.
- Later vehicle control, if approved, is an adapter plus explicit policy rows.
- Naming in core code stays vehicle-neutral (`motion`, not `autopilotState`).
