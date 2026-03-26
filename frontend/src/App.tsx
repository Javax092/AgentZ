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
import { getSession, subscribeSessionChange } from "./services/session";
import type {
  AgentSettings,
  AppSession,
  CRMBoard,
  DashboardData,
  Lead,
  LeadCreateInput,
  LeadUpdateInput,
  MessageTemplate,
  MessageTemplateInput,
  PipelineStage,
  SettingsInput
} from "./types";

interface ProtectedProps {
  session: AppSession;
  onLogout: () => void;
}

function ProtectedApp({ session, onLogout }: ProtectedProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [board, setBoard] = useState<CRMBoard | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, leadsResponse, settingsResponse, boardResponse, templatesResponse] = await Promise.all([
        api.dashboard(),
        api.leads(),
        api.settings(),
        api.crmBoard(),
        api.messageTemplates()
      ]);
      setDashboard(dashboardResponse);
      setLeads(leadsResponse);
      setSettings(settingsResponse);
      setBoard(boardResponse);
      setTemplates(templatesResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar a aplicacao.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const refreshLead = async (leadId: number) => {
    const updated = await api.lead(leadId);
    setLeads((current) => current.map((lead) => (lead.id === leadId ? updated : lead)));
    return updated;
  };

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

  const handleSaveSettings = async (payload: SettingsInput) => {
    await api.updateSettings(payload);
    await load();
  };

  const handleCreateTemplate = async (payload: MessageTemplateInput) => {
    await api.createMessageTemplate(payload);
    await load();
  };

  const handleUpdateTemplate = async (templateId: number, payload: MessageTemplateInput) => {
    await api.updateMessageTemplate(templateId, payload);
    await load();
  };

  const handleDeleteTemplate = async (templateId: number) => {
    await api.deleteMessageTemplate(templateId);
    await load();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-glow p-6">
        <div className="surface-panel w-full max-w-xl p-8 text-center">
          <p className="eyebrow">LeadFlow AI</p>
          <h1 className="mt-3 font-display text-3xl text-ink">Carregando workspace comercial</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">Sincronizando leads, pipeline, configuracoes e mensagens para abrir o sistema com contexto completo.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-glow p-6">
        <div className="surface-panel max-w-lg p-8 text-center">
          <p className="eyebrow text-red-500">Falha na inicializacao</p>
          <h1 className="mt-3 font-display text-3xl text-white">Nao foi possivel abrir o produto</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">{error}</p>
          <button className="btn-primary mt-6" onClick={() => void load()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<DashboardLayout session={session} onLogout={onLogout} />}>
        <Route path="/dashboard" element={<DashboardPage dashboard={dashboard} leads={leads} />} />
        <Route path="/leads" element={<LeadsPage leads={leads} onCreateLead={handleCreateLead} onRefresh={load} />} />
        <Route
          path="/leads/:id"
          element={<LeadDetailPage onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} onRefreshLead={refreshLead} />}
        />
        <Route path="/crm" element={<CrmPage board={board} leads={leads} onMoveLead={handleMoveLead} />} />
        <Route path="/settings" element={<SettingsPage settings={settings} onSave={handleSaveSettings} />} />
        <Route
          path="/approach"
          element={
            <ApproachGeneratorPage
              leads={leads}
              templates={templates}
              onCreateTemplate={handleCreateTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          }
        />
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
