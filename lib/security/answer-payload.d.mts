export type TrustedAnswerPayload = Readonly<{ ok: true; questionId: string; selectedAnswer: string }> | Readonly<{ ok: false; error: string }>;
export function parseTrustedAnswerInput(raw: unknown): TrustedAnswerPayload;
