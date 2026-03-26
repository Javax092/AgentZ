import { PipelineBoard } from "../components/PipelineBoard";
import type { CRMBoard, Lead, PipelineStage } from "../types";

interface Props {
  board: CRMBoard | null;
  leads: Lead[];
  onMoveLead: (leadId: number, stage: PipelineStage) => Promise<void>;
}

export function CrmPage({ board, leads, onMoveLead }: Props) {
  const openValue = leads.filter((lead) => lead.pipeline_stage !== "fechado" && lead.pipeline_stage !== "perdido").reduce((sum, lead) => sum + lead.monthly_budget, 0);

  return (
    <section className="space-y-4">
      <div className="surface-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Pipeline</p>
            <h1 className="mt-2 font-display text-3xl text-white">Funil comercial com acao real</h1>
            <p className="mt-2 text-sm text-slate-300">Mova os leads entre etapas conforme avancam no processo. Cada troca atualiza historico e contexto operacional.</p>
          </div>
          <div className="rounded-[24px] border border-coral/20 bg-coral/10 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-coral">Pipeline aberto</p>
            <p className="mt-2 font-display text-3xl text-white">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(openValue)}
            </p>
          </div>
        </div>
      </div>
      <PipelineBoard board={board} onMove={(leadId, stage) => void onMoveLead(leadId, stage)} />
    </section>
  );
}
