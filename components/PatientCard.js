// Phase 3.2-fix5 + fix6 — adapted from firekraker-monorepo/kairos/components/PatientCard.js.
//
// Adaptations vs source:
//   • <Link href> wrapper → <button onClick> (no /patient/[id] route yet,
//     fix5 #3). Click toggles selection — sets/clears `.kairos-card-selected`.
//   • Accept `isSelected` + `onSelect` props.
//   • fix6 #4 — REMOVED the inline action button <span> row ("Open chart →"
//     and "Draft callback"). Buttons return when the card opens to the
//     detail view (Phase 3.3). Earlier fix5 kept them; fix6 overrides.
//   • fix6 #1 — `h-full` + `flex flex-col` so the card fills its grid cell;
//     CSS Grid stretches all cells in a row to the tallest card's height,
//     so adding `h-full` to outer + inner makes every card in a row visually
//     equalize.
//
// `kind` and `label` props remain in the API for compatibility, but kind no
// longer drives any rendered text (button labels were the only consumer).

const SEV_CLASS = { red: 'severity-red', amber: 'severity-amber', green: 'severity-green' };

export default function PatientCard({ patient, label, isSelected, onSelect }) {
  const dot = SEV_CLASS[patient.severity] || 'severity-amber';

  const cardClass =
    'kairos-card kairos-card-hover p-4 h-full flex flex-col' +
    (isSelected ? ' kairos-card-selected' : '');

  function handleClick() {
    if (typeof onSelect === 'function') onSelect(patient.id);
  }
  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <button
      type="button"
      className="block w-full text-left h-full"
      onClick={handleClick}
      onKeyDown={handleKey}
      aria-pressed={!!isSelected}
      aria-label={`Select card for ${patient.name}`}
    >
      <div className={cardClass}>
        <div className="flex items-start gap-2">
          <span className={`severity-dot ${dot} mt-1.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="kairos-display text-bone text-[18px] font-medium leading-tight truncate">
                {patient.name}
              </h3>
              <span className="kairos-data text-[11px] text-bone-muted shrink-0">
                {patient.age}{patient.sex}
              </span>
            </div>
            {label && (
              <div className="kairos-kicker text-amber/80 mt-1">{label}</div>
            )}
            <p className="text-[13px] text-bone-muted mt-2 leading-relaxed line-clamp-2">
              {patient.reasonForColumn || patient.issueLine}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
