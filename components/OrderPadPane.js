// Phase 3.3 — Order Pad pane (bottom-right). 13-field display per design
// Section 5. Block-Authorize gate is driven by the fixture's
// hasUnansweredQuestions flag in 3.3 (no real auto-pop logic).

"use client";

function Field({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <>
      <dt className="text-[11px] text-bone-muted/70">{label}</dt>
      <dd className="text-[12px] text-bone">{value}</dd>
    </>
  );
}

function OrderCard({ order, idx }) {
  return (
    <div className="border border-mist/60 rounded-sm p-3 bg-platinum/30">
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <h4 className="kairos-display text-bone text-[14px] font-medium leading-tight">
          {order.type}
        </h4>
        <span className="kairos-data text-[11px] text-bone-muted">#{idx + 1}</span>
      </div>
      <dl className="grid grid-cols-[88px_1fr] gap-x-2 gap-y-0.5">
        <Field label="Code" value={order.codeVariant} />
        <Field label="Reason" value={order.reason} />
        <Field
          label="Dx"
          value={
            Array.isArray(order.associatedDx) ? order.associatedDx.join(" · ") : null
          }
        />
        <Field label="Priority" value={order.priority} />
        <Field label="Class" value={order.class} />
        <Field label="Status" value={order.status} />
        <Field label="Expected" value={order.expectedDate} />
        <Field label="Expires" value={order.expires} />
        <Field
          label="Release"
          value={order.releaseToPatient === undefined ? null : order.releaseToPatient ? "Yes" : "No"}
        />
        <Field
          label="CC"
          value={Array.isArray(order.ccResults) ? order.ccResults.join(", ") : null}
        />
        <Field label="Cosign" value={order.cosign} />
        {order.auditTrail ? (
          <>
            <dt className="text-[11px] text-bone-muted/70">Audit</dt>
            <dd className="text-[12px] text-bone-muted italic">{order.auditTrail}</dd>
          </>
        ) : null}
        {Array.isArray(order.packetContents) && order.packetContents.length ? (
          <>
            <dt className="text-[11px] text-bone-muted/70">Packet</dt>
            <dd className="text-[12px] text-bone-muted">
              {order.packetContents.join(" · ")}
            </dd>
          </>
        ) : null}
      </dl>
      {Array.isArray(order.clinicalQuestions) && order.clinicalQuestions.length ? (
        <div className="mt-2 pt-2 border-t border-mist/40">
          <div className="kairos-kicker text-amber/80 mb-1">CLINICAL QUESTIONS</div>
          <ul className="space-y-0.5">
            {order.clinicalQuestions.map((q, i) => (
              <li key={i} className="text-[12px] text-bone-muted">
                {q.answered ? (
                  <span className="text-sage">✓</span>
                ) : (
                  <span className="text-amber">⚠</span>
                )}{" "}
                {q.q} {q.answered ? <span className="text-bone">— {q.answer}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function OrderPadPane({ orderPad }) {
  const orders = (orderPad && orderPad.orders) || [];
  const blocked = !!(orderPad && orderPad.hasUnansweredQuestions);

  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker text-amber/80">ORDER PAD</span>
        <span className="text-[11px] text-bone-muted">{orders.length} order(s)</span>
      </header>
      {blocked ? (
        <div className="mb-2 text-[12px] text-amber border border-amber/40 bg-amber/10 rounded-sm px-2 py-1">
          ⚠ Order requires verification — clinical questions block Authorize.
        </div>
      ) : null}
      <div className="flex-1 overflow-auto space-y-2">
        {orders.length === 0 ? (
          <div className="text-[12px] text-bone-muted/60 italic">
            {orderPad && orderPad.note ? orderPad.note : "— no orders staged —"}
          </div>
        ) : (
          orders.map((o, i) => <OrderCard key={i} order={o} idx={i} />)
        )}
      </div>
    </section>
  );
}
