# Ebb: next-release plan

Status: v0.2 implemented locally on 11 October 2026; deployment approved on 11 October 2026; actual iPhone acceptance remains pending. See [implementation and verification notes](../IMPLEMENTATION.md).
Prepared 10 October 2026 against commit `7bcd980`.

## The direction

**Ebb gives you a little space between an impulse and a choice.**

The POC has already helped its creator. The next release should make that useful interaction feel warm, effortless, dependable, and personal. Preserve a short pause, an honest choice, the user's own alternatives, and motivation toward a meaningful goal. Expand to more habits through the same simple configuration rather than accumulating new intervention mechanics.

Three decisions are confirmed in this conversation:

1. Brighter Coastal colors: turquoise, coral, and warm sunshine.
2. Organic, softly flowing motion with a slow breathing rhythm.
3. A fixed savings contribution that is independent of estimated spending avoided.

The detailed specifications are in [DESIGN.md](DESIGN.md), [ENGINEERING.md](ENGINEERING.md), and [SOURCES-DECISIONS.md](SOURCES-DECISIONS.md). The interactive [motion preview](motion-preview.html) is an isolated design study, not the next app build. Its editable source is `motion-study.fragment.html`; [PREVIEW-QA.md](PREVIEW-QA.md) records its verification and limits.

## What to preserve and what to change

| Preserve | Improve |
| --- | --- |
| Ten-second default pause | Organic motion and a composed transition into the choice |
| Food, groceries, entertainment starting points | Editable personal pauses, with those three available as presets |
| User-written alternatives | One relevant suggestion at a time, with a simple editor |
| A concrete savings goal | Separate estimates, planned contributions, and money actually moved |
| Static hosting and local data | Reliable validation, migration, backups, and offline support |
| Existing Shortcut entry links | Explicit compatibility and tested return/cooldown behavior |
| No account needed | Clear data ownership and export/restore |

The latest ChatGPT discussion supplies a useful backlog, but its proposed schedules, rich analytics, AI summaries, intention questionnaires, experiments, and multiple goals are not all next-release requirements. The earlier Claude discussion records the user's stronger constraint: keep the interaction simple and grow horizontally. The latest color and motion preferences supersede both discussions' muted visual direction.

## The next release: a focused, polished v0.2

### The complete everyday loop

1. A configured Shortcut or manual action opens a pause directly.
2. Ebb immediately identifies the pause and starts one ten-second cycle. An active pause does not detour into onboarding or a dashboard.
3. One form expands for four seconds and releases for six. The instruction is invitational: “Breathe in” / “Breathe out,” with permission to simply watch.
4. The form settles. “Do you still want to continue?” appears with **Not now** and **Continue**. Neither choice receives failure language.
5. “Try something else” can reveal one personal alternative without adding a competing primary button to the initial decision.
6. Not now records one choice, then optionally suggests a personal alternative. Selecting it updates the same event; it never adds a second contribution.
7. Continue records the choice and offers the configured return action. A manual return remains honest and explicit where a tested callback is unavailable.
8. A brief receipt offers Undo for eligible local changes. The person can leave immediately; visiting the home screen is optional.

A preview/test mode must never increase totals. The user can pause manually or log a missed choice from Home, but those actions are explicitly different from previewing a configuration.

### Home: make progress legible

The home screen should fit the following hierarchy without a wall of statistics:

- A small Ebb wordmark and “A little space for what matters.”
- Today's completed choices, with a neutral breakdown of Not now and Continued. An empty state offers “Try your first pause.”
- One optional goal card: **₹X moved toward [goal]**, with a progress bar based on actual, user-confirmed transfers. A separate line says **₹Y planned to move**.
- An unobtrusive estimated-spending figure, explicitly labeled as an estimate. It must not imply a bank balance or guaranteed savings.
- Your most-used pauses, with a way to start one manually.
- Recent activity and a compact seven-day summary. Manual entries are labeled. The first release does not need a separate analytics destination.

Use three main destinations: **Home, Pauses, Settings**. Hide that navigation during the breathing/decision experience so it remains focused. The active pause must still provide a deliberate exit; define an interrupted session separately from a completed decision.

### Pauses: personal configuration without a long form

