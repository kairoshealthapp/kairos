# 0005 — Three knowledge-layer architecture

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Most "clinical AI" tools integrate exactly one knowledge source — the patient chart — and stop there. HVC, the prior-generation product, operates this way. The downstream consequence is well documented: recommendations are clinically generic, ignore the prescribing patterns of the specific clinician, and cannot adapt to specialty-specific guideline updates without a vendor release.

Kairos's pitch and clinical thesis depend on integrating **three** knowledge sources, not one. The three layers are described in [`KAIROS-CONTEXT.md`](../KAIROS-CONTEXT.md) under "Three Knowledge Layers" and are repeated here for ADR durability:

1. **Patient knowledge** — FHIR pull from Epic. Authoritative for chart state.
2. **Provider preferences** — per-clinician patterns. Learned from the clinician's prior notes and corrections.
3. **Clinical guidelines** — ACC/AHA cardiology protocols, drug interaction databases, anticoagulation rules, pre-procedure med management, billing code logic. The swappable specialty module.

Each layer answers a distinct question. Patient: "what is true of this chart?" Provider: "what does *this* clinician usually do in this situation?" Guidelines: "what does evidence say should happen?"

## Decision

The Kairos engine is architected around three explicit knowledge layers, with clean seams between them. Phase 1 ships layers 1 and 3 only — patient FHIR data and guideline-grade clinical rules (e.g., the GDMT HFrEF rule). The provider-preference layer is deferred to Phase 2 and is **not** simulated by stuffing per-clinician constants into the rule files.

The clinical-guideline layer is **specialty-swappable**: cardiology rules today, oncology or pre-op modules later, without disturbing layers 1 or 2.

## Consequences

**Positive.** Generalization to other specialties is a module swap, not a rewrite. Provider preference can be layered in later without rule rewrites — the rule signature (see ADR 0004) does not need to change to accommodate it. Each layer can be audited, versioned, and updated independently.

**Negative.** Until Phase 2 ships, Kairos output is one knowledge layer ahead of HVC, not two. The full pitch ("three knowledge layers, not one") is partly a forward promise. Mitigation: be explicit with stakeholders that Phase 1 is layer 1 + layer 3.

**Operational.** New rules belong in layer 3 only. Surface code (Phase 1 nurse UI, provider tour) must not encode clinician preference inline — that work is deferred to layer 2 by design.
