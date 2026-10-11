import { useRef, useState, type FormEvent } from "react";
import { Modal } from "../components/UI";
import {
  activeGoal,
  addTransfer,
  currencies,
  inputMoney,
  parseAmount,
  pauseSchema,
  replaceGoal,
  totals,
  uid,
  formatMoney,
  type Data,
  type Goal,
  type PauseConfig,
} from "../domain/model";
import type { Change } from "./Pause";
type Shared = { data: Data; change: Change; onClose: () => void };
export function PauseEditor({
  data,
  change,
  onClose,
  pause,
}: { pause?: PauseConfig } & Shared) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [type, setType] = useState(pause?.type ?? "attention");
  const [pauseId] = useState(() => pause?.id ?? uid());
  const currency = activeGoal(data)?.currency ?? "INR";
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const p = pauseSchema.parse({
        id: pauseId,
        name: f.get("name"),
        type,
        color: f.get("color"),
        seconds: Number(f.get("seconds")),
        estimate:
          type === "spending"
            ? parseAmount(String(f.get("estimate")), currency)
            : 0,
        contribution:
          type === "spending"
            ? parseAmount(String(f.get("contribution")), currency)
            : 0,
        alternatives: String(f.get("alternatives"))
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
        enabled: pause?.enabled ?? true,
        archived: pause?.archived ?? false,
        order: pause?.order ?? data.pauses.length,
        returnShortcut: String(f.get("returnShortcut") ?? "").trim(),
      });
      await change((d) => {
        const i = d.pauses.findIndex((x) => x.id === p.id);
        if (i < 0) d.pauses.push(p);
        else d.pauses[i] = p;
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={pause ? "Make this pause yours" : "A new little pause"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <label>
          Name
          <input
            name="name"
            required
            maxLength={60}
            defaultValue={pause?.name}
            placeholder="e.g. Evening scrolling"
            autoFocus
          />
        </label>
        <div className="form-row">
          <label>
            For
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <option value="attention">My attention</option>
              <option value="spending">My spending</option>
            </select>
          </label>
          <label>
            Color
            <select name="color" defaultValue={pause?.color ?? "sea"}>
              <option value="sea">Sea</option>
              <option value="coral">Coral</option>
              <option value="sun">Sunshine</option>
              <option value="violet">Periwinkle</option>
            </select>
          </label>
        </div>
        <label>
          Pause length (seconds)
          <input
            type="number"
            name="seconds"
            min="4"
            max="30"
            step="1"
            required
            defaultValue={pause?.seconds ?? 10}
          />
        </label>
        {type === "spending" && (
          <>
            <div className="form-row">
              <label>
                Usual spend ({currency})
                <input
                  name="estimate"
                  inputMode="decimal"
                  required
                  defaultValue={inputMoney(pause?.estimate ?? 0, currency)}
                />
              </label>
              <label>
                Plan per skip ({currency})
                <input
                  name="contribution"
                  inputMode="decimal"
                  required
                  defaultValue={inputMoney(pause?.contribution ?? 0, currency)}
                />
              </label>
            </div>
            <p className="hint">
              The estimate is what you might spend. The plan is what you choose
              to set aside.{" "}
              {activeGoal(data)
                ? ""
                : "Add a goal to begin collecting contributions."}
            </p>
          </>
        )}
        <label>
          Your alternatives
          <textarea
            name="alternatives"
            rows={4}
            defaultValue={pause?.alternatives.join("\n")}
            placeholder={"Read a few pages of my book\nTake a short walk"}
          />
        </label>
        <p className="hint">
          One per line. Up to 30, each under 200 characters.
        </p>
        <details>
          <summary>Optional return shortcut</summary>
          <p className="hint">
            Your five-minute Safari cooldown works without this. Only add a
            named shortcut you have created and tested.
          </p>
          <label>
            Shortcut name
            <input
              name="returnShortcut"
              maxLength={100}
              defaultValue={pause?.returnShortcut}
              placeholder="Leave empty for manual switching"
            />
          </label>
        </details>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button className="button full" disabled={busy}>
          {busy ? "Saving…" : "Save pause"}
        </button>
      </form>
    </Modal>
  );
}
export function GoalEditor({
  data,
  change,
  onClose,
  newGoal = false,
}: Shared & { newGoal?: boolean }) {
  const lock = useRef(false);
  const current = newGoal ? undefined : activeGoal(data),
    [currency, setCurrency] = useState<Goal["currency"]>(
      current?.currency ?? "INR",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const name = String(f.get("name")).trim(),
        target = parseAmount(String(f.get("target") || "0"), currency);
      await change((d) => {
        if (current) {
          const g = d.goals.find((g) => g.id === current.id);
          if (!g) throw Error("This goal is no longer available.");
          g.name = name;
          g.target = target;
        } else return replaceGoal(d, name, target, currency);
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      title={current ? "Your goal" : "What would you like to make room for?"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <label>
          Goal name
          <input
            name="name"
            required
            maxLength={80}
            defaultValue={current?.name}
            placeholder="A trip, a watch, a little peace of mind…"
            autoFocus
          />
        </label>
        <div className="form-row">
          <label>
            Target (optional)
            <input
              name="target"
              inputMode="decimal"
              defaultValue={
                current ? inputMoney(current.target, current.currency) : ""
              }
              placeholder="0"
            />
          </label>
          <label>
            Currency
            <select
              disabled={!!current}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Goal["currency"])}
            >
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="hint">
          Ebb records the money you choose to move. It never moves money for
          you.
        </p>
        {newGoal && activeGoal(data) && (
          <div className="notice">
            <p>
              Your current goal and its money stay in your history.
              Contributions from future choices go to this new goal. Changing
              currency resets pause amounts to zero for you to configure.
            </p>
            <label className="check">
              <input type="checkbox" required />
              Archive my current goal and start fresh
            </label>
          </div>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <button className="button full" disabled={busy}>
          {busy ? "Saving…" : current ? "Save goal" : "Create goal"}
        </button>
      </form>
    </Modal>
  );
}
export function TransferEditor({ data, change, onClose }: Shared) {
  const g = activeGoal(data)!,
    balance = totals(data, g.id).planned,
    [value, setValue] = useState(inputMoney(balance, g.currency)),
    [amount, setAmount] = useState<number | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [id] = useState(uid);
  async function save() {
    if (amount === null) return;
    setBusy(true);
    try {
      await change((d) => addTransfer(d, g.id, amount, id));
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Record money moved" onClose={onClose}>
      {amount === null ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const n = parseAmount(value, g.currency);
              if (!n || n > balance)
                throw Error("Enter an amount within your available plan.");
              setAmount(n);
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <p>
            You have {formatMoney(balance, g.currency)} planned for {g.name}.
          </p>
          <label>
            Amount you moved ({g.currency})
            <input
              autoFocus
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </label>
          <p className="hint">A record only. No money is transferred by Ebb.</p>
          <button className="button full">Review</button>
        </form>
      ) : (
        <div>
          <p className="transfer-amount">{formatMoney(amount, g.currency)}</p>
          <p>
            Record that you moved this amount toward <strong>{g.name}</strong>?
          </p>
          <button className="button full" disabled={busy} onClick={save}>
            Yes, I moved this money
          </button>
          <button className="text-button" onClick={() => setAmount(null)}>
            Change amount
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </Modal>
  );
}
