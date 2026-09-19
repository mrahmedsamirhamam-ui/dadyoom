# Dadyoom — Current Product Priority

Updated: 2026-09-19

## Video engine policy

Primary engine:
1. HeyGen

Automatic fallbacks, only when configured:
2. HF ZeroGPU + SadTalker
3. HF ZeroGPU + MuseTalk
4. Tavus
5. AKOOL
6. D-ID
7. Creatify

Rules:
- HeyGen is always attempted first when configured and healthy.
- Unconfigured engines are skipped without showing an error to the learner.
- Credit exhaustion, rate limiting, auth failures, timeouts, and provider outages trigger cooldown and automatic failover.
- Provider names, API errors, keys, and internal configuration details are never exposed to learners.

## Curriculum priority

1. Bahrain Arabic unified tracks, grades 10–12, using the official 2026–2027 Ministry/Edunet plan only.
2. Add interactive questions to all 333 currently published Bahrain lessons in grades 2–9.
3. Audit grade 9 lesson names and ordering against the actual third-intermediate Arabic textbook, then fix OCR/title/order problems.
4. After each curriculum update, run the Bahrain curriculum audit and verify no duplicate published lesson numbers/titles were introduced.

Do not fabricate missing secondary lessons. If a source is unavailable, keep the grade incomplete until the official source is available.
