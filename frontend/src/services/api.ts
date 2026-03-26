import type {
  AgentSettings,
  AINextAction,
  AIResponseSuggestion,
  AISummary,
  AppSession,
  CRMBoard,
  DashboardData,
  DemoLoginResponse,
  Lead,
  LeadCreateInput,
  LeadInteraction,
  LeadStatus,
  LeadUpdateInput,
  MessagePreview,
  MessageTemplate,
  MessageTemplateInput,
  PipelineStage,
  SettingsInput
} from "../types";
import { clearSession, getSession, saveSession } from "./session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  statusCode?: number;
  requestId?: string;

  constructor(message: string, options?: { statusCode?: number; requestId?: string }) {
    super(message);
    this.name = "ApiError";
    this.statusCode = options?.statusCode;
    this.requestId = options?.requestId;
  }
}

function toAppSession(response: DemoLoginResponse): AppSession {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type,
    expiresIn: response.expires_in,
    authMode: response.auth_mode,
    authSource: "api",
    dataSource: "remote",
    requestId: response.requestId,
    mode: "remote",
    user: response.user,
    createdAt: new Date().toISOString()
  };
}

async function requestJson<T>(path: string, init?: RequestInit, accessToken?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new ApiError(json?.message ?? json?.detail ?? "Falha na API.", {
      statusCode: response.status,
      requestId: json?.requestId
    });
  }

  return json as T;
}

async function fetchAuthed<T>(path: string, init?: RequestInit) {
  const session = getSession();
  if (!session) {
    throw new ApiError("Sessao expirada. Faca login novamente.", { statusCode: 401 });
  }

  try {
    return await requestJson<T>(path, init, session.accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      clearSession();
    }
    throw error;
  }
}

export const authApi = {
  async login(email: string, password: string) {
    const response = await requestJson<DemoLoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    const session = toAppSession(response);
    saveSession(session);
    return session;
  },
  logout() {
    clearSession();
  },
  getSession
};

export const api = {
  dashboard: () => fetchAuthed<DashboardData>("/dashboard"),
  leads: () => fetchAuthed<Lead[]>("/leads"),
  lead: (id: number) => fetchAuthed<Lead>(`/leads/${id}`),
  createLead: (payload: LeadCreateInput) => fetchAuthed<Lead>("/leads", { method: "POST", body: JSON.stringify(payload) }),
  updateLead: (id: number, payload: LeadUpdateInput) => fetchAuthed<Lead>(`/leads/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteLead: (id: number) => fetchAuthed<void>(`/leads/${id}`, { method: "DELETE" }),
  crmBoard: () => fetchAuthed<CRMBoard>("/crm/board"),
  moveLead: (id: number, pipelineStage: PipelineStage, status?: LeadStatus) =>
    fetchAuthed<Lead>(`/crm/leads/${id}/move`, { method: "POST", body: JSON.stringify({ pipeline_stage: pipelineStage, status }) }),
  addLeadActivity: (id: number, type: string, description: string) =>
    fetchAuthed<Lead>(`/crm/leads/${id}/activities`, { method: "POST", body: JSON.stringify({ type, description }) }),
  settings: () => fetchAuthed<AgentSettings>("/settings"),
  updateSettings: (payload: SettingsInput) => fetchAuthed<AgentSettings>("/settings", { method: "POST", body: JSON.stringify(payload) }),
  generateApproach: (leadId?: number, customContext?: string) =>
    fetchAuthed<{ message: string }>("/approaches/generate", { method: "POST", body: JSON.stringify({ lead_id: leadId, custom_context: customContext }) }),
  analyzeLeadAI: (id: number) => fetchAuthed<Lead>(`/ai/leads/${id}/analyze`, { method: "POST" }),
  generateLeadMessagesAI: (id: number, customContext?: string) =>
    fetchAuthed<Lead>(`/ai/leads/${id}/messages`, { method: "POST", body: JSON.stringify({ custom_context: customContext }) }),
  fullLeadAnalysisAI: (id: number, customContext?: string) =>
    fetchAuthed<Lead>(`/ai/leads/${id}/full-analysis`, { method: "POST", body: JSON.stringify({ custom_context: customContext }) }),
  aiSuggestResponse: (id: number) => fetchAuthed<AIResponseSuggestion>(`/ai/leads/${id}/suggest-response`, { method: "POST" }),
  aiLeadSummary: (id: number) => fetchAuthed<AISummary>(`/ai/leads/${id}/summary`),
  aiNextAction: (id: number) => fetchAuthed<AINextAction>(`/ai/leads/${id}/next-action`),
  messageTemplates: () => fetchAuthed<MessageTemplate[]>("/messages/templates"),
  createMessageTemplate: (payload: MessageTemplateInput) =>
    fetchAuthed<MessageTemplate>("/messages/templates", { method: "POST", body: JSON.stringify(payload) }),
  updateMessageTemplate: (id: number, payload: MessageTemplateInput) =>
    fetchAuthed<MessageTemplate>(`/messages/templates/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteMessageTemplate: (id: number) => fetchAuthed<void>(`/messages/templates/${id}`, { method: "DELETE" }),
  previewMessage: (leadId: number, templateId?: number, customContext?: string) =>
    fetchAuthed<MessagePreview>("/messages/preview", { method: "POST", body: JSON.stringify({ lead_id: leadId, template_id: templateId, custom_context: customContext }) }),
  messageHistory: (leadId: number) => fetchAuthed<LeadInteraction[]>(`/messages/leads/${leadId}/history`),
  addMessageHistory: (leadId: number, payload: Omit<LeadInteraction, "id" | "created_at">) =>
    fetchAuthed<LeadInteraction>(`/messages/leads/${leadId}/history`, { method: "POST", body: JSON.stringify(payload) })
};
