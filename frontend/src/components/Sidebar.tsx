import { NavLink } from "react-router-dom";
import type { AppSession } from "../types";

const items = [
  {
    to: "/dashboard",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M3 10.5h4V17H3v-6.5Zm5 0h4V17H8v-6.5Zm5-7h4V17h-4V3.5Z" className="fill-current" />
      </svg>
    )
  },
  {
    to: "/leads",
    label: "Leads",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 7.5a6 6 0 0 1 12 0H4Z" className="fill-current" />
      </svg>
    )
  },
  {
    to: "/crm",
    label: "Pipeline",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M3 5h5v4H3V5Zm9 0h5v4h-5V5ZM3 11h5v4H3v-4Zm9 0h5v4h-5v-4Z" className="fill-current" />
      </svg>
    )
  },
  {
    to: "/approach",
    label: "Mensagens",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M3 4h14v9H8.5L5 16.5V13H3V4Z" className="fill-current" />
      </svg>
    )
  },
  {
    to: "/settings",
    label: "Config",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M11.5 2 12 4.1a6.4 6.4 0 0 1 1.44.6l1.9-1 1.66 2.88-1.66 1.1c.1.46.16.94.16 1.42 0 .48-.06.96-.16 1.42l1.66 1.1-1.66 2.88-1.9-1a6.4 6.4 0 0 1-1.44.6L11.5 18h-3l-.5-2.1a6.4 6.4 0 0 1-1.44-.6l-1.9 1L3 13.42l1.66-1.1A6.24 6.24 0 0 1 4.5 10c0-.48.06-.96.16-1.42L3 7.48 4.66 4.6l1.9 1c.46-.25.94-.45 1.44-.6L8.5 2h3ZM10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" className="fill-current" />
      </svg>
    )
  }
];

interface Props {
  session: AppSession;
  onLogout: () => void;
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ session, onLogout, mobileOpen, onClose, collapsed, onToggleCollapse }: Props) {
  const desktopWidth = collapsed ? "lg:w-16" : "lg:w-64";

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm transition lg:hidden ${mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`surface-dark fixed inset-y-3 left-3 z-40 flex w-64 flex-shrink-0 flex-col overflow-hidden p-3 transition-all duration-200 lg:sticky lg:top-6 lg:z-auto lg:min-h-[calc(100vh-3rem)] ${desktopWidth} ${
          mobileOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
        }`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-3">
            <div className={`flex items-center gap-3 ${collapsed ? "lg:justify-center" : "justify-between"}`}>
              <div className={`flex items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-coral via-brand to-accent font-display text-sm font-bold tracking-[0.18em] text-white shadow-soft">
                  LF
                </div>
                <div className={collapsed ? "lg:hidden" : ""}>
                  <p className="font-display text-lg text-white">LeadFlow AI</p>
                  <p className="text-xs text-slate-400">Pipeline com IA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                className={`hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:inline-flex ${collapsed ? "lg:hidden xl:inline-flex" : ""}`}
                aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
                aria-pressed={collapsed}
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d={collapsed ? "m7 4 6 6-6 6" : "m13 4-6 6 6 6"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className={`mt-4 items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-300 ${collapsed ? "hidden" : "flex"}`}>
              <span>workspace</span>
              <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                online
              </span>
            </div>
          </div>

          <nav className="mt-5 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${collapsed ? "lg:justify-center" : ""} ${
                    isActive
                      ? "bg-white text-slate-950 shadow-soft"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-slate-900/40">{item.icon}</span>
                <span className={`font-medium ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 space-y-3 pt-4">
            <div className={`rounded-[24px] border border-white/10 bg-white/5 p-4 ${collapsed ? "hidden" : "block"}`}>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Workspace</p>
              <p className="mt-2 text-sm font-semibold text-white">{session.user.name}</p>
              <p className="mt-1 text-sm text-slate-400">{session.user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              title={collapsed ? "Encerrar sessao" : undefined}
            >
              <span className={collapsed ? "lg:hidden" : ""}>Encerrar sessao</span>
              <span className={`${collapsed ? "hidden lg:inline" : "hidden"}`}>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
