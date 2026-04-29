import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getCohortDefinition,
  getCohortSnapshot,
} from "@/lib/state/cohorts";
import CohortDrillIn from "@/components/CohortDrillIn";

export const dynamic = "force-dynamic";

export default async function CohortMemberPage({ params }) {
  const { cohortId, patientId } = await params;
  const definition = getCohortDefinition(cohortId);
  const snapshot = getCohortSnapshot(cohortId);
  const member = snapshot?.members?.find((m) => m.patientId === patientId);

  if (!definition || !snapshot || !member) {
    return (
      <div className="space-y-3">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-fg">
          Cohort member not found
        </h1>
        <p className="text-[13px] text-fg-muted">
          No member <code className="font-mono text-fg">{patientId}</code> in cohort{" "}
          <code className="font-mono text-fg">{cohortId}</code>.
        </p>
        <Link
          href={`/cohort/${cohortId}`}
          className="inline-flex items-center gap-1.5 rounded-button px-2 py-1 text-[13px] text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Back to {definition?.name || "cohort"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[24px] font-medium tracking-[-0.01em] text-fg">
            {member.patientName}{" "}
            <span className="ml-2 text-[15px] font-normal text-fg-muted">
              {member.ageSex}
            </span>
          </h1>
          <p className="text-[14px] text-fg-muted">
            {definition.name}
            <span className="mx-1.5 text-fg-faint/60">·</span>
            {member.keyData?.indication}
          </p>
        </div>
        <Link
          href={`/cohort/${cohortId}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-button px-2 py-1 text-[13px] text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Back to {definition.name}
        </Link>
      </header>

      <CohortDrillIn cohortMember={member} cohortDefinition={definition} />
    </div>
  );
}
