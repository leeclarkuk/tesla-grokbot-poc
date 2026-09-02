# tesla-grokbot-poc

Voice-first driver companion. First vehicle integration is Tesla.

Talk while driving. Inspect while parked.

## What this repository proves

**Build 0** (frozen at `d96290c`): text stand-in for voice, policy with motion `unknown`, in-memory agent adapter, bounded task or a short refusal, spoken or text response.

**Build 1** (ADR-0009): microphone on the iPhone, Apple Speech, full transcript to the existing TypeScript `VoiceCompanion`, spoken reply over Tesla Bluetooth. Policy, classification, and the gateway stay in the Node process. The HTTP listener is a presentation adapter, not a new service.

Programmatic entry remains `createInMemoryCompanion()` in `src/application`. Phone entry is `POST /utterance`.

## Docs

- Agent operating instructions: [`AGENTS.md`](AGENTS.md)
- Architecture and ADRs: [`docs/architecture/README.md`](docs/architecture/README.md)
- ADR-0009: [`docs/architecture/decisions/0009-iphone-speech-io.md`](docs/architecture/decisions/0009-iphone-speech-io.md)
- MVP boundary: [`docs/product/mvp.md`](docs/product/mvp.md)
- Driver safety policy: [`docs/product/driver-safety-policy.md`](docs/product/driver-safety-policy.md)
- Threat model: [`docs/product/threat-model.md`](docs/product/threat-model.md)

## Run the TypeScript companion

Node 22 or newer. The listener binds `0.0.0.0:8787` by default so a phone on a hotspot or LAN can reach it. Loopback (`127.0.0.1`) is wrong for that topology. Do not expose this to the public internet.

```bash
npm install
npm run build
npm run listen
```

Override bind with `COMPANION_HOST` and `COMPANION_PORT`.

On the developer machine, note a reachable address (personal hotspot is enough), for example `http://172.20.10.2:8787`.

- `GET /health` → `{ "ok": true }`
- `POST /utterance` with `{ "text": "...", "capturedAt": "<ISO-8601>" }` → `{ "text": "<spoken reply>" }`

Motion is hardcoded `unknown`. A `motion` field in the JSON is ignored. Callers cannot supply parked.

Each turn logs one JSON line on stdout: `timestamp`, `transcript`, `classifiedAction`, `policyDecision`, `spokenText`, `createTaskRan`.

### createTask allowlist

Policy may ALLOW pause, navigation, and similar while moving. This application slice still only calls `createTask` for:

`delegate_bounded_task` | `request_research` | `ask_question`

That list is `CREATE_TASK_ALLOWLIST` in `src/application/companion.ts`. Do not expand it here. Pause and navigation currently speak agent status. That is a documented gap, not a silent success.

## Run the iPhone app

Native Swift, not React Native. Single target: `ios/DrivingVoiceProof/`.

This Linux runner does not have `xcodebuild`. Compile on a Mac.

1. Pair the iPhone with Tesla Bluetooth (audio path, not Fleet API).
2. Open `ios/DrivingVoiceProof/DrivingVoiceProof.xcodeproj` in Xcode.
3. Select your development team (Automatic signing).
4. Install on a physical iPhone. On-device speech is required; the simulator is a poor proof.
5. While parked: set the companion URL, tap **Enable microphone and speech**, grant mic and speech.
6. Tap **Listen**, speak the full request, tap **Stop and send**. The app POSTs the whole transcript and speaks `SpokenResponse.text` on the same Bluetooth route.

The parked screen is setup only. There is no driving dashboard.

### Two spoken cases

1. "What are my agents doing?" → classified `read_agent_status`, spoken status, `createTask` does not run.
2. "Tell the agent to research that deployment problem and then merge the fix." → high-consequence phrasing wins, refused, `createTask` does not run.

## Gates

```bash
npm install
npm run build
npm test
npm run typecheck
npm run lint
```
