import type {
  AgentSettings,
  AppSession,
  CRMBoard,
  DashboardData,
  DemoLoginResponse,
  Lead,
  LeadAIAnalysis,
  LeadAIMessages,
  LeadCreateInput,
  LeadStatus,
  LeadUpdateInput,
  PipelineStage
} from "../types";

const DEMO_EMAIL = "admin@leadflow.ai";
const DEMO_PASSWORD = "123456";
const MOCK_DATA_KEY = "leadflow-mock-data-v2";
const NOW = new Date().toISOString();

interface MockDatabase {
  leads: Lead[];
  settings: AgentSettings;
  nextLeadId: number;
  nextActivityId: number;
}

function classifyScore(score: number) {
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  return "cold";
}

function inferScoreStatus(score: number): LeadStatus {
  if (score >= 80) return "proposal";
  if (score >= 60) return "qualified";
  return "new";
}

function inferStatusFromStage(stage: PipelineStage): LeadStatus {
  if (stage === "diagnostico") return "qualified";
  if (stage === "proposta") return "proposal";
  if (stage === "negociacao") return "negotiation";
  if (stage === "fechado") return "won";
  return "new";
}

function scoreLead(input: Pick<Lead, "monthly_budget" | "urgency_days" | "website_status" | "instagram_status" | "city" | "niche" | "solution_interest" | "pain_points">) {
  let score = 0;
  if (input.monthly_budget >= 5000) score += 30;
  else if (input.monthly_budget >= 2000) score += 20;
  else score += 10;

  if (input.urgency_days <= 7) score += 25;
  else if (input.urgency_days <= 21) score += 15;
  else score += 5;

  if (input.city === "Manaus") score += 10;
  if (["Clinicas", "Imobiliarias", "Barbearia", "Salao de beleza", "Loja de moveis"].includes(input.niche)) score += 15;
  if (input.website_status !== "good") score += 8;
  if (input.instagram_status !== "good") score += 6;
  if (input.solution_interest === "mixed") score += 12;
  if (input.pain_points.length >= 2) score += 8;

  return Math.min(score, 100);
}

function buildDiagnosis(lead: Pick<Lead, "company_name" | "pain_points" | "city" | "monthly_budget" | "urgency_days">) {
  const topPain = lead.pain_points[0] ?? "processo comercial pouco previsivel";
  return `${lead.company_name} em ${lead.city} apresenta gargalo em ${topPain}, com janela de ${lead.urgency_days} dias e potencial de investimento em R$ ${lead.monthly_budget.toLocaleString("pt-BR")}.`;
}

function buildOffer(lead: Pick<Lead, "solution_interest">) {
  const mapped = lead.solution_interest.replace("_", " ");
  return `Projeto de ${mapped} com diagnostico comercial, cadencia de contato e CRM operacional.`;
}

function buildMessage(
  settings: AgentSettings,
  lead: Pick<Lead, "contact_name" | "company_name" | "city" | "solution_interest" | "pain_points">,
  customContext?: string
) {
  const pains = lead.pain_points.slice(0, 2).join(", ") || "mais previsibilidade";
  const base = `Oi, ${lead.contact_name}. Analisei a ${lead.company_name} em ${lead.city} e vi espaco para evoluir ${pains}. ${settings.positioning}`;
  const offer = `Uma entrega de ${lead.solution_interest.replace("_", " ")} pode acelerar esse ganho comercial.`;
  return customContext ? `${base} ${offer} Contexto adicional: ${customContext}.` : `${base} ${offer}`;
}

function buildAiAnalysis(lead: Lead): LeadAIAnalysis {
  return {
    summary: `${lead.company_name} tem aderencia comercial relevante e pede abordagem consultiva com foco em ganho rapido.`,
    diagnosis: buildDiagnosis(lead),
    score: {
      value: lead.score,
      label: classifyScore(lead.score) as LeadAIAnalysis["score"]["label"],
      explanation: "Score composto por orcamento, urgencia, aderencia ao ICP e maturidade digital atual.",
      factors: [
        {
          title: "Orcamento",
          impact: lead.monthly_budget >= 2000 ? "positive" : "neutral",
          detail: `Investimento estimado em R$ ${lead.monthly_budget.toLocaleString("pt-BR")}.`
        },
        {
          title: "Urgencia",
          impact: lead.urgency_days <= 21 ? "positive" : "neutral",
          detail: `Prazo declarado de ${lead.urgency_days} dias.`
        },
        {
          title: "Presenca digital",
          impact: lead.website_status !== "good" || lead.instagram_status !== "good" ? "negative" : "neutral",
          detail: `Site ${lead.website_status} e Instagram ${lead.instagram_status}.`
        }
      ]
    },
    recommended_service: {
      name: buildOffer(lead),
      rationale: "A recomendacao cruza a dor principal com o tipo de solucao buscado pelo lead.",
      expected_outcome: "Ganhar velocidade comercial e previsibilidade no atendimento."
    },
    next_steps: [
      "Confirmar decisor e urgencia real.",
      "Apresentar gargalo comercial principal.",
      "Propor piloto enxuto com objetivo mensuravel."
    ]
  };
}

