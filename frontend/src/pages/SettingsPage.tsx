import { FormEvent, useEffect, useState } from "react";
import type { AgentSettings } from "../types";

interface Props {
  settings: AgentSettings | null;
  onSave: (payload: Omit<AgentSettings, "id">) => Promise<void>;
}

export function SettingsPage({ settings, onSave }: Props) {
  const [form, setForm] = useState({
    company_name: "",
    positioning: "",
    target_niches: "",
    target_cities: "",
    prompt_tone: "consultivo",
    budget_high: "30",
    budget_medium: "20",
    budget_low: "10",
    urgency_urgent: "25",
    urgency_medium: "15",
    urgency_low: "5"
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      company_name: settings.company_name,
      positioning: settings.positioning,
      target_niches: settings.target_niches.join(", "),
      target_cities: settings.target_cities.join(", "),
      prompt_tone: settings.prompt_tone,
      budget_high: String(settings.qualification_rules.budget_weights?.high ?? 30),
      budget_medium: String(settings.qualification_rules.budget_weights?.medium ?? 20),
      budget_low: String(settings.qualification_rules.budget_weights?.low ?? 10),
      urgency_urgent: String(settings.qualification_rules.urgency_weights?.urgent ?? 25),
      urgency_medium: String(settings.qualification_rules.urgency_weights?.medium ?? 15),
      urgency_low: String(settings.qualification_rules.urgency_weights?.low ?? 5)
    });
  }, [settings]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({
      company_name: form.company_name,
      positioning: form.positioning,
      target_niches: form.target_niches.split(",").map((item) => item.trim()).filter(Boolean),
      target_cities: form.target_cities.split(",").map((item) => item.trim()).filter(Boolean),
      prompt_tone: form.prompt_tone,
      qualification_rules: {
        budget_weights: {
          high: Number(form.budget_high),
          medium: Number(form.budget_medium),
          low: Number(form.budget_low)
        },
        urgency_weights: {
          urgent: Number(form.urgency_urgent),
          medium: Number(form.urgency_medium),
          low: Number(form.urgency_low)
        }
      }
    });
  };

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-panel">
      <h1 className="font-display text-2xl text-ink">Configuracoes</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Nome da operacao" value={form.company_name} onChange={(e) => setForm((current) => ({ ...current, company_name: e.target.value }))} />
        <textarea className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Posicionamento" value={form.positioning} onChange={(e) => setForm((current) => ({ ...current, positioning: e.target.value }))} />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Nichos separados por virgula" value={form.target_niches} onChange={(e) => setForm((current) => ({ ...current, target_niches: e.target.value }))} />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Cidades separadas por virgula" value={form.target_cities} onChange={(e) => setForm((current) => ({ ...current, target_cities: e.target.value }))} />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Tom do agente" value={form.prompt_tone} onChange={(e) => setForm((current) => ({ ...current, prompt_tone: e.target.value }))} />
        <div className="grid gap-4 md:grid-cols-3">
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Peso budget alto" value={form.budget_high} onChange={(e) => setForm((current) => ({ ...current, budget_high: e.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Peso budget medio" value={form.budget_medium} onChange={(e) => setForm((current) => ({ ...current, budget_medium: e.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Peso budget baixo" value={form.budget_low} onChange={(e) => setForm((current) => ({ ...current, budget_low: e.target.value }))} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Peso urgencia alta" value={form.urgency_urgent} onChange={(e) => setForm((current) => ({ ...current, urgency_urgent: e.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Peso urgencia media" value={form.urgency_medium} onChange={(e) => setForm((current) => ({ ...current, urgency_medium: e.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Peso urgencia baixa" value={form.urgency_low} onChange={(e) => setForm((current) => ({ ...current, urgency_low: e.target.value }))} />
        </div>
        <button className="w-fit rounded-2xl bg-ink px-5 py-3 font-semibold text-white">Salvar configuracoes</button>
      </form>
    </section>
  );
}
