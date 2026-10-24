/**
 * Bahrain draft preview is private. Profile country and user_metadata are
 * editable by the student, so neither can grant access to unpublished work.
 *
 * An administrator must explicitly set the Boolean claim below in the
 * server-managed Supabase Auth app_metadata of an approved preview account.
 * No implicit country-based elevation or service-role read is permitted.
 */
export function canReadBahrainDraftPreview(
  appMetadata: Record<string, unknown> | null | undefined,
  profileCountry: unknown
): boolean {
  if (appMetadata?.dadyoom_bahrain_draft_preview !== true) {
    return false;
  }

  if (typeof profileCountry !== "string") {
    return false;
  }

  const country = profileCountry.trim().toUpperCase();
  return country === "BH" || country === "BAHRAIN" || country === "البحرين";
}
