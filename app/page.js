// Kairos landing page — two sections. Server component.
//
// Section 1 (.kl-hero): architecture-pitch hero — KAIROS wordmark +
// tagline cluster, then a concise statement of what Kairos is, the
// rules-in-code differentiator, repo-verified proof points, and links
// to the GitHub repo / README. Built for the builder/provider audience.
//
// Section 2 (.kl-tiles-section): role picker — five role tiles, each
// with a one-line description of what that surface shows. Built for the
// clinical audience.
//
// AppChrome short-circuits for "/" so this page renders without the
// Banner / TourMode / VersionStamp chrome (see components/AppChrome.js:16).
// There is no tour machinery on the landing page — no tour anchors here.
//
// All landing-specific styles live in app/globals.css scoped under
// `.kairos-landing`. Tokens map design source (Cormorant + Inter +
// #C9A24A) onto the project's --kairos-amber + --font-fraunces +
// --font-geist so the wordmark matches the rest of the app.
//
// Layout: the page is a single continuous scroll — hero pitch, then
// role picker, then footer. Sections size to their content (no forced
// 100vh bands). At 768–1023px the tiles become a 3+2 grid; <768px
// collapses to a vertical stack. Entry animations and the ambient
// sweep are gated on (prefers-reduced-motion: no-preference).
//
// Routes confirmed live: /rn (guided tour), /provider (guided tour),
// /executive (static readout); /scribe and /frontdesk are scaffolded.

import Link from "next/link";

export const metadata = {
  title: "Kairos — the opportune moment",
  description:
    "Kairos — a design-stage prototype of a clinical workflow architecture: a deterministic rules engine running against FHIR-shaped data, demonstrating safety-critical clinical decision support.",
};

const REPO_URL = "https://github.com/kairoshealthapp/kairos";

// Repo-verified proof points — these must match README.md exactly.
const PROOF = [
  { num: "11", label: "deterministic rules" },
  { num: "4", label: "clinical areas" },
  { num: "431", label: "unit tests" },
  { num: "6", label: "guideline sources" },
  { num: "16", label: "ADRs" },
];

const TILES = [
  {
    label: "Nurse",
    href: "/rn",
    status: "Live",
    live: true,
    blurb:
      "Guided tour of the cardiology nurse dashboard — inbox-style work baskets, triage, and chart synthesis.",
  },
  {
    label: "Provider",
    href: "/provider",
    status: "Live",
    live: true,
    blurb:
      "Guided tour of the provider day-in-the-life — a 12-section patient briefing drawer across a clinic schedule.",
  },
  {
    label: "Scribe",
    href: "/scribe",
    status: "In development",
    live: false,
    blurb: "Ambient documentation surface — scaffolded, not yet built out.",
  },
  {
    label: "Front Desk",
    href: "/frontdesk",
    status: "In development",
    live: false,
    blurb: "Front-desk intake and scheduling surface — scaffolded, not yet built out.",
  },
  {
    label: "Executive",
    href: "/executive",
    status: "Live",
    live: true,
    blurb:
      "The leadership-audience readout — the case for the architecture, written for hospital decision-makers.",
  },
];

export default function LandingPage() {
  return (
    <div className="kairos-landing">
      <header className="kl-topbar">
        <div className="kl-mark" />
        <div>kairoshealth.app</div>
      </header>

      <section className="kl-hero">
        <div className="kl-eyebrow">Clinical workflow architecture</div>
        <h1 className="kl-wordmark">KAIROS</h1>
        <div className="kl-wordmark-rule" />
        <p className="kl-tagline">
          <em>the opportune moment</em>
          <span className="kl-now">The time is now.</span>
        </p>

        <div className="kl-pitch">
          <p className="kl-pitch-lead">
            A clinical workflow architecture with a deterministic rules engine
            running against FHIR-shaped data — a design-stage prototype
            demonstrating safety-critical clinical decision support.
          </p>
          <p className="kl-pitch-diff">
            Clinical rules live in code, not LLM prompts. The model is never in
            the decision path. Every chart commit is human-authorized.
          </p>

          <div className="kl-proof">
            {PROOF.map((p) => (
              <div key={p.label} className="kl-proof-item">
                <span className="kl-proof-num">{p.num}</span>
                <span className="kl-proof-label">{p.label}</span>
              </div>
            ))}
          </div>

          <div className="kl-pitch-links">
            <a
              className="kl-pitch-link"
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repository
            </a>
            <a
              className="kl-pitch-link"
              href={`${REPO_URL}#readme`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Architecture &amp; README
            </a>
          </div>
        </div>
      </section>

      <section className="kl-tiles-section">
        <div className="kl-tiles-label">Choose a vantage point</div>
        <div className="kl-tiles">
          {TILES.map((tile, i) => (
            <Link
              key={tile.href}
              href={tile.href}
              className={`kl-tile ${tile.live ? "live" : "soon"}`}
              style={{ "--i": i }}
              aria-label={`${tile.label} — ${tile.status}`}
            >
              <div className="kl-tile-body">
                <div className="kl-tile-role">{tile.label}</div>
                <div className="kl-tile-status">
                  <span className="kl-pip" />
                  {tile.status}
                </div>
                <p className="kl-tile-blurb">{tile.blurb}</p>
              </div>
              <div className="kl-tile-arrow" />
            </Link>
          ))}
        </div>
      </section>

      <footer className="kl-footer">
        Built by <span className="kl-author">Brandon Sterne RN BSN</span>
        {" "}— a registered nurse with 26 years of clinical experience, now
        working in cardiology.
      </footer>
    </div>
  );
}