function buildAiMessages(lead: Lead, settings: AgentSettings, customContext?: string): LeadAIMessages {
  return {
    whatsapp: buildMessage(settings, lead, customContext),
    follow_up: `Oi, ${lead.contact_name}. Voltei porque a ${lead.company_name} tem um ganho claro se organizar ${lead.pain_points[0] ?? "o processo comercial"}. Posso te mandar uma sugestao objetiva?`,
    email_subject: `Ideia pratica para o comercial da ${lead.company_name}`,
    email_body: `Ola, ${lead.contact_name}.\n\nRevendo o contexto da ${lead.company_name}, vi uma oportunidade clara para atacar ${lead.pain_points.slice(0, 2).join(", ") || "a previsibilidade comercial"} com uma entrega enxuta e orientada a resultado.\n\nSe fizer sentido, posso te enviar um diagnostico inicial ainda hoje.`,
    call_script: `Abrir citando ${lead.company_name}, validar como hoje tratam ${lead.pain_points[0] ?? "os leads"}, quantificar impacto e convidar para um diagnostico rapido.`
  };
}

function hydrateLead(
  input: Omit<Lead, "score" | "score_label" | "diagnosis" | "suggested_offer" | "generated_message" | "status">,
  settings: AgentSettings
): Lead {
  const score = scoreLead(input);
  const stageStatus = inferStatusFromStage(input.pipeline_stage);
  return {
    ...input,
    score,
    score_label: classifyScore(score),
    diagnosis: buildDiagnosis(input),
    suggested_offer: buildOffer(input),
    generated_message: buildMessage(settings, input),
    ai_analysis: null,
    ai_messages: null,
    ai_state: null,
    status: stageStatus === "new" ? inferScoreStatus(score) : stageStatus
  };
}

