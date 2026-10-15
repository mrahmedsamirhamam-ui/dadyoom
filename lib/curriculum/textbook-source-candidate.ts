/**
 * Candidate links for independently reviewed textbook TOCs only.
 * A ministry teaching plan or book *catalog* is not the textbook itself.
 * An accepted URL remains unverified until the book and edition are inspected.
 */
export function textbookSourceCandidate(raw: string): string | null {
  let url: URL;
  try { url = new URL(raw.trim()); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!["edunet.bh", "www.edunet.bh", "moe.gov.bh", "www.moe.gov.bh"].includes(host)) return null;
  const p = url.pathname.toLowerCase();
  if (/\/manual\/plans[12]-/u.test(p) || /\/manual\/books20\d\d\/books\d+\.pdf$/u.test(p)) return null;
  if (/\/econtent\/(?:booksguide|lessonsguide)\/?$/u.test(p)) return null;
  return url.toString();
}
