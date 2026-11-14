interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  readonly [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  onstart: ((this: SpeechRecognition, event: Event) => unknown) | null;
  onresult: ((this: SpeechRecognition, event: SpeechRecognitionEvent) => unknown) | null;
  onerror: ((this: SpeechRecognition, event: SpeechRecognitionErrorEvent) => unknown) | null;
  onend: ((this: SpeechRecognition, event: Event) => unknown) | null;
  start(): void;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}
