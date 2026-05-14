# Kairos Architecture — Three Surfaces, One Platform

> [← Index](INDEX.md) · Last updated: 2026-04-29 · One Next.js app, three role-specific surfaces (RN, Scribe, Provider) sharing a common backend.

## Overview
Kairos is a single Next.js app with three role-specific surfaces sharing a common backend.

## Surfaces
| Role | Route | Folder | Owner | Status |
|------|-------|--------|-------|--------|
| RN | /rn | kairos/rn/ | Brandon | Live (Phase 3.3) |
| Scribe | /scribe | kairos/scribe/ | Devin | Stub |
| Provider | /provider | kairos/provider/ | Brandon | Stub (future) |

## Legacy
- /dashboard redirects to /rn for backward compatibility

## Shared Layer
All three surfaces share:
- lib/clinical/ — clinical reasoning primitives
- lib/fhir/ — Epic FHIR adapters
- lib/components/ — reusable UI
- lib/auth/ — auth and session management
- data/mock-encounters/ — fixture content for simulation mode

## URL Conventions
- Public landing: kairoshealth.app (Riverbend prototype, untouched)
- Tour / RN demo: kairos-tour.firekraker.net/rn
- Future: kairos.app or similar production domain

## Cross-Surface Coordination
PRs touching multiple surface folders require Brandon's review and explicit approval. Default ownership boundary is folder-scoped. Anything in lib/ is shared and changes there ripple across all surfaces.
