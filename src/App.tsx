import { useCallback, useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Icon, Empty } from "./components/UI";
import {
  activeGoal,
  defaults,
  type Data,
  type PauseConfig,
} from "./domain/model";
import { load, mutate } from "./storage/db";
import { Pause, pauseHref, type Change } from "./features/Pause";
import { Activity, Home } from "./features/Home";
import { GoalEditor, PauseEditor, TransferEditor } from "./features/Forms";
import { Settings, Setup } from "./features/Settings";

export default function App() {
  const [data, setData] = useState<Data>(defaults),
    [loading, setLoading] = useState(true),
    [storageError, setStorageError] = useState(""),
    [route, setRoute] = useState(location.hash || "#/"),
    [epoch, setEpoch] = useState(0),
    [modal, setModal] = useState<
      "goal" | "new-goal" | "transfer" | "pause" | null
    >(null),
    [editing, setEditing] = useState<PauseConfig | undefined>(),
    [error, setError] = useState("");
  const channel = useRef<BroadcastChannel | null>(null),
    dataRef = useRef(data);
  dataRef.current = data;
  const {
    needRefresh: [refresh],
    offlineReady: [offline],
    updateServiceWorker,
  } = useRegisterSW();
  const sync = useCallback((next: Data) => {
    setData(next);
    setStorageError("");
    channel.current?.postMessage("updated");
  }, []);
  const change: Change = useCallback(
    async (fn) => {
      const next = await mutate(fn);
      sync(next);
      return next;
    },
    [sync],
  );
  useEffect(() => {
    let live = true;
    load()
      .then((d) => {
        if (live) setData(d);
      })
      .catch((e) => {
        if (live)
          setStorageError(`Your saved data could not be loaded. ${e.message}`);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    const reload = () =>
      load()
        .then((d) => {
          if (live) setData(d);
        })
        .catch((e) => {
          if (live) setStorageError(e.message);
        });
    if ("BroadcastChannel" in window) {
      const c = new BroadcastChannel("ebb-updates");
      channel.current = c;
      c.onmessage = reload;
    }
    return () => {
      live = false;
      channel.current?.close();
    };
  }, []);
  useEffect(() => {
    const navigate = () => {
      setRoute(location.hash || "#/");
      setEpoch((e) => e + 1);
      setError("");
      setModal(null);
      window.scrollTo(0, 0);
    };
    const resume = () => {
      if (document.hidden) return;
      void load()
        .then(setData)
        .catch(() => {});
      const raw = location.hash;
      const key = raw.startsWith("#/pause/")
        ? raw.slice(8).split("?")[0]
        : raw.slice(2).split("?")[0];
      try {
        const s = JSON.parse(
          sessionStorage.getItem(`ebb.session.${decodeURIComponent(key)}`) ||
            "null",
        );
        if (
          !raw.includes("launch=") &&
          s &&
          Date.now() - s.start >= 300000 &&
          dataRef.current.decisions.some((e) => e.id === s.id)
        )
          setEpoch((e) => e + 1);
      } catch {}
    };
    window.addEventListener("hashchange", navigate);
    window.addEventListener("pageshow", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.removeEventListener("hashchange", navigate);
      window.removeEventListener("pageshow", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme;
    document.documentElement.dataset.palette = data.settings.palette;
    document.documentElement.dataset.motion = data.settings.motion;
  }, [data.settings]);
  const [path, search = ""] = route.slice(2).split("?"),
    query = new URLSearchParams(search);
  let pauseId = path?.startsWith("pause/")
    ? path.slice(6)
    : ["food", "groceries", "entertainment"].includes(path)
      ? path
      : null;
  try {
    if (pauseId) pauseId = decodeURIComponent(pauseId);
  } catch {
    pauseId = "invalid";
  }
  const pause = data.pauses.find((p) => p.id === pauseId),
    isPause = pauseId !== null;
  const edit = (p?: PauseConfig) => {
    setEditing(p);
    setModal("pause");
  };
  const action = async (fn: (d: Data) => void) => {
    try {
      await change(fn);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (loading)
    return (
      <div className="loading">
        <span className="wordmark">
          ebb<span>·</span>
        </span>
        <p>Making a little space…</p>
      </div>
    );
  return (
    <div className={isPause ? "app intervention" : "app"}>
      {storageError && (
        <div className="storage-alert" role="alert">
          <strong>{storageError}</strong>
          <p>
            Your original data is preserved. Pauses still display, but new
            records may not save. Export the original POC data or import a valid
            backup in Settings.
          </p>
          <a href="#/settings">Open data & recovery</a>
        </div>
      )}
      {isPause ? (
        pause ? (
          <Pause
            key={`${route}:${epoch}`}
            p={pause}
            data={data}
            change={change}
            query={query}
          />
        ) : (
          <main className="pause-screen">
            <Empty title="That pause isn’t here">
              Check the link, or choose a pause below.
            </Empty>
            <a className="button" href="#/pauses">
              Your pauses
            </a>
          </main>
        )
      ) : (
        <>
          <aside className="sidebar">
            <a href="#/" className="wordmark">
              ebb<span>·</span>
            </a>
            <p className="brand-note">
              A little space.
              <br />A little more you.
            </p>
            <nav aria-label="Main navigation">
              {[
                ["", "home", "Home"],
                ["pauses", "pause", "Pauses"],
                ["settings", "settings", "Settings"],
              ].map(([to, icon, label]) => (
                <a
                  key={label}
                  href={`#/${to}`}
                  aria-current={(path || "") === to ? "page" : undefined}
                >
                  <Icon name={icon} />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
            <div className="sidebar-foot">
              <Icon name="leaf" />
              <span>
                Small pauses.
                <br />
                Meaningful choices.
              </span>
            </div>
          </aside>
          <div className="main-column">
            <div className="mobile-brand">
              <a href="#/" className="wordmark">
                ebb<span>·</span>
              </a>
              <span>A little space</span>
            </div>
            {refresh && (
              <div className="notice update">
                <span>A fresh version of Ebb is ready.</span>
                <button
                  className="text-button"
                  onClick={() => updateServiceWorker(true)}
                >
                  Update now
                </button>
              </div>
            )}
            {data.settings.migrationNotice && (
              <div className="notice">
                <strong>Your moments came with you.</strong>
                <p>
                  Your POC history is preserved. Past estimates also remain past
                  contributions. Set a separate amount for future skips in each
                  pause’s settings.
                </p>
                <button
                  className="text-button"
                  onClick={() =>
                    action((d) => {
                      d.settings.migrationNotice = false;
                    })
                  }
                >
                  Got it
                </button>
              </div>
            )}
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <main id="main-content">
              {!path || path === "/" ? (
                !data.settings.onboarded ? (
                  <Welcome
                    data={data}
                    finish={async (id?: string) => {
                      await change((d) => {
                        d.settings.onboarded = true;
                      });
                      if (id) location.hash = pauseHref(id).slice(1);
                    }}
                  />
                ) : (
                  <Home
                    data={data}
                    change={change}
                    onGoal={() => setModal("goal")}
                    onTransfer={() => setModal("transfer")}
                  />
                )
              ) : path === "pauses" ? (
                <>
                  <header className="page-heading compact">
                    <span className="eyebrow">Made for your everyday</span>
                    <h1>Your little pauses.</h1>
                    <p>Keep what helps. Make each one feel like you.</p>
                    <button className="button" onClick={() => edit()}>
                      <Icon name="plus" size={18} />
                      Add a pause
                    </button>
                  </header>
                  <div className="pause-configs">
                    {data.pauses
                      .filter((p) => !p.archived)
                      .sort((a, b) => a.order - b.order)
                      .map((p, i) => (
                        <article
                          className={`pause-config ${p.color}`}
                          key={p.id}
                        >
                          <div className="config-header">
                            <span className="tile-icon">
                              <Icon name={p.id} />
                            </span>
                            <div>
                              <h2>{p.name}</h2>
                              <p>
                                {p.seconds} seconds ·{" "}
                                {p.type === "spending"
                                  ? "Spending"
                                  : "Attention"}
                              </p>
                            </div>
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={p.enabled}
                                aria-label={`Enable ${p.name}`}
                                onChange={(e) =>
                                  action((d) => {
                                    d.pauses.find(
                                      (x) => x.id === p.id,
                                    )!.enabled = e.target.checked;
                                  })
                                }
                              />
                              <span />
                            </label>
                          </div>
                          <p className="config-alt">
                            {p.alternatives[0] ||
                              "Add a personal alternative to make this pause yours."}
                          </p>
                          {p.type === "spending" && (
                            <p className="hint">{formatPause(p, data)}</p>
                          )}
                          <div className="config-actions">
                            <button
                              className="text-button"
                              onClick={() => edit(p)}
                            >
                              Edit
                            </button>
                            <a
                              className="text-link"
                              href={pauseHref(p.id, true)}
                            >
                              Preview
                            </a>
                            <button
                              className="text-button"
                              disabled={i === 0}
                              aria-label={`Move ${p.name} earlier`}
                              onClick={() =>
                                action((d) => {
                                  const sorted = d.pauses
                                    .filter((x) => !x.archived)
                                    .sort((a, b) => a.order - b.order);
                                  const at = sorted.findIndex(
                                    (x) => x.id === p.id,
                                  );
                                  if (at < 1) return;
                                  [sorted[at - 1], sorted[at]] = [
                                    sorted[at],
                                    sorted[at - 1],
                                  ];
                                  sorted.forEach((x, j) => {
                                    x.order = j;
                                  });
                                })
                              }
                            >
                              Move up
                            </button>
                            <button
                              className="text-button"
                              onClick={() =>
                                action((d) => {
                                  d.pauses.find(
                                    (x) => x.id === p.id,
                                  )!.archived = true;
                                })
                              }
                            >
                              Archive
                            </button>
                          </div>
                        </article>
                      ))}
                  </div>
                  {data.pauses.some((p) => p.archived) && (
                    <section>
                      <h2>Resting for now</h2>
                      {data.pauses
                        .filter((p) => p.archived)
                        .map((p) => (
                          <div className="settings-row" key={p.id}>
                            <span>{p.name}</span>
                            <button
                              className="text-button"
                              onClick={() =>
                                action((d) => {
                                  d.pauses.find(
                                    (x) => x.id === p.id,
                                  )!.archived = false;
                                })
                              }
                            >
                              Restore pause
                            </button>
                          </div>
                        ))}
                    </section>
                  )}
                  <a className="text-link" href="#/setup">
                    Connect a Shortcut ↗
                  </a>
                </>
              ) : path === "settings" ? (
                <Settings
                  data={data}
                  change={change}
                  setData={sync}
                  onGoal={() => setModal("goal")}
                  onNewGoal={() => setModal("new-goal")}
                />
              ) : path === "setup" ? (
                <Setup data={data} />
              ) : path === "activity" ? (
                <>
                  <header className="page-heading compact">
                    <span className="eyebrow">Room to reflect</span>
                    <h1>Little moments, kept.</h1>
                    <p>
                      Correct any entry with Undo. Money already moved stays
                      protected.
                    </p>
                  </header>
                  <Activity data={data} change={change} full />
                </>
              ) : (
                <Empty title="Let’s find your way back">
                  <a href="#/">Back home</a>
                </Empty>
              )}
            </main>
            <footer className="main-footer">
              <span>Made for the life you want to live.</span>
              <span>
                {offline ? "Ready for offline moments" : "Private by design"}
              </span>
            </footer>
          </div>
        </>
      )}
      {modal === "pause" && (
        <PauseEditor
          data={data}
          change={change}
          pause={editing}
          onClose={() => setModal(null)}
        />
      )}
      {(modal === "goal" || modal === "new-goal") && (
        <GoalEditor
          data={data}
          change={change}
          newGoal={modal === "new-goal"}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "transfer" && activeGoal(data) && (
        <TransferEditor
          data={data}
          change={change}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
function formatPause(p: PauseConfig, d: Data) {
  const c = activeGoal(d)?.currency ?? "INR";
  return (
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits: 2,
    }).format(p.contribution / (c === "JPY" ? 1 : 100)) +
    " planned per skipped impulse"
  );
}
function Welcome({
  data,
  finish,
}: {
  data: Data;
  finish: (id?: string) => Promise<void>;
}) {
  const [step, setStep] = useState(0),
    [selected, setSelected] = useState("entertainment"),
    [error, setError] = useState("");
  const go = async (id?: string) => {
    try {
      await finish(id);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <div className="welcome">
      <span className="eyebrow">Meet Ebb</span>
      <div className="welcome-art" aria-hidden="true">
        <span />
        <i />
      </div>
      <h1>
        {step === 0 ? (
          <>
            A small pause.
            <br />
            <em>A little more you.</em>
          </>
        ) : (
          <>
            Where would you
            <br />
            <em>like some space?</em>
          </>
        )}
      </h1>
      <p>
        {step === 0
          ? "A moment before you order, scroll, or slip into autopilot. Then a choice that feels like your own."
          : "Choose a starting point. Your alternatives, savings goal, and colors can all come later."}
      </p>
      {step === 0 ? (
        <button className="button" onClick={() => setStep(1)}>
          Make some space <Icon name="arrow" size={18} />
        </button>
      ) : (
        <>
          <div className="welcome-options">
            {data.pauses
              .filter((p) => !p.archived)
              .map((p) => (
                <button
                  className={`welcome-option ${selected === p.id ? "selected" : ""}`}
                  aria-pressed={selected === p.id}
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                >
                  <Icon name={p.id} />
                  {p.name}
                  <span>{selected === p.id ? "✓" : ""}</span>
                </button>
              ))}
          </div>
          <button className="button" onClick={() => go(selected)}>
            Take my first pause <Icon name="arrow" size={18} />
          </button>
        </>
      )}
      <button className="text-button" onClick={() => go()}>
        Explore first
      </button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <p className="fine-print">No account. No streaks. Just a little space.</p>
    </div>
  );
}
