import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import type { AppSession } from "../types";

interface Props {
  session: AppSession;
  onLogout: () => void;
}

export function DashboardLayout({ session, onLogout }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const close = () => setSidebarOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  return (
    <div className="min-h-screen bg-app-glow p-3 md:p-5 xl:p-6">
      <div className="mx-auto flex max-w-[1600px] items-start gap-5">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          session={session}
          onLogout={onLogout}
        />
        <main className="min-w-0 flex-1 space-y-5">
          <Topbar session={session} onMenuToggle={() => setSidebarOpen((value) => !value)} />
          <section className="surface-panel flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-emerald-200">
            <div>
              <p className="eyebrow">Ambiente conectado</p>
              <p className="mt-1 text-sm text-slate-300">Autenticacao JWT ativa com sessao persistida no navegador.</p>
            </div>
            <span className="metric-pill">jwt</span>
          </section>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
