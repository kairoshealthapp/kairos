# Kairos Tour-Mode Deploy Checklist — 2026-04-30

Prepared 2026-04-29 evening. Execute in order tomorrow morning after local tour-mode build verifies clean.

## Targets

| Field | Value |
| --- | --- |
| Vercel project name | `kairos-tour` |
| Vercel project ID | `prj_2oHaWgO9NtOJnYU61vmYMcEdgtLu` |
| Vercel team | `firekrakerproductions-2999s-projects` (`team_VB6pSq4dwMh2zVjvuk0sMjGx`) |
| GitHub repo to connect | `firekraker1272/kairos` (branch: `main`) |
| Custom domain | `kairos-tour.firekraker.net` |
| Fallback URL | `kairos-tour-firekrakerproductions-2999s-projects.vercel.app` (auto on first deploy) |
| **Must remain untouched** | `kairoshealth.app` (lives in a different Vercel team — confirmed isolated) |

## Already configured (done 2026-04-29)

- [x] Vercel project `kairos-tour` created — empty, no Git source, no deployments, framework null.
- [x] Cloudflare CNAME `kairos-tour.firekraker.net` → `cname.vercel-dns.com`, proxied OFF, TTL auto. Record id `1dc6fa6ab7645c7279cbfb126fc50542` in zone `firekraker.net` (`8c286aec35b591aeb5a8f36b03ee9daa`).
- [x] Verified `kairoshealth.app` serving current production content.
- [x] Verified no Vercel project in this team is currently connected to `firekraker1272/kairos` — a push today would trigger nothing.

## Manual dashboard work (~5 minutes — do BEFORE pushing)

Vercel dashboard URL: https://vercel.com/firekrakerproductions-2999s-projects/kairos-tour/settings

1. **Connect Git repo**
   - Settings → Git → Connect Git Repository
   - Provider: GitHub, Repo: `firekraker1272/kairos`, Production branch: `main`
   - If GitHub OAuth scope to `firekraker1272/kairos` isn't already granted, the dashboard will walk through the install/grant flow.

2. **Add environment variable**
   - Settings → Environment Variables → Add
   - Key: `NEXT_PUBLIC_KAIROS_MODE` — Value: `simulation` — Environments: Production, Preview, Development

3. **Set Ignored Build Step**
   - Settings → Git → Ignored Build Step
   - Command: `git diff HEAD^ HEAD --quiet .`
   - (Per CLAUDE.md rule 11. The repo IS the project root — no monorepo subdir.)

4. **Attach custom domain**
   - Settings → Domains → Add → `kairos-tour.firekraker.net`
   - Cloudflare CNAME is already in place; Vercel should issue SSL within ~1 min.

## Push and verify

5. **Local tour-mode verify FIRST**
   - In a separate terminal, run `npm run build` from `C:\Users\kents\kairos` and confirm clean.
   - Spot-check tour-mode flow at `localhost:3000` (the seven scripted fixtures).

6. **Git push**
   ```
   rtk git push origin main
   ```
   First push triggers the project's first production deployment.

7. **Watch Vercel build**
   - https://vercel.com/firekrakerproductions-2999s-projects/kairos-tour/deployments
   - Expected: status READY in 2–4 minutes.

8. **Confirm both URLs work**
   - `kairos-tour.firekraker.net` (custom domain — primary demo URL)
   - `kairoshealth.app` (must still show current production — Riverbend review window through ~5/4)

## HALT condition

If at any point during step 6 or 7 you see `kairoshealth.app` redeploying — STOP and investigate before doing anything else. The two projects must remain on separate triggers.

Symptoms that mean halt:
- A new deployment appears under the `kairos` project (`prj_gIPHsKPXzooSALfYzMuWuKJboDo9`) tied to a `firekraker1272/kairos` commit
- `kairoshealth.app` content changes
- Vercel email alert about a deployment to a project other than `kairos-tour`
