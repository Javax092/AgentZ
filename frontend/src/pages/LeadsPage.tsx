import { FormEvent, useMemo, useState } from "react";
import { LeadCard } from "../components/LeadCard";
import type { Lead, LeadCreateInput } from "../types";

interface Props {
  leads: Lead[];
  onCreateLead: (payload: LeadCreateInput) => Promise<void>;
}

type LeadFormState = {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  niche: string;
  city: string;
  company_size: string;
  solution_interest: LeadCreateInput["solution_interest"];
  website_status: string;
  instagram_status: string;
  monthly_budget: number;
  urgency_days: number;
  source: string;
  notes: string;
  pain_points: string;
  tags: string;
};

const initialForm: LeadFormState = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  niche: "Clinicas",
  city: "Manaus",
  company_size: "small",
  solution_interest: "automation",
  website_status: "outdated",
  instagram_status: "weak",
  monthly_budget: 2000,
  urgency_days: 15,
  source: "manual",
  notes: "",
  pain_points: "follow-up manual, baixa conversao",
  tags: "manual"
};

export function LeadsPage({ leads, onCreateLead }: Props) {
  const [form, setForm] = useState<LeadFormState>({ ...initialForm });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "hot" | "qualified">("all");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = [lead.company_name, lead.contact_name, lead.email, lead.city].some((value) =>
        value.toLowerCase().includes(search.toLowerCase())
      );
      const matchesFilter =
        filter === "all" ||
        (filter === "hot"
          ? lead.score >= 80
          : lead.status === "qualified" || lead.status === "proposal" || lead.status === "negotiation");
      return matchesSearch && matchesFilter;
    });
  }, [filter, leads, search]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onCreateLead({
      ...form,
      monthly_budget: Number(form.monthly_budget),
      urgency_days: Number(form.urgency_days),
      pain_points: form.pain_points.split(",").map((item) => item.trim()).filter(Boolean),
      tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean)
    });
    setForm({ ...initialForm });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="surface-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Leads</p>
            <h1 className="mt-2 font-display text-3xl text-white">Base enxuta. Prioridade clara.</h1>
            <p className="mt-2 text-sm text-slate-400">
              {filteredLeads.length} de {leads.length} registros visíveis
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "Todos"],
              ["qualified", "Qualificados"],
              ["hot", "Hot"]
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value as typeof filter)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === value ? "bg-white text-slate-950" : "border border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <input
          placeholder="Buscar empresa, contato, email ou cidade"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="field-input mt-4"
        />

        <div className="mt-4 space-y-3">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </section>

      <section className="surface-dark p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Novo lead</p>
        <h2 className="mt-2 font-display text-3xl text-white">Entrada rápida</h2>
        <p className="mt-2 text-sm text-slate-300">Preencha só o necessário. O resto o sistema calcula.</p>
        <form onSubmit={submit} className="mt-5 grid gap-3">
          {[
            ["company_name", "Empresa"],
            ["contact_name", "Contato"],
            ["email", "Email"],
            ["phone", "Telefone"],
            ["niche", "Nicho"],
            ["city", "Cidade"]
          ].map(([key, label]) => (
            <input
              key={key}
              placeholder={label}
              value={String(form[key as keyof typeof form])}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              className="field-input-dark"
            />
          ))}
          <div className="grid gap-3 md:grid-cols-2">
            <select className="field-input-dark" value={form.company_size} onChange={(e) => setForm((current) => ({ ...current, company_size: e.target.value }))}>
              <option value="small">Empresa pequena</option>
              <option value="medium">Empresa média</option>
              <option value="large">Empresa grande</option>
            </select>
            <select className="field-input-dark" value={form.solution_interest} onChange={(e) => setForm((current) => ({ ...current, solution_interest: e.target.value as LeadCreateInput["solution_interest"] }))}>
              <option value="automation">Automação</option>
              <option value="landing_page">Landing page</option>
              <option value="web_system">Sistema web</option>
              <option value="mixed">Combinado</option>
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <select className="field-input-dark" value={form.website_status} onChange={(e) => setForm((current) => ({ ...current, website_status: e.target.value }))}>
              <option value="none">Sem site</option>
              <option value="outdated">Site desatualizado</option>
              <option value="good">Site bom</option>
            </select>
            <select className="field-input-dark" value={form.instagram_status} onChange={(e) => setForm((current) => ({ ...current, instagram_status: e.target.value }))}>
              <option value="inactive">Instagram inativo</option>
              <option value="weak">Instagram fraco</option>
              <option value="good">Instagram bom</option>
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input type="number" placeholder="Budget mensal" value={form.monthly_budget} onChange={(e) => setForm((current) => ({ ...current, monthly_budget: Number(e.target.value) }))} className="field-input-dark" />
            <input type="number" placeholder="Janela em dias" value={form.urgency_days} onChange={(e) => setForm((current) => ({ ...current, urgency_days: Number(e.target.value) }))} className="field-input-dark" />
          </div>
          <input placeholder="Dores separadas por vírgula" value={form.pain_points} onChange={(e) => setForm((current) => ({ ...current, pain_points: e.target.value }))} className="field-input-dark" />
          <input placeholder="Tags separadas por vírgula" value={form.tags} onChange={(e) => setForm((current) => ({ ...current, tags: e.target.value }))} className="field-input-dark" />
          <textarea placeholder="Notas internas" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} className="field-input-dark min-h-24" />
          <button className="btn-primary">Salvar lead</button>
        </form>
      </section>
    </div>
  );
}
