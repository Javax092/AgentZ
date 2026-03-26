import type {
  AgentSettings,
  AppSession,
  CRMBoard,
  DashboardData,
  DemoLoginResponse,
  Lead,
  LeadCreateInput,
  LeadStatus,
  LeadUpdateInput,
  PipelineStage
} from "../types";
import { log } from "./logger";
import { canUseDemoCredentials, createOfflineSession, loginOffline, mockBackend } from "./mockBackend";
import { clearSession, getSession, saveSession, updateSession } from "./session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
const REQUEST_TIMEOUT_MS = 8000;
const DEMO_FALLBACK_EMAIL = "admin@leadflow.ai";

export class ApiError extends Error {
  statusCode?: number;
  code?: string;
  requestId?: string;

  constructor(message: string, options?: { statusCode?: number; code?: string; requestId?: string }) {
    super(message);
    this.name = "ApiError";
    this.statusCode = options?.statusCode;
    this.code = options?.code;
    this.requestId = options?.requestId;
  }
}

function toAppSession(
  response: DemoLoginResponse,
  mode: AppSession["mode"],
  authSource: AppSession["authSource"],
  dataSource: AppSession["dataSource"],
  fallbackReason?: string
): AppSession {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type,
    expiresIn: response.expires_in,
    authMode: response.auth_mode,
    authSource,
    dataSource,
    requestId: response.requestId,
    mode,
    fallbackReason,
    user: response.user,
    createdAt: new Date().toISOString()
  };
}

function normalizeApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError("Tempo limite excedido ao falar com a API.", { code: "timeout" });
  }
  return new ApiError("Falha de rede ao falar com a API.", { code: "network_error" });
}

function isRetriableAuthFailure(error: unknown) {
  if (!(error instanceof ApiError)) return true;
  return ![400, 401, 403].includes(error.statusCode ?? 0);
}

function isSessionExpired(session: AppSession | null) {
  if (!session) return true;
  const createdAt = Date.parse(session.createdAt);
  if (Number.isNaN(createdAt)) return false;
  return Date.now() >= createdAt + Math.max(session.expiresIn - 30, 0) * 1000;
}

async function requestJson<T>(path: string, init?: RequestInit, accessToken?: string): Promise<T> {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    log("info", "http", "request_started", { path, requestId, method: init?.method ?? "GET" });

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init?.headers ?? {}),
        "x-request-id": requestId
      }
    });

    const text = await response.text();
    let json: (T & { message?: string; error?: string; requestId?: string }) | undefined;
    if (text) {
      try {
        json = JSON.parse(text) as T & { message?: string; error?: string; requestId?: string };
      } catch {
        throw new ApiError("Resposta JSON invalida recebida da API.", { code: "malformed_response", requestId });
      }
    }

    if (!response.ok) {
      throw new ApiError(json?.message ?? text ?? "Falha na API.", {
        statusCode: response.status,
        code: json?.error,
        requestId: json?.requestId ?? response.headers.get("x-request-id") ?? requestId
      });
    }

    log("info", "http", "request_succeeded", {
      path,
      requestId,
      durationMs: Number((performance.now() - startedAt).toFixed(1))
    });

    return json as T;
  } catch (error) {
    const apiError = normalizeApiError(error);
    log("error", "http", "request_failed", {
      path,
      requestId,
      statusCode: apiError.statusCode,
      code: apiError.code,
      message: apiError.message
    });
    throw apiError;
  } finally {
    window.clearTimeout(timer);
  }
}

async function resolveDataSource() {
  try {
    await requestJson<{ status: string }>("/health");
    return "remote" as const;
  } catch {
    return "mock" as const;
  }
}

let refreshPromise: Promise<AppSession | null> | null = null;

async function refreshSession() {
  const current = getSession();
  if (!current || current.dataSource === "mock" || !current.refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = requestJson<DemoLoginResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: current.refreshToken })
    })
      .then((response) => {
        const nextSession = toAppSession(response, "remote", "api", "remote", current.fallbackReason);
        saveSession(nextSession);
        return nextSession;
      })
      .catch((error) => {
        if (current.user.email.toLowerCase() === DEMO_FALLBACK_EMAIL) {
          const offlineSession = createOfflineSession(normalizeApiError(error).message);
          saveSession(offlineSession);
          return offlineSession;
        }
        clearSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function fetchAuthed<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getSession();
  if (!session) {
    throw new ApiError("Sessao expirada. Faca login novamente.", { statusCode: 401, code: "missing_session" });
  }

  let activeSession = session;
  if (session.dataSource === "remote" && isSessionExpired(session)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      activeSession = refreshed;
    }
  }

  try {
    return await requestJson<T>(path, init, activeSession.accessToken);
  } catch (error) {
    const apiError = normalizeApiError(error);
    if (apiError.statusCode === 401 && activeSession.dataSource === "remote") {
      const refreshed = await refreshSession();
      if (refreshed) {
        return requestJson<T>(path, init, refreshed.accessToken);
      }
    }
    throw apiError;
  }
}

