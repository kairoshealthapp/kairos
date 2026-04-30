# Scribe Surface

Owner: Tristan
Route: /scribe
Scope: live-encounter capture during physician rounding (Dr. E and others) — note transcription, order placement, plan structuring

## Boundaries
- This folder is the scribe module. Scribe-specific UI, capture flows, and order-staging code live here.
- Cross-module changes (touching lib/ or rn/ or provider/) require coordination — open a PR that touches both folders and tag Brandon for review.
- Shared utilities (FHIR adapters, patient header, order schema, auth) live in lib/ and should not be modified from this folder without coordination.

## Workflow
1. Create a branch: git checkout -b tristan/feature-name
2. Make your changes in this folder
3. Push the branch: git push origin tristan/feature-name
4. Open a Pull Request on GitHub
5. Vercel auto-builds a preview URL — share it in the PR for Brandon to review
6. Brandon reviews, approves, merges. He's the only person who can merge to main.