Seed Food delivery, Groceries, and Entertainment; allow a custom pause using the same model. A pause has a name, type (spending or attention), a preset color/icon, duration, personal alternatives, and an integration configuration. Advanced integration details stay behind a disclosure.

Spending pauses additionally have an estimated expense and a fixed contribution amount. Attention pauses have no money fields and do not claim minutes saved. Start with a ten-second duration; expose a bounded adjustment in settings instead of presenting “strength” levels and mandatory questionnaires.

People can create, edit, reorder, disable, and archive pauses. Archive preserves history and provides Restore. Existing entry links must continue to resolve; a disabled or archived pause gives a useful message rather than silently becoming a fresh preset.

Alternatives are plain text in v0.2. Add, edit, remove, reorder, and preview them. Seed editable defaults and encourage specific wording such as “Read a few pages of the book by my bed.” Keep “Show another” and avoid immediate repeats. A chosen alternative records intention, not proof that the activity happened.

### A money model that matches the user's intent

Illustrative setup: Food estimate = ₹400; contribution per skipped impulse = ₹150.

| Action | Estimated spending avoided | Planned to move | Actually moved |
| --- | ---: | ---: | ---: |
| First Not now | ₹400 | ₹150 | ₹0 |
| Another separate Not now | ₹800 | ₹300 | ₹0 |
| User records a ₹200 transfer | ₹800 | ₹100 | ₹200 |

The transfer is a record of a real-world action taken by the user. Ebb does not move money. A label such as “Record money moved” is clearer than a one-tap “Mark all as moved.” Let the user enter a partial amount, review it, and correct it later.

Contribution and estimate values are snapshotted at decision time. Editing today's settings never rewrites last month's entries. Permit zero amounts. Do not introduce a daily cap or contribution-credit cooldown: the user rejected that complexity. This is distinct from the working five-minute Shortcut launch cooldown, which prevents repeated interruptions. Prevent duplicate writes from the same session, while allowing distinct genuine choices.

Use one active money goal in v0.2, with a skippable name/target/currency setup. A savings destination such as FD can be optional text; do not hardcode it. Creating a different goal archives the previous goal and its records. Money is never silently reassigned. For the first release, a transfer against the planned pot cannot exceed its available balance; separate top-ups can be a later feature.

### First use, data, and installation

- First normal visit: a brief introduction, choose or customize a pause, optionally add a goal, then try the experience. Offer integration setup after the value is clear.
- Existing-user migration: keep established settings and history, explain the new money labels, and ask for future contribution amounts without blocking an urgent pause.
- Export a versioned backup file. Import shows a validated summary and replaces data only after an explicit review; keep a recoverable pre-import snapshot. Never merge a file silently.
- When storage fails, the pause can still work, but recording must show an accurate “Not saved on this device” state with retry/export options.
- Build the offline app shell early. Install guidance must reflect the browser context actually used by the Shortcut. Do not imply Safari and a Home Screen installation share data.

## Scope boundaries

| Ship in v0.2 | Evaluate after personal use | Defer |
| --- | --- | --- |
| Organic pause, bright Coastal light/dark design | Weekly pattern insights with sample counts | AI coaching and generated advice |
| Neutral decision and personal alternatives | Optional reasons/intention chips | SMS parsing and order detection |
| Configurable pauses and safe legacy links | Schedule-aware intervention | Bank connections or financial transactions |
| One goal and honest contribution accounting | Alternative ranking from explicit choices | Accounts, cloud sync, social features |
| Basic seven-day summary and recent activity | Attention goals without invented time savings | Streak penalties and leaderboards |
| Backups, migration, offline shell | Additional motion styles if requested | Native apps without a demonstrated platform need |
| Documented, tested iPhone setup | Shareable configuration-only alternative packs | Multiple goals, currencies per goal, experimentation system |

## Delivery sequence and acceptance gates

These are implementation slices, not a commitment to dates. Each slice should remain reviewable and have a runnable result.

