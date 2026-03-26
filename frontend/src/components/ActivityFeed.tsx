import { FormEvent } from "react";
import type { Activity } from "../types";
import { formatDate } from "../utils/format";

interface Props {
  activities: Activity[];
  activityType: string;
  activityDescription: string;
  onTypeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

const activityLabel: Record<string, string> = {
  note: "Nota",
  call: "Ligacao",
  email: "Email",
  meeting: "Reuniao"
};

export function ActivityFeed({
  activities,
  activityType,
  activityDescription,
  onTypeChange,
  onDescriptionChange,
  onSubmit
}: Props) {
  return (
    <section className="surface-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Historico</p>
          <h2 className="mt-2 font-display text-2xl text-white">Timeline de conversa</h2>
        </div>
        <span className="text-xs text-slate-400">{activities.length} eventos</span>
      </div>

      <div className="mt-5 space-y-4">
        {activities.length ? (
          activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-3">
              <div className="mt-2 flex w-12 flex-col items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                {index !== activities.length - 1 ? <span className="mt-2 h-full w-px bg-white/10" /> : null}
              </div>
              <div className="flex-1 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{activityLabel[activity.type] ?? activity.type}</span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{formatDate(activity.created_at)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{activity.description}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
            Nenhuma interacao registrada ainda.
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-5 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
        <select className="field-input" value={activityType} onChange={(event) => onTypeChange(event.target.value)}>
          <option value="note">Nota</option>
          <option value="call">Ligacao</option>
          <option value="email">Email</option>
          <option value="meeting">Reuniao</option>
        </select>
        <input
          className="field-input"
          placeholder="Registrar novo contato, objecao ou proximo passo"
          value={activityDescription}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
        <button className="btn-primary">Registrar</button>
      </form>
    </section>
  );
}
