# ADR-0006: Moving-versus-parked action policy

## Status

Accepted

## Context

The product exists to keep the driver's eyes on the road. If moving and parked share the same capability set, it will become a dashboard. Unknown motion is common: GPS stale, Bluetooth drop, telemetry late.

## Decision

Motion is part of every policy evaluation: `moving`, `parked`, or `unknown`.

Unknown is treated as moving. That is the safer default. Loosening it needs evidence and a new ADR.

While moving (or unknown): read status, hear concise summaries, ask questions, delegate bounded work, request drafts, pause an agent, request research, request navigation, hear alerts that need later attention.

While moving: do not merge, deploy, delete infrastructure, change permissions, send payments, run production shell, bypass security, or complete other high-consequence writes. Those are `DENY` or `REQUIRE_PARKED_APPROVAL` as catalogued.

Talk while driving. Inspect while parked.

## Consequences

- Navigation may be requested while moving. Vehicle control is not this decision and is out of MVP.
- A task may be accepted as bounded work while moving and still require parked approval before an external write.
- Policy tests lock the moving path. Do not "just allow it this once" in presentation.
