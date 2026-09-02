# Threat model

Engineering threat model for the driver companion. Concise on purpose. Residual risk is what we accept until a later control exists.

Voice is an input mechanism, not a security boundary.

| Asset | Threat | Likely consequence | Mitigation | Remaining risk |
| --- | --- | --- | --- | --- |
| Driver session on phone | Stolen or borrowed phone | Attacker talks to agents with the owner's grants | Device lock; policy on high-consequence actions; parked or external approval; short-lived session | Unlocked phone in a stolen car still works until lock or revocation |
| Tesla account | Compromised Tesla credentials | Vehicle data leak; later, unwanted vehicle commands | Tesla stays an adapter; vehicle control denied until a later ADR; least-privilege app tokens; revoke path | Fleet scopes we do not yet constrain in code |
| Provider API key | Leaked model or agent key | Bill shock; attacker-driven agent tasks; data exfiltration | Keys never in the client; adapter-side secrets; no keys in git | A leaked server key can still run allowed actions until rotated |
| Email or webpage content | Prompt injection via "read this" | Agent follows attacker instructions, including escalation | Treat external content as untrusted; policy on writes; no tool use from injected text without classification | Clever injection may still bias summaries |
| Agent runtime | Agent attempts unauthorised escalation | Writes, merges, or vehicle actions the driver did not intend | Gateway and policy sit in front of adapters; unclassified writes denied; audit | A buggy adapter could bypass the gateway if review fails |
| Voice channel | Replayed recording of a command | Repeat of a previous action | Voice is not auth; idempotent intents; confirmation and parked rules for writes | Replay of an `ALLOW` read is low impact; replay of a queued intent needs server-side replay defence |
| Voice channel | Unintended wake-word or mis-heard speech | Unwanted task, distraction, or queued write | Conservative policy while moving; confirmation distinct from the original utterance; easy pause | Mis-hears will happen. Keep moving-path actions cheap to undo |
| Agent output | Malicious or compromised provider response | Driver hears a lie; follow-on tools fire | Do not execute tools from model output without policy; show or speak provenance later | The driver may still trust a fluent lie |
| OAuth refresh token | Stolen refresh token (GitHub, Google, later Tesla) | Persistent access to mail, calendar, repos | Server-side token store; rotation; revoke on logout; no tokens in voice logs | Stolen server store is high impact; needs hardening in the OAuth slice |
| Event log / retry | Duplicate event delivery | Double merge, double mail, double pay | Durable intent plus idempotency keys (ADR-0008) | Handlers that forget the key will double-write |
| Approval record | Stale approval reused | Old "yes" executes a new or changed action | Approvals bind to intent id and hash; expiry; motion re-checked at execute | Clock skew and partial updates need tests in that slice |
| Confused deputy | Agent or adapter uses the driver's token for an attacker goal | Write in the driver's name | Per-action policy; audience-restricted tokens; never pass driver tokens to untrusted agents | A confused adapter is still a High finding |
| Provider adapter | Compromised or malicious adapter code | Gateway bypass, secret theft, unauthorised writes | Thin adapters; no domain import of SDKs; independent review; least privilege | Supply-chain risk on the first real SDK we add |
| Driver attention | Unsafe operation while moving | Distraction; high-consequence write from the seat | Moving-versus-parked catalogue; deny vehicle control in MVP; no dashboard | A determined driver can still park poorly and confirm. Policy reduces, it does not civilise |

## Review trigger

Any new external write, token, or vehicle capability updates this table in the same PR. If a threat has no row, it is not reviewed.
