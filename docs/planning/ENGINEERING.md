# Ebb engineering and verification plan

Baseline: `7bcd980`, inspected 10 October 2026. This document is an implementation proposal; it does not claim device tests or application changes have been completed.

## POC audit

The repository contains a README, MIT license, and one 145-line `index.html` (10,569 bytes). All styling, routing, storage, rendering, and integration logic lives in that file. There is no manifest, service worker, dependency manifest, build pipeline, or test suite.

| Location in baseline `index.html` | Observation | Planned treatment |
| --- | --- | --- |
| Lines 6, 110 | Product is labeled Pause although the repository is Ebb | Unify product naming |
| Lines 8–14 | Muted sage/clay colors and global noise texture | Coastal tokens; remove blanket grain unless it earns its place in visual review |
| Lines 27–38 | A scale-only orb, linear ring, and generic reveal | Coordinated organic motion controller and reserved transition layout |
| Line 50 | Reduced motion stops the orb but not the ring | Stop all spatial/continuous motion in Still mode |
| Lines 62–65 | Parsed storage is shallow-merged; invalid shapes can survive; errors are swallowed | Validated storage boundary, explicit error states, recoverable migration |
| Lines 73–74, 93 | Estimated expense is credited as savings and the pot | Separate estimate, contribution, and transfer records |
| Lines 83–89 | Future decision controls exist at opacity zero; pointer-events does not remove keyboard focus | Not-rendered/disabled/inert decision state |
| Line 98 | A delayed return callback is outside the tracked timeout list | Session-bound cleanup; explicit configured return action |
| Lines 104–105 | DOM queries in timer callbacks assume the same route/session | Deadline-driven state with cancellation and session identity |
| Lines 109–118 | Goal progress uses estimates; transfer marks the whole pot moved | Progress from confirmed transfers; partial transfer form and correction |
| Line 130 | `value || oldValue` prevents entering a valid zero for some settings | Explicit numeric parsing and bounded validation |
| Line 133 | Syntactically valid JSON is not necessarily valid application data | Versioned schema validation and import preview |
| Lines 136–142 | Only initial load and hash changes route the app | Test same-URL reentry, visibility/pageshow and unique launch identifiers |

These are source-review findings. The user subsequently confirmed the iOS 27 launch/cooldown setup described below. That working POC setup does not establish every edge case above or an automatic return callback.

## Proposed architecture

Use **Vite + React + TypeScript**, small custom components, and plain CSS tokens. Keep the site statically hostable on GitHub Pages. React is a proposed implementation choice, not something the current repository uses. Resolve and pin supported dependency versions at implementation time.

Use a small IndexedDB wrapper (proposed: `idb`) for transactions and versioned stores, plus a runtime validator (proposed: Zod) for persisted/imported data. Do not add a second global state library initially: query/domain functions plus feature state are sufficient. Keep all money/statistics functions independent from UI code. Choose Dexie instead only if its query/live-update benefits justify the additional abstraction after a brief storage spike; do not use both wrappers.

```
src/
  app/             # shell, hash router, loading/error boundaries
  features/
    pause/         # session state, decisions, breathing controller
    home/          # summaries and recent activity
    pauses/        # presets, configuration, alternatives
    goals/         # contribution and transfer UI
    onboarding/
    settings/
  components/      # accessible Button, Field, Sheet, Status, navigation
  domain/          # schemas, money, summaries, session rules
  storage/         # IndexedDB repository, migration, import/export
  integrations/    # route parsing, configured Shortcut return links
  styles/          # semantic tokens, base layout, motion tokens
public/            # manifest, icons, local assets
tests/             # domain, migration and meaningful browser flows
```

Prefer a service worker generated from the build's actual asset graph (e.g. a small Workbox integration) over a manually maintained asset list that misses lazy-loaded screens. The entire core experience must be pre-cached; analytics extensions can be split out later. The pause route gets the smallest practical startup path. No remote fonts, AI calls, or chart framework are required.

