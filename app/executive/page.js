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
          <p>
            In April 2026, Harvard Medical School, Beth Israel Deaconess, and
            Stanford published a study in Science demonstrating that a
            frontier reasoning model matched or exceeded expert physician
            performance on text-based emergency triage diagnosis across 76
            real Boston ER cases. The advantage was strongest where
            information was most limited and decisions most time-pressured —
            the exact conditions of outpatient nurse triage. Kairos
            operationalizes that capability inside a workflow surface the
            nurse already controls.
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
              Quick tour or Deep tour
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
            <h2 className="ke-section-title">
              The Landscape Right Now (May 2026)
            </h2>
          </header>
          <p>
            The clinical AI landscape moves in weeks, not quarters. A model
            named in this paragraph would be superseded before this page is
            read. Any informatics program worth running has someone tracking
            it continuously — not the names, but the capability frontier and
            what it unlocks.
          </p>
          <p>A snapshot of where things stand as of May 2026:</p>

          <h3 className="ke-subhead">
            Cloud LLMs under BAA — the production default.
          </h3>
          <p>
            Major US providers offer Business Associate Agreements covering
            clinical use. This is the path every production clinical AI
            product at major US health systems currently runs on. Lowest
            operational lift, fastest to deploy, proven at peer institutions.
          </p>

          <h3 className="ke-subhead">
            Open-weight models — the sovereignty path is now real.
          </h3>
          <p>
            A category that was a research curiosity twelve months ago. As of
            this quarter, MIT-licensed and Apache-licensed open-weight models
            from multiple labs — US, European, and Chinese — track
            approximately six months behind frontier proprietary models on
            the workloads outpatient clinical AI actually performs. That gap
            has held consistently for years. For chart reading, structured
            drafting, and routine clinical reasoning, six-month-old frontier
            capability is more than enough. The gap remains larger for the
            longest-context and most complex agentic workloads, but those are
            not the daily work of nursing.
          </p>

          <h3 className="ke-subhead">Hardware floor is dropping fast.</h3>
          <p>
            Mixture-of-experts architectures activate only a fraction of
            total model parameters for any given token. The result:
            frontier-grade open-weight models that run on a single on-prem
            GPU server in the $35&ndash;60K range. The &ldquo;you need a
            supercomputer to self-host&rdquo; objection from two years ago is
            out of date. A hospital that already runs Epic on-prem hardware
            can absorb this cost as line-item IT capital, not capital
            project.
          </p>

          <h3 className="ke-subhead">
            Release cadence has changed the planning horizon.
          </h3>
          <p>
            Between mid-March and early May 2026, major labs across the cloud
            and open-weight ecosystems shipped on the order of fifteen
            frontier or near-frontier model releases. A planning document
            written six months ago naming specific vendors is already out of
            date. A planning document written six weeks ago naming specific
            vendors may be out of date. The implication for institutional
            strategy: pick the architectural pattern, not the model. Build
            for swap-ability at the model layer. That is the only durable
            design choice.
          </p>

          <h3 className="ke-subhead">
            What this means for an informatics program.
          </h3>
          <p>
            The cloud BAA path is the right Phase 1 — fastest to production,
            lowest operational lift, proven at peer health systems. The
            self-hosted path is the right Phase 2 or Phase 3 — once a program
            has wins behind it and a board-level appetite for data
            sovereignty emerges. The architecture should support both from
            day one and remain agnostic to specific vendor choices. Kairos
            does.
          </p>

          <p>
            This section is dated May 2026. It will need to be rewritten by
            Q4. That cadence is the nature of the field, and tracking it is
            part of the job.
          </p>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">06</span>
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

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">07</span>
            <h2 className="ke-section-title">
              Where We Are &mdash; and What We Need
            </h2>
          </header>
          <p>
            Kairos has been validated end-to-end against Epic&rsquo;s FHIR R4
            sandbox. What follows is an honest accounting of what the
            platform can do today through standard interfaces, and what
            requires institutional support to unlock.
          </p>

          <h3 className="ke-subhead">
            What Kairos does today through Epic&rsquo;s standard FHIR
            interface &mdash; no additional access required.
          </h3>
          <p>
            Full chart ingestion. Problems, medications, allergies, vitals,
            labs, clinical notes, documents, encounters, procedures,
            diagnostic reports, insurance, care plans, immunizations. Every
            structured data point in the medical record is available to the
            AI before the nurse opens the card.
          </p>
          <p>
            Clinical documentation write-back. RN notes, anticoagulation
            notes, SBARs, and nursing documentation write directly to the
            chart through FHIR&rsquo;s DocumentReference resource. No
            copy-paste. No manual transcription.
          </p>
          <p>
            This alone transforms the nursing workflow. The AI reads the full
            record, identifies the correct workflow, and drafts every
            output. The nurse reviews and approves. Chart investigation
            &mdash; the work that consumes most of the shift &mdash; is
            handled before the card opens.
          </p>

          <h3 className="ke-subhead">
            Five workflows require institutional support.
          </h3>
          <p>
            These sit outside FHIR&rsquo;s standard reach. They are
            available through Epic&rsquo;s proprietary API layer &mdash;
            accessible via App Orchard partnership or direct integration
            approval at the customer site level.
          </p>

          <h3 className="ke-subhead">Patient messaging (MyChart).</h3>
          <p>
            FHIR&rsquo;s Communication resource does not support Epic In
            Basket messaging. Patient notifications, lab result messages,
            and care instructions require manual transfer until proprietary
            API access is granted.
          </p>

          <h3 className="ke-subhead">Order placement.</h3>
          <p>
            Medication, lab, and imaging orders cannot be placed through
            FHIR. Kairos drafts and stages orders for nurse review, but
            entry into Epic remains manual.
          </p>

          <h3 className="ke-subhead">Referral management.</h3>
          <p>
            The referral packet workflow &mdash; cover letter, face sheet,
            document assembly, fax transmission &mdash; is proprietary Epic
            UI. Kairos can automate document selection and packet assembly,
            but transmission requires API access that FHIR does not
            provide.
          </p>

          <h3 className="ke-subhead">Encounter creation.</h3>
          <p>
            Opening specialized encounters &mdash; Anticoagulation-Warfarin
            Visit, telephone encounters &mdash; requires Epic&rsquo;s
            proprietary encounter API.
          </p>

          <h3 className="ke-subhead">Inbox disposition.</h3>
          <p>
            Marking In Basket messages as Done is not available through
            FHIR. Completed items must be manually dispositioned in Epic.
          </p>

          <h3 className="ke-subhead">What this unlocks.</h3>
          <p>
            With FHIR alone, Kairos eliminates the cognitive work &mdash;
            chart investigation, clinical synthesis, note writing. The
            nurse still transfers outputs manually. Estimated savings:
            three to four minutes per encounter.
          </p>
          <p>
            With proprietary API access, Kairos eliminates both the
            cognitive and mechanical work. The nurse reviews, approves, and
            everything executes &mdash; note signed, message sent, orders
            placed, referral faxed, inbox cleared. Estimated savings: eight
            to twelve minutes per encounter.
          </p>
          <p>
            Across 55&ndash;70 daily encounters per nurse, that is the
            difference between a productivity tool and a workforce
            multiplier.
          </p>
          <p>
            Epic&rsquo;s 21st Century Cures Act compliance framework
            supports third-party app integration at this level. The
            technical infrastructure exists. What Kairos needs is a
            champion inside Phelps Health who advocates for the deeper
            integration tier.
          </p>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">08</span>
            <h2 className="ke-section-title">The Window</h2>
          </header>
          <p>
            Clinical AI is advancing at a pace where three months of delay
            represents years of lost positioning. The foundational models
            that power Kairos are improving every quarter &mdash; better
            clinical reasoning, better structured output, better safety
            rails. Institutions that establish integration infrastructure
            now will compound those improvements automatically.
            Institutions that wait will adopt a vendor product built by
            engineers who have never worked a nursing shift.
          </p>
          <p>
            This is not about moving fast at the expense of safety. Patient
            safety and HIPAA compliance are non-negotiable foundations, not
            obstacles to speed. Kairos is designed with safety as
            architecture &mdash; the nurse remains the licensed clinical
            authority on every output. The AI drafts. The nurse approves.
            No autonomous action touches the patient record without human
            review. That safety model does not slow the system down. It
            <em> is</em> the system.
          </p>
          <p>
            What does require urgency is the institutional infrastructure
            &mdash; API access, integration approvals, IT partnership.
            These are organizational decisions, not technical problems. The
            engineering is ready. The prototype is live. The clinical
            workflows are validated across ten encounter patterns
            representing the full scope of outpatient cardiology nursing.
          </p>
          <p>
            Phelps Health has an opportunity that most institutions do not:
            a clinician on staff who built the product, understands the
            workflows from the inside, and can implement it without a
            six-figure vendor contract. That window exists because the
            clinician is here, now, asking for institutional support
            &mdash; not selling software from the outside.
          </p>
          <p>
            The question is not whether AI will transform outpatient
            nursing workflows. It is whether Phelps Health builds that
            transformation internally &mdash; with a clinician who knows
            the chart, the patients, and the workflows &mdash; or
            purchases it from a vendor in two years at ten times the cost.
          </p>

          <a className="ke-cta-mid" href={TOUR_URL}>
            <span className="ke-cta-label">
              See the live prototype
            </span>
            <span className="ke-cta-arrow" aria-hidden="true">&rarr;</span>
          </a>
          <div className="ke-cta-host" aria-hidden="true">
            kairos-tour.firekraker.net/rn
          </div>
        </section>
      </article>

      <footer className="ke-footer">
        <div className="ke-author-name">Brandon Sterne, RN BSN</div>
        <div className="ke-footer-line">
          Phelps Health Heart and Vascular Clinic · 22-year U.S. Navy veteran
        </div>
        <div className="ke-footer-line">
          Highest-output cardiology RN by SlicerDicer note volume — Feb 844 ·
          Mar 1,016 · Apr 698
        </div>
        <div className="ke-footer-line">
          Sole architect of a production platform on Vercel + Cloudflare
          Workers + Supabase, including Kairos.
        </div>
      </footer>
    </div>
  );
}
