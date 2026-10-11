import { useRef, useState } from "react";
import { pauseSession } from "../domain/session";
import { Breath } from "../components/Breath";
import { Icon } from "../components/UI";
import {
  activeGoal,
  formatMoney,
  recordDecision,
  undoDecision,
  uid,
  type Data,
  type PauseConfig,
  type Decision,
} from "../domain/model";
export const pauseHref = (id: string, preview = false) =>
  `#/pause/${encodeURIComponent(id)}?source=manual&launch=${uid()}${preview ? "&preview=1" : ""}`;
export type Change = (fn: (d: Data) => Data | void) => Promise<Data>;
export function Pause({
  p,
  data,
  change,
  query,
}: {
  p: PauseConfig;
  data: Data;
  change: Change;
  query: URLSearchParams;
}) {
  const preview = query.get("preview") === "1",
    [s] = useState(() => pauseSession(p, query, preview));
  const existing = data.decisions.find((e) => e.id === s.id && !e.void),
    [local, setLocal] = useState<Decision["outcome"] | null>(null);
  const [ready, setReady] = useState(Date.now() >= s.start + p.seconds * 1000),
    [showAlt, setShowAlt] = useState(false),
    [alt, setAlt] = useState(0),
    [error, setError] = useState(""),
    [unsaved, setUnsaved] = useState(false),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const outcome = existing?.outcome ?? local,
    goal = activeGoal(data),
    source = query.get("source") === "manual" ? "manual" : "integration";
  async function choose(value: Decision["outcome"], alternative?: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (!preview)
        await change((d) => {
          const old = d.decisions.find((e) => e.id === s.id);
          if (old) {
            if (old.void)
              throw Error(
                "This choice was undone. Start a new pause to record another.",
              );
            if (alternative && old.outcome !== "continue") {
              old.outcome = "alternative";
              old.alternative = alternative;
            }
            return d;
          }
          return recordDecision(d, s.id, p, value, source, alternative);
        });
      setLocal(value);
      setShowAlt(value === "dismiss" && p.alternatives.length > 0);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your choice could not be saved.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function undo() {
    try {
      if (!preview) await change((d) => undoDecision(d, s.id));
      location.hash = pauseHref(p.id, preview).slice(1);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (!p.enabled || p.archived)
    return (
      <main className="pause-screen">
        <h1>This pause is resting.</h1>
        <p>You can enable it again in Your pauses.</p>
        <a className="button" href="#/pauses">
          Your pauses
        </a>
      </main>
    );
  const receiptAmount = existing?.contribution ?? (goal ? p.contribution : 0),
    currency = existing?.currency ?? goal?.currency ?? "INR";
  return (
    <main className="pause-screen">
      <div className="pause-top">
        <a href="#/" className="wordmark">
          ebb<span>·</span>
        </a>
        <a
          className="icon-button"
          href="#/"
          aria-label="Leave this pause without recording a choice"
        >
          <Icon name="close" />
        </a>
      </div>
      <div className="pause-intro">
        <span className={`category-label ${p.color}`}>
          <i />
          {p.name}
          {preview ? " · preview" : ""}
        </span>
        <h1>
          {outcome
            ? "A little space, made."
            : ready
              ? "Your choice."
              : "Come back to you."}
        </h1>
        <p>
          {outcome
            ? outcome === "continue"
              ? "You took a moment to decide."
              : "Make room for what matters to you."
            : ready
              ? "Do you still want to continue?"
              : "One breath before your next choice."}
        </p>
      </div>
      <Breath
        deadline={s.start + p.seconds * 1000}
        duration={p.seconds}
        motion={data.settings.motion}
        onComplete={() => setReady(true)}
      />
      <div className="decision-area">
        {error && (
          <div className="notice error" role="alert">
            <p>{error}</p>
            <p>Your choice has not been saved.</p>
            <button
              className="text-button"
              onClick={() => {
                setUnsaved(true);
                setLocal("continue");
                setError("");
              }}
            >
              Continue without saving
            </button>
          </div>
        )}
        {!ready && !outcome && (
          <p className="waiting">Nothing to do for a moment.</p>
        )}
        {ready && !outcome && !showAlt && (
          <div className="reveal">
            <div className="decision-buttons">
              <button
                disabled={busy}
                className="button"
                onClick={() => choose("dismiss")}
              >
                Not now
              </button>
              <button
                disabled={busy}
                className="button secondary"
                onClick={() => choose("continue")}
              >
                Continue
              </button>
            </div>
            {p.alternatives.length > 0 && (
              <button
                className="text-button centered"
                onClick={() => setShowAlt(true)}
              >
                Try something else
              </button>
            )}
          </div>
        )}
        {showAlt && (
          <div className="reveal">
            <div className="alternative">
              <span className="eyebrow">Something you chose</span>
              <h2>{p.alternatives[alt % p.alternatives.length]}</h2>
              {p.alternatives.length > 1 && (
                <button
                  className="text-button"
                  onClick={() => setAlt((i) => i + 1)}
                >
                  Show another
                </button>
              )}
            </div>
            <button
              disabled={busy}
              className="button full"
              onClick={() => {
                void choose(
                  "alternative",
                  p.alternatives[alt % p.alternatives.length],
                );
              }}
            >
              Do this instead
            </button>
            <button
              className="text-button centered"
              onClick={() => setShowAlt(false)}
            >
              {outcome ? "Done" : "Back to your choice"}
            </button>
          </div>
        )}
        {outcome && !showAlt && (
          <div className="reveal">
            <div className="receipt">
              <Icon name="check" />
              <h2>
                {unsaved
                  ? "Continued without saving"
                  : preview
                    ? "Preview complete"
                    : outcome === "continue"
                      ? "Choice recorded"
                      : receiptAmount
                        ? `${formatMoney(receiptAmount, currency)} added to your plan`
                        : "Choice recorded"}
              </h2>
              {!unsaved &&
                !preview &&
                outcome !== "continue" &&
                p.type === "spending" && (
                  <p>
                    Estimated spending avoided:{" "}
                    {formatMoney(existing?.estimate ?? p.estimate, currency)}
                  </p>
                )}
              {outcome === "alternative" && (
                <p>
                  {existing?.alternative ??
                    p.alternatives[alt % p.alternatives.length]}
                </p>
              )}
              {outcome === "continue" && (
                <p>You can switch back to your app now.</p>
              )}
            </div>
            {outcome === "continue" && p.returnShortcut && (
              <a
                className="button full"
                href={`shortcuts://run-shortcut?name=${encodeURIComponent(p.returnShortcut)}`}
              >
                Run your return shortcut <Icon name="arrow" size={18} />
              </a>
            )}
            <div className="receipt-links">
              {!unsaved && (
                <button className="text-button" onClick={undo}>
                  Undo choice
                </button>
              )}
              <a className="text-button" href="#/">
                Back home
              </a>
              <a className="text-button" href={pauseHref(p.id, preview)}>
                New pause
              </a>
            </div>
          </div>
        )}
      </div>
      <p className="pause-foot">
        {preview
          ? "Just a preview. Nothing is recorded."
          : "A little space between impulse and choice."}
      </p>
    </main>
  );
}