function createInitialDatabase(): MockDatabase {
  const settings: AgentSettings = {
    id: 1,
    company_name: "LeadFlow Manaus",
    positioning: "Operacao consultiva para captacao, qualificacao e CRM comercial de negocios locais em Manaus.",
    target_niches: ["Barbearia", "Clinicas", "Imobiliarias", "Loja de moveis", "Salao de beleza"],
    target_cities: ["Manaus"],
    prompt_tone: "consultivo",
    qualification_rules: {
      budget_weights: { high: 30, medium: 20, low: 10 },
      urgency_weights: { urgent: 25, medium: 15, low: 5 }
    }
  };

  const seedLeads = [
    {
      id: 1,
      company_name: "Barbearia Vieiralves Prime",
      contact_name: "Rafael Nogueira",
      email: "rafael@vieiralvesprime.com.br",
      phone: "(92) 99111-1201",
      niche: "Barbearia",
      city: "Manaus",
      company_size: "small",
      solution_interest: "automation" as const,
      website_status: "none",
      instagram_status: "weak",
      monthly_budget: 1800,
      urgency_days: 5,
      source: "instagram",
      notes: "Opera forte por indicacao, mas perde horarios por desorganizacao do atendimento.",
      pain_points: ["agendamento no WhatsApp sem controle", "faltas recorrentes", "sem rotina de pos-venda"],
      tags: ["barbearia", "zona-centro-sul", "reativacao"],
      pipeline_stage: "entrada" as PipelineStage,
      last_contact_at: null,
      created_at: NOW,
      updated_at: NOW,
      activities: [{ id: 1, type: "created", description: "Lead demo criado.", created_at: NOW }]
    },
    {
      id: 2,
      company_name: "Clinica Sorriso Adrianopolis",
      contact_name: "Dra. Juliana Castro",
      email: "juliana@sorrisoadrianopolis.com.br",
      phone: "(92) 99222-3402",
      niche: "Clinicas",
      city: "Manaus",
      company_size: "medium",
      solution_interest: "mixed" as const,
      website_status: "outdated",
      instagram_status: "weak",
      monthly_budget: 7200,
      urgency_days: 7,
      source: "indicacao",
      notes: "Quer organizar primeira consulta e confirmar faltosos automaticamente.",
      pain_points: ["baixo agendamento de avaliacao", "follow-up manual", "site com baixa conversao"],
      tags: ["saude", "alta-prioridade", "implantes"],
      pipeline_stage: "diagnostico" as PipelineStage,
      last_contact_at: NOW,
      created_at: NOW,
      updated_at: NOW,
      activities: [{ id: 2, type: "meeting", description: "Diagnostico comercial agendado.", created_at: NOW }]
    },
    {
      id: 3,
      company_name: "Amazon Home Imoveis",
      contact_name: "Patricia Almeida",
      email: "patricia@amazonhomeimoveis.com.br",
      phone: "(92) 99333-5603",
      niche: "Imobiliarias",
      city: "Manaus",
      company_size: "medium",
      solution_interest: "automation" as const,
      website_status: "outdated",
      instagram_status: "inactive",
      monthly_budget: 5400,
      urgency_days: 12,
      source: "site",
      notes: "Busca centralizar atendimento de lancamentos e revenda.",
      pain_points: ["leads de portal sem resposta rapida", "corretores sem cadencia", "sem CRM leve"],
      tags: ["crm", "imoveis", "alto-ticket"],
      pipeline_stage: "proposta" as PipelineStage,
      last_contact_at: NOW,
      created_at: NOW,
      updated_at: NOW,
      activities: [{ id: 3, type: "proposal", description: "Proposta enviada para time comercial.", created_at: NOW }]
    },
    {
      id: 4,
      company_name: "Mobili Casa Amazonas",
      contact_name: "Thiago Pereira",
      email: "thiago@mobilicasaam.com.br",
      phone: "(92) 99444-7804",
      niche: "Loja de moveis",
      city: "Manaus",
      company_size: "small",
      solution_interest: "landing_page" as const,
      website_status: "outdated",
      instagram_status: "good",
      monthly_budget: 3500,
      urgency_days: 18,
      source: "manual",
      notes: "Boa demanda organica, mas sem estrutura para transformar visitas em pedidos.",
      pain_points: ["catalogo sem captacao de orcamentos", "atendimento lento no direct"],
      tags: ["varejo", "moveis", "catalogo"],
      pipeline_stage: "entrada" as PipelineStage,
      last_contact_at: null,
      created_at: NOW,
      updated_at: NOW,
      activities: [{ id: 4, type: "created", description: "Lead demo criado.", created_at: NOW }]
    },
    {
      id: 5,
      company_name: "Salao Bella Cachoeirinha",
      contact_name: "Camila Ribeiro",
      email: "camila@bellacachoeirinha.com.br",
      phone: "(92) 99555-9105",
      niche: "Salao de beleza",
      city: "Manaus",
      company_size: "small",
      solution_interest: "automation" as const,
      website_status: "none",
      instagram_status: "weak",
      monthly_budget: 2200,
      urgency_days: 9,
      source: "instagram",
      notes: "Quer automatizar lembretes e campanhas de reativacao.",
      pain_points: ["agenda cheia sem confirmacao", "baixo retorno de clientes antigas"],
      tags: ["beleza", "agenda", "whatsapp"],
      pipeline_stage: "diagnostico" as PipelineStage,
      last_contact_at: NOW,
      created_at: NOW,
      updated_at: NOW,
      activities: [{ id: 5, type: "call", description: "Ligacao de qualificacao concluida.", created_at: NOW }]
    },
    {
      id: 6,
      company_name: "OrtoMais Clinica Integrada",
      contact_name: "Dr. Bruno Tavares",
      email: "bruno@ortomaismanaus.com.br",
      phone: "(92) 99666-1106",
      niche: "Clinicas",
      city: "Manaus",
      company_size: "medium",
      solution_interest: "web_system" as const,
      website_status: "good",
      instagram_status: "good",
      monthly_budget: 9000,
      urgency_days: 4,
      source: "evento",
      notes: "Ja investe em trafego e precisa integrar captura, triagem e acompanhamento.",
      pain_points: ["triagem comercial descentralizada", "falta de dashboard de conversao", "equipe sem SLA"],
      tags: ["saude", "premium", "sistema"],
      pipeline_stage: "negociacao" as PipelineStage,
      last_contact_at: NOW,
      created_at: NOW,
      updated_at: NOW,
      activities: [{ id: 6, type: "meeting", description: "Reuniao de alinhamento tecnico realizada.", created_at: NOW }]
    },
    {
      id: 7,
      company_name: "Reserva Ponta Negra Imoveis",
      contact_name: "Leonardo Barros",
      email: "leonardo@reservapontanegra.com.br",
      phone: "(92) 99777-2307",
      niche: "Imobiliarias",
      city: "Manaus",
      company_size: "medium",
      solution_interest: "mixed" as const,
      website_status: "good",
      instagram_status: "weak",
      monthly_budget: 6800,
      urgency_days: 20,
      source: "meta-ads",
      notes: "Precisa separar lead de compra, aluguel e investimento antes do repasse.",
      pain_points: ["lead frio entrando sem qualificacao", "retorno irregular dos corretores"],
      tags: ["lancamentos", "crm", "qualificacao"],
      pipeline_stage: "fechado" as PipelineStage,
      last_contact_at: NOW,
      created_at: NOW,
      updated_at: NOW,
      activities: [{ id: 7, type: "won", description: "Contrato aprovado em piloto comercial.", created_at: NOW }]
    },
    {
      id: 8,
      company_name: "Barbearia Distrito 10",
      contact_name: "Mateus Farias",
      email: "mateus@distrito10barbearia.com.br",
      phone: "(92) 99888-4508",
      niche: "Barbearia",
      city: "Manaus",
      company_size: "small",
      solution_interest: "landing_page" as const,
      website_status: "outdated",
      instagram_status: "inactive",
      monthly_budget: 1400,
      urgency_days: 25,
      source: "manual",
      notes: "Aceita piloto enxuto para testar campanhas de agenda da semana.",
      pain_points: ["dependencia de indicacao", "sem campanha de reativacao", "ausencia de landing page"],
      tags: ["baixo-ticket", "captacao", "bairro"],
      pipeline_stage: "entrada" as PipelineStage,
      last_contact_at: null,
      created_at: NOW,
      updated_at: NOW,
      activities: [{ id: 8, type: "created", description: "Lead demo criado.", created_at: NOW }]
    }
  ].map((lead) => hydrateLead(lead, settings));

  return {
    leads: seedLeads,
    settings,
    nextLeadId: 9,
    nextActivityId: 9
  };
}

