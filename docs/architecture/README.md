# Architecture

This is the conceptual architecture for a voice-first driver companion. First vehicle integration is Tesla. The product is not Tesla-shaped in its core, and it is not an infotainment dashboard.

**Talk while driving. Inspect while parked.**

`src/` encodes module boundaries as TypeScript contracts. The first application slice is the text-to-policy-to-in-memory-agent loop in `src/application`. Later slices must respect those boundaries.

## Conceptual flow

```
Tesla / Bluetooth audio
  → Driver companion application
    → Speech-to-speech AI interface
      → Agent Gateway
        → Agent provider adapters
          → Approval and policy engine
            → External systems
```

External systems may eventually include Tesla Fleet API, Tesla Fleet Telemetry, GitHub, Gmail, Google Calendar, coding agents, Grok-based agents, and other autonomous agent systems. None of those belong in core domain.

The Agent Gateway isolates the companion from individual AI providers. Provider concepts must not leak across that boundary.

## Module boundaries

| Module | Responsibility | Must not |
| --- | --- | --- |
| `src/domain` | Motion, action kinds, shared domain types | IO, SDKs, HTTP, UI |
| `src/policy` | Data-driven action classification | Presentation, provider SDKs |
| `src/agent-gateway` | Provider-neutral agent contract | Vendor types, Tesla commands |
| `src/adapters` | Vendor-specific ports | Be imported by domain or policy |
| `src/application` | Classify a request, ask policy, call the gateway, speak a short result | Invent policy, import vendor SDKs, persist as source of truth |
| `src/presentation/voice` | Voice as input and concise spoken or text output | Act as a security boundary |
| `src/persistence` | Durable store ports | Talk to a live database in this foundation |

Dependencies point inward. Adapters depend on gateway and domain contracts. Domain and policy do not depend on adapters.

## What is in the initial MVP

Prove one vertical:

voice or other input → Agent Gateway → one provider adapter → query agent status → delegate a safe bounded task → receive a result → concise spoken or text response

Navigation is a likely second slice. Vehicle control is later. See `docs/product/mvp.md`.

## What is out of the initial MVP

- Arbitrary Tesla vehicle commands
- Payments, deploys, production shell, permission changes
- Live Postgres, Redis, queues, Kafka, Temporal, Kubernetes, vector databases
- Real speech SDKs, Tesla SDKs, or model-provider SDKs
- A visual dashboard for use while driving

## How ADRs are used

Architecture Decision Records live in `docs/architecture/decisions/`. One decision per file.

- Status is `Accepted` until a later ADR supersedes it.
- Builder consumes ADRs. Builder does not silently reverse them.
- Architecture Reasoning (Grok Bot) is used before changing a major boundary. If the recommendation changes a decision, write a new ADR.
- Do not add speculative ADRs for technologies that have not been chosen.

Current ADRs:

1. Modular monolith first
2. Provider-neutral Agent Gateway
3. Postgres as durable system of record
4. Explicit approval and policy engine
5. Voice is not an authentication boundary
6. Moving-versus-parked action policy
7. Tesla is an adapter, not a core dependency
8. Consequential external actions require durable intent, audit, and idempotency

## Open questions

These need a human decision. They are listed in the foundation PR. Do not invent an answer in code.
