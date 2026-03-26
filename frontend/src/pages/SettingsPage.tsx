import { FormEvent, useEffect, useState } from "react";
import type { AgentSettings, SettingsInput } from "../types";

interface Props {
  settings: AgentSettings | null;
  onSave: (payload: SettingsInput) => Promise<void>;
}

export function SettingsPage({ settings, onSave }: Props) {
  const [form, setForm] = useState<SettingsInput>({
    company_name: "",
    description: "",
    niche: "",
    city: "",
    service_type: "",
    ai_tone: "consultivo",
    primary_goal: "",
    initial_message: "",
    follow_up_message: "",
    follow_up_delay_hours: 24,
    max_follow_up_attempts: 4,
    hot_lead_score_threshold: 80,
    webhook_url: "",
    provider_name: "gemini",
    positioning: "",
    target_niches: [],
    target_cities: [],
    qualification_rules: {
      budget_weights: { high: 30, medium: 20, low: 10 },
      urgency_weights: { urgent: 25, medium: 15, low: 5 }
    },
    prompt_tone: "consultivo"
  });
  const [tags, setTags] = useState({ niches: "", cities: "" });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!settings) return;
    setForm({
      company_name: settings.company_name,
      description: settings.description,
      niche: settings.niche,
      city: settings.city,
      service_type: settings.service_type,
      ai_tone: settings.ai_tone,
      primary_goal: settings.primary_goal,
      initial_message: settings.initial_message,
      follow_up_message: settings.follow_up_message,
      follow_up_delay_hours: settings.follow_up_delay_hours,
      max_follow_up_attempts: settings.max_follow_up_attempts,
      hot_lead_score_threshold: settings.hot_lead_score_threshold,
      webhook_url: settings.webhook_url,
      provider_name: settings.provider_name,
      positioning: settings.positioning,
      target_niches: settings.target_niches,
      target_cities: settings.target_cities,
      qualification_rules: settings.qualification_rules,
      prompt_tone: settings.prompt_tone
    });
    setTags({
      niches: settings.target_niches.join(", "),
      cities: settings.target_cities.join(", ")
    });
  }, [settings]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFeedback("");

    try {
      await onSave({
        ...form,
        target_niches: tags.niches.split(",").map((item) => item.trim()).filter(Boolean),
        target_cities: tags.cities.split(",").map((item) => item.trim()).filter(Boolean)
      });
      setFeedback("Configuracoes salvas com sucesso.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar configuracoes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="surface-dark p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Settings</p>
        <h1 className="mt-2 font-display text-3xl text-white">Configurar o motor comercial da operacao</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Essas configuracoes alimentam score, mensagens, follow-up e leitura de oportunidade da IA. O objetivo aqui e
          deixar o produto aderente ao negocio do cliente.
        </p>
        <div className="mt-6 space-y-3">
          {[
            "Nome da empresa e posicionamento comercial",
            "Tom, objetivo e cadencia do follow-up",
            "Regra de score para lead quente",
            "Webhook e provider da IA guardados no backend"
          ].map((item) => (
            <div key={item} className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="surface-panel p-6">
        <form onSubmit={submit} className="grid gap-4">
          {feedback ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{feedback}</div> : null}
          {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <input className="field-input" placeholder="Nome da empresa" value={form.company_name} onChange={(e) => setForm((current) => ({ ...current, company_name: e.target.value }))} />
            <input className="field-input" placeholder="Nicho principal" value={form.niche} onChange={(e) => setForm((current) => ({ ...current, niche: e.target.value }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input className="field-input" placeholder="Cidade" value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} />
            <input className="field-input" placeholder="Tipo de atendimento" value={form.service_type} onChange={(e) => setForm((current) => ({ ...current, service_type: e.target.value }))} />
          </div>

          <textarea className="field-input min-h-24" placeholder="Descricao do negocio" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
          <textarea className="field-input min-h-24" placeholder="Posicionamento comercial" value={form.positioning} onChange={(e) => setForm((current) => ({ ...current, positioning: e.target.value }))} />

          <div className="grid gap-4 md:grid-cols-2">
            <input className="field-input" placeholder="Objetivo principal" value={form.primary_goal} onChange={(e) => setForm((current) => ({ ...current, primary_goal: e.target.value }))} />
            <input className="field-input" placeholder="Tom da IA" value={form.ai_tone} onChange={(e) => setForm((current) => ({ ...current, ai_tone: e.target.value, prompt_tone: e.target.value }))} />
          </div>

          <textarea className="field-input min-h-24" placeholder="Mensagem inicial" value={form.initial_message} onChange={(e) => setForm((current) => ({ ...current, initial_message: e.target.value }))} />
          <textarea className="field-input min-h-24" placeholder="Mensagem de follow-up" value={form.follow_up_message} onChange={(e) => setForm((current) => ({ ...current, follow_up_message: e.target.value }))} />

          <div className="grid gap-4 md:grid-cols-3">
            <input type="number" className="field-input" placeholder="Horas entre mensagens" value={form.follow_up_delay_hours} onChange={(e) => setForm((current) => ({ ...current, follow_up_delay_hours: Number(e.target.value) }))} />
            <input type="number" className="field-input" placeholder="Tentativas maximas" value={form.max_follow_up_attempts} onChange={(e) => setForm((current) => ({ ...current, max_follow_up_attempts: Number(e.target.value) }))} />
            <input type="number" className="field-input" placeholder="Score lead quente" value={form.hot_lead_score_threshold} onChange={(e) => setForm((current) => ({ ...current, hot_lead_score_threshold: Number(e.target.value) }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input className="field-input" placeholder="Nichos separados por virgula" value={tags.niches} onChange={(e) => setTags((current) => ({ ...current, niches: e.target.value }))} />
            <input className="field-input" placeholder="Cidades separadas por virgula" value={tags.cities} onChange={(e) => setTags((current) => ({ ...current, cities: e.target.value }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input className="field-input" placeholder="Webhook URL" value={form.webhook_url} onChange={(e) => setForm((current) => ({ ...current, webhook_url: e.target.value }))} />
            <input className="field-input" placeholder="Provider da IA" value={form.provider_name} onChange={(e) => setForm((current) => ({ ...current, provider_name: e.target.value }))} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            A chave do provider fica somente no backend via variavel de ambiente. Status atual: {settings?.has_provider_api_key ? "configurada" : "nao configurada"}.
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input type="number" className="field-input" placeholder="Peso budget alto" value={form.qualification_rules.budget_weights?.high ?? 30} onChange={(e) => setForm((current) => ({ ...current, qualification_rules: { ...current.qualification_rules, budget_weights: { ...current.qualification_rules.budget_weights, high: Number(e.target.value) } } }))} />
            <input type="number" className="field-input" placeholder="Peso budget medio" value={form.qualification_rules.budget_weights?.medium ?? 20} onChange={(e) => setForm((current) => ({ ...current, qualification_rules: { ...current.qualification_rules, budget_weights: { ...current.qualification_rules.budget_weights, medium: Number(e.target.value) } } }))} />
            <input type="number" className="field-input" placeholder="Peso budget baixo" value={form.qualification_rules.budget_weights?.low ?? 10} onChange={(e) => setForm((current) => ({ ...current, qualification_rules: { ...current.qualification_rules, budget_weights: { ...current.qualification_rules.budget_weights, low: Number(e.target.value) } } }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input type="number" className="field-input" placeholder="Peso urgencia alta" value={form.qualification_rules.urgency_weights?.urgent ?? 25} onChange={(e) => setForm((current) => ({ ...current, qualification_rules: { ...current.qualification_rules, urgency_weights: { ...current.qualification_rules.urgency_weights, urgent: Number(e.target.value) } } }))} />
            <input type="number" className="field-input" placeholder="Peso urgencia media" value={form.qualification_rules.urgency_weights?.medium ?? 15} onChange={(e) => setForm((current) => ({ ...current, qualification_rules: { ...current.qualification_rules, urgency_weights: { ...current.qualification_rules.urgency_weights, medium: Number(e.target.value) } } }))} />
            <input type="number" className="field-input" placeholder="Peso urgencia baixa" value={form.qualification_rules.urgency_weights?.low ?? 5} onChange={(e) => setForm((current) => ({ ...current, qualification_rules: { ...current.qualification_rules, urgency_weights: { ...current.qualification_rules.urgency_weights, low: Number(e.target.value) } } }))} />
          </div>

          <button disabled={saving} className="btn-primary w-fit">
            {saving ? "Salvando..." : "Salvar configuracoes"}
          </button>
        </form>
      </section>
    </div>
  );
}
