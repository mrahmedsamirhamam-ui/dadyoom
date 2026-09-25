# Dadyoom — Payments & Ads Launch Checklist

Updated: 2026-09-25

## Current repository state

- National curriculum current-scope gate: 22/22 countries.
- Free plan: active, ad-supported, daily AI limits.
- Plus plan: 10.00 USD/month, ad-free, unlimited configured feature limits.
- New-user welcome trial: automatic Plus for 24 hours.
- Paddle checkout UI/API/webhook: implemented and fail-closed.
- Paddle self-service subscription management: implemented.
- AdSense runtime loader, ads.txt, and verification meta: implemented and fail-closed.

No live payment or ad traffic should be claimed until the external account values below are configured and approved.

## Paddle sandbox → live

Create one recurring Plus price:

- Product: Dadyoom Plus
- Billing cycle: monthly
- Base currency: USD
- Base amount: 10.00 USD
- Status: active

Create credentials in the matching Paddle environment:

- client-side token
- API key with:
  - price.read
  - subscription.read
  - customer portal session permission
- notification destination/webhook secret

Deployment variables:

- PADDLE_ENVIRONMENT=sandbox or production
- PADDLE_CLIENT_TOKEN
- PADDLE_PLUS_PRICE_ID
- PADDLE_WEBHOOK_SECRET
- PADDLE_API_KEY

Webhook URL:

- https://<production-domain>/api/payments/paddle/webhook

Events handled by Dadyoom:

- transaction.completed
- subscription.activated
- subscription.updated
- subscription.canceled

Checkout safety:

- user authentication is required;
- Paddle credentials must exist;
- configured Paddle price must be active;
- Paddle base price must match 10.00 USD monthly in the Dadyoom database;
- webhook signature is checked against the raw request body;
- webhook events are idempotent through edu_subscription_events;
- Plus is granted from the signed server webhook, not from the browser success page.

Subscription management:

- /api/payments/paddle/manage fetches temporary Paddle customer-portal management URLs.
- Pricing UI exposes update-payment-method and cancellation links for Paddle-managed subscriptions.
- Welcome-trial/manual/admin Plus accounts do not fabricate Paddle management links.

## Google AdSense

Deployment variable:

- ADSENSE_CLIENT=ca-pub-0000000000000000

Optional verification variables already supported:

- GOOGLE_SITE_VERIFICATION
- BING_SITE_VERIFICATION

Repository behavior:

- /api/ads/config exposes only a validated public ca-pub ID.
- /ads.txt emits the Google DIRECT seller line from the same publisher ID.
- root metadata includes google-adsense-account when configured.
- Free web users can load AdSense.
- Plus users do not load the AdSense script.
- native mobile apps do not load web AdSense.
- ads are blocked from lesson, student, teacher, school, admin, payment, pricing, login, signup, and onboarding routes.

AdSense account-side steps:

1. Add the production domain in AdSense Sites.
2. Verify the site using the deployed AdSense meta/ads.txt integration.
3. Request site review.
4. Configure a Google-certified CMP / European regulations message for EEA, UK, and Switzerland traffic when required.
5. Enable Auto ads only after approval, or create explicit ad units later.
6. Add account-side page exclusions for sensitive learning/account routes as defense in depth.
7. Complete Google identity/payment verification if requested.

## Production gate

Before live promotion:

1. Set real Paddle live credentials and PADDLE_ENVIRONMENT=production.
2. Verify /api/payments/paddle/config returns a valid price config for an authenticated user.
3. Run one Paddle sandbox checkout first and confirm:
   - transaction.completed webhook accepted;
   - edu_subscriptions becomes active Plus;
   - edu_subscription_events receives exactly one event per webhook event ID;
   - /api/billing/status returns plan=plus and showAds=false.
4. Verify paid-user subscription management links.
5. Configure ADSENSE_CLIENT and confirm /ads.txt.
6. Complete AdSense site review/CMP.
7. Run:
   - npm run lint
   - npm run test:run
   - npm run curriculum:gate:official-22
   - npm run build:vinext
8. Deploy and perform a final anonymous/free/Plus smoke test.

## Security rules

- Never commit real Paddle keys, webhook secrets, or service-role keys.
- PADDLE_API_KEY and PADDLE_WEBHOOK_SECRET are server-side only.
- Paddle client-side token is intentionally exposed only through the authenticated checkout config endpoint.
- Dadyoom never stores raw card details.
- Do not activate Plus from a browser redirect alone.
