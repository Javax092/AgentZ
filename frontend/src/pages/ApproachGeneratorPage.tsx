import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import type { Lead, LeadInteraction, MessageTemplate, MessageTemplateInput } from "../types";
import { formatDate } from "../utils/format";

interface Props {
  leads: Lead[];
  templates: MessageTemplate[];
  onCreateTemplate: (payload: MessageTemplateInput) => Promise<void>;
  onUpdateTemplate: (templateId: number, payload: MessageTemplateInput) => Promise<void>;
  onDeleteTemplate: (templateId: number) => Promise<void>;
}

const emptyTemplate: MessageTemplateInput = {
  name: "",
  channel: "whatsapp",
  goal: "follow_up",
  content: "",
  is_active: true
};

export function ApproachGeneratorPage({ leads, templates, onCreateTemplate, onUpdateTemplate, onDeleteTemplate }: Props) {
  const [selectedLeadId, setSelectedLeadId] = useState<number | undefined>(leads[0]?.id);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(templates[0]?.id);
  const [customContext, setCustomContext] = useState("");
  const [preview, setPreview] = useState("");
  const [history, setHistory] = useState<LeadInteraction[]>([]);
  const [templateForm, setTemplateForm] = useState<MessageTemplateInput>(emptyTemplate);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedLeadId) return;
    setLoadingHistory(true);
    void api
      .messageHistory(selectedLeadId)
      .then(setHistory)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Falha ao carregar historico."))
      .finally(() => setLoadingHistory(false));
  }, [selectedLeadId]);

  const generatePreview = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedLeadId) return;
    setLoadingPreview(true);
    setError("");
    try {
      const response = await api.previewMessage(selectedLeadId, selectedTemplateId, customContext);
      setPreview(response.content);
      const summary = await api.aiSuggestResponse(selectedLeadId);
      setFeedback(summary.rationale);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Falha ao gerar preview.");
      setPreview("");
    } finally {
      setLoadingPreview(false);
    }
  };

  const startEditing = (template: MessageTemplate) => {
    setEditingTemplateId(template.id);
    setTemplateForm({
      name: template.name,
      channel: template.channel,
      goal: template.goal,
      content: template.content,
      is_active: template.is_active
    });
  };

  const submitTemplate = async (event: FormEvent) => {
    event.preventDefault();
    setSavingTemplate(true);
    setError("");
    setFeedback("");
    try {
      if (editingTemplateId) {
        await onUpdateTemplate(editingTemplateId, templateForm);
        setFeedback("Template atualizado.");
      } else {
        await onCreateTemplate(templateForm);
        setFeedback("Template criado.");
      }
      setTemplateForm(emptyTemplate);
      setEditingTemplateId(null);
    } catch (templateError) {
      setError(templateError instanceof Error ? templateError.message : "Falha ao salvar template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-6">
        <div className="surface-panel p-6">
          <p className="eyebrow">Mensagens</p>
          <h1 className="mt-2 font-display text-3xl text-white">Templates, preview e historico por lead</h1>
          <p className="mt-2 text-sm text-slate-300">Monte mensagens reutilizaveis, gere previews com contexto do lead e acompanhe o historico de contato.</p>
        </div>

        <form onSubmit={generatePreview} className="surface-dark p-6">
          <div className="grid gap-3">
            <select className="field-input-dark" value={selectedLeadId} onChange={(e) => setSelectedLeadId(Number(e.target.value))}>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.company_name}
                </option>
              ))}
            </select>
            <select className="field-input-dark" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(Number(e.target.value))}>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <textarea className="field-input-dark min-h-28" placeholder="Contexto extra para a IA ou para o preview" value={customContext} onChange={(e) => setCustomContext(e.target.value)} />
            <button disabled={!selectedLeadId || loadingPreview} className="btn-primary">
              {loadingPreview ? "Gerando preview..." : "Gerar preview"}
            </button>
          </div>
        </form>

        <div className="surface-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Historico</p>
              <h2 className="mt-2 font-display text-2xl text-white">Mensagens do lead</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {loadingHistory ? (
              <p className="text-sm text-slate-400">Carregando historico...</p>
            ) : history.length ? (
              history.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{item.channel} · {item.status}</p>
                    <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{item.content}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/10 p-5 text-sm text-slate-400">Sem historico de mensagens para este lead.</div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="surface-panel p-6">
          <p className="eyebrow">Preview</p>
          <h2 className="mt-2 font-display text-2xl text-white">Mensagem pronta para uso</h2>
          {feedback ? <p className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{feedback}</p> : null}
          {error ? <p className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
          <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/40 p-5 text-sm leading-7 text-slate-200">
            {preview || "Selecione lead e template para gerar uma mensagem contextualizada."}
          </div>
        </div>

        <div className="surface-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Templates</p>
              <h2 className="mt-2 font-display text-2xl text-white">Biblioteca comercial</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{template.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{template.channel} · {template.goal}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => startEditing(template)}>
                      Editar
                    </button>
                    <button className="btn-secondary" onClick={() => void onDeleteTemplate(template.id)}>
                      Excluir
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-300">{template.content}</p>
              </div>
            ))}
          </div>

          <form onSubmit={submitTemplate} className="mt-6 grid gap-3 rounded-[24px] border border-white/10 bg-slate-950/30 p-5">
            <input className="field-input" placeholder="Nome do template" value={templateForm.name} onChange={(e) => setTemplateForm((current) => ({ ...current, name: e.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <select className="field-input" value={templateForm.channel} onChange={(e) => setTemplateForm((current) => ({ ...current, channel: e.target.value as MessageTemplateInput["channel"] }))}>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="call">Ligacao</option>
                <option value="note">Interno</option>
              </select>
              <input className="field-input" placeholder="Objetivo" value={templateForm.goal} onChange={(e) => setTemplateForm((current) => ({ ...current, goal: e.target.value }))} />
            </div>
            <textarea className="field-input min-h-28" placeholder="Conteudo do template" value={templateForm.content} onChange={(e) => setTemplateForm((current) => ({ ...current, content: e.target.value }))} />
            <button disabled={savingTemplate} className="btn-primary w-fit">
              {savingTemplate ? "Salvando..." : editingTemplateId ? "Atualizar template" : "Criar template"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
