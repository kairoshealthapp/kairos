// v3.0 Order Pad Panel — AI-pre-staged orders extracted from provider
// plan. Approve places the orders (terminates card); Edit toggles
// in-place contentEditable on the orders region (no shrunken textarea).

"use client";

import { useEffect, useRef, useState } from "react";

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

export default function OrderPadPanel({
  orderPad,
  tourMode,
  onTerminate,
}) {
  const [editing, setEditing] = useState(false);
  const orders = (orderPad && orderPad.orders) || [];
  const blocked = !!(orderPad && orderPad.hasUnansweredQuestions);
  const editRef = useRef(null);

  // contentEditable doesn't natively edit React-rendered DOM safely on
  // every re-render, so freeze the children once the user enters edit
  // mode (we capture the rendered HTML at toggle time and then let the
  // user mutate it freely; on Done editing we accept whatever the DOM
  // contains as the new visual).
  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
    }
  }, [editing]);

  function handleApprove() {
    if (blocked) return;
    onTerminate && onTerminate({ kind: "orderPad.approve" });
  }
  function handleEditToggle() {
    if (tourMode) return;
    setEditing((v) => !v);
  }

  return (
    <section className="kairos-card p-4 flex flex-col">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker kairos-kicker-strong text-amber/80">ORDER PAD</span>
        <span className="text-[11px] text-bone-muted">
          {editing ? "Editing — content locks on Done editing" : `${orders.length} order(s)`}
        </span>
      </header>
      {blocked ? (
        <div className="mb-2 text-[12px] text-amber border border-amber/40 bg-amber/10 rounded-sm px-2 py-1">
          ⚠ Order requires verification — clinical questions block Approve.
        </div>
      ) : null}

      <div
        ref={editRef}
        contentEditable={editing}
        suppressContentEditableWarning
        spellCheck={editing}
        className={
          "space-y-2 focus:outline-none " +
          (editing ? "kairos-editable" : "")
        }
      >
        {orders.length === 0 ? (
          <div className="text-[12px] text-bone-muted/60 italic">
            {orderPad && orderPad.note ? orderPad.note : "— no orders staged —"}
          </div>
        ) : (
          orders.map((o, i) => <OrderCard key={i} order={o} idx={i} />)
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-mist/40 flex items-center gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={blocked}
          data-tour-button="orderPad.approve"
          title={blocked ? "Resolve clinical questions before Approve" : ""}
          className={
            "text-[12px] font-semibold px-3 py-1.5 rounded-sm transition-colors " +
            (blocked
              ? "bg-amber/30 text-graphite/60 cursor-not-allowed"
              : "bg-amber text-graphite hover:bg-amber/90")
          }
        >
          Approve
        </button>
        <button
          type="button"
          onClick={handleEditToggle}
          className="text-[12px] font-medium px-3 py-1.5 rounded-sm bg-platinum/60 text-bone border border-mist/60 hover:bg-platinum hover:border-amber/60 transition-colors"
        >
          {editing ? "Done editing" : "Edit"}
        </button>
      </div>
    </section>
  );
}
