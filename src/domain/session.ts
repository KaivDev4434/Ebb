import { uid, type PauseConfig } from "./model";

export function pauseSession(
  p: PauseConfig,
  q: URLSearchParams,
  preview: boolean,
) {
  const launch = q.get("launch")?.slice(0, 100),
    key = `ebb.session.${p.id}`;
  try {
    const old = JSON.parse(sessionStorage.getItem(key) || "null");
    if (
      !preview &&
      old &&
      typeof old.id === "string" &&
      Number.isFinite(old.start) &&
      old.start <= Date.now() &&
      ((launch && old.launch === launch) ||
        (!launch && Date.now() - old.start < 300000))
    )
      return old as { id: string; start: number; launch?: string };
  } catch {}
  const value = {
    id: launch ? `${p.id}:${launch}` : uid(),
    start: Date.now(),
    launch,
  };
  if (!preview)
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {}
  return value;
}
