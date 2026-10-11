# Sources, decisions, and remaining questions

Reviewed 10 October 2026. Shared discussions were read in the browser after the web reader could not fetch them. Their suggestions are design input, not verified product/platform behavior.

## Inputs and how they influenced this plan

| Input | Relevant signal | Treatment |
| --- | --- | --- |
| [Original Claude discussion](https://claude.ai/share/70070d99-a980-4251-a824-2aa48309cccc) | A pause before food/grocery spending, later attention habits; personal alternatives; simple open-source static app; user rejected caps/SMS complexity | Preserve the simple, personal, horizontally extensible product |
| [ChatGPT improvement discussion](https://chatgpt.com/share/6aca43bc-2090-83ee-8d7c-c43f7f9e1638) | UI/UX improvement, neutral decisions, clearer money, migration, offline support, extensive backlog | Adopt the core quality improvements; stage larger features after a usable release |
| [Repository](https://github.com/KaivDev4434/Ebb), commit `7bcd980` | Concrete POC behavior | Source of truth for current code; audit locations in ENGINEERING.md |
| Current user request | Plan in the cloned repo; implement later; brighter colors; much better calm animation | Documentation and isolated motion study only |
| Current user answers | Separate fixed contribution, Coastal colors, organic motion | Confirmed product/design direction |

## Decisions

| Decision | Status | Reason |
| --- | --- | --- |
| Coastal turquoise/coral/sunshine | Confirmed | Explicit current preference |
| Organic soft form and slow rhythm | Confirmed | Explicit current preference; basic scaling circle is insufficient |
| Fixed contribution separate from estimated expense | Confirmed | Explicit current answer and original motivation |
| iOS 27, Safari entry, five-minute launch cooldown | User-verified baseline | YouTube automation uses global stored `pause_youtube_last`; generated from the user's description and reported working |
| Preserve existing automation; callback optional | Proposed implementation treatment | Supplied route omits `app`, so its POC Continue does not invoke `Allow <app>` |
| No implementation of the application yet | Confirmed scope | User wants to plan/discuss before implementation |
| Local data, static hosting, no account | Proposed, strongly supported | Consistent with original open-source intent and POC |
| Ten-second default, four-second expansion/six-second release | Proposed, retain baseline | Familiar behavior; exact motion still needs review |
| Two main decisions, alternatives on demand or after Not now | Proposed | Retains personal alternatives while reducing competing actions |
| Three presets plus configurable custom pauses | Proposed | Horizontal expansion through the same mechanism |
| One optional active money goal | Proposed | Keeps the first release understandable |
| No skip cap; duplicate-session prevention only | Retain prior preference | User rejected daily limits and added complexity |
| Core summary on Home, richer Insights later | Proposed | Keep scope centered on daily value |
| React/TypeScript and transactional IndexedDB | Proposed | Maintainable UI and reliable migration/accounting; validate size budget |

## Platform facts checked against primary sources

- [Apple: setting triggers](https://support.apple.com/en-tm/guide/shortcuts/apde31e9638b/ios) says the App “Is Opened” trigger includes switching to the selected app. This supports treating return loops as a real integration risk.
- [Apple: run a Shortcut with a URL](https://support.apple.com/en-euro/guide/shortcuts/apd624386f42/ios) documents the named-shortcut URL scheme and optional text input. It does not prove a specific shortcut exists on a user's device.
- [WebKit: Home Screen storage isolation](https://webkit.org/blog/11338/cname-cloaking-and-bounce-tracking-defense/) documents isolation from Safari. This is historical platform documentation; exact launch/storage behavior should still be tested on the supported current devices.
- [WebKit: Safari storage policies](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/) describes the Storage API and persistence/eviction behavior. Local-only storage is not equivalent to guaranteed permanent storage.
- [MDN: service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) covers app-shell caching and the secure-context requirement. Ebb's proposed offline acceptance tests follow from this mechanism, not from an assumption that installing alone guarantees offline availability.
- [MDN: Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) describes animation control and reduced-motion considerations. The proposed timing and shape are Ebb design choices, not evidence of therapeutic effectiveness.

The reviewed Apple sources did not independently verify the previous discussion's precise iOS 27 instructions. The user subsequently confirmed iOS 27 and a working YouTube automation generated from their description, using the global stored variable `pause_youtube_last`, automatic app-open execution, a five-minute launch cooldown, and Safari entry. Those specific behaviors are now user-verified for their setup. The agent has not inspected the generated actions; unrelated claims about the entire iOS 27 automation UI remain unverified. The supplied URL is a placeholder template, not evidence of the actual deployment address.

The discussions cite external research about other products. This plan does not adopt their effect-size claims as evidence that Ebb will produce the same outcomes. Product validation here is a personal usability pilot; any efficacy statement would need a separate evidence review.

## Questions to settle next

1. What fixed contribution should Food and Groceries use? These can be changed later; preview examples are not defaults chosen for the user.
2. Which three to five personal alternatives should seed the user's own setup?
3. After seeing the motion study, is the form too liquid, too slow, or just right? Is the transition into the decision calm enough?

No additional question is required to finish this plan. The integration mechanism is sufficiently established to plan against. Check the actual deployed URL before rollout, preserve the existing Shortcut, and keep amounts and alternatives configurable.

## What has and has not been verified

- Completed: both shared discussions read; repository cloned in the requested Desktop project folder; current source inspected; source-backed integration constraints checked; planning documents drafted.
- Design-study verification is recorded separately with the preview once it has been inspected.
- Not yet completed: app implementation, dependency installation, production deployment, migration on real personal data, or iPhone automation testing. No claim is made that the proposed motion or stack has passed those future release gates.
