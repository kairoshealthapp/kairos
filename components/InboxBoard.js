// Phase 3.2-fix4 — kairoshealth.app panel chrome ported verbatim.
// Sections stack vertically; cards inside each section flow in a responsive
// grid (6 / 4 / 3 / 2 / 1 across at 1399 / 1099 / 799 / 499 px).
//
// Card rendering mirrors firekraker-monorepo/kairos/components/PatientCard.js:
//   .kairos-card .kairos-card-hover [.kairos-card-selected] p-4
//     .severity-dot.{severity-red|severity-green}
//     h3.kairos-display .text-bone .text-[18px]   (patient name, Fraunces serif)
//     span.kairos-data .text-[11px] .text-bone-muted   (age/sex)
//     p.text-[13px] .text-bone-muted .line-clamp-2   (description)
//
// No action buttons on the card surface (removed in fix4). Click toggles
// the persistent gold-amber selected ring; clicking another card moves
// selection; clicking the selected card clears it.
//
// TODO Phase 3.3 — Open card opens detail view (raw Epic note content +
// full action button set). Selection state today is purely visual.

"use client";

import { useMemo, useState } from "react";

/* ---------------- helpers ---------------- */

const SECTION_DEFS = [
  { key: "notify",  label: "NOTIFY" },
  { key: "refill",  label: "REFILL" },
  { key: "triage",  label: "TRIAGE" },
  { key: "advice",  label: "ADVICE" },
  { key: "inr",     label: "INR" },
  { key: "other",   label: "OTHER" },
];

const PRIMARY_TYPES = new Set(["notify", "refill", "triage", "advice", "inr"]);

function sectionKeyForCard(card) {
  const t = card?.type;
  if (PRIMARY_TYPES.has(t)) return t;
  return "other"; // handoff, auto, chase, anything unknown
}

function ageFromDOB(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function sortInSection(list) {
  return [...list].sort((a, b) => {
    const u =
      (a.urgency_signal === "red" ? 0 : 1) -
      (b.urgency_signal === "red" ? 0 : 1);
    if (u !== 0) return u;
    return new Date(a.received_at) - new Date(b.received_at);
  });
}

function groupBySection(cards) {
  const groups = new Map();
  for (const c of cards) {
    const key = sectionKeyForCard(c);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  return SECTION_DEFS.map(({ key, label }) => ({
    key,
    label,
    cards: sortInSection(groups.get(key) || []),
  }));
}

/* Severity mapping per Phase 3.2-fix4 spec — only red and green are used,
   matching the styles called out ("Severity dot styling matches .severity-red
   / .severity-green"). Calm cards get the green sage dot. */
function severityClass(card) {
  return card?.urgency_signal === "red" ? "severity-red" : "severity-green";
}

/* ---------------- card ---------------- */

function Card({ card, isSelected, onSelect }) {
  const sev = severityClass(card);
  const age = ageFromDOB(card.patient.dob);
  const description = card.message?.subject || card.message?.body || "";

  function onClick() {
    onSelect(card.id);
  }
  function onKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(card.id);
    }
  }

  const cardClass =
    "kairos-card kairos-card-hover p-4" +
    (isSelected ? " kairos-card-selected" : "");

  return (
    <button
      type="button"
      className="card-button"
      onClick={onClick}
      onKeyDown={onKey}
      aria-pressed={isSelected}
      aria-label={`Select card for ${card.patient.name}`}
    >
      <div className={cardClass}>
        <div className="flex items-start gap-2">
          <span className={`severity-dot ${sev} mt-1.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="kairos-display text-bone text-[18px] font-medium leading-tight truncate">
                {card.patient.name}
              </h3>
              <span className="kairos-data text-[11px] text-bone-muted shrink-0">
                {age != null ? `${age}y` : ""}
              </span>
            </div>
            <p className="text-[13px] text-bone-muted mt-2 leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ---------------- section ---------------- */

function Section({ section, selectedId, onSelect }) {
  if (section.cards.length === 0) return null;
  return (
    <section className="type-section">
      <div className="section-header">
        <span>{section.label}</span>
        <span className="section-header-count">{section.cards.length}</span>
      </div>
      <div className="card-grid kairos-stagger">
        {section.cards.map((c) => (
          <Card
            key={c.id}
            card={c}
            isSelected={selectedId === c.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

/* ---------------- board ---------------- */

export default function InboxBoard({ cards }) {
  const sections = useMemo(() => groupBySection(cards), [cards]);
  const [selectedId, setSelectedId] = useState(null);

  function handleSelect(id) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  const word = cards.length === 1 ? "message" : "messages";

  return (
    <div className="board-page">
      <div className="board-shell">
        <header className="board-header">
          <h1 className="board-title">Inbox</h1>
          <span className="board-count">
            {cards.length} {word}
          </span>
        </header>

        {sections.map((s) => (
          <Section
            key={s.key}
            section={s}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
