# How to run Build 1 from a parked phone

Operator page only. Architecture, ADRs, and the agent map live elsewhere. This is not a second source of truth.

## Topology

iPhone in the car. Companion on a Mac or other dev machine the phone can reach, typically the phone's personal hotspot. The phone is parked for setup. The companion still treats motion as `unknown` (callers cannot supply parked).

Do not host the companion. Do not expose `0.0.0.0:8787` to the internet. Loopback (`127.0.0.1`) is the wrong bind for a phone on the hotspot.

Tesla Bluetooth is the audio path. Not Fleet API. Not vehicle commands.

## Companion

Node 22 or newer, on the machine the phone can reach.

```bash
npm install
npm run build
npm run listen
```

Default listen is `0.0.0.0:8787`. Override with `COMPANION_HOST` and `COMPANION_PORT`.

Note a LAN address the phone can hit, for example `http://172.20.10.2:8787`. Check `GET /health` → `{ "ok": true }`.

## Parked iPhone

Compile on a Mac. Physical iPhone. Simulator is a poor proof.

1. Pair the iPhone with Tesla Bluetooth (audio only, not Fleet API).
2. Open `ios/DrivingVoiceProof/DrivingVoiceProof.xcodeproj` in Xcode on a Mac.
3. Select your development team (Automatic signing).
4. Install on the physical iPhone.
5. While parked: set the companion URL (`http://<lan-ip>:8787`, LAN or hotspot, not public), tap **Enable microphone and speech**, grant mic and speech.
6. Tap **Listen**, speak the full request, tap **Stop and send**.

The parked screen is setup only. There is no driving dashboard. The app POSTs the whole transcript and speaks the reply on the same Bluetooth route.

iOS compile and Tesla Bluetooth audio were not run from the Linux companion check on `a02184b`.

## Two spoken cases

Evidenced on main `a02184b` at 13:17 Europe/London, companion HTTP on a local bind only, then stopped.

1. "What are my agents doing?" Spoken: Companion is idle. Classified `read_agent_status`. `createTaskRan` false.
2. "Tell the agent to research that deployment problem and then merge the fix." Spoken: No. That is not allowed. Classified `deploy_production`, decision DENY, `createTaskRan` false. `\bdeploy` matches "deployment" before merge, so this utterance does not queue a merge. Do not document this compound case as REQUIRE_PARKED_APPROVAL.

`merge_pull_request` in the catalogue is still queue-merge-from-the-seat (REQUIRE_PARKED_APPROVAL). That rule is separate from this spoken proof.

## Do not

- Tesla vehicle commands
- A real agent adapter
- Origin as the PR review provider (not on yet)
- Host the companion or expose `0.0.0.0:8787` to the internet
