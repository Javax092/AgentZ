import { KPIBox } from "../components/KPIBox";
import { LeadCard } from "../components/LeadCard";
import type { DashboardData, Lead } from "../types";
import { formatCurrency } from "../utils/format";

interface Props {
  dashboard: DashboardData | null;
  leads: Lead[];
}

export function DashboardPage({ dashboard, leads }: Props) {
  const budget = leads.reduce((sum, lead) => sum + lead.monthly_budget, 0);
  const nextActionLead = [...leads].sort((a, b) => b.score - a.score)[0];
  const hotLeads = leads.filter((lead) => lead.score_label === "hot").length;
  const conversionsToday = leads.filter((lead) => lead.status === "won").length;
  const activeLeads = leads.filter((lead) => lead.status !== "lost" && lead.status !== "won").length;
  const topPriority = [...leads].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="surface-dark overflow-hidden p-6 md:p-8">
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Revenue cockpit</p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-white md:text-6xl">Pipeline com IA</h2>
            <p className="mt-3 max-w-2xl text-base text-slate-300">Priorize, aborde e converta leads com automacao</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="metric-pill">Foco em decisao</span>
              <span className="metric-pill">Copiloto comercial</span>
              <span className="metric-pill">Execucao imediata</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Lead em foco</p>
              <p className="mt-3 font-display text-2xl text-white">{nextActionLead?.company_name ?? "Sem prioridade"}</p>
              <p className="mt-2 text-sm text-slate-300">{nextActionLead?.city ?? "Aguardando novos leads"}</p>
              <p className="mt-4 text-sm text-slate-400">{nextActionLead?.suggested_offer ?? "Quando novos leads entrarem, a IA destaca a melhor rota."}</p>
            </div>
            <div className="rounded-[24px] border border-coral/20 bg-coral/10 p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-coral">Receita potencial</p>
              <p className="mt-3 font-display text-3xl text-white">{formatCurrency(budget)}</p>
              <p className="mt-2 text-sm text-slate-200">Volume visivel na base ativa agora.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPIBox label="Leads ativos" value={String(activeLeads)} delta="+12%" trend="up" hint={`${dashboard?.qualified_leads ?? 0} ja qualificados`} />
        <KPIBox label="Leads quentes" value={String(hotLeads)} delta="+8%" trend="up" hint="Maiores chances de fechamento" />
        <KPIBox label="Receita potencial" value={formatCurrency(budget)} delta="+21%" trend="up" hint="Pipeline monetizado" />
        <KPIBox label="Conversoes hoje" value={String(conversionsToday)} delta={`${dashboard?.conversion_rate ?? 0}%`} trend={conversionsToday > 0 ? "up" : "down"} hint="Taxa de fechamento atual" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-white">Visao do pipeline</h2>
            <span className="text-sm text-slate-400">Leitura em segundos</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {dashboard?.pipeline.map((item) => (
              <div key={item.stage} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{item.stage}</p>
                <p className="mt-3 font-display text-3xl text-white">{item.count}</p>
              </div>
            ))}
          </div>
          {nextActionLead ? (
            <div className="mt-5 rounded-[24px] border border-brand/20 bg-gradient-to-r from-brand/15 to-accent/10 p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-sky-100">Proxima melhor aposta</p>
              <p className="mt-2 font-display text-2xl text-white">{nextActionLead.company_name}</p>
              <p className="mt-2 text-sm text-slate-200">{nextActionLead.diagnosis}</p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4">
          <div className="surface-panel p-6">
            <h2 className="font-display text-2xl text-white">Prioridade da IA</h2>
            <div className="mt-4 space-y-3">
              {topPriority.length ? topPriority.map((lead) => <LeadCard key={lead.id} lead={lead} />) : <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">Sem leads para priorizar.</div>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-panel p-6">
              <h2 className="font-display text-2xl text-white">Nichos</h2>
              <div className="mt-4 space-y-3">
                {dashboard?.top_niches.map((niche) => (
                  <div key={niche.name} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <span className="text-sm text-white">{niche.name}</span>
                    <span className="text-sm font-semibold text-slate-400">{niche.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="surface-panel p-6">
              <h2 className="font-display text-2xl text-white">Cidades</h2>
              <div className="mt-4 space-y-3">
                {dashboard?.cities.map((city) => (
                  <div key={city.name} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <span className="text-sm text-white">{city.name}</span>
                    <span className="text-sm font-semibold text-slate-400">{city.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
