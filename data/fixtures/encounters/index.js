// Phase 3.3 — encounter fixture registry. 24 fixtures, slug-keyed.
// Mapping per the build prompt's 24-fixture table; sources in
// docs/KAIROS-SESSION-2026-04-29*.md and KAIROS-CONTEXT-ADDENDUM-2026-04-28.md.

import aldingtonTte from "./aldington-tte";
import brexleyStatin from "./brexley-statin";
import calderwoodCrestor from "./hesperdale-crestor";
import drennanPcp from "./wendelfaer-pcp";
import esselbachUrgent from "./esselbach-urgent";
import lyttletonCoordination from "./kvalheim-coordination";
import maundrellContradiction from "./maundrell-contradiction";
import norreysTransactional from "./norreys-transactional";
import halbrookLabReview from "./halbrook-lab-review";
import halbrookDmePa from "./halbrook-dme-pa";
import reinerMultilab from "./reiner-multilab";
import ravensdaleCpap from "./ravensdale-cpap";
import stockbridgeAsync from "./quelthorne-async";
import trumbleSecurechat from "./heldenmark-securechat";
import underwellFullLifecycle from "./underwell-full-lifecycle";
import quennellScope from "./quennell-scope";
import vanstoneDenialCascade from "./larvendel-denial-cascade";
import wexburyPhone from "./wexbury-phone";
import phillipsDoe from "./strathorne-doe";
import frazierHandoff from "./frazier-handoff";
import woodLipid from "./wood-lipid";
import czeschinBp from "./czeschin-bp";
import besemerBnp from "./besemer-bnp";
import vrabelReferral from "./vrabel-referral";
import locknerMedcheckin from "./lockner-medcheckin";
import criderInr from "./crider-inr";
import sellmanCpapReferral from "./sellman-cpap-referral";
import pelcVaRfs from "./pelc-va-rfs";
// Pass E §2 / §3 — new tour Cards 9 + 10.
import whitfieldInr from "./whitfield-inr";
import beasleyEpReferral from "./beasley-ep-referral";

const FIXTURES = [
  aldingtonTte,
  brexleyStatin,
  calderwoodCrestor,
  drennanPcp,
  esselbachUrgent,
  lyttletonCoordination,
  maundrellContradiction,
  norreysTransactional,
  halbrookLabReview,
  halbrookDmePa,
  reinerMultilab,
  ravensdaleCpap,
  stockbridgeAsync,
  trumbleSecurechat,
  underwellFullLifecycle,
  quennellScope,
  vanstoneDenialCascade,
  wexburyPhone,
  phillipsDoe,
  frazierHandoff,
  woodLipid,
  czeschinBp,
  besemerBnp,
  vrabelReferral,
  locknerMedcheckin,
  criderInr,
  sellmanCpapReferral,
  pelcVaRfs,
  whitfieldInr,
  beasleyEpReferral,
];

const BY_ID = {};
for (const f of FIXTURES) BY_ID[f.id] = f;

export function listFixtures() {
  return FIXTURES;
}

export function getFixture(id) {
  return BY_ID[id] || null;
}

export default FIXTURES;
