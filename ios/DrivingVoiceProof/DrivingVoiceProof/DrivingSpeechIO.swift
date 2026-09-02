import AVFoundation
import Foundation
import Speech

enum SpeechIOError: LocalizedError {
    case recognizerUnavailable
    case onDeviceUnavailable
    case notAuthorized
    case noSpeech
    case notListening
    case alreadyListening

    var errorDescription: String? {
        switch self {
        case .recognizerUnavailable:
            return "Speech recogniser is not available."
        case .onDeviceUnavailable:
            return "On-device speech recognition is not available on this iPhone."
        case .notAuthorized:
            return "Microphone or speech permission was not granted."
        case .noSpeech:
            return "No speech was recognised."
        case .notListening:
            return "Not listening."
        case .alreadyListening:
            return "Already listening."
        }
    }
}

/// Mic capture, on-device Apple Speech, and Bluetooth-routed TTS.
/// No classify, policy, or gateway.
@MainActor
final class DrivingSpeechIO: NSObject, AVSpeechSynthesizerDelegate {
    private let audioEngine = AVAudioEngine()
    private let synthesizer = AVSpeechSynthesizer()
    private var recognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var latestTranscript = ""
    private var listeningResult: Result<String, Error>?
    private var stopContinuation: CheckedContinuation<String, Error>?
    private var speakContinuation: CheckedContinuation<Void, Never>?

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func requestPermissions() async -> Bool {
        let mic = await AVAudioApplication.requestRecordPermission()
        let speech = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status)
            }
        }
        return mic && speech == .authorized
    }

    func prepareAudioSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(
            .playAndRecord,
            mode: .spokenAudio,
            options: [.allowBluetooth, .defaultToSpeaker]
        )
        try session.setActive(true, options: [])
    }

    func beginListening() throws {
        guard recognitionTask == nil else { throw SpeechIOError.alreadyListening }
        try prepareAudioSession()

        guard let recognizer = Self.makeOnDeviceRecognizer() else {
            if SFSpeechRecognizer() == nil || SFSpeechRecognizer()?.isAvailable == false {
                throw SpeechIOError.recognizerUnavailable
            }
            throw SpeechIOError.onDeviceUnavailable
        }
        self.recognizer = recognizer
        latestTranscript = ""
        listeningResult = nil
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        request.requiresOnDeviceRecognition = true
        request.addsPunctuation = true
        request.taskHint = .dictation
        recognitionRequest = request

        let input = audioEngine.inputNode
        let format = input.outputFormat(forBus: 0)
        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            request.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            Task { @MainActor in
                guard let self else { return }
                if let result {
                    self.latestTranscript = result.bestTranscription.formattedString
                    if result.isFinal {
                        self.finishListening(with: .success(self.latestTranscript))
                    }
                }
                if let error {
                    self.finishListening(with: .failure(error))
                }
            }
        }
    }

    func endListening() async throws -> String {
        guard recognitionRequest != nil || listeningResult != nil else {
            throw SpeechIOError.notListening
        }
        recognitionRequest?.endAudio()
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }

        let text: String
        if let listeningResult {
            text = try listeningResult.get()
        } else {
            text = try await withCheckedThrowingContinuation { continuation in
                stopContinuation = continuation
                Task { @MainActor in
                    try? await Task.sleep(for: .seconds(4))
                    if self.stopContinuation != nil {
                        self.finishListening(with: .success(self.latestTranscript))
                    }
                }
            }
        }

        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw SpeechIOError.noSpeech }
        return trimmed
    }

    func speak(_ text: String) async {
        try? prepareAudioSession()
        synthesizer.stopSpeaking(at: .immediate)
        await withCheckedContinuation { continuation in
            speakContinuation = continuation
            let utterance = AVSpeechUtterance(string: text)
            utterance.voice = AVSpeechSynthesisVoice(language: "en-GB")
                ?? AVSpeechSynthesisVoice(language: "en-US")
            utterance.rate = AVSpeechUtteranceDefaultSpeechRate
            synthesizer.speak(utterance)
        }
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        speakContinuation?.resume()
        speakContinuation = nil
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        speakContinuation?.resume()
        speakContinuation = nil
    }

    private func finishListening(with result: Result<String, Error>) {
        recognitionTask = nil
        recognitionRequest = nil
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        if let stopContinuation {
            self.stopContinuation = nil
            stopContinuation.resume(with: result)
        } else {
            listeningResult = result
        }
    }

    private static func makeOnDeviceRecognizer() -> SFSpeechRecognizer? {
        let locales = ["en-GB", "en-US"]
        for id in locales {
            if let recognizer = SFSpeechRecognizer(locale: Locale(identifier: id)),
               recognizer.isAvailable,
               recognizer.supportsOnDeviceRecognition {
                return recognizer
            }
        }
        return nil
    }
}
