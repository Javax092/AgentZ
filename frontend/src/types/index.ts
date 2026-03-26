export type LeadStatus = "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type PipelineStage = "entrada" | "diagnostico" | "proposta" | "negociacao" | "fechado";
export type SolutionInterest = "automation" | "landing_page" | "web_system" | "mixed";

export interface Activity {
  id: number;
  type: string;
  description: string;
  created_at: string;
}

export interface LeadAIScoreFactor {
  title: string;
  impact: "positive" | "neutral" | "negative";
  detail: string;
}

export interface LeadAIScore {
  value: number;
  label: "cold" | "warm" | "hot";
  explanation: string;
  factors: LeadAIScoreFactor[];
}

export interface LeadAIRecommendedService {
  name: string;
  rationale: string;
  expected_outcome: string;
}

export interface LeadAIAnalysis {
  summary: string;
  diagnosis: string;
  score: LeadAIScore;
  recommended_service: LeadAIRecommendedService;
  next_steps: string[];
}

export interface LeadAIMessages {
  whatsapp: string;
  follow_up: string;
  email_subject: string;
  email_body: string;
  call_script: string;
}

export interface LeadAIState {
  analysis_source?: "openai" | "local" | null;
  messages_source?: "openai" | "local" | null;
  fallback_used: boolean;
  model?: string | null;
  last_error?: string | null;
  updated_at?: string | null;
}

export interface Lead {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  niche: string;
  city: string;
  company_size: string;
  solution_interest: SolutionInterest;
  website_status: string;
  instagram_status: string;
  monthly_budget: number;
  urgency_days: number;
  source: string;
  notes: string;
  pain_points: string[];
  tags: string[];
  score: number;
  score_label: string;
  diagnosis: string;
  suggested_offer: string;
  generated_message: string;
  status: LeadStatus;
  pipeline_stage: PipelineStage;
  last_contact_at?: string | null;
  created_at: string;
  updated_at: string;
  ai_analysis?: LeadAIAnalysis | null;
  ai_messages?: LeadAIMessages | null;
  ai_state?: LeadAIState | null;
  activities: Activity[];
}

export interface DashboardData {
  total_leads: number;
  qualified_leads: number;
  avg_score: number;
  pipeline: { stage: string; count: number }[];
  top_niches: { name: string; count: number }[];
  cities: { name: string; count: number }[];
  conversion_rate: number;
}

export interface AgentSettings {
  id: number;
  company_name: string;
  positioning: string;
  target_niches: string[];
  target_cities: string[];
  qualification_rules: {
    budget_weights?: {
      high?: number;
      medium?: number;
      low?: number;
    };
    urgency_weights?: {
      urgent?: number;
      medium?: number;
      low?: number;
    };
  };
  prompt_tone: string;
}

export interface CRMBoardLead {
  id: number;
  company_name: string;
  contact_name: string;
  score: number;
  score_label: string;
  status: LeadStatus;
}

export interface CRMColumn {
  stage: PipelineStage;
  count: number;
  leads: CRMBoardLead[];
}

export interface CRMBoard {
  updated_at: string;
  columns: CRMColumn[];
}

export interface LeadCreateInput {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  niche: string;
  city: string;
  company_size: string;
  solution_interest: SolutionInterest;
  website_status: string;
  instagram_status: string;
  monthly_budget: number;
  urgency_days: number;
  source: string;
  notes: string;
  pain_points: string[];
  tags: string[];
}

export interface LeadUpdateInput {
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  niche?: string;
  city?: string;
  company_size?: string;
  solution_interest?: SolutionInterest;
  website_status?: string;
  instagram_status?: string;
  monthly_budget?: number;
  urgency_days?: number;
  source?: string;
  notes?: string;
  pain_points?: string[];
  tags?: string[];
  status?: LeadStatus;
  pipeline_stage?: PipelineStage;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface DemoLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  auth_mode: string;
  database_required: boolean;
  requestId?: string;
  user: AuthUser;
}

export interface AppSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  authMode: string;
  authSource: "api" | "local-mock";
  dataSource: "remote" | "mock";
  requestId?: string;
  mode: "remote" | "hybrid" | "offline-demo";
  fallbackReason?: string;
  user: AuthUser;
  createdAt: string;
}
