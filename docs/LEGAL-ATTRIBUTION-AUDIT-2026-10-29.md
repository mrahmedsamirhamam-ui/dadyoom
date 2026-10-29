# Dadyoom — public founder attribution and legal-operator audit

Date: 2026-10-29
Status: **Source changes prepared; live legal pages NOT changed or verified as deployed**

## Confirmed owner instruction

The project founder/director identifies himself as **أحمد سمير حمام / Ahmed Samir Hamam** and states that all project files and accounts are his. He does not know QAMORYX Technologies W.L.L and did not authorize it to operate Dadyoom.

## Public-site discrepancy

- On 2026-10-29, the publicly readable https://dadyoom.com/about displayed `QAMORYX Technologies W.L.L` near the top.
- Earlier accessible https://dadyoom.com/terms stated that QAMORYX operates the platform; this needs a fresh direct verification from the live deployment before correcting its actual source.
- Repository `mrahmedsamirhamam-ui/dadyoom` default branch `main` did not contain an `app/about` or `app/terms` directory when reviewed. Therefore **changes in this PR do not prove the live site was corrected**.
- QAMORYX appeared in existing Netlify billing team labels and Paddle test transaction emails. This is evidence of a label/configuration in external services, not proof of company ownership or a legal operating agreement.

## Changes prepared in GitHub

- New public founder profile `/founder` (Arabic and English) with Person/ProfilePage and Organization founder structured data.
- New `/about` page identifying the founder/director.
- Home navigation/footer attribution and sitemap entries.
- No modification to payments, merchant-of-record identity, tax data, subscriptions, legal entities, Supabase, student data, or Cloudflare deployment settings.

## Required separate production remediation (not yet done)

1. Identify the actual code/deployment project currently serving `dadyoom.com`, including custom domain, branch, build target, and account.
2. Record a version-controlled snapshot of current /about, /terms, /privacy and all other legal/policy pages.
3. Locate every QAMORYX reference in that actual project, deployed environment variables, SEO metadata and public legal text.
4. Replace inaccurate public operating-entity claims with carefully reviewed, accurate operator/contact wording. **Never replace a legally required merchant identity with an invented one.**
5. Verify any registered business identity against Bahrain Sijilat and the real contracts/accounts. Do not claim registration or trademark ownership solely from GitHub control.
6. Review Netlify team display name and Paddle merchant/product configuration separately. A merchant-of-record/test receipt can retain historic legally required information and should not be rewritten.
7. Run lint/typecheck/build and live-route checks; confirm new /founder and /about, page metadata, structured data, sitemap, and absence of outdated attribution before marking complete.

## Editorial rule

Present Ahmed Samir Hamam as founder/director based on his first-party account. Keep "registered owner", "registered legal operator" and intellectual-property ownership as distinct questions requiring documentary verification.
