import { useState } from "react";
import { Icon, Modal } from "../components/UI";
import {
  activeGoal,
  defaults,
  formatMoney,
  totals,
  type Data,
} from "../domain/model";
import { download, parseBackup, recover, restore } from "../storage/db";
import type { Change } from "./Pause";
export function Settings({
  data,
  change,
  setData,
  onGoal,
  onNewGoal,
}: {
  data: Data;
  change: Change;
  setData: (d: Data) => void;
  onGoal: () => void;
  onNewGoal: () => void;
}) {
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [incoming, setIncoming] = useState<Data | null>(null),
    [reset, setReset] = useState(false),
    [busy, setBusy] = useState(false),
    goal = activeGoal(data);
  async function preference(
    key: "theme" | "palette" | "motion",
    value: string,
  ) {
    try {
      await change((d) => {
        (d.settings as Record<string, unknown>)[key] = value;
      });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function apply(next: Data) {
    setBusy(true);
    try {
      const d = await restore(next);
      setData(d);
      setIncoming(null);
      setReset(false);
      setMessage(
        "Your data is ready. A copy of the previous data is kept for recovery.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="page-heading compact">
        <span className="eyebrow">Make yourself at home</span>
        <h1>Your kind of calm.</h1>
        <p>A few thoughtful choices. Nothing to perfect.</p>
      </header>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <section className="settings-card">
        <h2>Look & feel</h2>
        <div className="settings-row">
          <div>
            <h3>Palette</h3>
            <p>A little change of scenery.</p>
          </div>
          <select
            aria-label="Palette"
            value={data.settings.palette}
            onChange={(e) => preference("palette", e.target.value)}
          >
            <option value="coastal">Coastal</option>
            <option value="orchard">Orchard</option>
            <option value="playful">Playful</option>
          </select>
        </div>
        <div className="palette-swatches" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="settings-row">
          <div>
            <h3>Appearance</h3>
            <p>Follow your day, or set your own.</p>
          </div>
          <select
            aria-label="Appearance"
            value={data.settings.theme}
            onChange={(e) => preference("theme", e.target.value)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <h3>Motion</h3>
            <p>Your device’s reduced-motion setting always takes priority.</p>
          </div>
          <select
            aria-label="Motion"
            value={data.settings.motion}
            onChange={(e) => preference("motion", e.target.value)}
          >
            <option value="full">Full</option>
            <option value="gentle">Gentle</option>
            <option value="still">Still</option>
          </select>
        </div>
      </section>
      <section className="settings-card">
        <h2>Your goal</h2>
        <p>
          {goal
            ? `${goal.name}${goal.target ? ` · ${formatMoney(goal.target, goal.currency)}` : ""}`
            : "You do not need a money goal to use Ebb."}
        </p>
        <div className="button-row">
          <button className="button secondary" onClick={onGoal}>
            {goal ? "Edit goal" : "Add a goal"}
          </button>
          {goal && (
            <button className="text-button" onClick={onNewGoal}>
              Start a different goal
            </button>
          )}
        </div>
        {data.goals.some((g) => g.archived) && (
          <details>
            <summary>Previous goals</summary>
            {data.goals
              .filter((g) => g.archived)
              .map((g) => {
                const s = totals(data, g.id);
                return (
                  <p key={g.id}>
                    <strong>{g.name}</strong>
                    <br />
                    {formatMoney(s.moved, g.currency)} moved ·{" "}
                    {formatMoney(s.planned, g.currency)} remaining in its plan
                  </p>
                );
              })}
            <p className="hint">
              These records stay with their original goal. Activity lets you
              correct a previous transfer.
            </p>
          </details>
        )}
      </section>
      <section className="settings-card">
        <h2>Data, on your terms.</h2>
        <p>
          Your habit history stays in this browser. No account, analytics, or
          cloud sync. Export a backup before clearing browser data or changing
          devices.
        </p>
        <div className="button-row">
          <button
            className="button secondary"
            onClick={() =>
              download(
                data,
                `ebb-${new Date().toISOString().slice(0, 10)}.ebb.json`,
              )
            }
          >
            Export backup
          </button>
          <label className="button secondary file-button">
            Import backup
            <input
              type="file"
              accept=".json,.ebb.json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  if (file.size > 25000000)
                    throw Error("This file is too large.");
                  setIncoming(parseBackup(await file.text()));
                  setError("");
                } catch (e) {
                  setError(
                    `Could not read this backup. ${(e as Error).message}`,
                  );
                }
              }}
            />
          </label>
        </div>
        <details>
          <summary>Recovery & fresh starts</summary>
          <p className="hint">
            Restoring a backup or starting fresh keeps one previous copy on this
            device. A later import replaces that recovery copy.
          </p>
          <button
            className="text-button"
            onClick={async () => {
              try {
                setData(await recover());
                setMessage("Previous data restored.");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Restore before last import
          </button>
          <button
            className="text-button"
            onClick={() => {
              try {
                const raw = localStorage.getItem("pause.v1");
                if (!raw) throw Error("No POC data was found in this browser.");
                download(raw, "ebb-original-poc.json");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Export original POC data
          </button>
          <button className="text-button" onClick={() => setReset(true)}>
            Start fresh
          </button>
        </details>
        <button
          className="text-button"
          onClick={async () => {
            try {
              const granted = await navigator.storage?.persist?.();
              setMessage(
                granted
                  ? "Persistent storage is enabled. Keep exporting backups too."
                  : "Your browser manages storage automatically. Keep a backup for recovery.",
              );
            } catch {
              setMessage(
                "Persistent storage is unavailable here. You can still export a backup.",
              );
            }
          }}
        >
          Ask this browser to keep my data
        </button>
      </section>
      <section className="settings-card">
        <h2>Connect your pauses</h2>
        <p>
          Keep using your working iOS 27 automation. It opens Ebb in Safari and
          uses its own five-minute cooldown.
        </p>
        <a className="text-link" href="#/setup">
          Shortcut setup & test <Icon name="arrow" size={18} />
        </a>
        <p className="hint">
          A Home Screen installation may use separate storage from Safari. Set
          up and use Ebb in the same browser context your automation opens.
        </p>
      </section>
      <p className="app-footer">
        ebb · version 0.2
        <br />
        Made for a little more intention.
      </p>
      {incoming && (
        <Modal title="Review your backup" onClose={() => setIncoming(null)}>
          <p>
            {incoming.pauses.length} pauses · {incoming.decisions.length}{" "}
            choices · {incoming.transfers.length} transfers
          </p>
          <p>
            This replaces the current data. A recovery copy will be kept on this
            device.
          </p>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <button
            className="button full"
            disabled={busy}
            onClick={() => apply(incoming)}
          >
            Replace with this backup
          </button>
        </Modal>
      )}
      {reset && (
        <Modal title="Start fresh?" onClose={() => setReset(false)}>
          <p>
            Your current data will be replaced with the starting presets. A
            recovery copy and the original POC data, if present, are retained on
            this device.
          </p>
          <button
            disabled={busy}
            className="button full"
            onClick={() => apply(defaults())}
          >
            Start fresh and keep recovery copy
          </button>
        </Modal>
      )}
    </>
  );
}
export function Setup({ data }: { data: Data }) {
  const [copied, setCopied] = useState(""),
    [selected, setSelected] = useState(
      data.pauses.find((p) => p.id === "entertainment")?.id ??
        data.pauses[0]?.id ??
        "",
    );
  const p = data.pauses.find((p) => p.id === selected),
    url = `${location.href.split("#")[0]}#/pause/${encodeURIComponent(selected)}`;
  return (
    <>
      <header className="page-heading compact">
        <span className="eyebrow">A moment, when you need it</span>
        <h1>Connect Ebb.</h1>
        <p>Your existing Safari shortcut can stay just as it is.</p>
      </header>
      <section className="settings-card">
        <h2>Your pause link</h2>
        <label>
          Pause
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {data.pauses
              .filter((p) => !p.archived)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <code className="url">{url}</code>
        <div className="button-row">
          <button
            className="button secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied("Link copied.");
              } catch {
                setCopied("Select and copy the link above.");
              }
            }}
          >
            Copy link
          </button>
          {p && (
            <a className="text-link" href={`${url}?preview=1`}>
              Test this pause
            </a>
          )}
        </div>
        <p role="status">{copied}</p>
      </section>
      <section className="settings-card">
        <h2>Your working iOS 27 setup</h2>
        <ol className="steps">
          <li>
            When YouTube opens, check the global stored variable{" "}
            <code>pause_youtube_last</code>.
          </li>
          <li>If it is less than five minutes old, stop the shortcut.</li>
          <li>
            Otherwise, save the current time and open your Ebb link in Safari.
          </li>
        </ol>
        <p>
          The cooldown begins when Ebb opens, including when you choose Not now.
          Continue records your decision; switch back to the app yourself.
        </p>
        <p className="hint">
          Your existing #/entertainment, #/food, and #/groceries links still
          work. Each new app can have its own stored timestamp.
        </p>
      </section>
      <section className="settings-card">
        <h2>A quick phone check</h2>
        <ul className="steps">
          <li>Open the target app. Confirm Ebb receives the link.</li>
          <li>
            Choose Continue, switch back, and confirm there is no second pause
            within five minutes.
          </li>
          <li>After five minutes, open it again and confirm a new pause.</li>
          <li>After a successful online visit, try again offline.</li>
        </ul>
        <p>
          If Safari resumes an already completed page, use “New pause.” For
          unambiguous launches, your shortcut can append a fresh timestamp as{" "}
          <code>?launch=…</code> to the hash route.
        </p>
        <p className="hint">
          Ebb cannot inspect your installed shortcuts. This test is something
          you verify on your phone.
        </p>
      </section>
      <section className="settings-card">
        <h2>Keep one home for your data</h2>
        <p>
          Safari is the baseline for your automation. A Home Screen app can have
          a separate history. To move between them, export and import your
          backup; there is no automatic sync.
        </p>
      </section>
    </>
  );
}
