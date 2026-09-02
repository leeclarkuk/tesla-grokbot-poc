# Driver safety policy

Talk while driving. Inspect while parked.

This is the domain-level action policy. Presentation does not invent extra rules. The executable catalogue in `src/policy` must match this document.

Voice is an input mechanism, not a security boundary. A spoken request is not proof of identity and not a signature.

## Decisions

| Decision | Meaning |
| --- | --- |
| `ALLOW` | Proceed. Keep the response short enough to hear while driving. |
| `DENY` | Do not accept the intent. Say so briefly. |
| `REQUIRE_CONFIRMATION` | Need an explicit confirm that is not the original utterance. Still subject to motion rules. |
| `REQUIRE_PARKED_APPROVAL` | Intent may be recorded. Execution waits until the vehicle is parked and the driver approves. |
| `REQUIRE_EXTERNAL_APPROVAL` | Parked is not enough. Another approval path is required (device factor, second channel, or out-of-band reviewer). Voice cannot satisfy this. |

Unknown motion is treated as moving.

Unclassified external writes are `DENY`.

## While moving (or unknown)

Allowed:

- Read agent status
- Read concise summaries
- Ask questions
- Delegate bounded work that cannot itself complete a high-consequence write
- Request drafts
- Pause an agent
- Request research
- Request navigation
- Hear alerts that will need attention later

Not allowed to complete while moving. Catalogue as `DENY` or `REQUIRE_PARKED_APPROVAL`:

- Merge pull requests
- Deploy production
- Delete infrastructure
- Change access permissions
- Send payments or other financial transfers
- Destructive external writes
- Bypass security controls
- Execute arbitrary shell against production
- Send highly consequential communications

Bounded delegation while moving must not be a back door. If the delegated task would merge, pay, deploy, or destroy, policy applies to that action, not to the speech that requested it.

## Catalogue

| Action | Moving / unknown | Parked |
| --- | --- | --- |
| Read agent status | `ALLOW` | `ALLOW` |
| Read concise summary | `ALLOW` | `ALLOW` |
| Ask question | `ALLOW` | `ALLOW` |
| Delegate bounded task | `ALLOW` | `ALLOW` |
| Request draft | `ALLOW` | `ALLOW` |
| Pause agent | `ALLOW` | `ALLOW` |
| Resume agent | `REQUIRE_CONFIRMATION` | `ALLOW` |
| Cancel agent | `REQUIRE_CONFIRMATION` | `ALLOW` |
| Request research | `ALLOW` | `ALLOW` |
| Request navigation | `ALLOW` | `ALLOW` |
| Hear deferred alert | `ALLOW` | `ALLOW` |
| Merge pull request | `REQUIRE_PARKED_APPROVAL` | `REQUIRE_CONFIRMATION` |
| Send consequential communication | `REQUIRE_PARKED_APPROVAL` | `REQUIRE_CONFIRMATION` |
| Destructive external write | `DENY` | `REQUIRE_PARKED_APPROVAL` |
| Deploy production | `DENY` | `REQUIRE_EXTERNAL_APPROVAL` |
| Delete infrastructure | `DENY` | `REQUIRE_EXTERNAL_APPROVAL` |
| Change access permissions | `DENY` | `REQUIRE_EXTERNAL_APPROVAL` |
| Send payment | `DENY` | `REQUIRE_EXTERNAL_APPROVAL` |
| Financial transfer | `DENY` | `REQUIRE_EXTERNAL_APPROVAL` |
| Bypass security control | `DENY` | `DENY` |
| Execute arbitrary production shell | `DENY` | `DENY` |
| Vehicle control | `DENY` | `DENY` until a later ADR |

Vehicle control is denied in both states until an explicit later decision. Do not implement Tesla commands in the initial MVP.

## Confirmation quality

`REQUIRE_CONFIRMATION` must not be satisfied by repeating the wake word or by a single noisy transcription. The confirm step needs a distinct driver action. Parked approval may use a short inspect-and-confirm flow. External approval is never voice-only.
