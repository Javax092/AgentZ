import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Lead, LeadCreateInput } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

interface Props {
  leads: Lead[];
  onCreateLead: (payload: LeadCreateInput) => Promise<void>;
  onRefresh: () => Promise<void>;
}

type LeadFormState = LeadCreateInput & { pain_points_text: string; tags_text: string };

const initialForm: LeadFormState = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  niche: "",
  city: "",
  owner_name: "Equipe comercial",
  interest_summary: "",
  company_size: "small",
  solution_interest: "automation",
  website_status: "outdated",
  instagram_status: "weak",
  monthly_budget: 2000,
  urgency_days: 7,
  source: "manual",
  notes: "",
  pain_points: [],
  tags: [],
  next_action: "Realizar primeiro contato consultivo",
  pain_points_text: "",
  tags_text: ""
};

const filters = [
  { id: "all", label: "Todos" },
  { id: "hot", label: "Quentes" },
  { id: "pending", label: "Pendentes" },
  { id: "proposal", label: "Em proposta" }
] as const;

export function LeadsPage({ leads, onCreateLead, onRefresh }: Props) {
  const [form, setForm] = useState<LeadFormState>(initialForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = [lead.company_name, lead.contact_name, lead.email, lead.city, lead.interest]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "hot" && lead.temperature === "hot") ||
        (filter === "pending" && Boolean(lead.next_action)) ||
        (filter === "proposal" && lead.pipeline_stage === "proposta");
      return matchesSearch && matchesFilter;
    });
  }, [filter, leads, search]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await onCreateLead({
        ...form,
        pain_points: form.pain_points_text.split(",").map((item) => item.trim()).filter(Boolean),
        tags: form.tags_text.split(",").map((item) => item.trim()).filter(Boolean)
      });
      setForm(initialForm);
      setSuccess("Lead criado com sucesso.")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao criar lead.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="surface-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Leads</p>
            <h1 className="mt-2 font-display text-3xl text-white">Base comercial operacional</h1>
            <p className="mt-2 text-sm text-slate-400">
              {filteredLeads.length} de {leads.length} leads visiveis
            </p>
          </div>
          <button className="btn-secondary" onClick={() => void onRefresh()}>
            Atualizar lista
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={filter === item.id ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950" : "rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300"}
            >
              {item.label}
            </button>
          ))}
        </div>

        <input
          placeholder="Buscar empresa, contato, email, cidade ou interesse"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="field-input mt-4"
        />

        <div className="mt-5 space-y-3">
          {filteredLeads.length ? (
            filteredLeads.map((lead) => (
              <Link key={lead.id} to={`/leads/${lead.id}`} className="block rounded-[24px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand/40">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{lead.company_name}</p>
                    <p className="mt-1 text-sm text-slate-400">{lead.contact_name} · {lead.phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="metric-pill">{lead.temperature}</span>
                    <span className="metric-pill">{lead.pipeline_stage}</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Origem</p>
                    <p className="mt-1 text-sm text-slate-200">{lead.source}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Interesse</p>
                    <p className="mt-1 text-sm text-slate-200">{lead.interest}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Responsavel</p>
                    <p className="mt-1 text-sm text-slate-200">{lead.responsible}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Budget</p>
                    <p className="mt-1 text-sm text-slate-200">{formatCurrency(lead.monthly_budget)}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-[20px] border border-white/10 bg-slate-950/30 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Proxima acao</p>
                  <p className="mt-1 text-sm text-slate-200">{lead.next_action || "Sem proxima acao definida."}</p>
                  {lead.next_action_at ? <p className="mt-2 text-xs text-slate-500">Prazo: {formatDate(lead.next_action_at)}</p> : null}
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
              Nenhum lead encontrado. Cadastre o primeiro lead no painel ao lado.
            </div>
          )}
        </div>
      </section>

      <section className="surface-dark p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Novo lead</p>
        <h2 className="mt-2 font-display text-3xl text-white">Cadastro com contexto comercial</h2>
        <p className="mt-2 text-sm text-slate-300">Preencha o minimo necessario para o CRM ja sugerir proxima acao, temperatura e abordagem.</p>
        <form onSubmit={submit} className="mt-6 grid gap-3">
          {success ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div> : null}
          {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

          {[
            ["company_name", "Empresa"],
            ["contact_name", "Contato"],
            ["phone", "Telefone"],
            ["email", "Email"],
            ["source", "Origem"],
            ["interest_summary", "Interesse do lead"],
            ["owner_name", "Responsavel"],
            ["next_action", "Proxima acao"]
          ].map(([key, label]) => (
            <input
              key={key}
              required={["company_name", "contact_name", "phone", "email"].includes(key)}
              placeholder={label}
              value={String(form[key as keyof LeadFormState] ?? "")}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              className="field-input-dark"
            />
          ))}

          <div className="grid gap-3 md:grid-cols-2">
            <input placeholder="Nicho" value={form.niche} onChange={(event) => setForm((current) => ({ ...current, niche: event.target.value }))} className="field-input-dark" />
            <input placeholder="Cidade" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="field-input-dark" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select className="field-input-dark" value={form.solution_interest} onChange={(event) => setForm((current) => ({ ...current, solution_interest: event.target.value as LeadCreateInput["solution_interest"] }))}>
              <option value="automation">Automacao comercial</option>
              <option value="landing_page">Landing page</option>
              <option value="web_system">Sistema web</option>
              <option value="mixed">Projeto combinado</option>
            </select>
            <select className="field-input-dark" value={form.company_size} onChange={(event) => setForm((current) => ({ ...current, company_size: event.target.value }))}>
              <option value="small">Pequena empresa</option>
              <option value="medium">Media empresa</option>
              <option value="large">Operacao maior</option>
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input type="number" placeholder="Budget mensal" value={form.monthly_budget} onChange={(event) => setForm((current) => ({ ...current, monthly_budget: Number(event.target.value) }))} className="field-input-dark" />
            <input type="number" placeholder="Urgencia em dias" value={form.urgency_days} onChange={(event) => setForm((current) => ({ ...current, urgency_days: Number(event.target.value) }))} className="field-input-dark" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select className="field-input-dark" value={form.website_status} onChange={(event) => setForm((current) => ({ ...current, website_status: event.target.value }))}>
              <option value="none">Sem site</option>
              <option value="outdated">Site desatualizado</option>
              <option value="good">Site funcional</option>
            </select>
            <select className="field-input-dark" value={form.instagram_status} onChange={(event) => setForm((current) => ({ ...current, instagram_status: event.target.value }))}>
              <option value="inactive">Instagram inativo</option>
              <option value="weak">Instagram fraco</option>
              <option value="good">Instagram forte</option>
            </select>
          </div>

          <input
            placeholder="Dores separadas por virgula"
            value={form.pain_points_text}
            onChange={(event) => setForm((current) => ({ ...current, pain_points_text: event.target.value }))}
            className="field-input-dark"
          />
          <input
            placeholder="Tags separadas por virgula"
            value={form.tags_text}
            onChange={(event) => setForm((current) => ({ ...current, tags_text: event.target.value }))}
            className="field-input-dark"
          />
          <textarea
            placeholder="Observacoes internas"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            className="field-input-dark min-h-28"
          />
          <button disabled={saving} className="btn-primary">
            {saving ? "Salvando..." : "Salvar lead"}
          </button>
        </form>
      </section>
    </div>
  );
}
