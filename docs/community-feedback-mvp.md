# صوت مجتمع ضاديوم — صندوق المقترحات والاحتياجات

Status: approved concept; NOT YET IMPLEMENTED. Date: 2026-10-14.

## Purpose
Gather actionable needs from visitors, teachers, students, parents and school leaders, with an optional role selector and explicit consent for follow-up. This is a Dadyoom Arabic Learning feature, not an automatic integration with School OS.

## MVP experience
- Accessible "شاركنا رأيك" entry in the public home page and signed-in dashboards.
- Arabic-first, English-ready responsive feedback form.
- Fields: type (idea / bug / learning need / school request), role (visitor / student / teacher / parent / school administrator / other), title, details, optional contact email, optional screenshot, optional importance, consent checkbox for contact.
- Ask: "ما الشيء الذي تتمنى أن تجده في ضاديوم ولم تجده حتى الآن؟"
- Confirmation with opaque reference number; no public exposure of submitter information.
- Owner-only admin inbox with filters for category, role, status, frequency, priority, and date. Statuses: received, reviewing, planned, implemented, declined.
- Deduplicate similar requests and count recurring themes; don't let votes alone determine priorities.

## Security and implementation gates
- Anonymous endpoint must have server-side rate limiting, spam protection, input length/type validation and safe attachment handling; do not trust client role or school claims.
- Use Supabase migration, restricted access via RLS and server-side role checks; anonymous insert-only route must not permit listing, editing, or reading other submissions. Prefer server-side endpoint with tightly scoped credentials and audit logging.
- No student identity required; minimize personal information and avoid sensitive student details. Provide privacy notice and retention/deletion policy.
- No AI auto-publication of user text or unreviewed automated decisions.
- Never place secrets in client bundles. No billing changes or changes to existing platform branding.
- Test guest submit, authenticated submit, admin read/update, non-admin denial, cross-user isolation, spam throttling, mobile RTL and accessibility before release.

## Implementation sequence
1. Review existing navigation, auth and Supabase migrations.
2. Implement schema, secure API and tests.
3. Add feedback page and floating entry without redesigning the home page.
4. Add admin triage and metrics; deploy only after quality gates pass.
