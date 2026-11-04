# Dadyoom — ownership attribution and production safety gate

Date: 2026-10-29. **Audit branch only; no production configuration change.**

## Confirmed inputs
- Founder declaration: Ahmed Samir Mohamed Hafez Hamam states there are no partners as of 2026-10-29 and no authorization or contract with QAMORYX Technologies W.L.L. This is a declaration, **not** a judicial or registration finding.
- Existing evidence: `docs/LEGAL-ATTRIBUTION-AUDIT-2026-10-29.md` records company attribution in public About, Terms, Privacy pages. Preserve that snapshot for provenance.

## Required checks before correction
1. Identify deployed source for About, Terms, Privacy and configuration references, including CMS/database/edge caches and environment values. Confirm deployment branch and exact SHA.
2. Determine actual operator, data controller, payment contracting party and statutory disclosures with competent advice where necessary; do not substitute an unverified legal designation.
3. Remove unsupported company references in a scoped PR, keeping privacy disclosures truthful and complete. Do not remove necessary legal notices or modify billing credentials.
4. Run build, lint, typecheck, tests, accessibility and localization checks; inspect diff for accidental content/secret exposure.
5. Test authentication, lessons, grading, parent/teacher/school roles, contact, policies and API health in staging; deploy with rollback and verify all public pages.
6. Audit least-privilege collaborators, branch protections, required reviews, MFA/passkeys, recovery methods, domain registrar lock/renewal, DNS, Cloudflare and Supabase permissions, RLS, secrets and backup restoration. Never commit credentials or personal records.
7. Track quality against WCAG 2.2 AA, OWASP ASVS, Core Web Vitals, and curriculum/assessment rubrics, with measured evidence rather than a claimed certification.

## Release gate
No direct production edits until source is located, tests pass and rollback is available. GitHub account control and founder statements are provenance indicators, not conclusive legal title or trademark registration. This file intentionally contains no private repository details or sensitive personal documents.
