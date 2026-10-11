import { useRef, useState } from "react";
import { Empty, Icon, Modal } from "../components/UI";
import {
  activeGoal,
  formatMoney,
  recordDecision,
  totals,
  uid,
  undoDecision,
  type Data,
} from "../domain/model";
import { pauseHref, type Change } from "./Pause";
const dateLabel = (n: number) =>
  new Date(n).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
const choiceLabel = (outcome: string) =>
  outcome === "continue"
    ? "Continued"
    : outcome === "alternative"
      ? "Chose an alternative"
      : "Not now";
export function Activity({
  data,
  change,
  full = false,
}: {
  data: Data;
  change: Change;
  full?: boolean;
}) {
  const [limit, setLimit] = useState(30),
    [error, setError] = useState("");
  const entries = [
    ...data.decisions
      .filter((e) => !e.void)
      .map((e) => ({
        id: e.id,
        at: e.at,
        title: e.pauseName,
        detail:
          choiceLabel(e.outcome) +
          (e.source === "manual-record" ? " · manually logged" : ""),
        money: e.contribution,
        currency: e.currency,
        type: "choice",
        alt: e.alternative,
      })),
    ...data.transfers
      .filter((t) => !t.void)
      .map((t) => ({
        id: t.id,
        at: t.at,
        title: "Money moved",
        detail: data.goals.find((g) => g.id === t.goalId)?.name ?? "Goal",
        money: t.amount,
        currency: t.currency,
        type: "transfer",
        alt: undefined,
      })),
  ].sort((a, b) => b.at - a.at);
  async function undo(id: string, type: string) {
    try {
      await change((d) => {
        if (type === "choice") return undoDecision(d, id);
        const t = d.transfers.find((t) => t.id === id);
        if (t) t.void = true;
      });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section>
      <div className="section-heading">
        <h2>{full ? "Your activity" : "Recent moments"}</h2>
        {!full && entries.length > 0 && (
          <a href="#/activity" className="text-link">
            View all <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {!entries.length ? (
        <Empty title="A fresh start">
          Your choices will find a home here. There is no score to keep up with.
        </Empty>
      ) : (
        <div className="activity-list">
          {entries.slice(0, full ? limit : 4).map((e) => (
            <div className="activity-row" key={`${e.type}-${e.id}`}>
              <span
                className={`activity-symbol ${e.type === "transfer" ? "sun" : "sea"}`}
              >
                <Icon
                  name={e.type === "transfer" ? "arrow" : "leaf"}
                  size={18}
                />
              </span>
              <div className="activity-copy">
                <strong>{e.title}</strong>
                <p>{e.detail}</p>
                {e.alt && <p>{e.alt}</p>}
                <small>{dateLabel(e.at)}</small>
              </div>
              <div className="activity-end">
                {e.money > 0 && <span>{formatMoney(e.money, e.currency)}</span>}
                {full && (
                  <button
                    className="text-button"
                    onClick={() => undo(e.id, e.type)}
                    aria-label={`Undo ${e.title} ${dateLabel(e.at)}`}
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {full && entries.length > limit && (
        <button
          className="button secondary"
          onClick={() => setLimit((n) => n + 30)}
        >
          Show more
        </button>
      )}
    </section>
  );
}
export function Home({
  data,
  change,
  onGoal,
  onTransfer,
}: {
  data: Data;
  change: Change;
  onGoal: () => void;
  onTransfer: () => void;
}) {
  const manualId = useRef(uid()),
    manualLock = useRef(false);
  const [manualSaving, setManualSaving] = useState(false);
  const goal = activeGoal(data),
    sum = goal ? totals(data, goal.id) : null,
    [manual, setManual] = useState(false),
    [manualError, setManualError] = useState("");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = data.decisions.filter((e) => !e.void && e.at >= +start),
    dismiss = today.filter((e) => e.outcome !== "continue").length;
  const week = Array.from({ length: 7 }, (_, i) => {
      const from = new Date(start);
      from.setDate(from.getDate() - 6 + i);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      const entries = data.decisions.filter(
        (e) => !e.void && e.at >= +from && e.at < +to,
      );
      return {
        label: from.toLocaleDateString(undefined, { weekday: "short" }),
        count: entries.length,
        skips: entries.filter((e) => e.outcome !== "continue").length,
      };
    }),
    max = Math.max(3, ...week.map((x) => x.count));
  const pauses = data.pauses
    .filter((p) => !p.archived && p.enabled)
    .sort((a, b) => a.order - b.order);
  return (
    <>
      <header className="page-heading">
        <span className="eyebrow">A little more intention</span>
        <h1>
          Space for
          <br />
          <em>what matters.</em>
        </h1>
        <p>
          {today.length
            ? `${today.length} ${today.length === 1 ? "choice" : "choices"} today · ${dismiss} not now, ${today.length - dismiss} continued`
            : "Small pauses. A day that feels more like you."}
        </p>
      </header>
      <div className="home-grid">
        <section className="goal-card">
          {goal && sum ? (
            <>
              <div className="goal-heading">
                <span className="eyebrow">Making room for</span>
                <span className="sun-stamp">
                  <Icon name="sun" size={28} />
                </span>
              </div>
              <h2>{goal.name}</h2>
              <div className="goal-amount">
                {formatMoney(sum.moved, goal.currency)}
              </div>
              <p>
                moved
                {goal.target > 0
                  ? ` toward ${formatMoney(goal.target, goal.currency)}`
                  : " toward your goal"}
              </p>
              {goal.target > 0 && (
                <div
                  className="goal-track"
                  role="progressbar"
                  aria-label="Goal progress from money moved"
                  aria-valuenow={Math.round(
                    Math.min(100, (sum.moved / goal.target) * 100),
                  )}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span
                    style={{
                      width: `${Math.min(100, (sum.moved / goal.target) * 100)}%`,
                    }}
                  />
                </div>
              )}
              <div className="goal-balance">
                <span>Planned to move</span>
                <strong>{formatMoney(sum.planned, goal.currency)}</strong>
              </div>
              <button
                className="button full"
                disabled={!sum.planned}
                onClick={onTransfer}
              >
                Record money moved <Icon name="arrow" size={18} />
              </button>
              <p className="fine-print">
                {formatMoney(sum.estimate, goal.currency)} estimated spending
                avoided
              </p>
            </>
          ) : (
            <>
              <span className="sun-stamp">
                <Icon name="sun" size={28} />
              </span>
              <span className="eyebrow">Something to look forward to</span>
              <h2>
                What are you
                <br />
                making room for?
              </h2>
              <p>
                A trip. A new watch. A little cushion.
                <br />
                Give your small choices somewhere to go.
              </p>
              <button className="button" onClick={onGoal}>
                Add a goal <Icon name="plus" size={18} />
              </button>
              <p className="fine-print">
                Entirely optional. Your pauses work either way.
              </p>
            </>
          )}
        </section>
        <section className="week-card">
          <div className="section-heading">
            <h2>Your week, gently.</h2>
            <Icon name="leaf" />
          </div>
          <p>Every deliberate choice counts.</p>
          <div
            className="week-chart"
            role="img"
            aria-label={week
              .map(
                (d) =>
                  `${d.label}: ${d.skips} not now and ${d.count - d.skips} continued`,
              )
              .join("; ")}
          >
            {week.map((d, i) => (
              <div className={`week-day ${i === 6 ? "today" : ""}`} key={i}>
                <span className="day-count">{d.count || "–"}</span>
                <div className="day-track">
                  <div
                    className="day-bar"
                    style={{ height: `${(d.count / max) * 100}%` }}
                  >
                    <span
                      style={{
                        height: `${d.count ? (d.skips / d.count) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <span>{d.label}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Not now / alternative
            </span>
            <span>
              <i />
              Continued
            </span>
          </div>
          <p className="fine-print">
            Completed choices only. No streaks to protect.
          </p>
        </section>
      </div>
      <section>
        <div className="section-heading">
          <h2>Your pauses</h2>
          <a href="#/pauses" className="text-link">
            Make them yours ↗
          </a>
        </div>
        <div className="pause-grid">
          {pauses.map((p) => (
            <a
              key={p.id}
              className={`pause-tile ${p.color}`}
              href={pauseHref(p.id)}
            >
              <span className="tile-icon">
                <Icon name={p.id} />
              </span>
              <span>
                <strong>{p.name}</strong>
                <small>{p.seconds} seconds to come back to you</small>
              </span>
              <Icon name="arrow" size={20} />
            </a>
          ))}
        </div>
        {!pauses.length && (
          <Empty title="Room for a new pause">
            Enable or create a pause in Your pauses.
          </Empty>
        )}
        <button
          className="text-button"
          onClick={() => {
            manualId.current = uid();
            setManualError("");
            setManual(true);
          }}
        >
          Already took a moment? Log a missed choice
        </button>
      </section>
      <Activity data={data} change={change} />
      {manual && (
        <Modal title="Log a missed choice" onClose={() => setManual(false)}>
          <p>
            For a real moment your automation missed. This records a Not now
            choice and its configured contribution.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (manualLock.current) return;
              const f = new FormData(e.currentTarget),
                p = pauses.find((p) => p.id === f.get("pause"));
              if (!p) return;
              manualLock.current = true;
              setManualSaving(true);
              try {
                await change((d) =>
                  recordDecision(
                    d,
                    manualId.current,
                    p,
                    "dismiss",
                    "manual-record",
                  ),
                );
                setManual(false);
              } catch (e) {
                setManualError((e as Error).message);
              } finally {
                manualLock.current = false;
                setManualSaving(false);
              }
            }}
          >
            <label>
              Pause
              <select name="pause">
                {pauses.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {manualError && <p role="alert">{manualError}</p>}
            <button
              className="button full"
              disabled={!pauses.length || manualSaving}
            >
              Record this choice
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