| Slice | Work | Done when |
| --- | --- | --- |
| 0. Preserve and verify | Record POC commit, sanitized migration fixtures, current routes and working phone setup; settle return strategy | We can reproduce the user's current loop and list supported device/context combinations |
| 1. Approve experience | Coastal tokens, home/decision/alternative layouts, organic motion preview, reduced-motion mode | The user likes the full ten-second cycle and the reveal; money labels are unambiguous |
| 2. Build foundation | Vite + React + TypeScript, storage boundary, schema validation, migration, hash routes, initial offline shell | Old data migrates once, old links work, and a cached direct pause opens offline |
| 3. Ship one vertical flow | One spending pause from entry through animation, choice, contribution, receipt and return action | No duplicate records; neutral copy; keyboard/screen-reader access; correct timer after backgrounding |
| 4. Complete everyday product | Presets/custom pauses, alternatives, Home, one goal, partial transfers, corrections/undo | The food and attention journeys work end to end with correct balances |
| 5. Make setup and recovery usable | Onboarding, integration guide/test flow, export/import, storage errors, theme and motion settings | A new person can set up one pause; an existing person can restore a backup without losing data |
| 6. Release candidate | Device checks, offline/update checks, accessibility/performance review, contributor docs | All release-blocking checks below pass, then the user authorizes release/deployment |

Suggested implementation work can be split into six or seven small PRs following these slices. A speculative analytics layer must not delay the usable core.

## Release-blocking checks

- Every supported direct URL opens the right pause without a onboarding detour.
- The full pause is calm and visibly smooth on the actual iPhone. No flashing, harsh brightness changes, looping background motion, or sudden choice-screen jump.
- Tab, VoiceOver, larger text, reduced motion, small screens, dark mode, and landscape have usable layouts. Hidden decision controls cannot be focused early.
- A double tap, refresh, back/forward navigation, or return from a Shortcut cannot create duplicate money entries.
- Migration, malformed backup, failed persistence, partial transfer, transfer correction, and goal changes preserve the accounting rules.
- Repeated opening of the exact same Shortcut URL starts a new session correctly; no dependence on `hashchange` alone.
- Cached launch works in airplane mode in the browser context actually used by the automation. A first-ever offline visit is not represented as supported.
- An app update waits until the person has finished the pause; the user does not lose a decision during reload.
- Real phone verification covers return without a loop, cooldown expiration, rapid reopening, app switching, and missing integration configuration.

## How to decide whether the release helped

Run a seven-day personal pilot, then review the experience after a longer period if it remains in use. Keep the evaluation local and voluntary. Look for fewer confusing steps, fewer annoying repeat interruptions, alternatives that are actually chosen, and confidence in the recorded money. Compare completed outcomes only with clear denominators; an abandoned pause is not a dismissal. Do not infer reduced screen time, real spending changes, or efficacy from app events alone.

The first follow-up should be about friction and usefulness, not adding features: Does Ebb still feel pleasant on the tenth use? Is Continue easy and nonjudgmental? Can I understand and correct my pot? Does the integration get out of my way when I deliberately switch apps?

## Confirmed implementation baseline

Palette, motion direction, and money semantics are confirmed. The user also confirms a working iOS 27 YouTube automation: a global stored variable `pause_youtube_last` enforces a five-minute launch cooldown, then opens the entertainment route in Safari. Preserve that integration as the baseline. Continue records the choice and explains that the user can switch back; an `Allow <app>` callback is not required for this setup. The provided prompt contains a placeholder deployment URL, so preserve the actual configured URL rather than copying the placeholder or changing origins.

Remaining decisions are the exact fixed contribution amounts and preferred personal alternatives. Keep these configurable and use clearly marked example values in previews. A regression test of the upgraded app on the existing automation remains necessary; the working POC setup does not require another feasibility spike.

## Implementation update — 11 October 2026

The user authorized implementation after reviewing a more translucent breathing treatment. The application now uses one softly shaded, translucent SVG form with a four-second expansion and six-second release at the default duration. Curated Coastal, Orchard, and Playful palettes, System/Light/Dark appearance, and Full/Gentle/Still motion are available. There are no orb size or shape sliders. The original study remains a design reference; the app in `src/` is the implementation.

Local checks are recorded separately from device acceptance in [IMPLEMENTATION.md](../IMPLEMENTATION.md). Do not treat desktop browser checks as validation of the user’s iPhone automation.
