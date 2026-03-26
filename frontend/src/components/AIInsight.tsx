interface Props {
  insights: string[];
  source?: string | null;
  loading?: boolean;
}

export function AIInsight({ insights, source, loading }: Props) {
  return (
    <section className="surface-dark overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Insight da IA</p>
          <h2 className="mt-2 font-display text-2xl text-white">Copiloto de fechamento</h2>
        </div>
        <span className="metric-pill">{loading ? "Processando" : source ?? "LeadFlow AI"}</span>
      </div>
      <div className="mt-5 grid gap-3">
        {insights.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium text-slate-100">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
