import { PipelineBoard } from "../components/PipelineBoard";
import type { CRMBoard, PipelineStage } from "../types";

interface Props {
  board: CRMBoard | null;
  onMoveLead: (leadId: number, stage: PipelineStage) => Promise<void>;
}

export function CrmPage({ board, onMoveLead }: Props) {
  return (
    <section className="space-y-4">
      <div className="surface-panel p-6">
        <p className="eyebrow">Pipeline</p>
        <h1 className="mt-2 font-display text-3xl text-white">Funil direto. Ação rápida.</h1>
        <p className="mt-2 text-sm text-slate-300">Arraste visualmente a prioridade do pipeline para a próxima etapa.</p>
      </div>
      <PipelineBoard board={board} onMove={onMoveLead} />
    </section>
  );
}
