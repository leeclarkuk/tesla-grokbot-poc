# ADR-0001: Modular monolith first

## Status

Accepted

## Context

This product will talk to vehicles, agent providers, and several external systems. That shape tempts people into microservices, message meshes, and a platform diagram before there is a working vertical slice.

We need somewhere to put domain, policy, gateway, adapters, presentation, and persistence without pretending we have an operations problem we have not earned.

## Decision

Ship a modular monolith. Module boundaries are encoded in `src/`. Process and network splits wait for evidence: independent scale, independent failure, or an organisational ownership problem that a module cannot carry.

## Consequences

- Faster to test and reason about. One build, four gates.
- Boundaries must be enforced by imports and review, not by repository count.
- Introducing Kubernetes, Kafka, or extra services requires a new ADR and a present problem.
