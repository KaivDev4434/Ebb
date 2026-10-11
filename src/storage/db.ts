import { openDB } from "idb";
import { z } from "zod";
import { defaults, validate, type Data } from "../domain/model";
export const dbPromise = () =>
  openDB("ebb.v2", 1, {
    upgrade(db) {
      db.createObjectStore("data");
      db.createObjectStore("recovery");
    },
  });
const nonnegative = z.number().finite().nonnegative();
const legacySchema = z.object({
  goal: z
    .object({
      name: z.string().max(80).optional(),
      target: nonnegative.optional(),
    })
    .optional(),
  cats: z
    .record(
      z.string(),
      z
        .object({
          label: z.string().max(60).optional(),
          est: nonnegative.optional(),
          sec: nonnegative.optional(),
          alts: z.array(z.string().max(200)).max(30).optional(),
          pot: z.union([z.number(), z.boolean()]).optional(),
        })
        .passthrough(),
    )
    .optional(),
  log: z
    .array(
      z.object({
        t: nonnegative,
        cat: z.enum(["food", "groceries", "entertainment"]).optional(),
        out: z.enum(["skip", "alt", "open", "moved"]),
        amt: nonnegative.optional(),
        app: z.string().optional(),
      }),
    )
    .optional(),
});
export function migrate(raw: string): Data {
  const parsed = JSON.parse(raw);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    "version" in parsed ||
    !("cats" in parsed || "log" in parsed || "goal" in parsed)
  )
    throw Error("This is not an Ebb backup.");
  const old = legacySchema.parse(parsed),
    d = defaults();
  d.migrated = true;
  d.settings.onboarded = true;
  d.settings.migrationNotice = true;
  d.goals = [
    {
      id: "legacy-goal",
      name: old.goal?.name?.trim() || "My goal",
      target: Math.round((old.goal?.target || 0) * 100),
      currency: "INR",
      archived: false,
    },
  ];
  for (const p of d.pauses) {
    p.contribution = p.type === "spending" ? p.estimate : 0;
    const c = old.cats?.[p.id];
    if (!c) continue;
    p.name = c.label?.trim() || p.name;
    p.estimate = Math.round((c.est ?? p.estimate / 100) * 100);
    p.contribution = c.pot === 0 || c.pot === false ? 0 : p.estimate;
    p.seconds = Math.min(30, Math.max(4, Math.round(c.sec ?? 10)));
    p.alternatives = (c.alts ?? p.alternatives)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  (old.log ?? []).forEach((e, i) => {
    const id = `legacy-${i}`,
      amount = Math.round((e.amt ?? 0) * 100),
      at = Math.round(e.t);
    if (e.out === "moved") {
      if (amount > 0)
        d.transfers.push({
          id,
          goalId: "legacy-goal",
          amount,
          currency: "INR",
          at,
          void: false,
        });
      return;
    }
    const p = d.pauses.find((p) => p.id === e.cat);
    if (!p) throw Error("A legacy choice is missing its category.");
    const n = e.out === "open" ? 0 : amount;
    d.decisions.push({
      id,
      pauseId: p.id,
      pauseName: p.name,
      at,
      outcome:
        e.out === "open"
          ? "continue"
          : e.out === "alt"
            ? "alternative"
            : "dismiss",
      estimate: n,
      contribution: n,
      goalId: "legacy-goal",
      currency: "INR",
      source: "legacy",
      void: false,
      legacy: true,
    });
  });
  return validate(d);
}
export async function load(): Promise<Data> {
  const db = await dbPromise();
  try {
    const stored = await db.get("data", "current");
    if (stored) return validate(stored);
    const raw = localStorage.getItem("pause.v1"),
      initial = raw ? migrate(raw) : defaults();
    const tx = db.transaction(["data", "recovery"], "readwrite"),
      existing = await tx.objectStore("data").get("current");
    if (!existing) {
      await tx.objectStore("data").put(initial, "current");
      if (raw) await tx.objectStore("recovery").put(raw, "legacy");
    }
    await tx.done;
    return existing ? validate(existing) : initial;
  } finally {
    db.close();
  }
}
export async function mutate(fn: (d: Data) => Data | void): Promise<Data> {
  const db = await dbPromise(),
    tx = db.transaction("data", "readwrite");
  try {
    const old = validate(await tx.store.get("current")),
      next = validate(fn(old) ?? old);
    next.revision++;
    await tx.store.put(next, "current");
    await tx.done;
    return next;
  } catch (e) {
    try {
      tx.abort();
    } catch {}
    await tx.done.catch(() => {});
    throw e;
  } finally {
    db.close();
  }
}
export function parseBackup(raw: string): Data {
  if (raw.length > 25_000_000) throw Error("This file is too large.");
  const parsed = JSON.parse(raw);
  return parsed?.version === 2 ? validate(parsed) : migrate(raw);
}
export async function restore(next: Data): Promise<Data> {
  next = validate(next);
  const db = await dbPromise(),
    tx = db.transaction(["data", "recovery"], "readwrite");
  try {
    const old = await tx.objectStore("data").get("current");
    if (old) await tx.objectStore("recovery").put(old, "before-import");
    await tx.objectStore("data").put(next, "current");
    await tx.done;
    return next;
  } catch (e) {
    try {
      tx.abort();
    } catch {}
    await tx.done.catch(() => {});
    throw e;
  } finally {
    db.close();
  }
}
export async function recover(): Promise<Data> {
  const db = await dbPromise();
  let previous: unknown;
  try {
    previous = await db.get("recovery", "before-import");
  } finally {
    db.close();
  }
  if (!previous) throw Error("There is no previous import to restore.");
  return restore(validate(previous));
}
export function download(data: unknown, name = "ebb-backup.ebb.json") {
  const url = URL.createObjectURL(
    new Blob(
      [typeof data === "string" ? data : JSON.stringify(data, null, 2)],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
