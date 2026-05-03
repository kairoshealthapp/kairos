// /executive — strategic readout for hospital informatics leadership.
// Long-scroll editorial page. Bypasses AppChrome (see components/AppChrome.js)
// so neither the demonstration banner nor tour chrome render here. Server
// component, no JS interactivity beyond native scroll.

export const metadata = {
  title: "Kairos — for Phelps Health Informatics",
  description:
    "Clinical infrastructure for outpatient cardiology — a working prototype and a pilot proposal for Phelps Health's clinical informatics program.",
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
          Clinical infrastructure for outpatient cardiology — a working
          prototype and a pilot proposal for Phelps Health&rsquo;s
          clinical informatics program.
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
            <h2 className="ke-section-title">The Problem</h2>
          </header>
          <p>
            Kairos reduces the time and variability of outpatient nursing
            work by pre-generating documentation, patient communication,
            and orders from the full patient chart.
          </p>
          <p>
            Cardiology nursing is bottlenecked by mechanical work the
            chart already has the answers to. Labs, meds, prior notes,
            source messages, Media tab attachments — the clinical
            reasoning is rarely the hard part. The work is the searching.
          </p>
          <p>
            Across an outpatient cardiology shift, a single RN handles
            roughly 55 to 70 encounters: lab follow-ups, refills, triage
            calls, MyChart messages, referrals, prior auths. The clinical
            decision on each is usually small. The chart-searching,
            context-assembly, and protocol application are not.
          </p>
          <p>
            Capacity varies by nurse experience, not patient demand. Two
            nurses processing the same inbox produce different outputs at
            different speeds. If Kairos compresses each
            encounter&rsquo;s cognitive prep from minutes to a review
            step, the recovered time per nurse per shift is the
            difference between hiring and not hiring.
          </p>
          <p>
            This page describes a working prototype, validated against
            synthetic test cases in Epic&rsquo;s sandbox environment. It
            is not a vendor pitch. It is a proposal for what an
            outpatient clinical informatics program could ship first.
            The thesis: reduce the mechanical workload, return cognitive
            bandwidth to clinical judgment, use AI as the lever.
          </p>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">02</span>
            <h2 className="ke-section-title">The Clinical Thesis</h2>
          </header>

          <h3 className="ke-subhead">Most of nursing is small forwards.</h3>
          <p>
            A patient calls with an update. Front desk routes a
            clarification. Pharmacy confirms a refill. Each takes a
            minute or two. Multiplied across a shift, it&rsquo;s hours.
            The cognitive cost isn&rsquo;t the decision — it&rsquo;s the
            context-switching, the chart-searching, the clicks across
            Epic surfaces to assemble what should already be assembled.
          </p>
          <p>
            Kairos recognizes the pattern, pre-populates the routing
            decision, makes it a single tap. The nurse glances, confirms,
            moves on. Clinical judgment stays with the nurse. Mechanical
            assembly moves to infrastructure.
          </p>

          <h3 className="ke-subhead">
            What this looks like for one encounter.
          </h3>
          <p>
            A patient&rsquo;s INR result lands in the nurse&rsquo;s
            inbox. The current workflow:
          </p>
          <ul>
            <li>Nurse reads the result</li>
            <li>Pulls the chart for trend (manual, multiple clicks)</li>
            <li>Reviews medications and recent notes</li>
            <li>Applies the clinic&rsquo;s anticoagulation protocol</li>
            <li>Writes the nurse note from scratch</li>
            <li>Drafts a MyChart message to the patient</li>
            <li>Documents and signs</li>
          </ul>
          <p>The Kairos workflow:</p>
          <ul>
            <li>Nurse opens the card</li>
            <li>
              The note is written, the patient message is drafted, the
              next INR is scheduled
            </li>
            <li>Nurse reviews, approves, moves on</li>
          </ul>
          <p>Same clinical decision. Different cognitive load.</p>

          <h3 className="ke-subhead">Triage is where this goes deeper.</h3>
          <p>
            Generic triage protocols ask the same questions of every
            patient. Kairos generates patient-specific assessment
            questions from the full chart — surfacing risks generic
            protocols miss, including missed medications, relevant lab
            trends, and condition-specific red flags. The SBAR that
            comes out reads like it was written by a nurse with years
            of cardiac triage experience, because the AI has the full
            chart context that would otherwise take fifteen minutes to
            manually review.
          </p>
          <p>
            In April 2026, Harvard Medical School, Beth Israel Deaconess,
            and Stanford published a study in <em>Science</em>{" "}
            demonstrating that a frontier reasoning model matched or
            exceeded expert physician performance on text-based
            emergency triage diagnosis across 76 real Boston ER cases.
            The advantage was strongest where information was most
            limited and decisions most time-pressured — the exact
            conditions of outpatient nurse triage. Kairos
            operationalizes that capability inside a workflow surface
            the nurse already controls.
          </p>

          <h3 className="ke-subhead">
            The chart is full of answers. The work is the searching.
          </h3>
          <p>
            A common workflow pattern: a VA Request for Service routing
            question takes fifteen minutes of bouncing between Epic
            surfaces — only to discover the form was already submitted
            and scanned into the Media tab two weeks earlier. Kairos
            runs OCR on chart attachments at workflow time, surfaces a
            Finding banner, collapses the fifteen minutes to a glance.
          </p>
          <p>
            The same primitive applies to referral packets, insurance
            card retrieval, outside hospital records — any PDF that
            lives one tab over from the workflow that needs it.
          </p>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">03</span>
            <h2 className="ke-section-title">The Architecture</h2>
          </header>
          <p>
            Kairos is bidirectional. Chart context is pulled from Epic
            via FHIR — labs, meds, procedures, prior notes, source
            messages, Media tab attachments. Outputs are written back
            to Epic via FHIR — nurse notes, MyChart messages, orders,
            encounter closes, communications.
          </p>
          <p className="ke-emphasis">
            The nurse never copies, pastes, switches tabs, or moves data
            between systems.
          </p>
          <p>
            That is the architectural thesis. Kairos is the integration
            layer. Every other pattern — pattern recognition, atomic
            commit, Media tab retrieval, scope-respecting reply,
            multi-step triage — is a feature of the integration layer.
          </p>

          <h3 className="ke-subhead">Six Epic-faithful baskets.</h3>
          <p>
            Kairos&rsquo;s dashboard mirrors Epic&rsquo;s In Basket
            exactly: Results, Results F/U, Rx Request, Patient Call,
            Patient Advice Request, Secure Chat. No invented categories.
            Pattern types are per-card metadata, not separate
            workspaces. A nurse trained on Epic recognizes the surface
            in under a minute.
          </p>

          <h3 className="ke-subhead">Atomic commit.</h3>
          <p>
            A CPAP order, sleep medicine referral, and patient
            communication that today require 20+ clicks across five
            Epic surfaces collapse to a single Authorize on a single
            card. Every action is auditable. Every action is reversible
            until commit. The nurse approves the package; Kairos writes
            it.
          </p>

          <h3 className="ke-subhead">Phased by risk, not by feature.</h3>
          <p>
            The integrations unlock in order of clinical risk. Estimated
            timelines depend on Phelps&rsquo;s institutional review pace.
          </p>
          <p>
            <strong>Phase 1 — Documentation.</strong> Clinical notes
            write back to Epic. Lowest risk, already authorized in test.
            Estimated 2 to 4 weeks from approval to limited deployment.
          </p>
          <p>
            <strong>Phase 2 — Patient communication.</strong> MyChart
            messaging. Higher frequency, moderate risk. Every message
            reviewed by the nurse before sending. Estimated 4 to 8
            weeks from Phase 1 completion.
          </p>
          <p>
            <strong>Phase 3 — Orders.</strong> Medications, labs,
            imaging. Highest clinical risk. Approved last, with the
            audit trail and override capture from Phases 1 and 2
            already in place. Estimated 8 to 16 weeks from Phase 2
            completion, dependent on governance review.
          </p>
          <p>
            Each phase generates the safety data that justifies the
            next.
          </p>

          <a className="ke-cta-mid" href={TOUR_URL}>
            <span className="ke-cta-label">See the live prototype</span>
            <span className="ke-cta-arrow" aria-hidden="true">&rarr;</span>
          </a>
          <div className="ke-cta-host" aria-hidden="true">
            kairos-tour.firekraker.net/rn
          </div>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">04</span>
            <h2 className="ke-section-title">Risk and Governance</h2>
          </header>

          <h3 className="ke-subhead">Liability and the audit trail.</h3>
          <p>
            Kairos functions as clinical decision support and
            documentation assistance. Final clinical responsibility
            remains with the licensed clinician approving the output.
            The product does not autonomously place orders, send
            patient messages, or sign documentation. Every outbound
            action requires nurse approval.
          </p>
          <p>
            Every model call is logged with prompt, response, model
            version, latency, and the user identity that triggered it.
            Logs are exportable and queryable, tied to the FHIR
            resource the call produced. The audit trail is the
            regulatory artifact.
          </p>

          <h3 className="ke-subhead">Authentication and identity.</h3>
          <p>
            SMART on FHIR launch from inside Epic. No separate user
            provisioning, no help-desk tickets, no shadow identity
            store. The nurse who launches Kairos is the nurse Epic says
            they are.
          </p>

          <h3 className="ke-subhead">PHI handling.</h3>
          <p>
            PHI in transit only. Kairos does not persist patient
            charts. Inputs are pulled from Epic at workflow time,
            processed, discarded after write-back. The HIPAA footprint
            is a documentation tool, not a system of record.
          </p>

          <h3 className="ke-subhead">LLM provider pathway.</h3>
          <p>
            The architecture is model-agnostic. Anthropic, OpenAI, and
            Google all offer Business Associate Agreements covering
            clinical use — the same vendor pattern major clinical AI
            products run on. Any of them can be primary, any of them
            can be failover. The same flexibility extends to
            enterprise-tenancy variants (AWS Bedrock, Azure OpenAI),
            self-hosted open-weight LLMs, and hybrid configurations
            with on-prem PHI scrubbing as defense in depth.
            Phelps&rsquo;s choice; the architecture supports all of
            them.
          </p>

          <h3 className="ke-subhead">Implementation lift on the IT side.</h3>
          <p>
            Epic admin approves the FHIR access required for the pilot.
            Network admin allows outbound HTTPS. Identity team confirms
            SMART launch. After that, day-to-day IT involvement is zero
            unless something breaks.
          </p>

          <h3 className="ke-subhead">Vendor durability.</h3>
          <p>
            Kairos is currently a working prototype, built by a
            practicing cardiology nurse. Any deployment beyond pilot
            would require formalization — defined ownership, maintenance
            commitments, support agreements, and uptime expectations.
            Whether that formalization happens through internal Phelps
            Health ownership, an external vendor relationship, or a
            hybrid arrangement is a decision for the institution.
          </p>
          <p>
            The architecture is intentionally portable. The clinical
            reasoning, the FHIR integration patterns, the safety rails,
            and the workflow definitions are documented and
            transferable. The product is not dependent on any single
            individual to maintain.
          </p>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">05</span>
            <h2 className="ke-section-title">The Pilot Proposal</h2>
          </header>

          <h3 className="ke-subhead">Pilot decision criteria.</h3>
          <p>
            The pilot&rsquo;s purpose is to validate or invalidate
            Kairos against real-world clinical work. Three threshold
            criteria, defined before the pilot starts:
          </p>
          <ul>
            <li>
              <strong>Clinical agreement.</strong> Kairos&rsquo;s
              drafted output matches the nurse-of-record&rsquo;s
              independent judgment in the majority of encounters. The
              exact threshold is set by clinical leadership before the
              pilot begins.
            </li>
            <li>
              <strong>Time per encounter.</strong> A measurable
              reduction in cognitive prep time, with the baseline
              established in the first week of the pilot using current
              workflow.
            </li>
            <li>
              <strong>Safety.</strong> Zero high-severity safety events
              attributable to AI draft or human review failure.
            </li>
          </ul>
          <p>
            If all three thresholds are met, Kairos progresses to
            limited deployment under continued monitoring. If any are
            missed, the program pauses for analysis before proceeding.
          </p>

          <h3 className="ke-subhead">What we need from Phelps.</h3>
          <p>Approval required from three institutional functions:</p>
          <ul>
            <li>
              <strong>Nursing leadership.</strong> Pilot site selection
              and clinical champion identification.
            </li>
            <li>
              <strong>IT.</strong> Epic test environment access for the
              integrations not yet validated. Each has a defined
              integration path requiring institutional approval.
            </li>
            <li>
              <strong>Compliance.</strong> PHI handling review for the
              pilot scope.
            </li>
          </ul>
          <p>
            Staff time commitment for the pilot is approximately one
            to two hours per day from a single RN clinical champion,
            for an estimated two to three weeks of parallel-workflow
            validation. This is observation and review work — not
            additional clinical workload.
          </p>
          <p>
            A defined decision authority for advancing through phases
            is also required. Most reasonably, this lives with whoever
            owns clinical informatics or operational improvement at
            the institution.
          </p>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">06</span>
            <h2 className="ke-section-title">
              The Field, Right Now (May 2026)
            </h2>
          </header>
          <p>
            The clinical AI landscape moves in weeks, not quarters. A
            snapshot of where things stand:
          </p>

          <h3 className="ke-subhead">Cloud LLMs under BAA.</h3>
          <p>
            Major US providers offer Business Associate Agreements
            covering clinical use. This is the path most clinical AI
            products at major US health systems currently run on.
            Lowest operational lift, fastest to deploy.
          </p>

          <h3 className="ke-subhead">Open-weight models.</h3>
          <p>
            Open-weight models from multiple labs now track
            approximately six months behind frontier proprietary
            models on the workloads outpatient clinical AI actually
            performs. For chart reading, structured drafting, and
            routine clinical reasoning, that gap is well within
            tolerance.
          </p>

          <h3 className="ke-subhead">Hardware floor is dropping fast.</h3>
          <p>
            Mixture-of-experts architectures activate only a fraction
            of total parameters per token. Frontier-grade open-weight
            models now run on a single on-prem GPU server in the
            $35&ndash;60K range — line-item IT capital, not capital
            project.
          </p>

          <h3 className="ke-subhead">
            What this means for an informatics program.
          </h3>
          <p>
            Cloud BAA is the right Phase 1 — fastest, lowest lift.
            Self-hosted is the right Phase 2 or 3 — once a program has
            wins behind it and a board-level appetite for data
            sovereignty emerges. The architecture should support both
            from day one. Kairos does.
          </p>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">07</span>
            <h2 className="ke-section-title">The Window</h2>
          </header>

          <h3 className="ke-subhead">Strategic positioning.</h3>
          <p>
            The first health systems to integrate AI into nursing
            workflow at the institutional level — not as shadow tools
            individual clinicians use, but as sanctioned workflow
            infrastructure — will set the patterns the rest of the
            field follows. Documentation standards. Audit conventions.
            Safety protocols.
          </p>

          <h3 className="ke-subhead">Risk of delay.</h3>
          <p>
            The alternative is waiting until the patterns are set
            elsewhere and adopting them later. That works, but the
            institution becomes a follower rather than a participant
            in defining how clinical AI integrates with nursing
            practice. The cost of that position compounds as competing
            institutions move from experimentation to deployment.
          </p>

          <h3 className="ke-subhead">What happens next.</h3>
          <p>
            The demo is a working prototype. The path forward is the
            pilot framework in Section 05. The technical foundation is
            validated through Epic&rsquo;s test environment. The
            integration plan is sequenced by risk. What&rsquo;s
            missing is the institutional decision to start.
          </p>

          <a className="ke-cta-mid" href={TOUR_URL}>
            <span className="ke-cta-label">See the live prototype</span>
            <span className="ke-cta-arrow" aria-hidden="true">&rarr;</span>
          </a>
          <div className="ke-cta-host" aria-hidden="true">
            kairos-tour.firekraker.net/rn
          </div>
        </section>

        <section className="ke-section">
          <header className="ke-section-marker">
            <span className="ke-numeral">08</span>
            <h2 className="ke-section-title">Author Context</h2>
          </header>
          <p>
            Kairos was developed by a practicing cardiology RN at
            Phelps Health Heart and Vascular Clinic, working under
            Roland P Hardenkvist, NP. Twenty-six years of nursing experience,
            including eleven years running outpatient clinics for the
            VA and Navy and a Director of Process Improvement role
            with Lean Six Sigma certification.
          </p>
          <p>
            The work reflects combined clinical and technical training
            relevant to clinical informatics. Building Kairos required
            learning Epic FHIR integration, OAuth authentication,
            healthcare data standards, and the engineering practices
            clinical AI requires. The full prototype — the four-panel
            card UI, the FHIR sandbox integration, the conditional
            panel rendering, the patient-specific triage generation —
            was built as ongoing work over the past several months.
          </p>
          <p>
            Kairos was developed to solve a workflow problem the
            author observed in daily practice. The architecture, the
            clinical reasoning, and the safety rails are portable to
            any institution willing to formalize the work into a
            supported deployment.
          </p>
        </section>
      </article>

      <footer className="ke-footer">
        <div className="ke-author-name">Brandon Sterne, RN BSN</div>
        <div className="ke-footer-line">
          Phelps Health Heart and Vascular Clinic
        </div>
      </footer>
    </div>
  );
}
