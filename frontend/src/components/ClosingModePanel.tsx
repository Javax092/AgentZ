interface Props {
  approach: string;
  timing: string;
  objections: string[];
  message: string;
  open: boolean;
  onToggle: () => void;
}

export function ClosingModePanel({ approach, timing, objections, message, open, onToggle }: Props) {
  return (
    <section className="surface-panel overflow-hidden p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral">Modo fechamento</p>
          <h2 className="mt-2 font-display text-2xl text-white">Roteiro de conversao assistida</h2>
        </div>
        <button type="button" onClick={onToggle} className="btn-primary">
          {open ? "Ocultar" : "Abrir modo fechamento"}
        </button>
      </div>

      {open ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-coral/20 bg-coral/10 p-4">
            <p className="eyebrow text-coral">Melhor abordagem</p>
            <p className="mt-2 text-sm leading-6 text-slate-100">{approach}</p>
          </div>
          <div className="rounded-[24px] border border-brand/20 bg-brand/10 p-4">
            <p className="eyebrow text-sky-200">Timing ideal</p>
            <p className="mt-2 text-sm leading-6 text-slate-100">{timing}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="eyebrow">Objecoes possiveis</p>
            <div className="mt-3 grid gap-2">
              {objections.map((item) => (
                <div key={item} className="rounded-2xl bg-white/[0.04] px-3 py-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="eyebrow">Mensagem pronta</p>
            <p className="mt-3 text-sm leading-6 text-slate-100">{message}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
