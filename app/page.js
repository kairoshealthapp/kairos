// Kairos landing page — role picker. Server component.
//
// Editorial dark + warm gold treatment: KAIROS wordmark + tagline cluster
// in the hero, then five role tiles in a single horizontal row below.
// AppChrome short-circuits for "/" so this page renders without the
// Banner / TourMode / VersionStamp chrome (see components/AppChrome.js:16).
//
// All landing-specific styles live in app/globals.css scoped under
// `.kairos-landing`. Tokens map design source (Cormorant + Inter +
// #C9A24A) onto the project's --kairos-amber + --font-fraunces +
// --font-geist so the wordmark matches the rest of the app.
//
// Layout: ≥1024px hero is 100vh + tiles row in a 5-col grid below.
// 768–1023px tiles become a 3+2 grid. <768px collapses to a vertical
// stack. Entry animations and the ambient sweep are gated on
// (prefers-reduced-motion: no-preference); without that, content is
// visible by default with no transforms or opacity tricks.
//
// Routes confirmed live: /rn (live tour), /provider, /frontdesk,
// /executive, /scribe (the latter four are placeholder pages).

import Link from "next/link";

export const metadata = {
  title: "Kairos — the opportune moment",
  description:
    "Kairos. The time is now. A clinical workflow tour for hospital leadership.",
};

const TILES = [
  { label: "Nurse",      href: "/rn",        status: "Live tour",   live: true  },
  { label: "Provider",   href: "/provider",  status: "Live tour",   live: true  },
  { label: "Scribe",     href: "/scribe",    status: "Coming soon", live: false },
  { label: "Front Desk", href: "/frontdesk", status: "Coming soon", live: false },
  { label: "Executive",  href: "/executive", status: "Live",        live: true  },
];

export default function LandingPage() {
  return (
    <div className="kairos-landing">
      <header className="kl-topbar">
        <div className="kl-mark" />
        <div>kairoshealth.app</div>
      </header>

      <section className="kl-hero">
        <div className="kl-eyebrow">Clinical workflow tour</div>
        <h1 className="kl-wordmark">KAIROS</h1>
        <div className="kl-wordmark-rule" />
        <p className="kl-tagline">
          <em>the opportune moment</em>
          <span className="kl-now">The time is now.</span>
        </p>
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
              </div>
              <div className="kl-tile-arrow" />
            </Link>
          ))}
        </div>
      </section>

      <footer className="kl-footer">
        Built by <span className="kl-author">Brandon Sterne RN BSN</span>,
        {" "}cardiology nurse and developer.
      </footer>
    </div>
  );
}
