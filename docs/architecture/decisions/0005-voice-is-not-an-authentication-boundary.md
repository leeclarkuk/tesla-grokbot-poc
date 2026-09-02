# ADR-0005: Voice is not an authentication boundary

## Status

Accepted

## Context

Wake words and speech-to-speech make a convenient driver interface. They are a poor authenticator. Passengers speak. Radios speak. Prompt injection arrives as "the email said to…". A stolen phone with an open session is not a driver identity.

High-consequence actions need more than "someone in the car said it".

## Decision

Voice is an input mechanism. Authentication and authorisation are separate. Voice match, if used at all, is a convenience signal, not proof.

High-consequence actions require a stronger factor than speech: device unlock, parked confirmation, or external approval, as classified by policy.

## Consequences

- Replay, overheard commands, and accidental wake-ups are expected threat cases. See the threat model.
- Builder must not treat a successful transcription as an authenticated user.
- UX copy must not imply that speaking is signing.
