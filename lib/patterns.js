// Phase 3.3 — 14-pattern taxonomy as data.
// Source of truth: docs/PHASE-3.3-DESIGN.md Section 4.

const PATTERNS = [
  {
    id: 1,
    name: "SYNTHESIS only",
    trigger: "Provider decided, no orders, no labs",
    panes: ["source", "nurseNote", "mychart"],
    actionButtons: [{ id: "generate-note-mychart", label: "Generate Note + MyChart" }],
    surface: "v1",
  },
  {
    id: 2,
    name: "SYNTHESIS + NEW ORDER",
    trigger: "Plan includes new diagnostic study or referral",
    panes: ["source", "nurseNote", "mychart", "orderPad"],
    actionButtons: [
      { id: "generate-note-mychart", label: "Generate Note + MyChart" },
      { id: "stage-order", label: "Order Staging Diff" },
    ],
    surface: "v1",
  },
  {
    id: 3,
    name: "SYNTHESIS + DOSE CHANGE",
    trigger: "Med modification, no labs",
    panes: ["source", "nurseNote", "mychart", "orderPad"],
    actionButtons: [
      { id: "generate-note-mychart", label: "Generate Note + MyChart" },
      { id: "stage-dose-diff", label: "Stage Dose Diff" },
    ],
    surface: "v1",
  },
  {
    id: 4,
    name: "SYNTHESIS + DOSE CHANGE + LAB CLUSTER",
    trigger: "Med change + multi-lab follow-up",
    panes: ["source", "nurseNote", "mychart", "orderPad"],
    actionButtons: [
      { id: "generate-note-mychart", label: "Generate Note + MyChart" },
      { id: "stage-dose-and-labs", label: "Stage Dose + Lab Cluster" },
    ],
    surface: "v1",
  },
  {
    id: 5,
    name: "SYNTHESIS + CHOICE",
    trigger: "Two-stage with conditional staged orders",
    panes: ["source", "nurseNote", "mychart", "orderPad"],
    actionButtons: [
      { id: "generate-note-mychart", label: "Generate Note + MyChart" },
      { id: "choose-option-a", label: "Choose Option A" },
      { id: "choose-option-b", label: "Choose Option B" },
    ],
    surface: "v1",
  },
  {
    id: 6,
    name: "SYNTHESIS + HANDOFF",
    trigger: "Cross-specialty referral, no orders fire from cardiology side",
    panes: ["source", "nurseNote", "mychart", "orderPad"],
    actionButtons: [
      { id: "generate-note-mychart", label: "Generate Note + MyChart" },
      { id: "route-to-pcp", label: "Route to PCP" },
    ],
    surface: "v1",
  },
  {
    id: 7,
    name: "URGENT",
    trigger: "Symptom-acuity high; phone-only regardless of MyChart status",
    panes: ["source", "nurseNote", "phone"],
    actionButtons: [
      { id: "generate-phone-script", label: "Generate Note + Explanation" },
      { id: "page-provider", label: "Page Provider" },
    ],
    surface: "v1",
  },
  {
    id: "7b",
    name: "ASYNC PRE-CALL STRUCTURED INQUIRY",
    trigger: "Patient-origin or outside-origin clinical inbound; multi-stage lifecycle",
    panes: ["source", "nurseNote", "phone", "orderPad"],
    actionButtons: [
      { id: "generate-inquiry", label: "Generate Inquiry" },
      { id: "process-reply", label: "Process Reply" },
      { id: "generate-sbar", label: "Generate SBAR" },
      { id: "synthesize-callback", label: "Synthesize Callback Note" },
    ],
    surface: "v1",
  },
  {
    id: 8,
    name: "CONTRADICTION",
    trigger: "Patient statement contradicts chart; clinical safety hold",
    panes: ["source", "nurseNote"],
    actionButtons: [{ id: "forward-to-provider", label: "Forward to Provider" }],
    surface: "v1",
  },
  {
    id: 9,
    name: "TRANSACTIONAL REPLY",
    trigger: "MyChart confirmation round-trip",
    panes: ["source", "nurseNote", "mychart"],
    actionButtons: [{ id: "generate-reply", label: "Generate Reply" }],
    surface: "v1",
  },
  {
    id: 10,
    name: "COORDINATION",
    trigger: "Multi-task across boxes, persistent investigation",
    panes: ["source", "nurseNote", "mychart"],
    actionButtons: [
      { id: "generate-reply", label: "Generate Reply" },
      { id: "forward-to-provider", label: "Forward to Provider" },
    ],
    surface: "v1",
  },
  {
    id: 11,
    name: "ADMINISTRATIVE (Layer 1)",
    trigger: "Pharmacy fax, records request, refill-rule auto-clear (background agent)",
    panes: ["source", "nurseNote", "mychart"],
    actionButtons: [{ id: "audit-auto-clear", label: "Audit Auto-Clear" }],
    surface: "v1.5",
  },
  {
    id: 12,
    name: "SCOPE-CONSTRAINED PATIENT QUESTION",
    trigger: "Vague patient question — clarification subroutine",
    panes: ["source", "nurseNote", "mychart"],
    actionButtons: [
      { id: "request-clarification", label: "Request Clarification" },
      { id: "generate-scope-respecting-reply", label: "Generate Scope-Respecting Reply" },
    ],
    surface: "v1",
  },
  {
    id: 13,
    name: "INSURANCE DENIAL CASCADE",
    trigger: "ServiceRequest denied; persistent investigation; auth-state drives framing",
    panes: ["source", "nurseNote", "mychart", "orderPad"],
    actionButtons: [
      { id: "generate-denial-aware-outreach", label: "Generate Denial-Aware Outreach" },
      { id: "schedule-peer-to-peer", label: "Schedule Peer-to-Peer" },
      { id: "forward-to-provider", label: "Forward to Provider" },
    ],
    surface: "v1.5",
  },
  {
    id: 14,
    name: "PHONE-CHANNEL SYNTHESIS",
    trigger: "Result Note when MyChart Pending/Inactive/None; example explanation rather than written reply",
    panes: ["source", "nurseNote", "phone"],
    actionButtons: [
      { id: "generate-phone-script", label: "Generate Note + Explanation" },
    ],
    surface: "v1",
  },
];

export default PATTERNS;

export function getPattern(id) {
  return PATTERNS.find((p) => String(p.id) === String(id)) || null;
}
