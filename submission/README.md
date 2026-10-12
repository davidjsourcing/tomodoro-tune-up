# Submission items — AngelHack "Building with IBM Bob", Track 1 (Explore, Fix, and Build)

**Prove every claim, or it doesn't ship.** IBM Bob tunes up a real open-source app and shows receipts for every change.

- **Team:** Tomodoro Tune-Up — David J (solo, early career)
- **Repo:** https://github.com/davidjsourcing/tomodoro-tune-up (mirror: https://gitlab.com/davidj-builds/tomodoro-tune-up) — public, MIT; upstream lazy-guy/tomodoro, baseline commit 17a5091
- **Live demo:** https://tomodoro-bob.sites.tab.bot/tuneup.html (Tune-Up Report) → "Open the app"
- **Demo video (2:29, narrated + captioned):** YOUTUBE_URL — the same file is in [`../media/tomodoro-tuneup-demo-v3.mp4`](../media/tomodoro-tuneup-demo-v3.mp4)
- **Pitch deck:** [`pitch-deck.pdf`](pitch-deck.pdf) (10 slides: team + intro, summary, Bob adoption, results, learnings + roadmap)
- **How Bob was used:** [`../BOB-LOG.md`](../BOB-LOG.md) (19 runs, every prompt/output/cost/correction), the Tune-Up Kit in [`../.bob/`](../.bob/) explained in [`../docs/TUNEUP-KIT.md`](../docs/TUNEUP-KIT.md), raw transcripts in [`../docs/bob-runs/`](../docs/bob-runs/), Claim Checker audit in [`../docs/reviews/round2-check.md`](../docs/reviews/round2-check.md)
- **Testing instructions:** `npm test` (Node 20+, no dependencies: 144 tests). Browser flows: `docs/e2e/` (see [`../TEST-REPORT.md`](../TEST-REPORT.md): 35/35, axe-core 0).
- **AI disclosure:** code changes were made by IBM Bob Shell, driven and checked by David J; an AI assistant helped write prompts, check Bob's claims and produce the video and deck; the video narration is text-to-speech.
