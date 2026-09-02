import SwiftUI

/// Parked setup only. Not a driving dashboard. No agent list, no policy UI.
struct SetupView: View {
    @State private var model = SetupModel()

    var body: some View {
        NavigationStack {
            Form {
                Section("Companion") {
                    TextField("http://HOST:8787", text: $model.companionURL)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Text("Type the developer machine address on the hotspot or LAN. Loopback will not work from the phone.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section("Parked setup") {
                    Text("Enable the audio session while parked. Then listen over Tesla Bluetooth. This screen is setup, not a dashboard.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    Button("Enable microphone and speech") {
                        Task { await model.enableAudio() }
                    }
                    .disabled(model.phase == .listening || model.phase == .working)
                    Button(model.phase == .listening ? "Stop and send" : "Listen") {
                        Task { await model.toggleListen() }
                    }
                    .disabled(!model.audioReady || model.phase == .working)
                }

                Section("Status") {
                    Text(model.status)
                    if !model.lastTranscript.isEmpty {
                        Text("Heard: \(model.lastTranscript)")
                            .font(.footnote)
                    }
                    if !model.lastSpoken.isEmpty {
                        Text("Spoken: \(model.lastSpoken)")
                            .font(.footnote)
                    }
                }
            }
            .navigationTitle("Driving voice proof")
        }
    }
}

@MainActor
@Observable
final class SetupModel {
    enum Phase {
        case idle
        case listening
        case working
    }

    var companionURL = "http://192.168.0.10:8787"
    var audioReady = false
    var phase: Phase = .idle
    var status = "Parked: set the companion URL, then enable audio."
    var lastTranscript = ""
    var lastSpoken = ""

    private let speech = DrivingSpeechIO()

    func enableAudio() async {
        let allowed = await speech.requestPermissions()
        guard allowed else {
            status = "Microphone or speech permission denied."
            audioReady = false
            return
        }
        do {
            try speech.prepareAudioSession()
            audioReady = true
            status = "Audio session ready. Bluetooth HFP is allowed. Listen when you want to speak."
        } catch {
            audioReady = false
            status = error.localizedDescription
        }
    }

    func toggleListen() async {
        if phase == .listening {
            await stopAndSend()
            return
        }
        await startListening()
    }

    private func startListening() async {
        do {
            try speech.beginListening()
            phase = .listening
            status = "Listening. Speak the full request. Stop and send when done."
        } catch {
            phase = .idle
            status = error.localizedDescription
        }
    }

    private func stopAndSend() async {
        phase = .working
        status = "Transcribing…"
        do {
            let transcript = try await speech.endListening()
            lastTranscript = transcript
            status = "Sending full transcript…"

            guard let url = URL(string: companionURL.trimmingCharacters(in: .whitespacesAndNewlines)) else {
                throw CompanionClientError.invalidURL
            }
            let client = CompanionClient(baseURL: url)
            let spoken = try await client.requestSpokenReply(transcript: transcript)
            lastSpoken = spoken.text
            status = "Speaking reply."
            await speech.speak(spoken.text)
            phase = .idle
            status = "Idle."
        } catch {
            phase = .idle
            status = error.localizedDescription
        }
    }
}
