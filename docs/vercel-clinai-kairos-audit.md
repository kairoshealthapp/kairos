# Vercel Audit — clinai and kairos projects

**Generated:** 2026-04-27
**Team:** `firekrakerproductions-2999's projects` (`team_VB6pSq4dwMh2zVjvuk0sMjGx`)
**Method:** Vercel MCP, read-only (`list_teams`, `get_project`, `list_deployments`, `get_deployment`). No settings modified.

---

## Summary table

| Field | clinai | kairos |
|---|---|---|
| Project ID | `prj_neiT0E8mXQdM8Aa5xHTeOrD6Rdoz` | `prj_gIPHsKPXzooSALfYzMuWuKJboDo9` |
| Created | 2026-04-26 10:32 CDT | 2026-04-24 20:47 CDT |
| Framework | Next.js | Next.js |
| Node version | 24.x | 24.x |
| GitHub repo | `firekraker1272/firekraker-monorepo` (private) | `firekraker1272/firekraker-monorepo` (private) |
| Production branch | `main` | `main` |
| Repo source (inferred) | `clinai/` subdir of monorepo | `kairos/` subdir of monorepo |
| Latest deployment | CANCELED, 2026-04-26 15:45 CDT | CANCELED, 2026-04-26 15:45 CDT |
| Latest READY (production) | 2026-04-26 11:28 CDT | 2026-04-25 21:44 CDT |
| `kairoshealth.app` attached? | **No** (per MCP response) | **Not visible in MCP response** — see caveat below |
| `commandForIgnoringBuildStep` | **Configured** (inferred from commit history; not exposed by MCP) | **Configured** (same inference) |
| `live` flag | `false` | `false` |

---

## clinai — `prj_neiT0E8mXQdM8Aa5xHTeOrD6Rdoz`

### Domains (per `get_project`)
- `clinai-firekrakerproductions-2999s-projects.vercel.app`
- `clinai-git-main-firekrakerproductions-2999s-projects.vercel.app`

No `kairoshealth.app` in the returned `domains` array. Commit messages reference `clinai.firekraker.net` as a target hostname (commit `3748bc3` 2026-04-26: "Production endpoints verified live: /.well-known/jwks.json → 2..."), but it does **not** appear in the project's domain list returned by MCP. Possible explanations: (a) the MCP `get_project` wrapper summarizes domains, omitting custom ones; (b) the custom domain assignment lives on a different project or routed via a separate hostname rewrite. Verify in the Vercel dashboard.

### GitHub link
- Org: `firekraker1272` (User)
- Repo: `firekraker-monorepo` (private, repoId `1163775766`)
- Production branch: `main`
- Latest deployed commit on main: `c349ff1` ("fix(dk): categorization expansion + worker cascade rewrite + inbox UX")

### Root directory / monorepo path
**Not exposed by Vercel MCP `get_project`.** Strong inference: `clinai/` subdirectory.
- Dependabot opens PRs scoped to `/clinai` (e.g. `dependabot/npm_and_yarn/clinai/next-15.5.15`), implying the project's rootDirectory points at `clinai/`.
- Commit `7477851` (2026-04-26) explicitly references "rule 11.6 (first-deploy bootstrap when latest main HEAD doesn't touch the new app's rootDirectory — clear ignore-build-step, deploy, then restore)" — confirming a rootDirectory is set on this project.

### Latest deployments (most recent 8)

| Deploy ID | Created (CDT) | State | Target | Branch | Commit subject |
|---|---|---|---|---|---|
| `dpl_FCkBKHVeABra8SiDaGp8Ra1Q7DyV` | 2026-04-26 15:45 | CANCELED | production | main | fix(dk): categorization expansion |
| `dpl_GV5aDLMqR6xyobaWdAWGnPLF7pQY` | 2026-04-26 14:23 | CANCELED | production | main | docs: clarify computer-use test execution mode |
| `dpl_9PqbfFRdokUDYEsh41WEkPTZQaow` | 2026-04-26 14:15 | CANCELED | production | main | docs: add Chrome computer-use test protocol |
| `dpl_7nktxjmy549Gp4FtaF5EEiW5vFSd` | 2026-04-26 11:47 | CANCELED | production | main | fix(dk): projected MOVE waterfall cascade |
| `dpl_AbemsTdTbZgaJCemBrDXNA4EBNXu` | 2026-04-26 11:33 | CANCELED | production | main | docs: capture clinai Phase 0 Vercel gotchas |
| `dpl_7o1ixusdFeq6BWXgEe2cp6TeJHu3` | 2026-04-26 11:32 | CANCELED | production | main | docs(clinai): document Git link fix |
| `dpl_aXHLbjngzq3G2pG6K4DfdtbkG9W4` | 2026-04-26 11:28 | **READY** | production | main | docs: register clinai Phase 0 in docs/ |
| `dpl_E3xWjNUJZNdLJKQkGPD9yCd9bPuF` | 2026-04-26 11:27 | CANCELED | production | main | docs: register clinai Phase 0 in docs/ |

