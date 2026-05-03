// v3.0 Fix 1a — Epic-style recipient search. Replaces the static
// dropdown with a search input + autocomplete from a fictional roster.
// Single-select (Forward) or multi-select (Reply + CC). No real
// Phelps names anywhere.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const ROSTER = [
  { name: "Dr. Sarah Chen, MD", role: "Cardiology" },
  { name: "Dr. Michael Torres, MD", role: "Internal Medicine" },
  { name: "Dr. Priya Patel, MD", role: "Cardiology" },
  { name: "Dr. James Liu, MD", role: "Pulmonology" },
  { name: "Dr. Anna Kowalski, MD", role: "Hematology" },
  { name: "James Holvenmark, NP", role: "Cardiology" },
  { name: "Rachel Kim, RN", role: "Support Staff" },
  { name: "Lisa Park, RN", role: "Cardiology" },
  { name: "Maria Santos, RN", role: "Device Nurse" },
  { name: "Front Desk Pool", role: "Pool" },
  { name: "Cardiology Support Staff Pool", role: "Pool" },
  { name: "Device Nurse Pool", role: "Pool" },
];

export default function RecipientPicker({
  open,
  multi = false,
  onConfirm,
  onCancel,
  title = "Forward to",
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(multi ? [] : "");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setPicked(multi ? [] : "");
    const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    return () => clearTimeout(t);
  }, [open, multi]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onCancel && onCancel();
      }
    }
    function onKey(e) {
      if (e.key === "Escape") onCancel && onCancel();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ROSTER;
    return ROSTER.filter(
      (r) => r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q)
    );
  }, [query]);

  if (!open) return null;

  function handleSelect(name) {
    if (multi) {
      setPicked((prev) => (prev.includes(name) ? prev : [...prev, name]));
      setQuery("");
      inputRef.current && inputRef.current.focus();
    } else {
      setPicked(name);
      setQuery(name);
    }
  }

  function removeChip(name) {
    setPicked((prev) => prev.filter((n) => n !== name));
  }

  function handleConfirm() {
    if (multi) {
      if (picked.length > 0) onConfirm && onConfirm(picked);
    } else if (picked) {
      onConfirm && onConfirm(picked);
    }
  }

  const canConfirm = multi ? picked.length > 0 : !!picked;

  return (
    <div
      ref={ref}
      className="absolute right-0 mt-1 z-30 kairos-card p-3 w-80 shadow-xl"
    >
      <div className="kairos-kicker text-amber/80 mb-2">{title}</div>

      {multi && picked.length > 0 ? (
        <div className="flex flex-wrap gap-1 mb-2">
          {picked.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 text-[11px] bg-amber/15 text-bone border border-amber/40 px-2 py-0.5 rounded-sm"
            >
              {name}
              <button
                type="button"
                onClick={() => removeChip(name)}
                aria-label={`Remove ${name}`}
                className="text-bone-muted hover:text-amber leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!multi) setPicked("");
        }}
        placeholder="Search by name..."
        className="w-full bg-platinum/40 border border-mist/60 rounded-sm px-2 py-1.5 text-[12px] text-bone placeholder:text-bone-muted/70 focus:outline-none focus:border-amber/60"
      />

      <ul className="mt-2 max-h-48 overflow-auto border-t border-mist/40 pt-1">
        {suggestions.length === 0 ? (
          <li className="text-[11px] text-bone-muted/70 italic px-2 py-1">No matches.</li>
        ) : (
          suggestions.map((r) => {
            const isPicked = multi ? picked.includes(r.name) : picked === r.name;
            return (
              <li key={r.name}>
                <button
                  type="button"
                  onClick={() => handleSelect(r.name)}
                  disabled={multi && isPicked}
                  className={
                    "w-full text-left px-2 py-1 rounded-sm hover:bg-platinum transition-colors flex items-baseline justify-between gap-2 " +
                    (isPicked ? "bg-amber/10" : "")
                  }
                >
                  <span className="text-[12px] text-bone">{r.name}</span>
                  <span className="text-[10px] text-bone-muted/70">{r.role}</span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-mist/60">
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] px-2 py-1 rounded-sm text-bone-muted hover:text-bone"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="text-[12px] font-medium px-3 py-1 rounded-sm bg-amber text-graphite hover:bg-amber/90 disabled:opacity-40"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
