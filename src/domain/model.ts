import { z } from "zod";
export const currencies = ["INR", "USD", "EUR", "GBP", "JPY"] as const;
const id = z.string().min(1).max(200),
  text = z.string().max(300);
const money = z.number().int().min(0).max(9_000_000_000_000),
  time = z.number().int().min(0).max(8_640_000_000_000_000);
export const pauseSchema = z.object({
  id,
  name: z.string().trim().min(1).max(60),
  type: z.enum(["spending", "attention"]),
  color: z.enum(["coral", "sun", "sea", "violet"]),
  seconds: z.number().int().min(4).max(30),
  estimate: money,
  contribution: money,
  alternatives: z.array(z.string().trim().min(1).max(200)).max(30),
  enabled: z.boolean(),
  archived: z.boolean(),
  order: z.number().int().nonnegative(),
  returnShortcut: z.string().max(100).default(""),
});
const goalSchema = z.object({
  id,
  name: z.string().trim().min(1).max(80),
  target: money,
  currency: z.enum(currencies),
  archived: z.boolean(),
});
const decisionSchema = z.object({
  id,
  pauseId: id,
  pauseName: text,
  at: time,
  outcome: z.enum(["dismiss", "continue", "alternative"]),
  alternative: text.optional(),
  estimate: money,
  contribution: money,
  goalId: id.nullable(),
  currency: z.enum(currencies),
  source: z.enum(["manual", "integration", "manual-record", "legacy"]),
  void: z.boolean(),
  legacy: z.boolean().default(false),
});
const transferSchema = z.object({
  id,
  goalId: id,
  amount: money.refine((n) => n > 0),
  currency: z.enum(currencies),
  at: time,
  void: z.boolean(),
});
export const dataSchema = z.object({
  version: z.literal(2),
  revision: z.number().int().nonnegative(),
  settings: z.object({
    theme: z.enum(["system", "light", "dark"]),
    palette: z.enum(["coastal", "orchard", "playful"]),
    motion: z.enum(["full", "gentle", "still"]),
    onboarded: z.boolean(),
    migrationNotice: z.boolean(),
  }),
  pauses: z.array(pauseSchema).max(100),
  goals: z.array(goalSchema).max(100),
  decisions: z.array(decisionSchema).max(100000),
  transfers: z.array(transferSchema).max(100000),
  migrated: z.boolean(),
});
export type PauseConfig = z.infer<typeof pauseSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Decision = z.infer<typeof decisionSchema>;
export type Data = z.infer<typeof dataSchema>;
export const uid = () => crypto.randomUUID();
export const activeGoal = (d: Data) => d.goals.find((g) => !g.archived);
export function defaults(): Data {
  const common = {
    seconds: 10,
    enabled: true,
    archived: false,
    contribution: 0,
    returnShortcut: "",
  };
  return {
    version: 2,
    revision: 0,
    migrated: false,
    settings: {
      theme: "system",
      palette: "coastal",
      motion: "full",
      onboarded: false,
      migrationNotice: false,
    },
    goals: [],
    decisions: [],
    transfers: [],
    pauses: [
      {
        ...common,
        id: "food",
        name: "Food delivery",
        type: "spending",
        color: "coral",
        estimate: 40000,
        order: 0,
        alternatives: [
          "Make something simple at home.",
          "Enjoy a snack from the kitchen.",
          "Make a cup of tea and take a break.",
        ],
      },
      {
        ...common,
        id: "groceries",
        name: "Groceries",
        type: "spending",
        color: "sun",
        estimate: 30000,
        order: 1,
        alternatives: [
          "See what is already in the fridge.",
          "Add it to a list and decide later.",
        ],
      },
      {
        ...common,
        id: "entertainment",
        name: "Entertainment",
        type: "attention",
        color: "sea",
        estimate: 0,
        order: 2,
        alternatives: [
          "Read a few pages of your book.",
          "Step outside for some fresh air.",
          "Spend five minutes on your personal project.",
        ],
      },
    ],
  };
}
export function totals(d: Data, goalId?: string) {
  const choices = d.decisions.filter(
    (e) => !e.void && (goalId === undefined || e.goalId === goalId),
  );
  const contributions = choices.reduce((s, e) => s + e.contribution, 0),
    estimate = choices.reduce((s, e) => s + e.estimate, 0);
  const moved = d.transfers
    .filter((t) => !t.void && (goalId === undefined || t.goalId === goalId))
    .reduce((s, t) => s + t.amount, 0);
  if (![contributions, estimate, moved].every(Number.isSafeInteger))
    throw Error("The total amount exceeds the supported range.");
  return { contributions, estimate, moved, planned: contributions - moved };
}
export function validate(input: unknown): Data {
  const d = dataSchema.parse(input);
  for (const records of [d.pauses, d.goals, d.decisions, d.transfers])
    if (new Set(records.map((x) => x.id)).size !== records.length)
      throw Error("This backup contains duplicate records.");
  if (d.goals.filter((g) => !g.archived).length > 1)
    throw Error("Only one goal can be active.");
  for (const e of d.decisions) {
    if (!d.pauses.some((p) => p.id === e.pauseId))
      throw Error("A choice references a missing pause.");
    if (
      e.goalId &&
      !d.goals.some((g) => g.id === e.goalId && g.currency === e.currency)
    )
      throw Error("A choice has an invalid goal or currency.");
    if (e.contribution && !e.goalId)
      throw Error("A contribution needs a goal.");
    if (e.outcome === "continue" && (e.estimate || e.contribution))
      throw Error("Continuing cannot add money.");
  }
  for (const t of d.transfers)
    if (!d.goals.some((g) => g.id === t.goalId && g.currency === t.currency))
      throw Error("A transfer has an invalid goal or currency.");
  for (const g of d.goals)
    if (totals(d, g.id).planned < 0)
      throw Error(
        "Money moved exceeds contributions. Correct the transfer before removing a choice.",
      );
  return d;
}
export const currencyFactor = (c: string) => (c === "JPY" ? 1 : 100);
export function parseAmount(value: string, currency = "INR"): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim()))
    throw Error("Enter a non-negative amount with up to two decimal places.");
  const n = Number(value) * currencyFactor(currency);
  if (
    Math.abs(n - Math.round(n)) > 1e-5 ||
    !Number.isSafeInteger(Math.round(n)) ||
    n > 9e12
  )
    throw Error("Enter a valid amount for this currency.");
  return Math.round(n);
}
export const formatMoney = (amount: number, currency = "INR") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: amount % currencyFactor(currency) ? 2 : 0,
  }).format(amount / currencyFactor(currency));
