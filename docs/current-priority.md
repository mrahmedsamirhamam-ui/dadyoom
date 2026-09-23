# Dadyoom — Current Product Priority

Updated: 2026-09-19

## Video engine policy

Cloud-first order:
1. Hugging Face ZeroGPU + MiniMax H3 (text-to-video with soundtrack)
2. HF ZeroGPU + SadTalker
3. HF ZeroGPU + MuseTalk
4. Higgsfield, when valid credentials/credits exist
5. HeyGen, when API credits exist
6. Tavus
7. AKOOL
8. D-ID
9. Creatify

Rules:
- Android, iPhone, and web use the same cloud rendering path.
- Video generation must not depend on the student's phone/desktop GPU.
- VIDEO_PROVIDER_ORDER is respected; configured healthy fallbacks are appended automatically.
- Unconfigured engines are skipped without showing an internal provider error to the learner.
- Credit exhaustion, rate limiting, auth failures, timeouts, and provider outages trigger cooldown and automatic failover.
- Provider names, API errors, keys, and internal configuration details are never exposed to learners.

## Curriculum priority

1. Close the mobile/cloud video generation gate.
2. Continue the 22-country curriculum rollout using verified official/primary sources.
3. Keep Bahrain as the reference implementation and preserve its verified lesson/video/question coverage.
4. After each country update, run curriculum audits and verify no duplicate published lesson numbers/titles were introduced.

Do not fabricate missing secondary lessons. If a source is unavailable, keep the grade incomplete until the official source is available.
