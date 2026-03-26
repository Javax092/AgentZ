import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export function LoginPage() {
  const [email, setEmail] = useState("admin@leadflow.ai");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Autenticacao demo com fallback offline habilitado.");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("Validando backend de autenticacao e disponibilidade dos dados...");

    try {
      const session = await authApi.login(email, password);
      setStatus(
        session.mode === "offline-demo"
          ? `Login liberado em modo offline. Motivo: ${session.fallbackReason}`
          : session.dataSource === "mock"
            ? "Login remoto concluido. API indisponivel para dados, usando seed demo local."
            : "Login remoto concluido com sessao persistida e API online."
      );
      navigate("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Falha no login de demonstracao.");
      setStatus("Nao foi possivel concluir a autenticacao demo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#091525_0%,_#0f766e_38%,_#2563eb_100%)] p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden rounded-[36px] border border-white/10 bg-white/8 p-8 text-white shadow-panel backdrop-blur-xl lg:block">
          <p className="eyebrow text-teal-200">LeadFlow AI</p>
          <h1 className="mt-4 max-w-xl font-display text-5xl leading-[1.05]">O cockpit comercial para operações de geração de demanda com IA.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200">
            Centralize prospecção, diagnóstico, scoring, CRM e mensagens prontas em uma experiência premium voltada para produtividade comercial e percepção de valor.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Pipeline orientado por dados", "Distribua oportunidades e priorize contas com maior potencial."],
              ["Abordagem com IA", "Gere mensagens e análises alinhadas ao contexto do lead."],
              ["Visão executiva", "Monitore volume, qualificação, orçamento e conversão em tempo real."]
            ].map(([title, text]) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </section>
        <form onSubmit={handleSubmit} className="w-full max-w-xl justify-self-center rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-panel backdrop-blur-xl md:p-8">
          <p className="eyebrow">Acesso seguro</p>
          <p className="mt-3 font-display text-4xl text-ink">Entre no LeadFlow AI</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">Abra seu workspace de CRM e automação comercial com uma interface preparada para operação diária, análise e conversão.</p>
          <div className="mt-5 rounded-2xl border border-brand/10 bg-brand/5 px-4 py-3 text-sm leading-6 text-slate-600">{status}</div>
          <div className="mt-8 space-y-4">
            <input className="field-input" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="field-input" aria-label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <button disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="mt-4 text-center text-xs uppercase tracking-[0.18em] text-slate-400">Demo pronta para CRM, automação e geração de leads</p>
      </form>
      </div>
    </div>
  );
}
