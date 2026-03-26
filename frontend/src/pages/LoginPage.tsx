import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Autenticacao JWT ativa com usuario persistido no banco.");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus(mode === "login" ? "Validando credenciais..." : "Criando usuario e abrindo workspace...");

    try {
      if (mode === "register") {
        await authApi.register({ name, email, password });
        setStatus("Conta criada e autenticada com sucesso.");
      } else {
        await authApi.login(email, password);
        setStatus("Login concluido com sucesso.");
      }
      navigate("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Falha na autenticacao.");
      setStatus("Nao foi possivel concluir a autenticacao.");
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
            Centralize prospecção, diagnóstico, scoring, CRM e mensagens prontas em uma experiência premium voltada para produtividade comercial e operação real.
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
          <p className="mt-3 font-display text-4xl text-ink">{mode === "login" ? "Entre no LeadFlow AI" : "Crie sua conta"}</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">Abra seu workspace de CRM e automação comercial com autenticação real e sessão persistida.</p>
          <div className="mt-5 rounded-2xl border border-brand/10 bg-brand/5 px-4 py-3 text-sm leading-6 text-slate-600">{status}</div>
          <div className="mt-8 space-y-4">
            {mode === "register" ? <input className="field-input" aria-label="Nome" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} /> : null}
            <input className="field-input" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="field-input" aria-label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          <button disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
          <button
            type="button"
            className="btn-secondary mt-3 w-full"
            onClick={() => {
              setMode((current) => (current === "login" ? "register" : "login"));
              setError("");
              setStatus("Autenticacao JWT ativa com usuario persistido no banco.");
            }}
          >
            {mode === "login" ? "Criar nova conta" : "Ja tenho conta"}
          </button>
          <p className="mt-4 text-center text-xs uppercase tracking-[0.18em] text-slate-400">Producao real com JWT e PostgreSQL</p>
        </form>
      </div>
    </div>
  );
}
