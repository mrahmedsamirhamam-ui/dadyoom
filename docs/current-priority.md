# Dadyoom — Current Product Priority

Updated: 2026-09-25

## Current launch gate

The national Arabic curriculum match is closed for the currently published and verifiable official scope in all 22 Arab countries.

Current priority is commercial launch readiness:

1. Activate Dadyoom Plus checkout through Paddle.
2. Keep the automatic 24-hour Plus welcome trial for every new account.
3. Keep the Free plan ad-supported and Plus ad-free.
4. Complete Google AdSense site verification and approval.
5. Deploy with production billing/ad environment variables only after the external account values are available.
6. Run lint, tests, curriculum gate, and production/Vinext build before promotion.

## Paddle contract

Plus plan:
- 10.00 USD / month.
- Checkout is card-based through Paddle.js.
- Dadyoom never stores card data.
- Subscription activation/cancellation is driven by signed Paddle webhooks.
- Required deployment variables:
  - PADDLE_ENVIRONMENT
  - PADDLE_CLIENT_TOKEN
  - PADDLE_PLUS_PRICE_ID
  - PADDLE_WEBHOOK_SECRET
  - PADDLE_API_KEY (server-side; subscription.read + customer portal session permissions)
- Webhook endpoint:
  - /api/payments/paddle/webhook
- Success page:
  - /payments/paddle/success
- Signed-in subscription management:
  - /api/payments/paddle/manage

Fail-closed rule:
- If Paddle credentials are absent, checkout does not fabricate a payment session and returns PADDLE_NOT_CONFIGURED.

## AdSense contract

Free web users may see light ads outside sensitive learning/account/payment areas.
Plus users never load the AdSense script.
Native mobile apps do not load web AdSense.

Required deployment variable:
- ADSENSE_CLIENT=ca-pub-...

Runtime:
- /api/ads/config exposes only a validated public AdSense publisher client.
- /ads.txt is generated from the same publisher ID.
- Root metadata publishes google-adsense-account when the ID is configured.

Account-side requirements remain external to the repository:
- add the production site to AdSense;
- complete site/identity review when requested;
- configure consent/CMP and page exclusions where required;
- enable Auto ads or create explicit ad units after approval.

## Curriculum status

- Dadyoom Core: 22/22.
- National Official Match current scope: 22/22.
- Pending countries: 0.
- Tunisia and Mauritania retain 13 official levels in the national layer; Core remains 12 grades.
- Do not replace the national evidence model with invented lesson titles when an official source only supports a book, stage, track, or competency bundle.

## Video engine policy

Cloud-first rendering remains the default. Payment/ads work must not change AI/video provider routing unless a separate task explicitly requests it.