export const inputMoney = (amount: number, currency = "INR") =>
  String(amount / currencyFactor(currency));
export function recordDecision(
  d: Data,
  id: string,
  p: PauseConfig,
  outcome: Decision["outcome"],
  source: Decision["source"],
  alternative?: string,
): Data {
  if (d.decisions.some((e) => e.id === id)) return d;
  const current = d.pauses.find((x) => x.id === p.id);
  if (!current || current.archived || !current.enabled)
    throw Error(
      "This pause is no longer active. Start another pause from Home.",
    );
  p = current;
  const goal = activeGoal(d),
    credited = p.type === "spending" && outcome !== "continue";
  d.decisions.push({
    id,
    pauseId: p.id,
    pauseName: p.name,
    at: Date.now(),
    outcome,
    source,
    alternative,
    estimate: credited ? p.estimate : 0,
    contribution: credited && goal ? p.contribution : 0,
    goalId: goal?.id ?? null,
    currency: goal?.currency ?? "INR",
    void: false,
    legacy: false,
  });
  return validate(d);
}
export function addTransfer(
  d: Data,
  goalId: string,
  amount: number,
  id: string = uid(),
): Data {
  if (d.transfers.some((t) => t.id === id)) return d;
  const g = d.goals.find((g) => g.id === goalId);
  if (!g || g.archived || amount <= 0 || amount > totals(d, goalId).planned)
    throw Error("Enter an amount within your available plan.");
  d.transfers.push({
    id,
    goalId,
    amount,
    currency: g.currency,
    at: Date.now(),
    void: false,
  });
  return validate(d);
}
export function undoDecision(d: Data, id: string): Data {
  const e = d.decisions.find((e) => e.id === id);
  if (e) e.void = true;
  return validate(d);
}
export function replaceGoal(
  d: Data,
  name: string,
  target: number,
  currency: Goal["currency"],
): Data {
  const previous = activeGoal(d);
  if (previous) previous.archived = true;
  d.goals.push({ id: uid(), name, target, currency, archived: false });
  if ((previous?.currency ?? "INR") !== currency)
    for (const p of d.pauses) {
      p.estimate = 0;
      p.contribution = 0;
    }
  return validate(d);
}