## State and records

Keep timestamps as epoch milliseconds, amounts as integer minor units, a single configured currency for the active money goal, and a version on exported data. A different currency must never reinterpret old values; archive the goal or explicitly start a new one.

| Store/entity | Essential fields and purpose |
| --- | --- |
| Settings | schema version, locale/currency defaults, theme, motion preference, onboarding state |
| Pause | stable id, legacy route aliases, name, spending/attention type, duration, color/icon token, estimate, contribution, alternatives, integration config, enabled/archive state |
| Goal | stable id, name, optional positive target, currency, created/archived dates |
| Session | stable id, pause id, source, start/deadline, status, optional finalized timestamp |
| Decision | unique session id, time, pause/name snapshot, Not now/Continue/alternative, chosen alternative snapshot, estimate/contribution snapshot, goal id, currency, source, correction status |
| Transfer | id, goal id, currency, amount, user-confirmed date, created date, reversal/correction reference |
| Metadata | migration version/source fingerprint, import information, compatibility flags |

Session sources distinguish integration, manual pause, manual record, and preview. Previews are excluded from persistent activity and every total. A single decision per session is a database invariant. Editing a decision changes that record or adds a linked correction in one transaction; it must not manufacture an additional skip.

Store the category-level legacy app name as a snapshot when known. Do not split historical Food delivery events into specific apps without evidence. Keep historical estimates labeled as estimates and user-reported transfers labeled as user-reported.

## Accounting rules

For a goal and currency:

```
estimatedAvoided = sum(active Not-now/alternative decisions' estimate snapshots)
contributions   = sum(active Not-now/alternative decisions' contribution snapshots)
moved           = sum(active confirmed transfers, net of reversals)
plannedToMove   = contributions - moved
goalProgress    = moved / target     # only if target > 0
```

Attention decisions have no estimate or contribution. Continue has zero contribution. A selected alternative may be chosen before or after Not now, but contributes once. Never recalculate history from current pause configuration. Money sums must have one currency and goal context; do not combine unrelated goals/currencies into a misleading balance.

For v0.2, a new transfer is positive and at most the remaining plan. Re-read that balance inside the transaction so simultaneous tabs cannot overdraw it. If undoing a credited decision would make the plan negative because money has already been moved, explain the dependency and offer correction of the relevant transfer first. Do not silently reduce a real transfer or silently clamp a negative balance. Imported inconsistent historical data goes into a review/recovery state rather than being “fixed” invisibly.

## Migration from `pause.v1`

1. Read the original string without modifying it. Validate its structure, numeric finiteness, strings, arrays, and known outcomes. Missing safe defaults and malformed records are distinct cases.
2. Build stable IDs for three legacy pauses and the legacy goal. Preserve the three hash aliases.
3. Map `skip`, `alt`, and `open` to decision records. Preserve each original event's `amt`; for legacy skip/alt records, use that value for both the historical estimate and historical contribution, with provenance `legacyCombinedAmount`. The POC cannot tell us a different intended fixed amount.
4. Map `moved` entries to transfers. Do not invent start/abandon events or an alternative's text if the POC did not record them.
5. Convert INR amounts to minor units using validated rounding rules. Generate deterministic migration IDs from the source fingerprint and record index; migration repeats cannot duplicate entries.
6. Validate aggregate balances and write the converted entities plus completion marker in one transaction. A crash leaves either the old state or a complete migration, never half a migration.
7. Leave `pause.v1` intact until the user has a successful export and the retention policy is intentionally revised in a later release. Never automatically remove the only recovery copy during this release.
8. Explain the new labels and let the user configure future contribution amounts. The compatibility default can retain old per-category amounts until edited; disclose that choice.

If data lives on the old deployment origin and the new app moves origins, automatic migration cannot read it. Keep the current origin/base path for rollout or use an explicit export/import. Test existing origin storage separately from a pristine local development database.

