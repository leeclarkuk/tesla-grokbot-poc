/** Voice is an input mechanism, not a security boundary. */
export interface VoiceUtterance {
  readonly text: string;
  readonly capturedAt: string;
}

export interface SpokenResponse {
  readonly text: string;
}
