# Dadyoom Arabic SEO audit — 2026-10-29

## Observed
- Public search providers returned `https://dadyoom.com/`, `/about`, `/how-to-use` for Dadyoom / ضاديوم queries; this is **not** evidence of Google-specific indexing or a rank guarantee.
- The live website `/robots.txt` and `/sitemap.xml` could not be independently retrieved from this environment; status and body remain unverified.
- The connected GSC Wizard integration returned `payment_required`, so we did not access first-party Google Search Console index coverage or submit a sitemap. Google's free Search Console interface can be used without buying GSC Wizard.
- GitHub source previously fell back to `http://localhost:3000` for canonical/robots/sitemap when `NEXT_PUBLIC_SITE_URL` was missing in production.
- Source `app/sitemap.ts` previously used `.limit(5000)` for published lessons despite a larger curriculum; both queries lacked pagination and depended solely on a service role key.
- Source `app/layout.tsx` already had Arabic titles and `robots.index: true`, so an absent Arabic title was not the core problem.
- GitHub main continues to show failing `Workers Builds: dadyoom`; working SEO source requires a successful live deployment.

## Safe changes
1. In production, `getSiteUrl()` consistently returns `https://dadyoom.com` so canonical metadata, robots sitemap and sitemap URL entries do not accidentally use localhost or staging hosts.
2. `robots.ts` and `sitemap.ts` share the same canonical site helper.
3. Sitemap uses stable ID/slug pagination to include **all successfully fetched published lessons** beyond the old 5,000 row cap. Published-only content remains the only user-facing content included, and errors are logged rather than silently indicating all content exists. If neither service key nor public anon key is configured, the sitemap returns only static routes.
4. Adds optional `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` metadata field for **only** a real verification token; does not invent ownership or submit indexing requests.
5. Automated tests cover production canonical URL, robots sitemap declaration, and public page URLs.
6. Search aliases such as «داديوم» / «ضاديو» are secondary; the official brand remains «ضاديوم / Dadyoom».

## Post-deployment checklist (not yet verified)
- From a real network fetch `https://dadyoom.com/robots.txt` and `https://dadyoom.com/sitemap.xml` and ensure HTTP 200, correct MIME types, host, no `noindex`, and no localhost.
- Verify `/`, `/about`, `/founder` return 200 with canonical `https://dadyoom.com/...` in the initial HTML, no accidental Cloudflare block for Googlebot, and no mixed redirect host.
- In **free Google Search Console**, verify `sc-domain:dadyoom.com` or exact https origin; inspect URL coverage for the three core URLs and submit `https://dadyoom.com/sitemap.xml` after live publication.
- Check Core Web Vitals and SEO indexing coverage over time, not by repeated sitemap resubmissions.
- Build links from genuine educator/author profiles and original Arabic educational content; avoid keyword stuffing or fake backlink schemes.
- Cloudflare deployment blocker is tracked in https://github.com/mrahmedsamirhamam-ui/dadyoom/issues/46 .

**Changes here do not imply that Google indexed the domain or that Cloudflare live deployment succeeded.**
