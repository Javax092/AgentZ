interface Props {
  label: string;
  score: number;
}

const palette: Record<string, string> = {
  hot: "border border-success/20 bg-success/10 text-success",
  warm: "border border-amber-400/20 bg-amber-400/10 text-amber-300",
  cold: "border border-white/10 bg-white/[0.04] text-slate-300"
};

export function LeadScoreBadge({ label, score }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${palette[label] ?? palette.cold}`}
    >
      <span>{label}</span>
      <span className="text-current">{score}</span>
    </span>
  );
}