## Routing and session behavior

- Preserve `#/food`, `#/groceries`, `#/entertainment`, and `#/settings`; introduce `#/pause/<id>` for custom pauses.
- A recognized `app` parameter may populate the displayed context, but must not unilaterally authorize arbitrary Shortcut execution. Use stored, user-configured return mappings. Keep legacy callback names compatible after configuration confirmation.
- Integration setup should generate a fresh launch/session identifier per activation where supported. Deduplicate the same launch ID; never rely on route text alone to define a new session.
- Without a launch ID, document and test the fallback entry behavior. A page that is merely resumed must not create a fresh money event. A same-hash URL opened again may not fire `hashchange`; this is a real-device test requirement.
- Invalid routes offer a useful way to select a pause without auto-recording a choice. Integration input never records money on arrival.
- A session moves through loading → breathing → deciding → saving → resolved, with interrupted/error alternatives. The timer is a deadline, not a chain of decremented counters.
- On resume, use elapsed time to resolve the breath state; animation does not govern permission to decide. Persist the finalized session ID before an external return so reopening cannot finalize it twice.
- Do not make a delayed external navigation outlive its route. Prefer an explicit “Return to [app]” link/button if saving asynchronously would lose browser user activation. Automatic single-tap handoff is an optimization only after successful device tests.

## iPhone integration contract

Apple documents that app-open automation includes switching to the app and supports running a named Shortcut through a URL scheme. Neither fact proves that a particular return/grace implementation is installed or works on this device. The browser cannot inspect the user's Shortcut collection or silently verify that an automation exists.

### Confirmed working baseline (user report, 10 October 2026)

The user runs iOS 27 and confirms that a Shortcut generated from a natural-language description runs automatically when YouTube opens. It checks the global stored variable `pause_youtube_last`; if the saved time is less than five minutes old it stops, otherwise it stores the current time and opens the entertainment route in Safari. The user reports that both automatic launching and the cooldown work.

The supplied description uses `https://<your-username>.github.io/pause/#/entertainment` as a template, without an `app` parameter. Do not treat that placeholder as the actual deployed address. Preserve the installed Shortcut's real URL and storage origin during rollout. This route does not invoke the POC's `Allow <app>` callback. The v0.2 baseline therefore records Continue and gives a clear manual-switch-back instruction; it must not claim to have automatically opened YouTube. No new callback Shortcut is required.

Keep `pause_youtube_last` and the five-minute launch-time semantics compatible. The web page cannot read this global Shortcut variable directly. Document that the window starts when the pause is launched, applies after any outcome, and is not reset by the web decision. This is launch suppression, not a restriction on recording distinct choices or contributions. If more apps are configured, use separate per-app timestamps unless the user deliberately chooses a shared cooldown.

This is user-verified behavior on their phone, not a claim that the agent independently inspected the generated actions or that every iOS 27 device behaves identically. Reuse it and regression-test the upgraded app; do not repeat a feasibility spike for the already-working mechanism.

Support the simplest tested path first:

1. **Launch cooldown in Shortcuts — selected baseline:** preserve the confirmed global-variable implementation and five-minute default. The window begins at entry even when the person chooses Not now. Show that tradeoff in setup.
2. **Continuation grace in Shortcuts — optional later:** a return Shortcut records an allowed-until value before reopening the target app. This has an extra setup requirement and different semantics. Its callback path still needs device testing; it is not required for v0.2.

Web storage cannot silently suppress an automation before Safari opens. A web-only grace preference must not promise that behavior. Schedules, if later added, require the same separation of web configuration and Shortcut execution.

Setup diagnostics may truthfully say “Ebb received this test link.” Mark return/cooldown as user-verified only after the phone test. Do not show green checks for installed shortcuts or automatic app launch without evidence. Provide exact manual steps against the tested OS rather than promising Siri will generate a correct automation.

