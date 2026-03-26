interface Props {
  onMessage: () => void;
  onFollowUp: () => void;
  onQualify: () => void;
  busy?: boolean;
}

export function NextAction({ onMessage, onFollowUp, onQualify, busy }: Props) {
  return (
    <section className="surface-panel p-5">
      <p className="eyebrow">Proxima acao</p>
      <h2 className="mt-2 font-display text-2xl text-white">Remova atrito e avance o lead</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button type="button" disabled={busy} onClick={onMessage} className="btn-primary w-full">
          Enviar mensagem
        </button>
        <button type="button" disabled={busy} onClick={onFollowUp} className="btn-secondary w-full">
          Agendar follow-up
        </button>
        <button type="button" disabled={busy} onClick={onQualify} className="btn-secondary w-full border-success/20 text-success hover:bg-success/10">
          Marcar como qualificado
        </button>
      </div>
    </section>
  );
}
