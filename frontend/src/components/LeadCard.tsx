import { Link } from "react-router-dom";
import type { Lead } from "../types";
import { LeadScoreBadge } from "./LeadScoreBadge";

interface Props {
  lead: Lead;
}

function statusTone(label: string) {
  switch (label) {
    case "hot":
      return "text-success border-success/25 bg-success/10";
    case "warm":
      return "text-amber-300 border-amber-400/25 bg-amber-400/10";
    default:
      return "text-slate-300 border-white/10 bg-white/[0.04]";
  }
}

export function LeadCard({ lead }: Props) {
  return (
    <Link
      to={`/leads/${lead.id}`}
      className="surface-panel block p-5 transition duration-200 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-display text-2xl text-white">{lead.company_name}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="metric-pill">{lead.source}</span>
            <span className="text-sm text-slate-300">{lead.city}</span>
          </div>
        </div>
        <LeadScoreBadge label={lead.score_label} score={lead.score} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(lead.score_label)}`}>
          {lead.score_label}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
          {lead.status === "new" ? "cold" : lead.status === "qualified" || lead.status === "proposal" ? "warm" : lead.status === "negotiation" || lead.status === "won" ? "hot" : "cold"}
        </span>
        {lead.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-300">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
