/**
 * Bounded streaming multipart reader for small student voice recordings.
 * Multipart parsing normally buffers the entire request. Content-Length may
 * be absent or forged, so enforce the byte cap while the stream is read.
 */
export type BoundedMultipartResult =
  | { ok: true; value: FormData }
  | { ok: false; status: 400 | 413 | 415 };

export async function readBoundedMultipart(
  request: Request,
  maxBytes = 9 * 1024 * 1024,
): Promise<BoundedMultipartResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new Error("Invalid multipart size bound");
  }
  const contentType = request.headers.get("content-type");
  if (!contentType || !/^multipart\/form-data\s*;/i.test(contentType)) {
    return { ok: false, status: 415 };
  }

  const declared = request.headers.get("content-length");
  if (declared !== null) {
    if (!/^\d+$/.test(declared)) return { ok: false, status: 400 };
    if (Number(declared) > maxBytes) return { ok: false, status: 413 };
  }
  if (!request.body) return { ok: false, status: 400 };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        // Never wait for the rest of an oversized/hostile upload.
        void reader.cancel().catch(() => undefined);
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let cursor = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, cursor);
      cursor += chunk.byteLength;
    }
    const parsed = await new Response(new Blob([bytes.buffer]), {
      headers: { "content-type": contentType },
    }).formData();
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }
}
