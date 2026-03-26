import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ApproachGeneratorPage } from "./pages/ApproachGeneratorPage";
import { CrmPage } from "./pages/CrmPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadDetailPage } from "./pages/LeadDetailPage";
import { LeadsPage } from "./pages/LeadsPage";
import { LoginPage } from "./pages/LoginPage";
import { SettingsPage } from "./pages/SettingsPage";
import { api, authApi } from "./services/api";
import { log } from "./services/logger";
import { getSession, subscribeSessionChange } from "./services/session";
import type { AgentSettings, AppSession, CRMBoard, DashboardData, Lead, LeadCreateInput, LeadUpdateInput, PipelineStage } from "./types";

interface ProtectedProps {
  session: AppSession;
  onLogout: () => void;
}

function ProtectedApp({ session, onLogout }: ProtectedProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [board, setBoard] = useState<CRMBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, leadsResponse, settingsResponse, boardResponse] = await Promise.all([
        api.dashboard(),
        api.leads(),
        api.settings(),
        api.crmBoard()
      ]);
      setDashboard(dashboardResponse);
      setLeads(leadsResponse);
      setSettings(settingsResponse);
      setBoard(boardResponse);
    } catch (loadError) {
      log("error", "app", "workspace_load_failed", {
        message: loadError instanceof Error ? loadError.message : "unknown_error"
      });
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar dados da API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreateLead = async (payload: LeadCreateInput) => {
    await api.createLead(payload);
    await load();
  };

  const handleMoveLead = async (leadId: number, stage: PipelineStage) => {
    await api.moveLead(leadId, stage);
    await load();
  };

  const handleUpdateLead = async (leadId: number, payload: LeadUpdateInput) => {
    await api.updateLead(leadId, payload);
    await load();
  };

  const handleDeleteLead = async (leadId: number) => {
    await api.deleteLead(leadId);
    await load();
  };

  const handleSaveSettings = async (payload: Omit<AgentSettings, "id">) => {
    await api.updateSettings(payload);
    await load();
  };

  const handleGenerate = async (leadId?: number, customContext?: string) => {
    const response = await api.generateApproach(leadId, customContext);
    return response.message;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-glow p-6">
        <div className="surface-panel w-full max-w-xl p-8 text-center">
          <p className="eyebrow">LeadFlow AI</p>
          <h1 className="mt-3 font-display text-3xl text-ink">Carregando workspace comercial</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Sincronizando dashboard, pipeline, configurações e inteligência de leads para abrir o sistema com contexto completo.</p>
          <div className="mt-6 grid gap-3">
            <div className="h-3 rounded-full bg-slate-200/80" />
            <div className="h-3 w-5/6 rounded-full bg-slate-200/80" />
            <div className="h-3 w-2/3 rounded-full bg-slate-200/80" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-glow p-6">
        <div className="surface-panel max-w-lg p-8 text-center">
          <p className="eyebrow text-red-600">Falha na inicialização</p>
          <h1 className="mt-3 font-display text-3xl text-ink">Não foi possível abrir o workspace</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<DashboardLayout session={session} onLogout={onLogout} />}>
        <Route path="/dashboard" element={<DashboardPage dashboard={dashboard} leads={leads} />} />
        <Route path="/leads" element={<LeadsPage leads={leads} onCreateLead={handleCreateLead} />} />
        <Route path="/leads/:id" element={<LeadDetailPage onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} />} />
        <Route path="/crm" element={<CrmPage board={board} onMoveLead={handleMoveLead} />} />
        <Route path="/settings" element={<SettingsPage settings={settings} onSave={handleSaveSettings} />} />
        <Route path="/approach" element={<ApproachGeneratorPage leads={leads} onGenerate={handleGenerate} />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  const [session, setSession] = useState<AppSession | null>(() => getSession());

  useEffect(() => subscribeSessionChange(() => setSession(getSession())), []);

  const handleLogout = () => {
    authApi.logout();
    setSession(null);
  };

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/*" element={session ? <ProtectedApp session={session} onLogout={handleLogout} /> : <Navigate to="/" replace />} />
    </Routes>
  );
}
