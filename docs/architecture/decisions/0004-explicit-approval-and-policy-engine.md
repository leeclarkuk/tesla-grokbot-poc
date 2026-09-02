# ADR-0004: Explicit approval and policy engine

## Status

Accepted

## Context

Voice makes it easy to ask for something dangerous without noticing. Scattering `if (moving)` checks through presentation code will miss paths and hide the real rule set.

The product needs a single, inspectable classification for actions.

## Decision

Policy is a data-driven engine, independent of presentation. Decisions are:

`ALLOW` | `DENY` | `REQUIRE_CONFIRMATION` | `REQUIRE_PARKED_APPROVAL` | `REQUIRE_EXTERNAL_APPROVAL`

The domain catalogue lives in `docs/product/driver-safety-policy.md`. The executable catalogue lives in `src/policy`. Those two must stay aligned. Unclassified external writes are denied, not guessed.

## Consequences

- Presentation asks policy. It does not invent policy.
- Adding an action means adding a catalogue row and a test, not a new conditional in the voice layer.
- High-consequence actions can require parked state, extra confirmation, or an approval path that is not the driver's voice.
