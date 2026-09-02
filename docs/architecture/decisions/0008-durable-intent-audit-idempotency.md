# ADR-0008: Durable intent, audit, and idempotency for consequential external actions

## Status

Accepted

## Context

Provider calls, GitHub writes, mail sends, and any future vehicle command will retry. Duplicate events will arrive. The driver will ask "did that merge?" after a tunnel. If we execute as a side effect of a voice handler, we will double-write and be unable to explain ourselves.

## Decision

For consequential external actions:

1. Record durable intent first, distinct from execution.
2. Append an audit record for approvals and external attempts.
3. Execute through an idempotent adapter (idempotency key on the intent).
4. Treat retries as normal. The second attempt must not create a second effect.

This foundation does not implement the write path. Later slices must not skip these four steps.

## Consequences

- Presentation must not call GitHub, Gmail, or Tesla directly.
- Exactly-once is not claimed. At-least-once with idempotent handlers is the design.
- Kafka is not implied. Durable rows and a boring retry loop come first.
