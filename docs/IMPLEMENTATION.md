# Ebb v0.2 — implementation and verification

Implemented locally on 11 October 2026, from POC commit `7bcd980`. The source is in this repository. The user approved committing and deploying this build on 11 October 2026; GitHub Pages is configured to publish the tested build at the existing `/Ebb/` address. The original POC remains recoverable from Git.

## Implemented

- React + TypeScript application with Home, Pauses, Settings, activity, onboarding, and a focused direct-entry pause screen.
- Brighter Coastal colors, with optional Orchard and Playful palettes; System/Light/Dark appearance.
- A translucent breathing form with blended internal light, subtle contour variation, and smooth expansion/release. Full/Gentle/Still controls; device reduced-motion preferences override animation. No shape or size sliders.
- Ten-second default pause, bounded duration adjustment, deadline-based progress, and no decision controls before the timer finishes. A hidden tab pauses rendering; return resumes from elapsed time.
- Neutral Not now / Continue choices, personal alternatives, preview mode excluded from records, and manual logging.
- Presets plus custom pauses; editing, ordering, disabling, archiving, and restoring without removing history.
- Separate estimated expenses, fixed contributions, and recorded transfers. One active optional goal, partial transfer review, immutable monetary snapshots, goal history, currency reset for future settings, and guarded Undo.
- IndexedDB transactions, cross-tab notifications, one-time POC migration preserving `pause.v1`, validated export/import, and a recoverable pre-import/fresh-start snapshot.
- Offline shell, locally bundled icons, and an update prompt outside the active pause. No account or network data service.
- Existing `#/food`, `#/groceries`, and `#/entertainment` routes; custom `#/pause/<id>` routes; existing manual Safari return; optional user-configured named return Shortcut.
- Contributor README, formatting, and GitHub Actions validation. Approved pushes to main deploy the tested build to GitHub Pages.

## Automated verification

`npm run check`: TypeScript compilation and **26 passing tests** across accounting, migration, persistence, and session identity.

Covered: independent contributions/estimates; partial transfer balances; idempotent sessions; zero values; attention and Continue exclusions; historical snapshots; overdraw and Undo protection; archived goals and currencies; strict amount parsing; duplicate/foreign record rejection; deterministic POC migration; backup roundtrips; unknown or malformed backups; serialized concurrent writes; concurrent overdraw rollback; recoverable replacement; preserving corrupt originals; five-minute legacy session reuse/expiry; new explicit launch tokens; revisited explicit URLs; preview isolation; malformed session storage; stale configuration after a currency change; archived pauses; legacy default amounts.

Production builds completed for relative hosting and `EBB_BASE=/Ebb/`. Formatting checks pass. The production app is approximately 112 kB gzipped JavaScript plus 5.4 kB CSS, with about 398 KiB of precached local resources. These are build sizes, not device performance measurements.

## Browser verification

Used the local production build in the desktop in-app browser with synthetic data only, including phone-sized 390 px and 320 px layouts.

- Onboarding can be skipped; a new direct legacy URL bypasses it.
- Created a sample goal, set a ₹100 food contribution against a ₹400 estimate, completed the pause, and selected an alternative. One decision and ₹100 contribution remained after reload.
- Recorded a partial ₹60 transfer: ₹60 moved, ₹40 still planned, ₹400 estimated spending avoided. Undoing its funding choice was rejected with a useful explanation.
- Inspected the home, breathing, configuration, dialog, settings, activity, and setup screens. Dark mode and Still settings persisted. The phone layout retained navigation and readable controls without horizontal page overflow in inspected views.
- Stopped the local server, opened/reloaded the cached legacy entertainment route, and saved a Continue choice successfully. This tests cached operation with a network-unavailable origin, not iPhone airplane mode.
- Applied a pending service-worker update from Settings and retained the sample history.
- Exported a backup through the UI, selected that file for import, reviewed the counts, replaced local data, and verified the recovery acknowledgement and retained history.
- Loaded `#/groceries` on a fresh `/Ebb/` preview origin with matching build/preview base configuration. The direct pause rendered without onboarding.
- Inspected browser error/warning logs during the flows; none were reported.

Screenshots and a copy of these notes are available in the task's `outputs/ebb-build` folder. The local preview contains sample records used for verification; they are browser-local and are not shipped in the app defaults.

## Remaining release gates

These require the actual iPhone and the actual deployment URL. Desktop checks do not establish them:

1. Review the complete animation on the user's iPhone: smoothness, translucency, comfort, portrait/landscape, larger text, and VoiceOver.
2. Run the existing iOS 27 YouTube automation in Safari: Continue/manual switch back, rapid reopening during cooldown, another opening after five minutes, background/resume, and same-URL behavior.
3. Confirm cached launch in airplane mode, an app update, and persistence in the exact browser context used by the Shortcut. Safari and Home Screen storage must not be assumed to match.
4. Export the real POC history before migration and verify its actual shape against the migration. Automated fixtures are sanitized representative data, not the user's live data.
5. The Pages API confirmed the existing public address as `https://kaivdev4434.github.io/Ebb/`; deployment preserves it. Verify the phone Shortcut targets that address. The original description contained a placeholder, so its precise installed URL remains unobserved.

## Known boundaries

Safari may resume an already visible same-hash page without providing a distinct launch event. Ebb handles reloads and visibility/page-show resume of expired completed sessions, and exposes New pause. A fresh `?launch=<timestamp>` on each accepted Shortcut launch provides unambiguous identity; it complements the existing five-minute Shortcut cooldown.

Data is local to the browser. It is not synced or permanently backed up by installation. Keep exported backups. Imported data replaces rather than merges, after review; one pre-replacement recovery snapshot is retained. A POC code rollback cannot read new v0.2 events automatically.

The goal of this build is the complete agreed v0.2 loop. AI coaching, schedules, bank integrations, cloud accounts, and elaborate analytics remain deferred.
