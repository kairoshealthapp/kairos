// Phase 3.6 — Patient Assessment Panel.
// Renders a structured assessment as a question list. Each question is
// rendered per its `inputType` (yesno, single_select, multi_select,
// number_unit, free_text). Conditional `followUp` is shown when the
// parent answer matches the followUp's `condition` array.
//
// `mode` toggles between MyChart-message (read-only patient-facing
// preview) and phone-call-script (structured input form).

"use client";

function questionMatchesCondition(value, condition) {
  if (!condition) return false;
  if (!Array.isArray(condition)) return value === condition;
  if (Array.isArray(value)) {
    return value.some((v) => condition.includes(v));
  }
  return condition.includes(value);
}

function YesNo({ value, onChange, disabled }) {
  return (
    <div className="flex gap-2">
      {["Yes", "No"].map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={`px-3 py-1 rounded-sm text-[12px] border transition-colors ${
            value === opt
              ? "border-amber/80 bg-amber/15 text-bone"
              : "border-mist/60 text-bone-muted hover:border-amber/40 hover:text-bone"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SingleSelect({ options, value, onChange, disabled, name }) {
  return (
    <div className="flex flex-wrap gap-3">
      {(options || []).map((opt) => (
        <label
          key={opt}
          className={`flex items-center gap-1.5 text-[12px] ${
            disabled ? "opacity-50" : "cursor-pointer"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            disabled={disabled}
            onChange={() => onChange(opt)}
            className="accent-amber"
          />
          <span className="text-bone">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function MultiSelect({ options, value, onChange, disabled }) {
  const arr = Array.isArray(value) ? value : [];
  const toggle = (opt) => {
    if (arr.includes(opt)) onChange(arr.filter((v) => v !== opt));
    else onChange([...arr, opt]);
  };
  return (
    <div className="flex flex-wrap gap-3">
      {(options || []).map((opt) => (
        <label
          key={opt}
          className={`flex items-center gap-1.5 text-[12px] ${
            disabled ? "opacity-50" : "cursor-pointer"
          }`}
        >
          <input
            type="checkbox"
            checked={arr.includes(opt)}
            disabled={disabled}
            onChange={() => toggle(opt)}
            className="accent-amber"
          />
          <span className="text-bone">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function NumberUnit({ value, unit, onChange, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 bg-platinum/40 border border-mist/60 rounded-sm px-2 py-1 text-[12px] text-bone focus:outline-none focus:border-amber/60 disabled:opacity-50"
      />
      <span className="text-[12px] text-bone-muted">{unit || ""}</span>
    </div>
  );
}

function FreeText({ value, onChange, disabled, multiline }) {
  if (multiline) {
    return (
      <textarea
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full bg-platinum/40 border border-mist/60 rounded-sm px-2 py-1 text-[12px] text-bone resize-none focus:outline-none focus:border-amber/60 disabled:opacity-50"
      />
    );
  }
  return (
    <input
      type="text"
      value={value || ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-platinum/40 border border-mist/60 rounded-sm px-2 py-1 text-[12px] text-bone focus:outline-none focus:border-amber/60 disabled:opacity-50"
    />
  );
}

function renderInput({ inputType, value, onChange, options, unit, disabled, name }) {
  switch (inputType) {
    case "yesno":
      return <YesNo value={value} onChange={onChange} disabled={disabled} />;
    case "single_select":
      return (
        <SingleSelect
          options={options}
          value={value}
          onChange={onChange}
          disabled={disabled}
          name={name}
        />
      );
    case "multi_select":
      return (
        <MultiSelect options={options} value={value} onChange={onChange} disabled={disabled} />
      );
    case "number_unit":
      return <NumberUnit value={value} unit={unit} onChange={onChange} disabled={disabled} />;
    case "free_text":
    default:
      return <FreeText value={value} onChange={onChange} disabled={disabled} />;
  }
}

export default function PatientAssessmentPanel({
  assessment,
  mode = "phone",
  responses,
  onResponseChange,
  notes,
  onNotesChange,
  readOnly = false,
}) {
  const list = assessment || [];
  const r = responses || {};
  const isMyChart = mode === "mychart";

  const setQ = (id, patch) => {
    if (!onResponseChange) return;
    const prev = r[id] || {};
    onResponseChange(id, { ...prev, ...patch });
  };

  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker kairos-kicker-strong text-amber/80">
          PATIENT ASSESSMENT
        </span>
        <span className="text-[11px] text-bone-muted">
          {isMyChart ? "MyChart message preview" : "Phone-call script"}
        </span>
      </header>

      {!list.length ? (
        <div className="flex-1 flex items-center justify-center text-bone-muted/60 italic text-[13px]">
          — empty — click Generate Patient Assessment to draft —
        </div>
      ) : isMyChart ? (
        <div className="flex-1 overflow-auto text-[13px] text-bone leading-relaxed whitespace-pre-wrap">
          <div className="mb-2 text-[12px] text-bone-muted">
            Hello — your care team has a few questions before your nurse calls. Please reply at your
            convenience:
          </div>
          <ol className="list-decimal list-inside space-y-2">
            {list.map((q) => (
              <li key={q.id} className="text-bone">
                {q.text}
                {q.inputType === "single_select" || q.inputType === "multi_select" ? (
                  <span className="text-bone-muted">
                    {" "}
                    ({(q.options || []).join(" / ")})
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="flex-1 overflow-auto pr-1 space-y-4">
          {list.map((q, idx) => {
            const resp = r[q.id] || {};
            const value = resp.value;
            const followUpVisible =
              q.followUp && questionMatchesCondition(value, q.followUp.condition);
            return (
              <div key={q.id} className="space-y-1.5">
                <div className="text-[12px] text-bone">
                  <span className="text-bone-muted mr-1">{idx + 1}.</span>
                  {q.text}
                </div>
                <div>
                  {renderInput({
                    inputType: q.inputType,
                    value,
                    options: q.options,
                    unit: q.unit,
                    disabled: readOnly,
                    name: q.id,
                    onChange: (v) =>
                      q.inputType === "number_unit"
                        ? setQ(q.id, { value: v, unit: q.unit })
                        : setQ(q.id, { value: v }),
                  })}
                </div>
                {followUpVisible ? (
                  <div className="ml-4 pl-3 border-l border-amber/40 space-y-1">
                    <div className="text-[11px] text-bone-muted">{q.followUp.text}</div>
                    {renderInput({
                      inputType: q.followUp.inputType,
                      value: resp.followUp,
                      options: q.followUp.options,
                      unit: q.followUp.unit,
                      disabled: readOnly,
                      name: `${q.id}-followup`,
                      onChange: (v) => setQ(q.id, { followUp: v }),
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="space-y-1.5 pt-2 border-t border-mist/60">
            <div className="text-[12px] text-bone">
              Additional notes (anything else the patient said)
            </div>
            <FreeText
              value={notes}
              onChange={(v) => onNotesChange && onNotesChange(v)}
              disabled={readOnly}
              multiline
            />
          </div>
        </div>
      )}
    </section>
  );
}
