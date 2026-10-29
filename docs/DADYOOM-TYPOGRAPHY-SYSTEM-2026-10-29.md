# Dadyoom typography system v2 — October 29, 2026

## Purpose
Provide a clear, consistent, professional Arabic interface across the public site, admin, student, teacher, school, parent, interactive lesson and login experiences.

## Type hierarchy
| Use | Family | Source | Fallback |
| --- | --- | --- | --- |
| Interface: navigation, body text, forms, buttons and cards | Tajawal | Google Fonts CSS request with `display=swap` | Noto Sans Arabic, Tahoma, Arial |
| Headings, page titles, section headings, promotional banners | Cairo | Same Google Fonts stylesheet | Tajawal, Tahoma, Arial |
| Extended lesson passages, explanation and Arabic reading | Noto Naskh Arabic | Same Google Fonts stylesheet | Traditional Arabic, serif |
| Code and technical literals | System monospace | Device-native | System monospace |

- Families live in exactly one `:root` CSS token block.
- The Tailwind 4 `--font-sans`/ `--font-heading` / `--font-reading` tokens reference these CSS custom properties.
- Existing `.font-arabic-display` and `.font-arabic-reading` classes are preserved for backward compatibility, but their styling no longer conflicts.
- Semantic headings use Cairo by default even when a route lacks a typography utility class.
- Long lesson text is set in Noto Naskh Arabic at a readable width and responsive size; questions, buttons, inputs and grading logic are untouched.
- Fallback fonts work when fonts.googleapis.com is blocked; the design uses `display=swap`.
- There are no new dependencies, billable resources or changes to user data.
- The web-font stylesheet requires access to Google Fonts at runtime; fonts are NOT self-hosted and an offline device uses local fallbacks.

## Testing and accessibility
- Vitest enforces token-family selection, absence of conflicting declarations, the stylesheet fallback strategy, and reading treatment.
- GitHub Actions checks the targeted test, TypeScript, ESLint and a production Next.js build.
- Visual browser/mobile testing and live Cloudflare deployment remain separate acceptance steps. This is not a statement that the live website already uses these fonts.
- Preserve Arabic diacritics and punctuation: use normal glyph shaping, no positive Latin-style tracking in Arabic.
- Relevant current deployment blocker: https://github.com/mrahmedsamirhamam-ui/dadyoom/issues/46
