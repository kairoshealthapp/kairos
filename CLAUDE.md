@AGENTS.md

## CC Verification Discipline — Localhost Handoff Protocol

CC NEVER runs preview eval, in-window Chromium previews, or self-driving screenshot tools to verify interactive UI changes. Those produce static HTML renders, not real interaction. CC cannot launch Brandon's Chrome with the Claude plugin from inside its own session. Self-verification by CC for interactive UI is not real verification.

After build passes clean and dev server is running, CC's verification step is exactly:

1. Restart the dev server cleanly. Confirm it's listening on a stable localhost port.
2. Output the clickable localhost URL in its own fenced code block.
3. Output the Chrome computer-use test prompt in a SEPARATE fenced code block, formatted per `docs/computer-use-test-protocol.md` if it exists, with the full T1/T2/T3 spec re-pasted (Chrome computer-use sessions are stateless — every run needs the full spec).
4. Stop. Do NOT mark the change "verified" without Brandon's PASS report.

Brandon opens the localhost URL in his own Chrome, pastes the test prompt into the Claude Chrome plugin, and the plugin drives the actual verification. Brandon then reports PASS (CC proceeds to commit) or FAIL (CC stops, fixes, restarts the loop).

Build passing remains necessary but not sufficient for interactive UI. Static content changes (pitch pages, marketing copy, footer edits) may still skip Chrome computer-use and use mobile screenshots from Brandon + HTML/CSS fetch as verification.
