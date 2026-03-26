import type {
  AgentSettings,
  CRMBoard,
  DashboardData,
  DemoLoginResponse,
  Lead,
  LeadCreateInput,
  LeadStatus,
  LeadUpdateInput,
  PipelineStage
} from "../types";

const disabled = () => {
  throw new Error("Mock backend desativado. Use a API real do LeadFlow AI.");
};

export const canUseDemoCredentials = () => false;

export const createOfflineSession = (_reason?: string) => {
  throw new Error("Modo offline desativado.");
};

export const loginOffline = (_email: string, _password: string, _reason?: string): DemoLoginResponse => {
  throw new Error("Modo offline desativado.");
};

export const mockBackend = {
  dashboard: (): DashboardData => disabled(),
  leads: (): Lead[] => disabled(),
  lead: (_id: number): Lead => disabled(),
  createLead: (_payload: LeadCreateInput): Lead => disabled(),
  updateLead: (_id: number, _payload: LeadUpdateInput): Lead => disabled(),
  deleteLead: (_id: number): void => disabled(),
  crmBoard: (): CRMBoard => disabled(),
  moveLead: (_id: number, _pipelineStage: PipelineStage, _status?: LeadStatus): Lead => disabled(),
  addLeadActivity: (_id: number, _type: string, _description: string): Lead => disabled(),
  settings: (): AgentSettings => disabled(),
  updateSettings: (_payload: unknown): AgentSettings => disabled(),
  generateApproach: (_leadId?: number, _customContext?: string): { message: string } => disabled(),
  analyzeLeadAI: (_id: number): Lead => disabled(),
  generateLeadMessagesAI: (_id: number, _customContext?: string): Lead => disabled(),
  fullLeadAnalysisAI: (_id: number, _customContext?: string): Lead => disabled()
};
