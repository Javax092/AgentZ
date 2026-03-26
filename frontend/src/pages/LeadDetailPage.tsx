import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AIInsight } from "../components/AIInsight";
import { ActivityFeed } from "../components/ActivityFeed";
import { ClosingModePanel } from "../components/ClosingModePanel";
import { LeadScoreBadge } from "../components/LeadScoreBadge";
import { MessageBox } from "../components/MessageBox";
import { NextAction } from "../components/NextAction";
import { api } from "../services/api";
import type { Lead, LeadStatus, LeadUpdateInput, PipelineStage } from "../types";
import { formatCurrency } from "../utils/format";

interface Props {
  onUpdateLead: (leadId: number, payload: LeadUpdateInput) => Promise<void>;
  onDeleteLead: (leadId: number) => Promise<void>;
}

const stageOptions: PipelineStage[] = ["entrada", "diagnostico", "proposta", "negociacao", "fechado"];
const statusOptions: LeadStatus[] = ["new", "qualified", "proposal", "negotiation", "won", "lost"];

const statusLabel: Record<LeadStatus, string> = {
  new: "Cold",
  qualified: "Warm",
  proposal: "Warm",
  negotiation: "Hot",
  won: "Hot",
  lost: "Cold"
};

function compactBullets(value: string, fallback: string[]) {
  const parts = value
    .split(/[.,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length ? parts.slice(0, 4) : fallback;
}

function solutionLabel(solution: Lead["solution_interest"]) {
  switch (solution) {
    case "automation":
      return "Automacao + CRM + cadencia";
    case "landing_page":
      return "Landing page + automacao";
    case "web_system":
      return "Sistema + CRM";
    default:
      return "Automacao + CRM + cadencia";
  }
}

function fallbackMessage(lead: Lead) {
  return (
    lead.ai_messages?.whatsapp ||
    lead.generated_message ||
    "Vi potencial de crescimento com automacao e landing page. Posso te mostrar em 2 minutos?"
  );
}

export function LeadDetailPage({ onUpdateLead, onDeleteLead }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const leadId = Number(id);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loadingLead, setLoadingLead] = useState(true);
  const [activityType, setActivityType] = useState("note");
  const [activityDescription, setActivityDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiAction, setAiAction] = useState<"analysis" | "messages" | "full" | null>(null);
  const [error, setError] = useState("");
  const [closingMode, setClosingMode] = useState(false);
  const [form, setForm] = useState({
    notes: "",
    monthly_budget: 0,
    urgency_days: 7,
    pipeline_stage: "entrada" as PipelineStage,
    status: "new" as LeadStatus,
    pain_points: "",
    tags: ""
  });

  const loadLead = async () => {
    if (!leadId) {
      setLead(null);
      setLoadingLead(false);
      return;
    }

    setLoadingLead(true);
    try {
      const response = await api.lead(leadId);
      setLead(response);
      setForm({
        notes: response.notes,
        monthly_budget: response.monthly_budget,
        urgency_days: response.urgency_days,
        pipeline_stage: response.pipeline_stage,
        status: response.status,
        pain_points: response.pain_points.join(", "),
        tags: response.tags.join(", ")
      });
    } catch (loadError) {
      setLead(null);
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar lead.");
    } finally {
      setLoadingLead(false);
    }
  };

  useEffect(() => {
    void loadLead();
  }, [leadId]);

  const submitActivity = async (event: FormEvent) => {
    event.preventDefault();
    if (!leadId || !activityDescription.trim()) return;
    const updatedLead = await api.addLeadActivity(leadId, activityType, activityDescription.trim());
    setLead(updatedLead);
    setActivityDescription("");
  };

  const submitLeadUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!leadId) return;
    setSaving(true);
    setError("");
    try {
      await onUpdateLead(leadId, {
        notes: form.notes,
        monthly_budget: Number(form.monthly_budget),
        urgency_days: Number(form.urgency_days),
        status: form.status,
        pipeline_stage: form.pipeline_stage,
        pain_points: form.pain_points.split(",").map((item) => item.trim()).filter(Boolean),
        tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean)
      });
      await loadLead();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Falha ao salvar lead.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!leadId || !window.confirm("Excluir este lead do CRM?")) return;
    setSaving(true);
    setError("");
    try {
      await onDeleteLead(leadId);
      navigate("/leads");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Falha ao excluir lead.");
      setSaving(false);
    }
  };

  const handleAiAction = async (action: "analysis" | "messages" | "full") => {
    if (!leadId || !lead) return;
    setAiAction(action);
    setError("");
    try {
      const updatedLead =
        action === "analysis"
          ? await api.analyzeLeadAI(leadId)
          : action === "messages"
            ? await api.generateLeadMessagesAI(leadId)
            : await api.fullLeadAnalysisAI(leadId);
      setLead(updatedLead ?? lead);
    } catch (aiError) {
      setError(aiError instanceof Error ? aiError.message : "Falha ao executar a IA.");
    } finally {
      setAiAction(null);
    }
  };

  const qualifyLead = async () => {
    if (!leadId) return;
    setSaving(true);
    await onUpdateLead(leadId, { status: "qualified", pipeline_stage: "diagnostico" });
    await loadLead();
    setSaving(false);
  };

  const scheduleFollowUp = async () => {
    if (!leadId || !lead) return;
    setError("");
    try {
      const updatedLead = await api.addLeadActivity(leadId, "meeting", "Follow-up sugerido pela IA para as proximas 48h.");
      setLead(updatedLead ?? lead);
    } catch (followUpError) {
      setError(followUpError instanceof Error ? followUpError.message : "Falha ao registrar follow-up.");
    }
  };

  const diagnosisItems = compactBullets(lead?.diagnosis ?? "", [
    "Sem automacao",
    lead?.website_status === "none" ? "Sem landing page" : "Landing page fraca",
    "Baixa conversao",
    `Janela: ${lead?.urgency_days ?? 0} dias`
  ]);

  const message = lead ? fallbackMessage(lead) : "";
  const aiInsights = useMemo(
    () =>
      [
        lead?.ai_analysis?.summary,
        lead?.ai_analysis?.next_steps[0],
        lead?.ai_messages?.whatsapp ? "Lead responde melhor via WhatsApp." : undefined
      ]
        .filter(Boolean)
        .slice(0, 3)
        .map((item) => String(item)),
    [lead]
  );

  const insights = aiInsights.length
    ? aiInsights
    : [
        "Alta chance de conversao em ate 48h.",
        "Lead responde melhor via WhatsApp.",
        "Recomendado contato imediato."
      ];

  const objectionItems = lead?.ai_analysis?.next_steps?.slice(1, 4).length
    ? lead.ai_analysis.next_steps.slice(1, 4)
    : ["Pode alegar falta de tempo.", "Pode pedir prova de retorno.", "Pode comparar com processo atual."];

  if (loadingLead) {
    return <div className="surface-panel p-6 text-slate-300">Carregando lead...</div>;
  }

  if (error && !lead) {
    return (
      <div className="surface-panel p-6">
        <p className="text-sm font-semibold text-red-400">Falha ao abrir lead</p>
        <p className="mt-2 text-sm text-slate-300">{error}</p>
      </div>
    );
  }

  if (!lead) {
    return <div className="surface-panel p-6 text-slate-300">Lead indisponível.</div>;
  }

  return (
    <div className="space-y-6">
      <section className="surface-dark overflow-hidden p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Lead ativo</p>
                <h1 className="mt-2 font-display text-4xl leading-none text-white md:text-5xl">{lead.company_name}</h1>
                <p className="mt-3 text-sm text-slate-300">{lead.contact_name}</p>
              </div>
              <LeadScoreBadge label={lead.score_label} score={lead.score} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="metric-pill">{lead.source}</span>
              <span className="metric-pill">{lead.city}</span>
              <span className="metric-pill">{statusLabel[lead.status]}</span>
              <span className="metric-pill">Score {lead.score}</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <p className="eyebrow">Diagnostico</p>
                <div className="mt-4 grid gap-2">
                  {diagnosisItems.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-3 py-3 text-sm text-slate-200">
                      <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <p className="eyebrow">Servico recomendado</p>
                  <p className="mt-3 font-display text-2xl text-white">{solutionLabel(lead.solution_interest)}</p>
                  <p className="mt-2 text-sm text-slate-300">{lead.suggested_offer}</p>
                </div>
                <div className="rounded-[24px] border border-coral/20 bg-coral/10 p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-coral">Orcamento</p>
                  <p className="mt-3 font-display text-5xl leading-none text-white">R$ {lead.monthly_budget.toLocaleString("pt-BR")}</p>
                  <p className="mt-2 text-sm text-slate-200">Janela de decisao: {lead.urgency_days} dias</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <AIInsight insights={insights} source={lead.ai_state?.model ?? lead.ai_state?.analysis_source ?? "LeadFlow AI"} loading={Boolean(aiAction)} />
            <NextAction
              busy={saving || Boolean(aiAction)}
              onMessage={() => void handleAiAction("messages")}
              onFollowUp={() => void scheduleFollowUp()}
              onQualify={() => void qualifyLead()}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <MessageBox message={message} phone={lead.phone} />
          <ClosingModePanel
            open={closingMode}
            onToggle={() => setClosingMode((value) => !value)}
            approach={lead.ai_analysis?.recommended_service?.rationale ?? "Abra com oportunidade de ganho rapido e traga um exemplo de automacao aplicada ao nicho."}
            timing={lead.urgency_days <= 7 ? "Contato hoje, com follow-up em 24h." : "Contato inicial hoje e reforco em 48h."}
            objections={objectionItems}
            message={lead.ai_messages?.follow_up ?? message}
          />
          <div className="surface-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Acoes de IA</p>
                <h2 className="mt-2 font-display text-2xl text-white">Atualize analise e mensagens</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={Boolean(aiAction)} onClick={() => handleAiAction("analysis")} className="btn-secondary px-4 py-2.5">
                  {aiAction === "analysis" ? "Gerando..." : "Analise"}
                </button>
                <button type="button" disabled={Boolean(aiAction)} onClick={() => handleAiAction("messages")} className="btn-secondary px-4 py-2.5">
                  {aiAction === "messages" ? "Gerando..." : "Mensagens"}
                </button>
                <button type="button" disabled={Boolean(aiAction)} onClick={() => handleAiAction("full")} className="btn-primary px-4 py-2.5">
                  {aiAction === "full" ? "Gerando..." : "Completo"}
                </button>
              </div>
            </div>
            {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          </div>
          <ActivityFeed
            activities={lead.activities}
            activityType={activityType}
            activityDescription={activityDescription}
            onTypeChange={setActivityType}
            onDescriptionChange={setActivityDescription}
            onSubmit={submitActivity}
          />
        </div>

        <div className="space-y-6">
          <div className="surface-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Detalhes do lead</p>
                <h2 className="mt-2 font-display text-2xl text-white">Contexto comercial</h2>
              </div>
              <span className="metric-pill">{lead.niche}</span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="eyebrow">Contato</p>
                <p className="mt-2 text-sm font-semibold text-white">{lead.phone}</p>
                <p className="mt-1 text-sm text-slate-400">{lead.email}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="eyebrow">Empresa</p>
                <p className="mt-2 text-sm font-semibold text-white">{lead.company_size}</p>
                <p className="mt-1 text-sm text-slate-400">{lead.website_status}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="eyebrow">Dores</p>
                <p className="mt-2 text-sm text-slate-300">{lead.pain_points.join(", ") || "Sem dores registradas"}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="eyebrow">Tags</p>
                <p className="mt-2 text-sm text-slate-300">{lead.tags.join(", ") || "Sem tags"}</p>
              </div>
            </div>
          </div>

          <form onSubmit={submitLeadUpdate} className="surface-panel grid gap-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Controle</p>
                <h2 className="mt-2 font-display text-2xl text-white">Mover, qualificar e ajustar</h2>
              </div>
              <span className="text-xs text-slate-400">Edicao rapida</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-400">
                Etapa
                <select className="field-input" value={form.pipeline_stage} onChange={(event) => setForm((current) => ({ ...current, pipeline_stage: event.target.value as PipelineStage }))}>
                  {stageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-400">
                Status
                <select className="field-input" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as LeadStatus }))}>
                  {statusOptions.map((option) => <option key={option} value={option}>{statusLabel[option]}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-400">
                Budget
                <input type="number" className="field-input" value={form.monthly_budget} onChange={(event) => setForm((current) => ({ ...current, monthly_budget: Number(event.target.value) }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-400">
                Janela
                <input type="number" className="field-input" value={form.urgency_days} onChange={(event) => setForm((current) => ({ ...current, urgency_days: Number(event.target.value) }))} />
              </label>
            </div>
            <label className="grid gap-2 text-sm text-slate-400">
              Dores
              <input className="field-input" value={form.pain_points} onChange={(event) => setForm((current) => ({ ...current, pain_points: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-400">
              Tags
              <input className="field-input" value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-400">
              Notas internas
              <textarea className="field-input min-h-28 resize-none" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
            </label>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="eyebrow">Potencial financeiro</p>
              <p className="mt-3 font-display text-4xl text-white">{formatCurrency(form.monthly_budget)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button disabled={saving} className="btn-primary">
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" disabled={saving} onClick={handleDelete} className="btn-secondary border-red-400/20 text-red-300 hover:bg-red-500/10">
                Excluir
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