## Offline, data reliability, and upgrades

- Scope the manifest, service worker, assets, and `start_url` to the configured project base (e.g. `/Ebb/`). Hash routes remain useful for static hosting.
- Pre-cache the complete core build and local visual assets. Verify a controlled/cached visit before claiming offline readiness. A fresh device cannot load an uncached app without a network.
- Show an update as available; apply it on a safe screen after the current session has saved. Do not force a reload mid-pause. Retain compatible caches long enough for open clients to finish.
- Treat cache data and personal records separately. A cache refresh must never clear IndexedDB.
- Ask for persistent storage where supported after meaningful use, but treat it as a request, not a guarantee. Export remains necessary for recovery; clearing site data or changing origin can remove access.
- Safari and a Home Screen web app can have separate storage. Identify the current context in support information and test it. Do not claim automatic synchronization or push installation as a fix without checking how the automation opens Ebb.
- Backups contain sensitive personal habit history. Keep them local and user-controlled; omit analytics and cloud upload from this release.

## Verification plan

| Area | Meaningful checks |
| --- | --- |
| Domain unit tests | Separate estimate/contribution; zero values; partial transfer; idempotent decisions; corrections; goal/currency boundaries; local-date summaries |
| Migration tests | Empty/valid/partial/malformed POC data; existing transfers; unknown outcome; repeat migration; interrupted transaction; invalid balance; original blob retained |
| Component tests | Hidden actions cannot be focused; alternative updates one decision; validation messages; successful/failed save; reduced motion setting |
| Browser flows | Direct legacy/new routes; full pause and each decision; refresh/back/resume; two tabs; preview excluded; export→restore round trip; app-base hosting |
| Offline/update | Cached deep link in airplane mode; cached configuration pages; first-load offline explanation; new service worker waits; decisions survive upgrade |
| Real phone | Existing automation, same-URL relaunch, Continue return, expired/in-window cooldown, manual return, Safari/standalone storage, VoiceOver, large text, low-power conditions |

Use Vitest for pure domain/migration logic, React Testing Library where semantics need interaction checks, and Playwright for browser flows. Browser emulation does not replace phone testing. Avoid snapshot tests that merely repeat markup.

Initial performance budgets to validate, not measured results: core JS ≤120KB gzip, first useful cached pause UI within about 500ms on the target phone, responsive actions within 100ms excluding persistence, and no sustained animation frame drops in a ten-second recording. Profile the organic contour on-device; simplify layers before adding an optimization framework. Record actual measured results and conditions in the release checklist.

## Release and rollback

Keep the baseline commit as the reproducible POC. During implementation create a feature branch and small commits; tag a preserved baseline only when starting that work. CI should run type checks, meaningful tests, build, and a base-path smoke test. Document local development, data model, tested iOS setup, and self-hosting.

Rollback has two parts: restore the previous static build and preserve/export the new database. The old POC only understands `pause.v1`; new events are not automatically visible to it. A code rollback must never claim that the user's newest history has rolled back safely without a tested data strategy.

## Implementation decisions — 11 October 2026

The app uses React, TypeScript, Vite, `idb`, Zod, and vite-plugin-pwa. IndexedDB contains `data` and `recovery` stores. The validated version-2 aggregate lives at `data/current`; serialized read-write transactions enforce cross-record accounting rules atomically. This intentionally replaces the proposed separate record stores for the initial personal-scale product. Reads and writes close their database connections, and BroadcastChannel notifies other tabs. A future record-store migration should be versioned and tested before adding large histories.

`src/domain` contains pure accounting/validation and session identity; `src/storage` owns migration and persistence. `src/features` owns screens and forms. The PWA prompts for updates outside a pause, and precaches the shell and local assets. No third-party fonts, analytics, network data API, or runtime image assets are required. CI checks formatting, TypeScript, unit/storage/session tests, and a subdirectory production build.
