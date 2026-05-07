// Converts a 12-section provider briefing object into plain text the
// chart-chat LLM can search. Output is grouped by section number
// (01-12) so the model can cite "Section 06" reliably.
//
// Schema reference: app/provider/components/BriefingDrawer.js.

const LABELS = {
  "01": "WHO THIS IS",
  "02": "WHY THEY'RE HERE TODAY",
  "03": "ACTIVE PROBLEMS",
  "04": "CURRENT MEDICATIONS",
  "05": "THE LONGITUDINAL STORY",
  "06": "TRENDED DATA THAT MATTERS",
  "07": "HOSPITAL COURSE & DISCHARGE",
  "08": "ALLERGIES",
  "09": "PATTERNS KAIROS SURFACES",
  "10": "RISK CONTEXT",
  "11": "CARE GAPS WORTH ADDRESSING",
  "12": "KAIROS-FLAGGED ITEMS",
};

function val(v) {
  if (v === null || v === undefined) return "(no data)";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    return v
      .map((it) => {
        if (typeof it === "string") return "- " + it;
        if (it && typeof it === "object") {
          if (it.med) {
            return "- " + it.med + (it.rationale ? " (" + it.rationale + ")" : "");
          }
          if (it.text) return "- " + it.text;
          if (it.name) return "- " + it.name + (it.rationale ? " (" + it.rationale + ")" : "");
        }
        return "- " + JSON.stringify(it);
      })
      .join("\n");
  }
  if (typeof v === "object") {
    const lines = [];
    for (const [k, vv] of Object.entries(v)) {
      lines.push(k + ":");
      const inner = val(vv);
      lines.push(
        inner
          .split("\n")
          .map((l) => "  " + l)
          .join("\n")
      );
    }
    return lines.join("\n");
  }
  return String(v);
}

function section(num, body) {
  return "Section " + num + " · " + LABELS[num] + "\n" + body;
}

export function serializeBriefing(briefing) {
  if (!briefing) return "(No chart available.)";

  const blocks = [];

  blocks.push(section("01", val(briefing.whoThisIs)));
  blocks.push(section("02", val(briefing.whyHereToday)));
  blocks.push(section("03", val(briefing.activeProblems)));
  blocks.push(section("04", val(briefing.currentMedications)));
  blocks.push(section("05", val(briefing.longitudinalStory)));
  blocks.push(section("06", val(briefing.trendedData)));

  if (briefing.kind === "postHospital" && briefing.hospitalCourse) {
    blocks.push(section("07", val(briefing.hospitalCourse)));
  } else {
    blocks.push(section("07", "(Not applicable — visit type does not include a hospital course.)"));
  }

  blocks.push(section("08", val(briefing.allergies)));
  blocks.push(section("09", val(briefing.patternsKairosSurfaces)));
  blocks.push(section("10", val(briefing.riskContext)));
  blocks.push(section("11", val(briefing.careGaps)));
  blocks.push(section("12", val(briefing.kairosFlags)));

  return blocks.join("\n\n");
}

export default serializeBriefing;
