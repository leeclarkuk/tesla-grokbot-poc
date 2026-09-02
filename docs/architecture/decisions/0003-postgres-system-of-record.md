# ADR-0003: Postgres as durable system of record

## Status

Accepted

## Context

Agent state, approvals, and intent must survive a crashed phone, a flaky car Bluetooth link, and retried provider calls. Treating GitHub, Gmail, Tesla, or a model vendor as the database would couple durability to someone else's outage and make audit impossible.

No live database ships in this foundation. The decision is the destination, not a hidden Postgres install.

## Decision

Postgres is the durable system of record. External systems are integrations. Persistence code talks to ports in `src/persistence`. A disconnected client may queue local input. It must not become the source of truth for agent lifecycle.

## Consequences

- First real persistence slice adds Postgres, migrations, and repository implementations. Not before.
- Other stores (Redis, object storage) need a present problem and a new ADR.
- Client caches are disposable. Reconciliation reads from durable state.