**Last successful production deploy:** `dpl_aXHLbjngzq3G2pG6K4DfdtbkG9W4` (commit `af92f7f`) at 2026-04-26 11:28 CDT.

The CANCELED runs after that point are consistent with `commandForIgnoringBuildStep` returning "skip" on commits that don't touch `clinai/` (for example, a `fix(dk):` commit only changes `bills/` files, so the clinai project's ignore step exits 0 and Vercel marks the build CANCELED). This is the expected behavior for a multi-app monorepo with per-project ignore predicates.

---

## kairos — `prj_gIPHsKPXzooSALfYzMuWuKJboDo9`

### Domains (per `get_project`)
- `kairos-firekrakerproductions-2999s-projects.vercel.app`
- `kairos-git-main-firekrakerproductions-2999s-projects.vercel.app`

**Caveat on `kairoshealth.app`:** the MCP-returned `domains` array does **not** include `kairoshealth.app`. However, per `docs/CONTEXT.md` (line 190): *"kairoshealth.app stays pointed at the existing prototype in firekraker-monorepo/kairos/ until after Riverbend review."* This is the existing prototype project. Two possibilities: (a) the MCP `get_project` wrapper truncates the domain list and omits attached custom domains; (b) the custom domain has been removed or never attached to this specific Vercel project. **Verify in the Vercel dashboard's Domains tab for this project before relying on the MCP answer.**

### GitHub link
- Org: `firekraker1272` (User)
- Repo: `firekraker-monorepo` (private, repoId `1163775766`)
- Production branch: `main`
- Latest deployed commit on main: `c349ff1` ("fix(dk): categorization expansion ...")

Note: this is the **old** Vercel project tied to `firekraker-monorepo/kairos/`. The new private `firekraker1272/kairos` repo (the local working tree at `C:\Users\kents\kairos`) is **not** connected to any Vercel project — by design, per `CONTEXT.md`.

### Root directory / monorepo path
**Not exposed by Vercel MCP `get_project`.** Strong inference: `kairos/` subdirectory of `firekraker-monorepo`.
- Many deploy commits explicitly reference `kairos/` paths and Phase 2X UI work (`feat(kairos): rewrite /vision page as ambient/agentic narrative`).
- The same monorepo-level "rule 11.6" gotcha doc applies to this project.

### Latest deployments (most recent 8 of 20 returned)

| Deploy ID | Created (CDT) | State | Target | Branch | Commit subject |
|---|---|---|---|---|---|
| `dpl_9iB573vbaDDo27UoZkZT7T3abk76` | 2026-04-26 15:45 | CANCELED | production | main | fix(dk): categorization expansion |
| `dpl_323sBVc5sab5S6WKY8uJNxZopNcp` | 2026-04-26 14:23 | CANCELED | production | main | docs: clarify computer-use test execution mode |
| `dpl_Bea5PgBV621etyyA2wyW3oRF4WmV` | 2026-04-26 14:15 | CANCELED | production | main | docs: add Chrome computer-use test protocol |
| `dpl_Fowg7SjyGVxLvnBtzdZN2DszeNoG` | 2026-04-26 11:47 | CANCELED | production | main | fix(dk): projected MOVE waterfall cascade |
| `dpl_AddRkZKBLRCxW1KHW5HRRYCzdhzj` | 2026-04-26 11:33 | CANCELED | production | main | docs: capture clinai Phase 0 Vercel gotchas |
| `dpl_GTNp1dWc7WSXTDLxCb1AeYB4i3Jd` | 2026-04-26 11:32 | CANCELED | production | main | docs(clinai): document Git link fix |
| `dpl_E21NtKaLk77FyQsWtWMpdv9hjHpY` | 2026-04-26 09:04 | CANCELED | preview | dependabot/npm_and_yarn/clinai/next-15.5.15 | chore(deps): bump next 14.2.35 → 15.5.15 in /clinai |
| `dpl_DnS46S7dAD6ZaUFBicQH8pTL9xBN` | 2026-04-26 09:02 | CANCELED | production | main | docs: register clinai Phase 0 in docs/ |
| ... | ... | ... | ... | ... | ... |
| `dpl_8o8UCXQh6XFvNmsWanmNUdAcjbJE` | 2026-04-25 21:44 | **READY** | production | main | feat(kairos): rewrite /vision page as ambient/agentic narrative (Phase 2X) |

