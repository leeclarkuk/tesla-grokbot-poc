# ADR-0009: iPhone speech I/O, TypeScript companion owns policy

## Status

Accepted

## Context

Build 0 proved the text stand-in loop: `VoiceUtterance` → classify → policy with motion `unknown` → in-memory Agent Gateway → short `SpokenResponse`.

Build 1 has to replace that stand-in with a driving path. The microphone and Tesla Bluetooth audio route live on the iPhone. Policy, classification, and the gateway already live in `src/`.

Two tempting mistakes: rewrite VoiceCompanion in Swift (two catalogues, ADR-0004 drifts), or skip to a vendor speech-to-speech SDK (the MVP deferred that; core must not take a speech-provider SDK).

The hardware split is a present requirement, not a scale argument. ADR-0001 still holds: this is not a new service.

## Decision

The iPhone is presentation only. It captures audio, transcribes, plays a short spoken reply, and routes sound over Bluetooth. It uses Apple Speech (`SFSpeechRecognizer`) and `AVSpeechSynthesizer`. Prefer on-device recognition. Do not add a vendor STT, TTS, or speech-to-speech provider in this slice.

`VoiceCompanion`, `classifyRequest`, `src/policy`, and the in-memory Agent Gateway stay in the existing TypeScript process. Motion stays `unknown` (treated as moving). Callers still cannot supply parked.

The phone sends the **full** transcript as `VoiceUtterance` and speaks `SpokenResponse.text`. One request/response in the same Node process (a small HTTP listener is a presentation adapter, not a new service). The phone must not classify, split clauses, drop the high-consequence part, or call the gateway.

Tesla Bluetooth is the audio path. It is not a Tesla adapter and not Fleet API (ADR-0007: audio from the car is presentation).

Starting the audio session while parked is allowed. Always-on wake-word from a cold app is not this slice.

## Consequences

- One policy implementation remains in `src/policy`. High-consequence phrasing still wins in `classifyRequest`; mixed utterances such as research-plus-merge are refused as the high-consequence action and must not create a task.
- In-car dictation quality and Bluetooth HFP limits are accepted and measured. They are not a reason to start with Whisper, ElevenLabs, or a realtime speech API.
- Topology for this proof: iPhone in the car, TypeScript companion on a developer machine reachable from the phone (personal hotspot is enough). Do not host, and do not put VoiceCompanion on-device.
- Observability is a companion log of transcript, classified action, policy decision, spoken text, and whether `createTask` ran. No driving UI.
- Keys stay off the phone (threat model). OS speech needs none.
