interface Props {
  label: string;
  value: string;
  hint: string;
}

export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="surface-panel p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-4 font-display text-4xl leading-none text-ink">{value}</p>
      <p className="mt-3 text-sm text-slate-500">{hint}</p>
    </div>
  );
}
