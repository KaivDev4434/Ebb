import { afterEach, describe, it, expect } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { load, mutate, restore, recover, dbPromise } from "../src/storage/db";
import { defaults, recordDecision, addTransfer } from "../src/domain/model";
afterEach(() => {
  globalThis.indexedDB = new IDBFactory();
  localStorage.clear();
});
describe("atomic storage", () => {
  it("migrates only once and leaves the original blob untouched", async () => {
    const raw = JSON.stringify({
      goal: { name: "Watch" },
      log: [{ t: 1, cat: "food", out: "skip", amt: 400 }],
    });
    localStorage.setItem("pause.v1", raw);
    const a = await load(),
      b = await load();
    expect(a).toEqual(b);
    expect(b.decisions).toHaveLength(1);
    expect(localStorage.getItem("pause.v1")).toBe(raw);
  });
  it("does not lose updates from two tabs or duplicate a shared session", async () => {
    await load();
    await Promise.all([
      mutate((d) => {
        d.settings.theme = "dark";
      }),
      mutate((d) => {
        d.settings.motion = "still";
      }),
    ]);
    let d = await load();
    expect(d.settings.theme).toBe("dark");
    expect(d.settings.motion).toBe("still");
    await Promise.all([
      mutate((d) =>
        recordDecision(d, "same", d.pauses[0], "dismiss", "manual"),
      ),
      mutate((d) =>
        recordDecision(d, "same", d.pauses[0], "dismiss", "manual"),
      ),
    ]);
    d = await load();
    expect(d.decisions).toHaveLength(1);
  });
  it("rolls back invalid transactions and prevents concurrent overdraw", async () => {
    const d = defaults();
    d.goals.push({
      id: "g",
      name: "Watch",
      target: 1,
      currency: "INR",
      archived: false,
    });
    d.pauses[0].contribution = 10000;
    recordDecision(d, "one", d.pauses[0], "dismiss", "manual");
    await restore(d);
    const outcomes = await Promise.allSettled([
      mutate((d) => addTransfer(d, "g", 8000, "a")),
      mutate((d) => addTransfer(d, "g", 8000, "b")),
    ]);
    expect(outcomes.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect((await load()).transfers).toHaveLength(1);
  });
  it("retains a recoverable snapshot before replacing data", async () => {
    await load();
    await mutate((d) => {
      d.settings.palette = "playful";
    });
    await restore(defaults());
    expect((await load()).settings.palette).toBe("coastal");
    expect((await recover()).settings.palette).toBe("playful");
  });
  it("does not silently replace invalid saved data", async () => {
    const db = await dbPromise();
    await db.put("data", { version: 999 }, "current");
    await expect(load()).rejects.toThrow();
    expect(await db.get("data", "current")).toEqual({ version: 999 });
  });
});
