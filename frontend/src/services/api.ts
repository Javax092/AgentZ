import type {
  AgentSettings,
  AINextAction,
  AIResponseSuggestion,
  AISummary,
  AppSession,
  AuthResponse,
  CRMBoard,
  DashboardData,
  Lead,
  LeadCreateInput,
  LeadInteraction,
  LeadStatus,
  LeadUpdateInput,
  MessagePreview,
  MessageTemplate,
  MessageTemplateInput,
  PipelineStage,
  RegisterInput,
  SettingsInput
} from "../types";
import { clearSession, getSession, saveSession } from "./session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  statusCode?: number;
  requestId?: string;
  errors?: Array<{ field?: string; message?: string }>;

  constructor(message: string, options?: { statusCode?: number; requestId?: string; errors?: Array<{ field?: string; message?: string }> }) {
    super(message);
    this.name = "ApiError";
    this.statusCode = options?.statusCode;
    this.requestId = options?.requestId;
    this.errors = options?.errors;
  }
}

function toAppSession(response: AuthResponse): AppSession {
  return {
    accessToken: response.access_token,
    tokenType: response.token_type,
    expiresIn: response.expires_in,
    requestId: response.requestId,
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
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }

  const payload = (json && typeof json === "object") ? (json as Record<string, unknown>) : undefined;

  if (!response.ok) {
    const errors = Array.isArray(payload?.errors)
      ? payload.errors
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
          .map((item) => ({
            field: typeof item.field === "string" ? item.field : undefined,
            message: typeof item.message === "string" ? item.message : undefined
          }))
      : undefined;

    const fallbackDetail = payload?.detail;
    const detailMessage =
      typeof payload?.message === "string"
        ? payload.message
        : typeof fallbackDetail === "string"
          ? fallbackDetail
          : Array.isArray(errors) && errors.length > 0
            ? errors.map((item) => item.message).filter(Boolean).join(" ")
            : "Falha na API.";

    throw new ApiError(detailMessage, {
      statusCode: response.status,
      requestId: typeof payload?.requestId === "string" ? payload.requestId : undefined,
      errors
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
  async register(payload: RegisterInput) {
    const response = await requestJson<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const session = toAppSession(response);
    saveSession(session);
    return session;
  },
  async login(email: string, password: string) {
    const response = await requestJson<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    const session = toAppSession(response);
    saveSession(session);
    return session;
  },
  me: () => fetchAuthed("/auth/me"),
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
