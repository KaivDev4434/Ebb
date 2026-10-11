# Ebb

A little space between impulse and choice. A private, offline-capable app for taking a short pause before ordering, shopping, or scrolling.

Version 0.2 replaces the single-file proof of concept with a React + TypeScript app. It includes a brighter Coastal palette, translucent breathing motion, personal alternatives, editable pauses, optional goal tracking, and recoverable backups. No account, analytics, bank connection, or cloud sync.

## Run locally

Use Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

For an offline-capable production preview:

```sh
npm run check
npm run build
npm run preview
```

Open the URL printed by Vite. Service workers are enabled in the production build, not the development server. The first visit must be online. A new build offers an update outside the active pause; accept it to replace a previously cached version.

```sh
npm run format:check
npm run format
```

## What the money means

Each spending pause has an estimated expense and a separate fixed contribution. Skipping a ₹400 impulse can add ₹100 to the plan. Recording a ₹60 transfer then leaves ₹40 planned and ₹60 actually moved. Ebb records your real-world transfer; it never moves money itself.

Attention pauses and Continue add no money. Choosing an alternative updates the same choice. Reloads and repeated taps cannot credit the same session twice. Undo cannot make a goal's balance negative. A different goal archives the old one; changing currency clears future pause amounts for reconfiguration and preserves historical amounts.

## Your existing Shortcut

The legacy `#/food`, `#/groceries`, and `#/entertainment` routes remain supported, alongside `#/pause/<id>`. Direct launches bypass onboarding.

Keep your working iOS 27 Safari automation and its five-minute `pause_youtube_last` cooldown. Continue saves the choice and tells you to switch back manually. An optional named return Shortcut can be configured in a pause after testing it on your phone.

Safari does not always produce a new navigation event when opening the exact same URL. Ebb checks resumed completed sessions after five minutes and offers **New pause**. For an unambiguous launch, append a fresh timestamp to the hash route, for example `#/entertainment?launch=UNIQUE_TIMESTAMP`. The timestamp changes for each accepted launch; retain the Shortcut's existing cooldown.

Settings → Shortcut setup provides links and a phone checklist. Safari and a Home Screen installation may have separate storage. Use the context your automation opens, or move data explicitly with a backup.

## Storage and backups

The app uses IndexedDB (`ebb.v2`). A validated aggregate document is updated atomically so a contribution, transfer, and goal cannot be partially committed. BroadcastChannel refreshes other open tabs.

On first use, compatible `pause.v1` POC data migrates once. The original localStorage value remains intact. Historical POC amounts retain their original combined estimate/contribution meaning; future amounts can be edited independently. Invalid data is reported instead of replaced silently.

Settings can export a versioned JSON backup. Import validates the file, shows a summary, then explicitly replaces local data after review. A recovery snapshot is kept before replacement or a fresh start. Back up before clearing browser data, moving to a different origin/device, or uninstalling. Local storage is not a permanent backup.

## Static hosting

The default build uses relative asset paths. For a known deployment subdirectory:

```sh
EBB_BASE=/Ebb/ npm run build
EBB_BASE=/Ebb/ npm run preview
```

Serve the contents of `dist/` over HTTPS. Hash routes need no server-side route rewriting. Do not publish the source `index.html` without building. GitHub Pages uses `.github/workflows/ci.yml`: pushes to `main` run formatting, type checks, tests, and a build with `/Ebb/` as the base, then publish `dist/`. Pull requests run the checks without deploying. The public address is https://kaivdev4434.github.io/Ebb/.

Preserve the existing public origin and path used by your automation. Browser storage is origin-scoped; changing origin does not move history. The original POC is preserved in Git at `7bcd980`. A code rollback alone does not convert v0.2 history back to POC format.

## Status and documentation

Implemented and verified locally, with GitHub Pages deployment configured for the existing `/Ebb/` address. Actual iPhone acceptance checks remain pending.

- [Implementation and verification notes](docs/IMPLEMENTATION.md)
- [Product plan](docs/planning/PLAN.md)
- [Design and motion](docs/planning/DESIGN.md)
- [Engineering decisions](docs/planning/ENGINEERING.md)
- [Discussion sources and decisions](docs/planning/SOURCES-DECISIONS.md)
- [Earlier motion study](docs/planning/motion-preview.html)
