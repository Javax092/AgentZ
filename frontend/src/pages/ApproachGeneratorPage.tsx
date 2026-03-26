import { FormEvent, useState } from "react";
import type { Lead } from "../types";

interface Props {
  leads: Lead[];
  onGenerate: (leadId?: number, customContext?: string) => Promise<string>;
}

export function ApproachGeneratorPage({ leads, onGenerate }: Props) {
  const [leadId, setLeadId] = useState<number | undefined>(leads[0]?.id);
  const [customContext, setCustomContext] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasLeads = leads.length > 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!hasLeads) {
      setError("Nenhum lead disponível para gerar mensagem.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await onGenerate(leadId, customContext);
      setMessage(result || "A IA não retornou uma mensagem válida.");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Falha ao gerar mensagem.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[28px] bg-white p-6 shadow-panel">
        <h1 className="font-display text-2xl text-gray-900">Gerador de abordagem</h1>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <select className="rounded-2xl border border-slate-300 px-4 py-3 text-gray-900" value={leadId} onChange={(e) => setLeadId(Number(e.target.value))} disabled={!hasLeads || loading}>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>{lead.company_name}</option>
            ))}
          </select>
          <textarea className="min-h-40 rounded-2xl border border-slate-300 px-4 py-3 text-gray-700 placeholder:text-gray-500" placeholder="Contexto opcional" value={customContext} onChange={(e) => setCustomContext(e.target.value)} disabled={loading} />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!hasLeads ? <p className="text-sm text-gray-500">Cadastre um lead antes de gerar mensagens.</p> : null}
          <button disabled={!hasLeads || loading} className="w-fit rounded-2xl bg-coral px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Gerando..." : "Gerar mensagem"}
          </button>
        </form>
      </section>
      <section className="rounded-[28px] bg-ink p-6 text-white shadow-panel">
        <p className="text-sm uppercase tracking-[0.2em] text-teal-200">Mensagem pronta</p>
        <p className="mt-4 whitespace-pre-line leading-8 text-gray-300">
          {loading ? "Gerando mensagem..." : message || "Selecione um lead e gere a abordagem personalizada."}
        </p>
      </section>
    </div>
  );
}
