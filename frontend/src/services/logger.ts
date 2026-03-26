type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  details?: Record<string, unknown>;
}

declare global {
  interface Window {
    __LEADFLOW_LOGS__?: LogEntry[];
  }
}

const MAX_LOGS = 200;

export function log(level: LogLevel, scope: string, message: string, details?: Record<string, unknown>) {
  if (!import.meta.env.DEV) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    message,
    details
  };

  if (typeof window !== "undefined") {
    const current = window.__LEADFLOW_LOGS__ ?? [];
    window.__LEADFLOW_LOGS__ = [...current.slice(-(MAX_LOGS - 1)), entry];
  }

  const printer = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  printer("[LeadFlow]", entry);
}
