# Dadyoom Cloud Human Video — Free-First Architecture

The local Windows machine has very low VRAM, so modern talking-human
rendering should not run locally. Dadyoom keeps orchestration, lesson
logic, Arabic script generation, caching, quotas, and UI in the app,
and sends only the final render job to GPU compute.

## Primary free / renewing path: Hugging Face ZeroGPU

Use a public Gradio ZeroGPU Space as the first avatar renderer.

Current ZeroGPU characteristics:
- Shared dynamic GPU allocation.
- Large GPU size exposes 48 GB VRAM.
- XLarge exposes 96 GB VRAM.
- A free personal account in good standing can host up to two ZeroGPU
  Spaces.
- Free-account GPU quota renews daily.
- The Space must use Gradio and the GPU function should use the
  `@spaces.GPU` decorator.

Recommended deployment:
1. Create one ZeroGPU Space for the avatar renderer.
2. Keep model weights/config in that Space.
3. Wrap the renderer in a tiny Gradio API.
4. Put the Space URL in DADYOOM_AVATAR_SERVICE_URL.
5. Dadyoom calls it only when a new human-video render is required.
6. Cache the returned MP4 per lesson.
7. Playing/downloading a cached video never requests GPU again.

Because free ZeroGPU is quota-limited, it must not be treated as
"unlimited production GPU".

## Secondary renewable free path: Kaggle batch rendering

Kaggle provides a free GPU quota that renews weekly. It is not a good
always-on public API, but it is excellent for a render factory:

1. Export a queue of unrendered Dadyoom lessons.
2. A Kaggle notebook renders a batch with EchoMimic/MuseTalk or another
   compatible model.
3. Upload finished MP4 files to persistent object storage.
4. Mark the lesson video artifact as cached.
5. All students then stream/download that shared cached video.

This changes the economics dramatically: a core lesson video is made
once, not once per student.

## Optional community grant

Hugging Face also accepts Community GPU Grant applications for useful
public Spaces. If Dadyoom receives one, the dedicated/granted GPU can
replace or supplement ZeroGPU while the grant remains active. Grants
are not guaranteed and may be temporary.

## Development-only alternatives

Google Colab:
- Free GPU access exists but hardware/access are not guaranteed.
- Good for experiments and manual batch jobs.
- Not an always-on Dadyoom production API.

Lightning AI:
- Useful initial free GPU credits.
- Good for testing.
- Initial credits are not an unlimited renewable production resource.

## Avatar engine priority

Dadyoom's default production order is now:

1. **HeyGen** — primary cinematic avatar engine.
2. **HF ZeroGPU + SadTalker** — first automatic fallback when its Dadyoom gateway is configured.
3. **HF ZeroGPU + MuseTalk** — second automatic fallback when its Dadyoom gateway is configured.
4. **Tavus** — API fallback when credentials/capacity are available.
5. **AKOOL** — API fallback when credentials/credits are available.
6. **D-ID** — API fallback when credentials/trial credits are available.
7. **Creatify** — additional API fallback when fully configured.

Every unconfigured engine is skipped automatically. If a configured engine returns exhausted credits, rate limiting, authentication failure, timeout, or server failure, Dadyoom records a cooldown and moves to the next configured engine without exposing provider details to the learner.

"Free" is deliberately treated as quota/availability, not as unlimited production capacity. If a provider returns exhausted credits, rate limiting, authentication failure, timeout, or server failure, Dadyoom records a cooldown and moves to the next configured provider.

## Dadyoom fallback chain

Recommended:
1. Cached lesson MP4.
2. HeyGen when configured and healthy.
3. Remaining configured avatar engines in the order above.
4. Kaggle-pre-rendered artifact when available.
5. Existing Dadyoom source-grounded video fallback.

## Agents vs GPU

Dadyoom agents can:
- write the Arabic script;
- choose scenes;
- select a character;
- create narration;
- validate Arabic;
- choose the fastest AI provider;
- supervise the render job;
- retry/fallback intelligently.

They cannot replace the GPU computation that generates frames for a
moving human. The free-first architecture therefore combines agents
with renewable shared GPU services and aggressive caching.

## Secrets

Never put provider tokens, API keys, PayPal secrets, or bank data in
source control. Use `.env.local` or the cloud provider's secret store.
