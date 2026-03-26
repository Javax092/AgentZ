interface Props {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  hint: string;
}

export function KPIBox({ label, value, delta, trend, hint }: Props) {
  const tone = trend === "up" ? "text-success bg-success/12 border-success/20" : "text-danger bg-danger/12 border-danger/20";

  return (
    <article className="surface-panel relative overflow-hidden p-5">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{label}</p>
          <p className="mt-4 font-display text-4xl leading-none text-white md:text-[2.6rem]">{value}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone}`}>{delta}</span>
      </div>
      <p className="mt-4 text-sm text-slate-300">{hint}</p>
    </article>
  );
}