async function withDataFallback<T>(operation: string, remoteCall: () => Promise<T>, mockCall: () => T): Promise<T> {
  const session = getSession();
  if (!session || session.dataSource === "mock") {
    log("warn", "data", "using_mock_backend", { operation, reason: session?.fallbackReason ?? "mock_mode" });
    return mockCall();
  }

  try {
    return await remoteCall();
  } catch (error) {
    const apiError = normalizeApiError(error);
    if (apiError.statusCode === 401) {
      clearSession();
      throw new ApiError("Sessao expirada. Faca login novamente.", { statusCode: 401, code: "session_expired" });
    }
    if (apiError.statusCode && apiError.statusCode < 500 && apiError.statusCode !== 404) {
      throw apiError;
    }

    updateSession({
      dataSource: "mock",
      mode: "hybrid",
      fallbackReason: `API indisponivel durante ${operation}. Modo demo local ativado.`
    });
    log("warn", "data", "switched_to_mock_backend", { operation, message: apiError.message });
    return mockCall();
  }
}

export const authApi = {
  async login(email: string, password: string) {
    try {
      const response = await requestJson<DemoLoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      const dataSource = await resolveDataSource();
      const session = toAppSession(response, dataSource === "remote" ? "remote" : "hybrid", "api", dataSource);
      saveSession(session);
      return session;
    } catch (error) {
      if (!canUseDemoCredentials(email, password) || !isRetriableAuthFailure(error)) {
        throw normalizeApiError(error);
      }

      const reason = normalizeApiError(error).message;
      const response = loginOffline(email, password, reason);
      const session = toAppSession(response, "offline-demo", "local-mock", "mock", reason);
      saveSession(session);
      log("warn", "auth", "offline_demo_login_enabled", { reason });
      return session;
    }
  },
  async me() {
    return fetchAuthed<{ id: string; name: string; email: string; role: string }>("/auth/me");
  },
  logout() {
    clearSession();
  },
  getSession
};

export const api = {
  dashboard: () => withDataFallback("dashboard", () => fetchAuthed<DashboardData>("/dashboard"), () => mockBackend.dashboard()),
  leads: () => withDataFallback("leads", () => fetchAuthed<Lead[]>("/leads"), () => mockBackend.leads()),
  lead: (id: number) => withDataFallback("lead", () => fetchAuthed<Lead>(`/leads/${id}`), () => mockBackend.lead(id)),
  createLead: (payload: LeadCreateInput) =>
    withDataFallback("createLead", () => fetchAuthed<Lead>("/leads", { method: "POST", body: JSON.stringify(payload) }), () => mockBackend.createLead(payload)),
  updateLead: (id: number, payload: LeadUpdateInput) =>
    withDataFallback("updateLead", () => fetchAuthed<Lead>(`/leads/${id}`, { method: "PUT", body: JSON.stringify(payload) }), () => mockBackend.updateLead(id, payload)),
  deleteLead: (id: number) =>
    withDataFallback("deleteLead", () => fetchAuthed<void>(`/leads/${id}`, { method: "DELETE" }), () => mockBackend.deleteLead(id)),
  crmBoard: () => withDataFallback("crmBoard", () => fetchAuthed<CRMBoard>("/crm/board"), () => mockBackend.crmBoard()),
  moveLead: (id: number, pipelineStage: PipelineStage, status?: LeadStatus) =>
    withDataFallback(
      "moveLead",
      () => fetchAuthed<Lead>(`/crm/leads/${id}/move`, { method: "POST", body: JSON.stringify({ pipeline_stage: pipelineStage, status }) }),
      () => mockBackend.moveLead(id, pipelineStage, status)
    ),
  addLeadActivity: (id: number, type: string, description: string) =>
    withDataFallback(
      "addLeadActivity",
      () => fetchAuthed<Lead>(`/crm/leads/${id}/activities`, { method: "POST", body: JSON.stringify({ type, description }) }),
      () => mockBackend.addLeadActivity(id, type, description)
    ),
  settings: () => withDataFallback("settings", () => fetchAuthed<AgentSettings>("/settings"), () => mockBackend.settings()),
  updateSettings: (payload: Omit<AgentSettings, "id">) =>
    withDataFallback(
      "updateSettings",
      () => fetchAuthed<AgentSettings>("/settings", { method: "PUT", body: JSON.stringify(payload) }),
      () => mockBackend.updateSettings(payload)
    ),
  generateApproach: (leadId?: number, customContext?: string) =>
    withDataFallback(
      "generateApproach",
      () =>
        fetchAuthed<{ message: string }>("/approaches/generate", {
          method: "POST",
          body: JSON.stringify({ lead_id: leadId, custom_context: customContext })
        }),
      () => mockBackend.generateApproach(leadId, customContext)
    ),
  analyzeLeadAI: (id: number) =>
    withDataFallback("analyzeLeadAI", () => fetchAuthed<Lead>(`/ai/leads/${id}/analyze`, { method: "POST" }), () => mockBackend.analyzeLeadAI(id)),
  generateLeadMessagesAI: (id: number, customContext?: string) =>
    withDataFallback(
      "generateLeadMessagesAI",
      () => fetchAuthed<Lead>(`/ai/leads/${id}/messages`, { method: "POST", body: JSON.stringify({ custom_context: customContext }) }),
      () => mockBackend.generateLeadMessagesAI(id, customContext)
    ),
  fullLeadAnalysisAI: (id: number, customContext?: string) =>
    withDataFallback(
      "fullLeadAnalysisAI",
      () => fetchAuthed<Lead>(`/ai/leads/${id}/full-analysis`, { method: "POST", body: JSON.stringify({ custom_context: customContext }) }),
      () => mockBackend.fullLeadAnalysisAI(id, customContext)
    )
};
