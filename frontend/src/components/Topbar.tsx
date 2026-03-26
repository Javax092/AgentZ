import type { AppSession } from "../types";

interface Props {
  session: AppSession;
  onMenuToggle: () => void;
}

export function Topbar({ session, onMenuToggle }: Props) {
  const initials = session.user.name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="surface-panel overflow-hidden px-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onMenuToggle} className="btn-secondary h-11 w-11 px-0 lg:hidden">
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <div>
            <p className="eyebrow">LeadFlow AI</p>
            <h1 className="mt-2 font-display text-3xl text-white md:text-[2.6rem]">Pipeline com IA</h1>
            <p className="mt-2 text-sm text-slate-400">Priorize, aborde e converta leads com automacao</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            API online
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 shadow-soft">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand to-accent font-display text-xs font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{session.user.name}</p>
              <p className="text-xs text-slate-400">{session.user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
