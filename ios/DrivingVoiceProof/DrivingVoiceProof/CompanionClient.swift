import Foundation

struct VoiceUtterance: Encodable {
    let text: String
    let capturedAt: String
}

struct SpokenResponse: Decodable {
    let text: String
}

enum CompanionClientError: LocalizedError {
    case invalidURL
    case httpStatus(Int)
    case emptyTranscript
    case emptyReply

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Companion URL is not valid."
        case .httpStatus(let status):
            return "Companion returned HTTP \(status)."
        case .emptyTranscript:
            return "No transcript to send."
        case .emptyReply:
            return "Companion returned an empty spoken reply."
        }
    }
}

/// Thin HTTP client. Sends the full transcript. Does not classify, split
/// clauses, drop text, or call an agent gateway.
struct CompanionClient {
    var baseURL: URL

    func requestSpokenReply(transcript: String) async throws -> SpokenResponse {
        let trimmed = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw CompanionClientError.emptyTranscript }

        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            throw CompanionClientError.invalidURL
        }
        var path = components.path
        if path.hasSuffix("/") {
            path.removeLast()
        }
        components.path = "\(path)/utterance"
        guard let url = components.url else {
            throw CompanionClientError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 30
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let body = VoiceUtterance(text: trimmed, capturedAt: formatter.string(from: Date()))
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200 ..< 300).contains(status) else {
            throw CompanionClientError.httpStatus(status)
        }

        let spoken = try JSONDecoder().decode(SpokenResponse.self, from: data)
        let reply = spoken.text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !reply.isEmpty else { throw CompanionClientError.emptyReply }
        return SpokenResponse(text: reply)
    }
}
