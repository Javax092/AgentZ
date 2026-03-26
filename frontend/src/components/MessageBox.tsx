import { useState } from "react";

interface Props {
  message: string;
  phone: string;
}

function phoneToWhatsapp(phone: string) {
  return phone.replace(/\D/g, "");
}

export function MessageBox({ message, phone }: Props) {
  const [copied, setCopied] = useState(false);
  const safeMessage = message.trim() || "Mensagem indisponível no momento.";
  const hasPhone = phoneToWhatsapp(phone).length > 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(safeMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="surface-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Mensagem pronta</p>
          <h2 className="mt-2 font-display text-2xl text-white">Curta, clara e acionavel</h2>
        </div>
        <span className="metric-pill">{copied ? "Copiado" : hasPhone ? "WhatsApp" : "Sem telefone"}</span>
      </div>
      <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-base leading-7 text-slate-100">{safeMessage}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={copy} className="btn-secondary">
          Copiar
        </button>
        <a
          href={hasPhone ? `https://wa.me/${phoneToWhatsapp(phone)}?text=${encodeURIComponent(safeMessage)}` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!hasPhone}
          className={`btn-primary ${hasPhone ? "" : "pointer-events-none opacity-60"}`}
        >
          Enviar no WhatsApp
        </a>
      </div>
    </section>
  );
}