function loadDatabase(): MockDatabase {
  const raw = localStorage.getItem(MOCK_DATA_KEY);
  if (!raw) {
    const initial = createInitialDatabase();
    localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    return JSON.parse(raw) as MockDatabase;
  } catch {
    const reset = createInitialDatabase();
    localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(reset));
    return reset;
  }
}

function saveDatabase(database: MockDatabase) {
  localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(database));
}

function buildBoard(leads: Lead[]): CRMBoard {
  const stages: PipelineStage[] = ["entrada", "diagnostico", "proposta", "negociacao", "fechado"];
  return {
    updated_at: new Date().toISOString(),
    columns: stages.map((stage) => {
      const items = leads.filter((lead) => lead.pipeline_stage === stage);
      return {
        stage,
        count: items.length,
        leads: items.map((lead) => ({
          id: lead.id,
          company_name: lead.company_name,
          contact_name: lead.contact_name,
          score: lead.score,
          score_label: lead.score_label,
          status: lead.status
        }))
      };
    })
  };
}

function buildDashboard(leads: Lead[]): DashboardData {
  const total = leads.length;
  const qualified = leads.filter((lead) => lead.score >= 60).length;
  const won = leads.filter((lead) => lead.status === "won").length;

  const byCount = (values: string[]) =>
    Object.entries(values.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item]: (acc[item] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);

  return {
    total_leads: total,
    qualified_leads: qualified,
    avg_score: total ? Number((leads.reduce((sum, lead) => sum + lead.score, 0) / total).toFixed(1)) : 0,
    pipeline: ["entrada", "diagnostico", "proposta", "negociacao", "fechado"].map((stage) => ({
      stage,
      count: leads.filter((lead) => lead.pipeline_stage === stage).length
    })),
    top_niches: byCount(leads.map((lead) => lead.niche)).map(([name, count]) => ({ name, count })),
    cities: byCount(leads.map((lead) => lead.city)).map(([name, count]) => ({ name, count })),
    conversion_rate: total ? Number(((won / total) * 100).toFixed(1)) : 0
  };
}

