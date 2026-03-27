import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        if (!fullName.trim()) {
          throw new Error("Informe seu nome completo.");
        }
        if (!email.trim()) {
          throw new Error("Informe seu email.");
        }
        if (!password.trim()) {
          throw new Error("Informe sua senha.");
        }
        if (password !== confirmPassword) {
          throw new Error("A confirmacao de senha nao confere.");
        }

        await authApi.register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          confirm_password: confirmPassword
        });
        setStatus("Conta criada e autenticada com sucesso.");
      } else {
        await authApi.login(email.trim(), password);
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
        <section className="hidden rounded-[36px] border border-white/15 bg-white/10 p-8 text-white shadow-panel backdrop-blur-xl lg:block">
          <p className="eyebrow text-teal-200">LeadFlow AI</p>
          <h1 className="mt-4 max-w-xl font-display text-5xl leading-[1.05]">O cockpit comercial para operações de geração de demanda com IA.</h1>
          <p className="text-secondary mt-5 max-w-2xl text-base leading-8">
            Centralize prospecção, diagnóstico, scoring, CRM e mensagens prontas em uma experiência premium voltada para produtividade comercial e operação real.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Pipeline orientado por dados", "Distribua oportunidades e priorize contas com maior potencial."],
              ["Abordagem com IA", "Gere mensagens e análises alinhadas ao contexto do lead."],
              ["Visão executiva", "Monitore volume, qualificação, orçamento e conversão em tempo real."]
            ].map(([title, text]) => (
              <div key={title} className="card-subtle p-4">
                <p className="font-semibold text-white">{title}</p>
                <p className="text-secondary mt-2 text-sm leading-6">{text}</p>
              </div>
            ))}
          </div>
        </section>
        <form onSubmit={handleSubmit} className="w-full max-w-xl justify-self-center rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-panel backdrop-blur-xl md:p-8">
          <p className="eyebrow">Acesso seguro</p>
          <p className="mt-3 font-display text-4xl text-ink">{mode === "login" ? "Entre no LeadFlow AI" : "Crie sua conta"}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Abra seu workspace de CRM e automação comercial com autenticação real e sessão persistida.</p>
          <div className="status-info mt-5">{status}</div>
          <div className="mt-8 space-y-4">
            {mode === "register" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Nome completo</span>
                <input
                  className="field-input"
                  aria-label="Nome completo"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <input className="field-input" aria-label="Email" type="email" placeholder="voce@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Senha</span>
              <input className="field-input" aria-label="Senha" type="password" placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {mode === "register" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Confirmar senha</span>
                <input
                  className="field-input"
                  aria-label="Confirmar senha"
                  type="password"
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            ) : null}
          </div>
          {error ? <p className="status-error mt-4">{error}</p> : null}
          <button disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
          <button
            type="button"
            className="btn-secondary mt-3 w-full"
            onClick={() => {
              setMode((current) => (current === "login" ? "register" : "login"));
              setError("");
              setConfirmPassword("");
              setStatus("Autenticacao JWT ativa com usuario persistido no banco.");
            }}
          >
            {mode === "login" ? "Criar nova conta" : "Ja tenho conta"}
          </button>
          <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Producao real com JWT e PostgreSQL</p>
        </form>
      </div>
    </div>
  );
}
