/**
 * Bounded JSON parser for grading endpoints. A Content-Length header alone is
 * not a security limit: requests can be streamed without one or lie about it.
 * Never return the raw body or decoder errors to learners.
 */
export type BoundedJsonResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; status: 400 | 413 };

export async function readBoundedJsonObject(
  request: Request,
  maxBytes = 32768,
): Promise<BoundedJsonResult> {
  const length = request.headers.get("content-length");
  if (length !== null) {
    if (!/^\d+$/.test(length)) return { ok: false, status: 400 };
    if (Number(length) > maxBytes) return { ok: false, status: 413 };
  }

  if (!request.body) return { ok: false, status: 400 };

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        // Do not wait on a malicious or stalled stream to finish.
        void reader.cancel().catch(() => undefined);
        return { ok: false, status: 413 };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();

    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, status: 400 };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    // Invalid UTF-8, JSON, aborted streams, and failed body reads are
    // malformed requests, not internal server errors.
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }
}