export function canUseDemoCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}

export function createOfflineSession(reason: string): AppSession {
  const now = new Date().toISOString();
  return {
    accessToken: `offline-demo.${btoa(`${DEMO_EMAIL}:${now}`)}`,
    refreshToken: `offline-refresh.${btoa(now)}`,
    tokenType: "Bearer",
    expiresIn: 3600,
    authMode: "demo",
    authSource: "local-mock",
    dataSource: "mock",
    requestId: `offline-${Date.now()}`,
    mode: "offline-demo",
    fallbackReason: reason,
    user: {
      id: "demo-admin",
      name: "Admin Demo",
      email: DEMO_EMAIL,
      role: "admin"
    },
    createdAt: now
  };
}

export function loginOffline(email: string, password: string, reason: string): DemoLoginResponse {
  if (!canUseDemoCredentials(email, password)) {
    throw new Error("Credenciais demo invalidas.");
  }

  const session = createOfflineSession(reason);
  return {
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    token_type: session.tokenType,
    expires_in: session.expiresIn,
    auth_mode: session.authMode,
    database_required: false,
    requestId: session.requestId,
    user: session.user
  };
}

export const mockBackend = {
  dashboard(): DashboardData {
    return buildDashboard(loadDatabase().leads);
  },
  leads(): Lead[] {
    return [...loadDatabase().leads].sort((a, b) => b.score - a.score || b.id - a.id);
  },
  lead(id: number): Lead {
    const lead = loadDatabase().leads.find((item) => item.id === id);
    if (!lead) {
      throw new Error("Lead nao encontrado.");
    }
    return lead;
  },
  settings(): AgentSettings {
    return loadDatabase().settings;
  },
  crmBoard(): CRMBoard {
    return buildBoard(loadDatabase().leads);
  },
  createLead(payload: LeadCreateInput): Lead {
    const db = loadDatabase();
    const now = new Date().toISOString();
    const lead = hydrateLead(
      {
        id: db.nextLeadId,
        ...payload,
        pipeline_stage: "entrada",
        last_contact_at: null,
        created_at: now,
        updated_at: now,
        activities: [{ id: db.nextActivityId, type: "created", description: "Lead cadastrado em modo offline.", created_at: now }]
      },
      db.settings
    );
    db.leads.unshift(lead);
    db.nextLeadId += 1;
    db.nextActivityId += 1;
    saveDatabase(db);
    return lead;
  },
  updateLead(id: number, payload: LeadUpdateInput) {
    const db = loadDatabase();
    const lead = db.leads.find((item) => item.id === id);
    if (!lead) {
      throw new Error("Lead nao encontrado.");
    }

    const now = new Date().toISOString();
    const nextStage = payload.pipeline_stage ?? lead.pipeline_stage;
    const hydrated = hydrateLead({ ...lead, ...payload, pipeline_stage: nextStage, updated_at: now }, db.settings);

    Object.assign(lead, hydrated, {
      ai_analysis: null,
      ai_messages: null,
      ai_state: null,
      status: payload.status ?? inferStatusFromStage(nextStage),
      pipeline_stage: nextStage,
      updated_at: now
    });
    saveDatabase(db);
    return lead;
  },
  deleteLead(id: number) {
    const db = loadDatabase();
    const index = db.leads.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("Lead nao encontrado.");
    }
    db.leads.splice(index, 1);
    saveDatabase(db);
  },
  moveLead(id: number, pipelineStage: PipelineStage, status?: LeadStatus) {
    const db = loadDatabase();
    const lead = db.leads.find((item) => item.id === id);
    if (!lead) {
      throw new Error("Lead nao encontrado.");
    }
    const now = new Date().toISOString();
    lead.pipeline_stage = pipelineStage;
    lead.status = status ?? inferStatusFromStage(pipelineStage);
    lead.updated_at = now;
    lead.last_contact_at = now;
    lead.activities.unshift({
      id: db.nextActivityId,
      type: "pipeline",
      description: `Lead movido para ${pipelineStage} no modo offline.`,
      created_at: now
    });
    db.nextActivityId += 1;
    saveDatabase(db);
    return lead;
  },
  addLeadActivity(id: number, type: string, description: string) {
    const db = loadDatabase();
    const lead = db.leads.find((item) => item.id === id);
    if (!lead) {
      throw new Error("Lead nao encontrado.");
    }

    const now = new Date().toISOString();
    lead.activities.unshift({
      id: db.nextActivityId,
      type,
      description,
      created_at: now
    });
    lead.updated_at = now;
    lead.last_contact_at = now;
    db.nextActivityId += 1;
    saveDatabase(db);
    return lead;
  },
  updateSettings(payload: Omit<AgentSettings, "id">) {
    const db = loadDatabase();
    db.settings = { ...payload, id: 1 };
    db.leads = db.leads.map((lead) => hydrateLead({ ...lead }, db.settings));
    saveDatabase(db);
    return db.settings;
  },
  generateApproach(leadId?: number, customContext?: string) {
    const db = loadDatabase();
    const lead = db.leads.find((item) => item.id === leadId) ?? db.leads[0];

    if (!lead) {
      return { message: `Tom ${db.settings.prompt_tone}. Contexto: ${customContext ?? "sem contexto adicional"}.` };
    }

    return { message: buildMessage(db.settings, lead, customContext) };
  },
  analyzeLeadAI(id: number) {
    const db = loadDatabase();
    const lead = db.leads.find((item) => item.id === id);
    if (!lead) {
      throw new Error("Lead nao encontrado.");
    }

    const now = new Date().toISOString();
    const analysis = buildAiAnalysis(lead);
    lead.ai_analysis = analysis;
    lead.ai_state = {
      ...(lead.ai_state ?? { messages_source: null }),
      analysis_source: "local",
      fallback_used: true,
      model: null,
      last_error: null,
      updated_at: now
    };
    lead.score = analysis.score.value;
    lead.score_label = analysis.score.label;
    lead.diagnosis = analysis.diagnosis;
    lead.suggested_offer = analysis.recommended_service.name;
    lead.updated_at = now;
    lead.activities.unshift({
      id: db.nextActivityId,
      type: "ai_analysis",
      description: "Analise IA gerada em modo demo/offline.",
      created_at: now
    });
    db.nextActivityId += 1;
    saveDatabase(db);
    return lead;
  },
  generateLeadMessagesAI(id: number, customContext?: string) {
    const db = loadDatabase();
    const lead = db.leads.find((item) => item.id === id);
    if (!lead) {
      throw new Error("Lead nao encontrado.");
    }

    const now = new Date().toISOString();
    const messages = buildAiMessages(lead, db.settings, customContext);
    lead.ai_messages = messages;
    lead.ai_state = {
      ...(lead.ai_state ?? { analysis_source: null }),
      messages_source: "local",
      fallback_used: true,
      model: null,
      last_error: null,
      updated_at: now
    };
    lead.generated_message = messages.whatsapp;
    lead.updated_at = now;
    lead.activities.unshift({
      id: db.nextActivityId,
      type: "ai_messages",
      description: "Mensagens IA geradas em modo demo/offline.",
      created_at: now
    });
    db.nextActivityId += 1;
    saveDatabase(db);
    return lead;
  },
  fullLeadAnalysisAI(id: number, customContext?: string) {
    const db = loadDatabase();
    const lead = db.leads.find((item) => item.id === id);
    if (!lead) {
      throw new Error("Lead nao encontrado.");
    }

    const now = new Date().toISOString();
    const analysis = buildAiAnalysis(lead);
    const messages = buildAiMessages(lead, db.settings, customContext);
    lead.ai_analysis = analysis;
    lead.ai_messages = messages;
    lead.ai_state = {
      analysis_source: "local",
      messages_source: "local",
      fallback_used: true,
      model: null,
      last_error: null,
      updated_at: now
    };
    lead.score = analysis.score.value;
    lead.score_label = analysis.score.label;
    lead.diagnosis = analysis.diagnosis;
    lead.suggested_offer = analysis.recommended_service.name;
    lead.generated_message = messages.whatsapp;
    lead.updated_at = now;
    lead.activities.unshift({
      id: db.nextActivityId,
      type: "ai_full_analysis",
      description: "Analise completa IA gerada em modo demo/offline.",
      created_at: now
    });
    db.nextActivityId += 1;
    saveDatabase(db);
    return lead;
  }
};
