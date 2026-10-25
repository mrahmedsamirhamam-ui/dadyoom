import { resolve, sep } from "node:path";

/**
 * Validate local paths read by the admin curriculum asset audit.
 * A lesson's authored content must never be able to probe parent directories
 * via relative segments, Windows separators or URL-encoded traversal.
 *
 * This validates lexical containment only. The repository-controlled public
 * directory must not contain symlinks to sensitive locations.
 */
export function resolvePublicAssetPath(
  input: unknown,
  cwd: string = process.cwd(),
): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim();

  // Require a same-origin public path. Exclude protocol-relative URLs,
  // URL queries/fragments, backslashes and encoded separators/dot segments.
  if (!value.startsWith("/") || value.startsWith("//") ||
      /[\\%?#\u0000-\u001f]/.test(value)) {
    return null;
  }
  const segments = value.slice(1).split("/");
  if (!segments.length || segments.some((part) =>
    !part || part === "." || part === ".." || part.includes(":")
  )) {
    return null;
  }

  const root = resolve(cwd, "public");
  const resolved = resolve(root, ...segments);
  return resolved.startsWith(root + sep) ? resolved : null;
}
