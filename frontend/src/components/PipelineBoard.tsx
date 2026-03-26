import { Link } from "react-router-dom";
import type { CRMBoard, PipelineStage } from "../types";

interface Props {
  board: CRMBoard | null;
  onMove: (leadId: number, stage: PipelineStage) => void;
}

const stageOrder: PipelineStage[] = ["novo", "contato_iniciado", "qualificado", "proposta", "fechado", "perdido"];

export function PipelineBoard({ board, onMove }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-6">
      {stageOrder.map((stage, index) => {
        const column = board?.columns.find((item) => item.stage === stage);
        const items = column?.leads ?? [];
        const nextStage = stageOrder[index + 1];

        return (
          <section key={stage} className="surface-panel p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg text-white">{column?.label ?? stage}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{column?.count ?? 0} leads</p>
              </div>
            </div>
            <div className="space-y-3">
              {items.map((lead) => (
                <article key={lead.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/leads/${lead.id}`} className="font-semibold text-white">
                        {lead.company_name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-300">{lead.contact_name}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                      {lead.score}
                    </span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">{lead.status}</p>
                  <p className="mt-3 text-sm text-slate-300">{lead.next_action}</p>
                  <p className="mt-2 text-xs text-slate-500">{lead.owner_name}</p>
                  {nextStage ? (
                    <button onClick={() => onMove(lead.id, nextStage)} className="btn-secondary mt-4 w-full">
                      Avancar etapa
                    </button>
                  ) : null}
                </article>
              ))}
              {!items.length ? <p className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-slate-400">Sem leads nesta etapa.</p> : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
