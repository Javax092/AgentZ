import type { CRMBoard, PipelineStage } from "../types";
import { LeadScoreBadge } from "./LeadScoreBadge";

interface Props {
  board: CRMBoard | null;
  onMove: (leadId: number, stage: PipelineStage) => void;
}

const stages: PipelineStage[] = ["entrada", "diagnostico", "proposta", "negociacao", "fechado"];

export function PipelineBoard({ board, onMove }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {stages.map((stage, index) => {
        const column = board?.columns.find((item) => item.stage === stage);
        const items = column?.leads ?? [];
        const nextStage = stages[index + 1];

        return (
          <section key={stage} className="surface-panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg capitalize text-white">{stage}</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                {column?.count ?? 0}
              </span>
            </div>
            <div className="space-y-3">
              {items.map((lead) => (
                <article key={lead.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{lead.company_name}</p>
                      <p className="text-sm text-slate-300">{lead.contact_name}</p>
                    </div>
                    <LeadScoreBadge label={lead.score_label} score={lead.score} />
                  </div>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-slate-400">{lead.status}</p>
                  {nextStage ? (
                    <button
                      onClick={() => onMove(lead.id, nextStage)}
                      className="mt-4 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      Mover para {nextStage}
                    </button>
                  ) : null}
                </article>
              ))}
              {!items.length ? <p className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-slate-400">Sem leads</p> : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
