import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaults } from "../src/domain/model";
import { pauseSession } from "../src/domain/session";

const pause = defaults().pauses[2];
let records: Map<string, string>;
beforeEach(() => {
  records = new Map();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
  });
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-11T10:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("Shortcut session identity", () => {
  it("resumes a legacy launch through reload within the five-minute window", () => {
    const first = pauseSession(pause, new URLSearchParams(), false);
    vi.advanceTimersByTime(20000);
    expect(pauseSession(pause, new URLSearchParams(), false)).toEqual(first);
  });
  it("starts a fresh legacy session after the launch cooldown", () => {
    const first = pauseSession(pause, new URLSearchParams(), false);
    vi.advanceTimersByTime(300000);
    expect(pauseSession(pause, new URLSearchParams(), false).id).not.toBe(
      first.id,
    );
  });
  it("uses a fresh explicit launch token even within the cooldown", () => {
    const first = pauseSession(pause, new URLSearchParams("launch=one"), false);
    const next = pauseSession(pause, new URLSearchParams("launch=two"), false);
    expect(next.id).not.toBe(first.id);
  });
  it("keeps the same explicit launch id when revisiting a completed URL later", () => {
    const q = new URLSearchParams("launch=one"),
      first = pauseSession(pause, q, false);
    vi.advanceTimersByTime(600000);
    expect(pauseSession(pause, q, false)).toEqual(first);
  });
  it("never replaces a real session when previewing", () => {
    const first = pauseSession(pause, new URLSearchParams(), false);
    pauseSession(pause, new URLSearchParams("preview=1"), true);
    expect(pauseSession(pause, new URLSearchParams(), false)).toEqual(first);
  });
  it("recovers from malformed session data", () => {
    records.set("ebb.session.entertainment", "{broken");
    expect(pauseSession(pause, new URLSearchParams(), false).start).toBe(
      Date.now(),
    );
  });
});
