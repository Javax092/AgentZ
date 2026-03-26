import { Link } from "react-router-dom";
import type { DashboardData, Lead } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

interface Props {
  dashboard: DashboardData | null;
  leads: Lead[];
}

const stageLabels: Record<string, string> = {
  novo: "Novo",
  contato_iniciado: "Contato iniciado",
  qualificado: "Qualificado",
  proposta: "Proposta",
  fechado: "Fechado",
  perdido: "Perdido"
};

export function DashboardPage({ dashboard, leads }: Props) {
  const hotLeads = leads.filter((lead) => lead.temperature === "hot").slice(0, 5);
  const pendingLeads = leads
    .filter((lead) => lead.next_action)
    .sort((a, b) => (a.next_action_at ?? "").localeCompare(b.next_action_at ?? ""))
    .slice(0, 5);
  const totalPipelineValue = leads.reduce((total, lead) => total + lead.monthly_budget, 0);

  return (
    <div className="space-y-6">
      <section className="surface-dark overflow-hidden p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Revenue cockpit</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-white md:text-6xl">CRM comercial com IA para vender melhor</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Acompanhe o que entrou, quem precisa de follow-up e onde o pipeline realmente trava. O foco aqui e converter,
              nao decorar tela.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="metric-pill">Leads priorizados</span>
              <span className="metric-pill">Mensagens reutilizaveis</span>
              <span className="metric-pill">Proxima acao clara</span>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Pipeline visivel</p>
              <p className="mt-3 font-display text-4xl text-white">{dashboard?.total_leads ?? 0}</p>
              <p className="mt-2 text-sm text-slate-300">leads em acompanhamento</p>
            </div>
            <div className="rounded-[24px] border border-coral/20 bg-coral/10 p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-coral">Potencial mensal</p>
              <p className="mt-3 font-display text-3xl text-white">{formatCurrency(totalPipelineValue)}</p>
              <p className="mt-2 text-sm text-slate-200">volume financeiro do pipeline ativo</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Leads totais", String(dashboard?.total_leads ?? 0), "base comercial ativa"],
          ["Leads quentes", String(dashboard?.hot_leads ?? 0), "prioridade imediata"],
          ["Sem resposta", String(dashboard?.leads_without_response ?? 0), "ultimos 3 dias"],
          ["Conversao", `${dashboard?.conversion_rate ?? 0}%`, "ganhos sobre a base"],
          ["Tarefas pendentes", String(dashboard?.pending_tasks ?? 0), "acoes vencidas ou de hoje"]
        ].map(([label, value, hint]) => (
          <div key={label} className="surface-panel p-5">
            <p className="eyebrow">{label}</p>
            <p className="mt-3 font-display text-4xl text-white">{value}</p>
            <p className="mt-2 text-sm text-slate-400">{hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Pipeline</p>
              <h2 className="mt-2 font-display text-2xl text-white">Distribuicao por etapa</h2>
            </div>
            <Link to="/crm" className="btn-secondary">
              Abrir pipeline
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {(dashboard?.pipeline ?? []).map((item) => (
              <div key={item.stage} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{stageLabels[item.stage] ?? item.stage}</p>
                <p className="mt-3 font-display text-3xl text-white">{item.count}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="eyebrow">Nichos mais ativos</p>
              <div className="mt-4 space-y-3">
                {(dashboard?.top_niches ?? []).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm text-slate-200">
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="eyebrow">Cidades</p>
              <div className="mt-4 space-y-3">
                {(dashboard?.cities ?? []).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm text-slate-200">
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <section className="surface-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Prioridade</p>
                <h2 className="mt-2 font-display text-2xl text-white">Leads quentes</h2>
              </div>
              <Link to="/leads" className="btn-secondary">
                Ver todos
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {hotLeads.length ? (
                hotLeads.map((lead) => (
                  <Link key={lead.id} to={`/leads/${lead.id}`} className="block rounded-[22px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-brand/40">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{lead.company_name}</p>
                        <p className="mt-1 text-sm text-slate-400">{lead.contact_name}</p>
                      </div>
                      <span className="rounded-full border border-coral/30 bg-coral/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-coral">
                        {lead.temperature}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{lead.next_action || "Sem proxima acao definida."}</p>
                  </Link>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-white/10 p-5 text-sm text-slate-400">Sem leads quentes ainda. Ajuste o score ou alimente mais a base.</div>
              )}
            </div>
          </section>

          <section className="surface-panel p-6">
            <p className="eyebrow">Operacao</p>
            <h2 className="mt-2 font-display text-2xl text-white">Tarefas e atividades recentes</h2>
            <div className="mt-5 space-y-3">
              {pendingLeads.map((lead) => (
                <div key={lead.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Link to={`/leads/${lead.id}`} className="font-semibold text-white">
                      {lead.company_name}
                    </Link>
                    <span className="text-xs text-slate-500">{lead.next_action_at ? formatDate(lead.next_action_at) : "sem prazo"}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{lead.next_action}</p>
                </div>
              ))}

              {(dashboard?.recent_activities ?? []).map((activity) => (
                <div key={`activity-${activity.id}`} className="rounded-[22px] border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{activity.lead_name ?? "Sistema"}</p>
                    <span className="text-xs text-slate-500">{formatDate(activity.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{activity.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