**Last successful production deploy:** `dpl_8o8UCXQh6XFvNmsWanmNUdAcjbJE` (commit `a0b88ad`, "Phase 2X /vision rewrite") at 2026-04-25 21:44 CDT.

The CANCELED runs after this point are again consistent with a path-scoped `commandForIgnoringBuildStep` — recent commits (`fix(dk):...`, `docs(clinai):...`) don't touch `kairos/`, so the kairos project's ignore step skips them.

---

## Build-skip predicate (`commandForIgnoringBuildStep`)

**Not exposed by the Vercel MCP `get_project` response shape.** However, the configuration is strongly evidenced by:

1. **Commit `7477851cca144573d68c6e920a383a2af72da562`** (2026-04-26, "docs: capture clinai Phase 0 Vercel gotchas in CLAUDE.md") explicitly documents:
   > "rule 11.6 (first-deploy bootstrap when latest main HEAD doesn't touch the new app's rootDirectory — **clear ignore-build-step**, deploy, then restore)"

2. **Commit `3748bc38291078fd2f89cc868d3f61740946cba0`** (2026-04-26, "docs(clinai): document Git link fix and first-deploy bootstrap") documents:
   > "Bootstrap first deploy by **clearing commandForIgnoringBuildStep** (the standard `git diff HEAD^ HEAD --quiet .` exits 0 when the latest main HEAD has no diff in clinai/ — exit 0 = skip)"

3. **Behavior confirms it.** Both projects show CANCELED runs on the same commits (e.g. `c349ff1` "fix(dk):..." cancels on both clinai and kairos because that commit only changes `bills/` files). That CANCELED-on-foreign-paths pattern is exactly what `git diff HEAD^ HEAD --quiet .` produces when the rootDirectory wasn't touched.

The standard predicate documented in commit `3748bc3` is:

```
git diff HEAD^ HEAD --quiet .
```

(scoped to the project's rootDirectory; exit 0 means "no diff in this dir — skip build").

To see the exact string currently configured on each project, use the Vercel dashboard → Project → Settings → Git → "Ignored Build Step", or call `GET /v9/projects/{projectId}` directly with the API token (the MCP wrapper does not surface this field).

---

## Gaps in this audit (MCP `get_project` does not expose)

- `rootDirectory` — inferred from PR/commit naming, not directly observed
- `commandForIgnoringBuildStep` — inferred from commit history and CANCELED patterns, not directly observed
- Custom domain attachments (e.g. `kairoshealth.app`, `clinai.firekraker.net`) — only auto-generated `vercel.app` aliases are returned

To close these gaps without modifying any settings: either (a) check the Vercel dashboard for each project, or (b) call `GET /v9/projects/{projectId}?teamId=team_VB6pSq4dwMh2zVjvuk0sMjGx` directly with the Vercel API token (read-only).

---

## Cross-cuts worth noting

- **Both projects build from the same monorepo** (`firekraker-monorepo`) on the same `main` branch, but with different rootDirectory scopes. Every push to `main` fans out to multiple Vercel projects; the `commandForIgnoringBuildStep` predicate is what keeps unrelated projects from rebuilding.
- **The Riverbend review window constraint** (per `CONTEXT.md`): zero commits to `firekraker-monorepo/kairos/` until ~5/4. Both Vercel projects auto-deploy on `main` push, so any commit touching either rootDirectory will produce a fresh production deploy.
- **The new `firekraker1272/kairos` repo (this working tree) is not connected to a Vercel project** — by design, per the CONTEXT.md "Repo & Infrastructure Decisions" section. Localhost-only during the Riverbend review window.
