// /executive — strategic readout for hospital informatics leadership.
// Long-scroll editorial page. Bypasses AppChrome (see components/AppChrome.js)
// so neither the demonstration banner nor tour chrome render here. Server
// component, no JS interactivity beyond native scroll.

export const metadata = {
  title: "Kairos — for Phelps Health Informatics",
  description:
    "Clinical infrastructure for outpatient cardiology — and a working blueprint for Phelps Health's clinical informatics program.",
};

const TOUR_URL = "https://kairos-tour.firekraker.net/rn";

export default function ExecutivePage() {
  return (
    <div className="kairos-executive">
      <header className="ke-topbar">
        <div className="ke-mark" />
        <div>kairoshealth.app</div>
      </header>

      <section className="ke-hero">
        <div className="ke-eyebrow">For Phelps Health Informatics</div>
        <h1 className="ke-wordmark">KAIROS</h1>
        <div className="ke-wordmark-rule" />
        <p className="ke-lede">
          Clinical infrastructure for outpatient cardiology — and a working
          blueprint for Phelps Health&rsquo;s clinical informatics program.
        </p>
        <p className="ke-byline">
          Built by Brandon Sterne, RN BSN — cardiology nurse, Phelps Health
          Heart and Vascular Clinic.
        </p>
        <a className="ke-cta" href={TOUR_URL}>
          <span className="ke-cta-label">Live prototype</span>
          <span className="ke-cta-arrow" aria-hidden="true">&rarr;</span>
        </a>
        <div className="ke-cta-host" aria-hidden="true">
          kairos-tour.firekraker.net/rn
        </div>
      </section>

      <article className="ke-prose">
        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">01</span>
            <h2 className="ke-section-title">Why This, Why Now</h2>
          </header>
          <p>
            Cardiology nursing is bottlenecked by mechanical work the chart
            already has the answers to. Labs, meds, prior notes, source
            messages, Media tab attachments — the clinical reasoning is rarely
            the hard part. The work is the searching.
          </p>
          <p>
            This page describes a working prototype called Kairos, built over
            the past week after ninety days of studying outpatient cardiology
            workflow patterns directly in practice. It is not a vendor pitch.
            It is a technical proposal for what an outpatient clinical
            informatics program could ship first.
          </p>
          <p>
            The thesis is simple: reduce the mechanical workload, return
            cognitive bandwidth to clinical judgment, use AI as the lever.
            Standardize the searching, the assembly, the routing — the parts
            of nursing that don&rsquo;t require a license. Leave the parts
            that do exactly where they belong.
          </p>
          <p>Kairos is one version of how to ship that.</p>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">02</span>
            <h2 className="ke-section-title">The Clinical Thesis</h2>
          </header>

          <h3 className="ke-subhead">Most of nursing is small forwards.</h3>
          <p>
            A patient calls with an update. Front desk routes a clarification.
            Pharmacy confirms a refill. Each takes a minute or two. Multiplied
            across a shift, it&rsquo;s hours. The cognitive cost isn&rsquo;t
            the decision — it&rsquo;s the context-switching, the
            chart-searching, the clicks across Epic surfaces to assemble what
            should already be assembled.
          </p>
          <p>
            Kairos recognizes the pattern, pre-populates the routing decision,
            makes it a single tap. The nurse glances, confirms, moves on.
            Clinical judgment stays with the nurse. Mechanical assembly moves
            to infrastructure.
          </p>

          <h3 className="ke-subhead">
            Triage is the most underbuilt thing other AI tools do.
          </h3>
          <p>
            Most clinical AI documents what already happened. Kairos drafts
            what needs to happen next. For triage — the most cognitively
            demanding outpatient nursing workflow — Kairos pulls chart context,
            drafts the patient assessment, captures structured responses in
            real time during the call or via patient portal, and synthesizes
            the SBAR for the provider. Two-pass clinical reasoning. Fully
            attributable. Fully editable.
          </p>

          <h3 className="ke-subhead">
            The chart is full of answers. The work is the searching.
          </h3>
          <p>
            A representative case: a VA Request for Service routing question
            takes fifteen minutes of bouncing between Epic surfaces — only to
            discover the form was already submitted and scanned into the Media
            tab two weeks earlier. Kairos runs OCR on chart attachments at
            workflow time, surfaces a Finding banner, collapses the fifteen
            minutes to a glance.
          </p>
          <p>
            The same primitive applies to referral packets, insurance card
            retrieval, outside hospital records — any PDF that lives one tab
            over from the workflow that needs it.
          </p>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">03</span>
            <h2 className="ke-section-title">
              Kairos as Architectural Demonstration
            </h2>
          </header>
          <p>
            Kairos is bidirectional. Chart context is pulled from Epic via
            FHIR — labs, meds, procedures, prior notes, source messages, Media
            tab attachments. Outputs are written back to Epic via FHIR — nurse
            notes, MyChart messages, orders, encounter closes, communications.
          </p>
          <p className="ke-emphasis">
            The nurse never copies, pastes, switches tabs, or moves data
            between systems.
          </p>
          <p>
            That is the architectural thesis. Kairos is the integration layer.
            Every other pattern — pattern recognition, atomic commit, Media
            tab retrieval, scope-respecting reply, multi-step triage — is a
            feature of the integration layer.
          </p>

          <h3 className="ke-subhead">Six Epic-faithful baskets.</h3>
          <p>
            Kairos&rsquo;s dashboard mirrors Epic&rsquo;s In Basket exactly:
            Results, Results F/U, Rx Request, Patient Call, Patient Advice
            Request, Secure Chat. No invented categories. Pattern types are
            per-card metadata, not separate workspaces. A nurse trained on
            Epic recognizes the surface in under a minute.
          </p>

          <h3 className="ke-subhead">Atomic commit.</h3>
          <p>
            A CPAP order, sleep medicine referral, and patient communication
            that today require 20+ clicks across five Epic surfaces collapse
            to a single Authorize on a single card. Every action is auditable.
            Every action is reversible until commit. The nurse approves the
            package; Kairos writes it.
          </p>

          <h3 className="ke-subhead">Four roles, one platform.</h3>
          <p>
            Kairos is scaffolded for four clinic surfaces: Nurse, Provider,
            Scribe, Front Desk. The nurse surface is live in the prototype.
            The provider surface targets morning prep and loop closure on
            prior recommendations. The scribe surface targets ambient capture
            and structured note generation during physician rounding —
            currently in early co-development with an IT-savvy science and
            technology student from the college across the street from
            Phelps. The front desk surface targets refill kickouts and
            scheduling triage.
          </p>

          <a className="ke-cta-mid" href={TOUR_URL}>
            <span className="ke-cta-label">
              13-minute Quick tour or 25-minute Deep tour
            </span>
            <span className="ke-cta-arrow" aria-hidden="true">&rarr;</span>
          </a>
          <div className="ke-cta-host" aria-hidden="true">
            kairos-tour.firekraker.net/rn
          </div>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">04</span>
            <h2 className="ke-section-title">How This Generalizes</h2>
          </header>
          <p>
            The architecture is specialty-agnostic. Cardiology was the proof
            environment because that&rsquo;s the workflow studied directly.
            The same primitives — bidirectional FHIR, pattern recognition over
            the In Basket, Media tab OCR, atomic commit, scope-respecting
            reply — apply to any outpatient specialty with high-volume
            documentation.
          </p>
          <p>
            A reasonable shape for a year-one informatics program: production
            deployment of the Nurse surface in cardiology — FHIR scopes, BAA,
            audit pipeline, two-nurse pilot, full clinic. Then expansion to
            the Provider surface for morning prep and Media tab OCR on outside
            records, and scoping of a second specialty.
          </p>
          <p>
            Year two: Front Desk and Scribe surfaces, third and fourth
            specialties, write-back expansion, pattern primitives become
            Phelps internal infrastructure.
          </p>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">05</span>
            <h2 className="ke-section-title">IT Answers</h2>
          </header>

          <h3 className="ke-subhead">Authentication and identity.</h3>
          <p>
            SMART on FHIR launch from inside Epic. No separate user
            provisioning, no help-desk tickets, no shadow identity store. The
            nurse who launches Kairos is the nurse Epic says they are.
          </p>

          <h3 className="ke-subhead">PHI handling.</h3>
          <p>
            PHI in transit only. Kairos does not persist patient charts.
            Inputs are pulled from Epic at workflow time, processed, discarded
            after write-back. The HIPAA footprint is a documentation tool,
            not a system of record.
          </p>

          <h3 className="ke-subhead">LLM provider pathway.</h3>
          <p>
            The current implementation runs on Anthropic Claude under a
            Business Associate Agreement — the same vendor pattern major
            clinical AI companies use for production. The architecture is
            deliberately model-agnostic. Production redundancy across
            Anthropic, OpenAI, and Google is a deployment decision, not a
            rebuild — any of them can be primary, any of them can be
            failover. The same flexibility extends to enterprise-tenancy
            variants (AWS Bedrock, Azure OpenAI), self-hosted open-source
            LLMs, and hybrid configurations with on-prem PHI scrubbing as
            defense in depth. Phelps&rsquo;s choice; the architecture
            supports all of them.
          </p>

          <h3 className="ke-subhead">Audit trail.</h3>
          <p>
            Every model call logged with prompt, response, model version,
            latency, and the user identity that triggered it. Exportable.
            Queryable. Tied to the FHIR resource the call produced.
          </p>

          <h3 className="ke-subhead">Implementation lift on the IT side.</h3>
          <p>
            Epic admin approves production FHIR scopes. Network admin allows
            outbound HTTPS. Identity team confirms SMART launch. After that,
            day-to-day IT involvement is zero unless something breaks.
          </p>

          <h3 className="ke-subhead">Vendor stability.</h3>
          <p>
            A single developer is a single point of failure and Phelps should
            treat it that way. The mitigation is the role itself: hire the
            developer in-house, version-control the codebase inside Phelps,
            build redundancy as the program grows. The architecture and
            clinical fluency are the value; the binary is portable.
          </p>
        </section>
      </article>

      <footer className="ke-footer">
        <div className="ke-author-name">Brandon Sterne, RN BSN</div>
        <div className="ke-footer-line">
          Phelps Health Heart and Vascular Clinic · 22-year U.S. Navy veteran
        </div>
        <div className="ke-footer-line">
          Highest-output cardiology RN by SlicerDicer note volume — Feb 844 ·
          Mar 1,016 · Apr MTD 634
        </div>
        <div className="ke-footer-line">
          Sole architect of a production platform on Vercel + Cloudflare
          Workers + Supabase, including Kairos.
        </div>
      </footer>
    </div>
  );
}
