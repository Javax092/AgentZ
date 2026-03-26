import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import type { AINextAction, AIResponseSuggestion, AISummary, Lead, LeadStatus, LeadUpdateInput, PipelineStage } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

interface Props {
  onUpdateLead: (leadId: number, payload: LeadUpdateInput) => Promise<void>;
  onDeleteLead: (leadId: number) => Promise<void>;
  onRefreshLead: (leadId: number) => Promise<Lead>;
}

const stages: PipelineStage[] = ["novo", "contato_iniciado", "qualificado", "proposta", "fechado", "perdido"];
const statuses: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];

export function LeadDetailPage({ onUpdateLead, onDeleteLead, onRefreshLead }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const leadId = Number(id);
  const [lead, setLead] = useState<Lead | null>(null);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [nextAction, setNextAction] = useState<AINextAction | null>(null);
  const [suggestion, setSuggestion] = useState<AIResponseSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({
    owner_name: "",
    interest_summary: "",
    notes: "",
    next_action: "",
    pipeline_stage: "novo" as PipelineStage,
    status: "new" as LeadStatus
  });

  const loadLead = async () => {
    if (!leadId) return;
    setLoading(true);
    setError("");
    try {
      const [leadResponse, summaryResponse, nextActionResponse, suggestionResponse] = await Promise.all([
        api.lead(leadId),
        api.aiLeadSummary(leadId),
        api.aiNextAction(leadId),
        api.aiSuggestResponse(leadId)
      ]);
      setLead(leadResponse);
      setSummary(summaryResponse);
      setNextAction(nextActionResponse);
      setSuggestion(suggestionResponse);
      setForm({
        owner_name: leadResponse.owner_name,
        interest_summary: leadResponse.interest_summary,
        notes: leadResponse.notes,
        next_action: leadResponse.next_action,
        pipeline_stage: leadResponse.pipeline_stage,
        status: leadResponse.status
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar lead.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLead();
  }, [leadId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!leadId) return;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      await onUpdateLead(leadId, form);
      const refreshed = await onRefreshLead(leadId);
      setLead(refreshed);
      setFeedback("Lead atualizado com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar lead.");
    } finally {
      setSaving(false);
    }
  };

  const handleAiFull = async () => {
    if (!leadId) return;
    setSaving(true);
    setError("");
    try {
      await api.fullLeadAnalysisAI(leadId);
      await loadLead();
      setFeedback("IA atualizada com sucesso.");
    } catch (aiError) {
      setError(aiError instanceof Error ? aiError.message : "Falha ao executar IA.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!leadId || !window.confirm("Excluir este lead?")) return;
    await onDeleteLead(leadId);
    navigate("/leads");
  };

  if (loading) {
    return <div className="surface-panel p-6 text-slate-300">Carregando lead...</div>;
  }

  if (!lead) {
    return <div className="surface-panel p-6 text-slate-300">Lead nao encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      <section className="surface-dark p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Lead ativo</p>
            <h1 className="mt-2 font-display text-4xl text-white">{lead.company_name}</h1>
            <p className="mt-3 text-sm text-slate-300">{lead.contact_name} · {lead.email} · {lead.phone}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="metric-pill">{lead.pipeline_stage}</span>
              <span className="metric-pill">{lead.temperature}</span>
              <span className="metric-pill">{lead.source}</span>
              <span className="metric-pill">{lead.city}</span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="eyebrow">Score</p>
                <p className="mt-2 font-display text-3xl text-white">{lead.score}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="eyebrow">Budget</p>
                <p className="mt-2 font-display text-3xl text-white">{formatCurrency(lead.monthly_budget)}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="eyebrow">Ultima interacao</p>
                <p className="mt-2 text-sm text-slate-200">{lead.last_interaction_at ? formatDate(lead.last_interaction_at) : "Sem registro"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="surface-panel p-5">
              <p className="eyebrow">Resumo da IA</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{summary?.summary ?? lead.diagnosis}</p>
            </div>
            <div className="surface-panel p-5">
              <p className="eyebrow">Proxima acao recomendada</p>
              <p className="mt-3 text-sm text-slate-200">{nextAction?.recommended_action ?? lead.next_action}</p>
              <p className="mt-2 text-sm text-slate-400">{nextAction?.why_now}</p>
            </div>
            <div className="surface-panel p-5">
              <p className="eyebrow">Resposta sugerida</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{suggestion?.message ?? lead.generated_message}</p>
            </div>
            <button className="btn-primary w-full" disabled={saving} onClick={() => void handleAiFull()}>
              {saving ? "Atualizando..." : "Atualizar analise da IA"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={submit} className="surface-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Edicao</p>
              <h2 className="mt-2 font-display text-2xl text-white">Dados operacionais</h2>
            </div>
            <button type="button" onClick={handleDelete} className="btn-secondary">
              Excluir lead
            </button>
          </div>
          {feedback ? <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{feedback}</div> : null}
          {error ? <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
          <div className="mt-5 grid gap-3">
            <input className="field-input" placeholder="Responsavel" value={form.owner_name} onChange={(e) => setForm((current) => ({ ...current, owner_name: e.target.value }))} />
            <input className="field-input" placeholder="Interesse" value={form.interest_summary} onChange={(e) => setForm((current) => ({ ...current, interest_summary: e.target.value }))} />
            <input className="field-input" placeholder="Proxima acao" value={form.next_action} onChange={(e) => setForm((current) => ({ ...current, next_action: e.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <select className="field-input" value={form.pipeline_stage} onChange={(e) => setForm((current) => ({ ...current, pipeline_stage: e.target.value as PipelineStage }))}>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <select className="field-input" value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as LeadStatus }))}>
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <textarea className="field-input min-h-32" placeholder="Observacoes" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
            <button disabled={saving} className="btn-primary w-fit">
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="surface-panel p-6">
            <p className="eyebrow">Historico de atividades</p>
            <div className="mt-4 space-y-3">
              {lead.activities.length ? lead.activities.map((activity) => (
                <div key={activity.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-white">{activity.type}</strong>
                    <span className="text-xs text-slate-500">{formatDate(activity.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{activity.description}</p>
                </div>
              )) : <div className="rounded-[22px] border border-dashed border-white/10 p-5 text-sm text-slate-400">Sem atividades registradas.</div>}
            </div>
          </div>

          <div className="surface-panel p-6">
            <p className="eyebrow">Historico de mensagens</p>
            <div className="mt-4 space-y-3">
              {lead.interactions.length ? lead.interactions.map((interaction) => (
                <div key={interaction.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-white">{interaction.channel} · {interaction.status}</strong>
                    <span className="text-xs text-slate-500">{formatDate(interaction.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{interaction.content}</p>
                </div>
              )) : <div className="rounded-[22px] border border-dashed border-white/10 p-5 text-sm text-slate-400">Sem mensagens registradas.</div>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
