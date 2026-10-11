import { describe, it, expect } from "vitest";
import {
  defaults,
  recordDecision,
  addTransfer,
  undoDecision,
  replaceGoal,
  totals,
  validate,
  parseAmount,
} from "../src/domain/model";
import { migrate, parseBackup } from "../src/storage/db";
const withGoal = () => {
  const d = defaults();
  d.goals.push({
    id: "goal",
    name: "Watch",
    target: 100000,
    currency: "INR",
    archived: false,
  });
  d.pauses[0].contribution = 15000;
  return d;
};
describe("honest money and idempotent choices", () => {
  it("separates estimated expenses, contributions and partial transfers", () => {
    const d = withGoal();
    recordDecision(d, "one", d.pauses[0], "dismiss", "manual");
    recordDecision(d, "two", d.pauses[0], "alternative", "integration");
    addTransfer(d, "goal", 20000);
    expect(totals(d, "goal")).toEqual({
      estimate: 80000,
      contributions: 30000,
      moved: 20000,
      planned: 10000,
    });
  });
  it("records a session once even on repeated taps", () => {
    const d = withGoal();
    recordDecision(d, "one", d.pauses[0], "dismiss", "manual");
    recordDecision(d, "one", d.pauses[0], "continue", "manual");
    expect(d.decisions).toHaveLength(1);
    expect(totals(d).contributions).toBe(15000);
  });
  it("does not claim money for attention or continuing", () => {
    const d = withGoal();
    recordDecision(d, "one", d.pauses[2], "alternative", "manual");
    recordDecision(d, "two", d.pauses[0], "continue", "manual");
    expect(totals(d).contributions).toBe(0);
    expect(totals(d).estimate).toBe(0);
  });
  it("snapshots amounts, allows zero, and does not rewrite past choices", () => {
    const d = withGoal();
    recordDecision(d, "one", d.pauses[0], "dismiss", "manual");
    d.pauses[0].estimate = 0;
    d.pauses[0].contribution = 0;
    recordDecision(d, "two", d.pauses[0], "dismiss", "manual");
    expect(totals(d).contributions).toBe(15000);
    expect(totals(d).estimate).toBe(40000);
  });
  it("protects transferred money from undo and rejects overdrawing", () => {
    const d = withGoal();
    recordDecision(d, "one", d.pauses[0], "dismiss", "manual");
    addTransfer(d, "goal", 10000);
    expect(() => addTransfer(d, "goal", 6000)).toThrow();
    expect(() => undoDecision(structuredClone(d), "one")).toThrow(/exceeds/);
    expect(totals(d).planned).toBe(5000);
  });
  it("keeps old currency and goal history when starting a new goal", () => {
    const d = withGoal();
    recordDecision(d, "one", d.pauses[0], "dismiss", "manual");
    replaceGoal(d, "Trip", 200000, "USD");
    expect(d.goals[0].archived).toBe(true);
    expect(d.pauses[0].contribution).toBe(0);
    expect(d.decisions[0].currency).toBe("INR");
    expect(totals(d, "goal").planned).toBe(15000);
  });
  it("rejects invalid precision and negative amounts", () => {
    expect(parseAmount("0")).toBe(0);
    expect(parseAmount("12.34")).toBe(1234);
    expect(() => parseAmount("-4")).toThrow();
    expect(() => parseAmount("1.1", "JPY")).toThrow();
  });
  it("validates duplicate records and foreign references", () => {
    const d = withGoal();
    recordDecision(d, "one", d.pauses[0], "dismiss", "manual");
    d.decisions.push({ ...d.decisions[0] });
    expect(() => validate(d)).toThrow(/duplicate/);
    d.decisions.pop();
    d.decisions[0].goalId = "missing";
    expect(() => validate(d)).toThrow(/goal/);
  });
});
describe("POC migration and backup validation", () => {
  const old = {
    goal: { name: "Apple Watch", target: 25000 },
    cats: {
      food: { label: "Delivery", est: 400, pot: 1, sec: 10, alts: ["Cook"] },
    },
    log: [
      { t: 1760000000000, cat: "food", out: "skip", amt: 400 },
      { t: 1760000001000, out: "moved", amt: 100 },
    ],
  };
  it("preserves historical combined amounts and transfers without fabricating events", () => {
    const d = migrate(JSON.stringify(old));
    expect(d.settings.migrationNotice).toBe(true);
    expect(d.decisions[0].legacy).toBe(true);
    expect(totals(d)).toEqual({
      estimate: 40000,
      contributions: 40000,
      moved: 10000,
      planned: 30000,
    });
    expect(d.pauses[0].alternatives).toEqual(["Cook"]);
  });
  it("generates deterministic IDs and roundtrips versioned backups", () => {
    const a = migrate(JSON.stringify(old)),
      b = migrate(JSON.stringify(old));
    expect(a).toEqual(b);
    expect(parseBackup(JSON.stringify(a))).toEqual(a);
  });
  it("rejects malformed, unknown-version and inconsistent data", () => {
    expect(() => parseBackup("{}")).toThrow();
    expect(() => parseBackup("{")).toThrow();
    expect(() => parseBackup(JSON.stringify({ version: 99 }))).toThrow();
    expect(() =>
      migrate(
        JSON.stringify({ ...old, log: [{ t: 1, out: "moved", amt: 900 }] }),
      ),
    ).toThrow(/exceeds/);
    expect(() =>
      migrate(JSON.stringify({ ...old, log: [{ t: 1, out: "made-up" }] })),
    ).toThrow();
  });
});

describe("configuration changes while a pause is open", () => {
  it("uses current amounts after another tab changes the goal currency", () => {
    const d = withGoal(),
      stale = structuredClone(d.pauses[0]);
    replaceGoal(d, "Trip", 10000, "USD");
    recordDecision(d, "late", stale, "dismiss", "manual");
    expect(d.decisions[0].estimate).toBe(0);
    expect(d.decisions[0].contribution).toBe(0);
    expect(d.decisions[0].currency).toBe("USD");
  });
  it("does not record a pause archived by another tab", () => {
    const d = withGoal(),
      stale = structuredClone(d.pauses[0]);
    d.pauses[0].archived = true;
    expect(() => recordDecision(d, "late", stale, "dismiss", "manual")).toThrow(
      /active/,
    );
  });
  it("preserves POC default contribution behavior when categories were not customized", () => {
    const d = migrate(JSON.stringify({ log: [] }));
    expect(d.pauses[0].contribution).toBe(40000);
    expect(d.pauses[2].contribution).toBe(0);
  });
  it("rejects an unknown version even when it resembles a legacy backup", () => {
    expect(() =>
      parseBackup(JSON.stringify({ version: 99, log: [] })),
    ).toThrow();
  });
});
