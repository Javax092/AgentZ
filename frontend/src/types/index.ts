export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type PipelineStage = "novo" | "contato_iniciado" | "qualificado" | "proposta" | "fechado" | "perdido";
export type SolutionInterest = "automation" | "landing_page" | "web_system" | "mixed";
export type MessageChannel = "whatsapp" | "email" | "call" | "note";
export type MessageDirection = "inbound" | "outbound" | "internal";

export interface Activity {
  id: number;
  type: string;
  description: string;
  created_at: string;
}

export interface LeadInteraction {
  id: number;
  channel: MessageChannel;
  direction: MessageDirection;
  status: string;
  subject: string;
  content: string;
  summary: string;
  scheduled_for?: string | null;
  sent_at?: string | null;
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
  analysis_source?: "gemini" | "openai" | "local" | null;
  messages_source?: "gemini" | "openai" | "local" | null;
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
  owner_name: string;
  interest_summary: string;
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
  next_action: string;
  next_action_at?: string | null;
  score: number;
  score_label: "cold" | "warm" | "hot";
  temperature: "cold" | "warm" | "hot";
  responsible: string;
  interest: string;
  diagnosis: string;
  suggested_offer: string;
  generated_message: string;
  status: LeadStatus;
  pipeline_stage: PipelineStage;
  last_contact_at?: string | null;
  last_interaction_at?: string | null;
  created_at: string;
  updated_at: string;
  ai_analysis?: LeadAIAnalysis | null;
  ai_messages?: LeadAIMessages | null;
  ai_state?: LeadAIState | null;
  activities: Activity[];
  interactions: LeadInteraction[];
}

export interface DashboardActivity {
  id: number;
  type: string;
  description: string;
  lead_id?: number | null;
  lead_name?: string | null;
  created_at: string;
}

export interface DashboardData {
  total_leads: number;
  qualified_leads: number;
  hot_leads: number;
  leads_without_response: number;
  avg_score: number;
  conversion_rate: number;
  pending_tasks: number;
  pipeline: { stage: PipelineStage; count: number }[];
  top_niches: { name: string; count: number }[];
  cities: { name: string; count: number }[];
  recent_activities: DashboardActivity[];
}

export interface AgentSettings {
  id: number;
  company_name: string;
  description: string;
  niche: string;
  city: string;
  service_type: string;
  ai_tone: string;
  primary_goal: string;
  initial_message: string;
  follow_up_message: string;
  follow_up_delay_hours: number;
  max_follow_up_attempts: number;
  hot_lead_score_threshold: number;
  webhook_url: string;
  provider_name: string;
  has_provider_api_key: boolean;
  positioning: string;
  target_niches: string[];
  target_cities: string[];
  qualification_rules: {
    budget_weights?: { high?: number; medium?: number; low?: number };
    urgency_weights?: { urgent?: number; medium?: number; low?: number };
  };
  prompt_tone: string;
}

export interface SettingsInput {
  company_name: string;
  description: string;
  niche: string;
  city: string;
  service_type: string;
  ai_tone: string;
  primary_goal: string;
  initial_message: string;
  follow_up_message: string;
  follow_up_delay_hours: number;
  max_follow_up_attempts: number;
  hot_lead_score_threshold: number;
  webhook_url: string;
  provider_name: string;
  positioning: string;
  target_niches: string[];
  target_cities: string[];
  qualification_rules: AgentSettings["qualification_rules"];
  prompt_tone: string;
}

export interface CRMBoardLead {
  id: number;
  company_name: string;
  contact_name: string;
  score: number;
  score_label: "cold" | "warm" | "hot";
  status: string;
  next_action: string;
  owner_name: string;
}

export interface CRMColumn {
  stage: PipelineStage;
  label: string;
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
  owner_name: string;
  interest_summary: string;
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
  next_action: string;
}

export interface LeadUpdateInput extends Partial<LeadCreateInput> {
  next_action_at?: string | null;
  status?: LeadStatus;
  pipeline_stage?: PipelineStage;
}

export interface MessageTemplate {
  id: number;
  name: string;
  channel: MessageChannel;
  goal: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplateInput {
  name: string;
  channel: MessageChannel;
  goal: string;
  content: string;
  is_active: boolean;
}

export interface MessagePreview {
  channel: MessageChannel;
  subject?: string | null;
  content: string;
  source: string;
}

export interface AIResponseSuggestion {
  channel: "whatsapp" | "email" | "call";
  message: string;
  rationale: string;
}

export interface AISummary {
  summary: string;
  score: number;
  temperature: "cold" | "warm" | "hot";
  next_action: string;
}

export interface AINextAction {
  recommended_action: string;
  why_now: string;
  urgency: "low" | "medium" | "high";
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  requestId?: string;
  user: AuthUser;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface AppSession {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  requestId?: string;
  user: AuthUser;
  createdAt: string;
}
