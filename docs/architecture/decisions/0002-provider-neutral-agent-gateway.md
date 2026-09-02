# ADR-0002: Provider-neutral Agent Gateway

## Status

Accepted

## Context

Agents will come from more than one provider. Grok is a likely adapter, not the product. If core code speaks a vendor's task model, swapping or combining providers becomes a rewrite.

The companion needs a stable way to list agents, inspect status, delegate bounded work, pause or cancel, collect results, and approve or reject actions.

## Decision

All agent interaction goes through a provider-neutral Agent Gateway. The current contract is `AgentGateway` in `src/agent-gateway`. Adapters implement that contract. Provider SDKs stay behind adapters.

Gateway operations: list agents, get status, create task, send instruction, pause, resume, cancel, get result, approve action, reject action.

## Consequences

- Core domain can be tested with a fake adapter.
- Provider-specific features must be translated at the adapter, or explicitly rejected.
- Changing the gateway contract is an architectural change. Ask Architecture Reasoning first.
