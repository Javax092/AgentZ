import type { AppSession } from "../types";

const SESSION_KEY = "leadflow-session";
const SESSION_EVENT = "leadflow-session-changed";

function emitSessionChange() {
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function getSession(): AppSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AppSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: AppSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem("leadflow-token", session.accessToken);
  emitSessionChange();
}

export function updateSession(patch: Partial<AppSession>) {
  const session = getSession();
  if (!session) return null;
  const nextSession = { ...session, ...patch };
  saveSession(nextSession);
  return nextSession;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("leadflow-token");
  emitSessionChange();
}

export function subscribeSessionChange(callback: () => void) {
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
