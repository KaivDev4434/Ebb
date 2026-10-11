# Ebb visual and motion specification

Status: implemented locally, with the translucent treatment refined after user review. Actual iPhone motion review is pending.

## Feel

Bright, welcoming, tactile, and unhurried. The app should feel like a small breath of fresh air. Use generous clear space, rounded but purposeful shapes, warm readable surfaces, and concentrated color. The intervention is visually sparse; Home can be more expressive through colored pause tiles and a cheerful goal card.

Retain Ebb as the product name throughout title, app icon, installation metadata, navigation, backups, and documentation. “Pause” names the action.

## Coastal palette

| Semantic role | Light | Dark | Usage |
| --- | --- | --- | --- |
| Page | `#FFFCF5` | `#102C31` | Warm ivory / deep teal canvas |
| Surface | `#FFFFFF` | `#193A40` | Cards, sheets, fields |
| Text | `#173F43` | `#F0FAF8` | Primary copy |
| Secondary text | `#52696C` | `#ADC8C8` | Supporting copy, labels |
| Main action | `#007F78` | `#57DACC` | Filled buttons; light text in light mode, deep text in dark mode |
| Luminous turquoise | `#27CDBA` | `#57DACC` | Breathing form and category illustration |
| Coral | `#F58B73` | `#FFAA91` | Spending accents, small warm details |
| Sunshine | `#FFD166` | `#F6CD75` | Goal accents and selected highlights |
| Soft sea | `#E0F7F0` | `#234C50` | Quiet contextual surface |
| Border | `#CEDFD9` | `#426067` | Fields and necessary structure |

Use darker turquoise for a light-mode primary button so white text remains readable. The brighter turquoise, coral, and yellow are not small-text colors on ivory. Labels on pastel surfaces use the dark ink. Color never communicates a result by itself. Verify all actual token pairings during implementation, including disabled controls, focus rings, and dark surfaces; target WCAG AA text contrast and clearly visible non-text controls.

For comparison, optional palette studies can use Orchard (leaf green/peach/gold) and Playful (periwinkle/apricot/mint). Coastal is the selected baseline. Do not present three app themes as a release requirement merely because three studies exist.

## Layout and type

- System rounded font where available, then system UI. Avoid a network font dependency on the pause path.
- Base text 16–17px; supporting text at least 14px; main headings 28–32px. Keep sentence lengths short.
- A 4px spacing scale, usually 20–24px screen gutters. Main controls at least 48px high, with adequate separation.
- Cards: 20–24px radii; buttons: 16px. Small elevations are allowed where they explain layering; do not blanket the screen with shadows.
- Phone content width around 440px, with responsive layout rather than a rigid phone frame in production. Wider Home layouts may use two columns.
- Safe areas belong on the actual scroll/layout containers. Respect dynamic viewport changes and the software keyboard.
- Use clear labeled icons, not emoji as the only identifiers. The brand may use an abstract rising-and-falling shape; the motion itself should be recognizable without a mascot.

## The breathing form: Organic Ebb

The user explicitly asked for calm animations that are more accomplished than the current scaling circle. The improvement is a coordinated motion language, not additional movement everywhere.

### Composition

One softly asymmetrical form occupies a stable 260–300px stage. Its silhouette gently changes shape while it expands and releases. A second, faint offset layer supplies depth; a small tonal gradient gives the main form volume. Keep contour modulation subtle—roughly 3–6% of radius. Avoid liquid turbulence, particle systems, pulsing neon bloom, constant rotation, or a bouncing spring.

The form should resemble something breathing, not a loading indicator. No perpetual spin. No full-screen hue cycling. It begins already visible so there is no empty first frame. The ten-second rhythm starts only once the pause content is ready.

### Timeline (default ten seconds)

| Time | Form | Text / interaction |
| --- | --- | --- |
| 0–300ms | Soft arrival, already at resting size | Pause name is immediately legible |
| 0–4,000ms | Resting scale about 0.76 to full size; smooth start and zero-velocity crest | “Breathe in” |
| 4,000–10,000ms | Slow release to resting size; slightly changing contour settles | “Breathe out” replaces the cue with a short crossfade |
| 10,000–10,450ms | Settles without a snap; any positional shift is small | “Your choice” / decision prompt appears; actions unlock at 10 seconds |
| After choice | One restrained acknowledgement, then stillness | Receipt and optional personal alternative; leaving is always immediate |

The arrival and settle are visual treatments inside/around the timer, not extra mandatory waiting. Scale and contour derive from one timeline. A smooth half-cosine envelope for each breath phase yields zero velocity at phase boundaries. Use a zero-slope transition for the contour changes as well. No automatic breath-hold. Breathing language is optional guidance; users can simply watch.

Initial design preference: no large numeric countdown. A restrained progress cue can be tested if users are unsure when choices appear. Do not layer a loud ring, a numeric timer, animated text, and a morphing form simultaneously.

### Motion elsewhere

| Interaction | Proposed treatment | Timing |
| --- | --- | --- |
| Button press | 1–2% compression on the pressed surface, prompt release | 90–140ms |
| Decision reveal | Opacity and 6–10px translation inside reserved space | 300–450ms |
| Alternative change | Short text crossfade; card height remains stable when possible | 180–220ms |
| Sheet open/close | Gentle translation and scrim change, no overshoot | 240–300ms |
| Tab navigation | Direct content replacement with a short fade if useful | 120–180ms |
| Goal contribution/transfer | Animate the progress change only when it actually changes | 400–600ms |
| Receipt / Undo | Calm appearance, no confetti; at least 8 seconds to Undo | 160–220ms |

Do not count up every number on every visit. Do not animate all cards in a stagger each time Home opens. No sound or haptics are required; platform support and user control would need separate design before adding them.

### Accessibility and lifecycle

- Reduced motion uses a static form with a plain text phase/time indicator; remove morphing, scaling, moving rings, and sliding transitions. Offer an in-app “Still” setting as well as honoring the OS preference. Never let a normal app setting silently override an OS request for reduced motion.
- Do not announce each animation frame or countdown second. Announce phase changes and the availability of the decision once, through a polite status region.
- Decision controls must be disabled/inert or not rendered during the breath, not merely opacity-zero and pointer-disabled. Preserve a meaningful focus order when they become available.
- On backgrounding, stop visual updates. On return, derive the state from the elapsed deadline; never replay ten seconds that have already passed. Do not log a choice merely because the timer expired.
- Stop every animation and callback when the session changes. Honor runtime changes to reduced-motion preferences.
- No animation may be needed to understand state, and no recorded action should wait for a decorative animation to finish.

### Implementation approach

Prefer CSS/WAAPI for transforms and opacity. If the chosen organic contour needs a custom renderer, use a small bounded SVG path with a single requestAnimationFrame loop. Keep it independent of React re-renders; render the surrounding screen normally and update the visual through a dedicated controller. Suspend work when hidden. Avoid canvas/WebGL, a physics engine, Lottie, or a large motion package unless profiling proves a specific need.

The preview is a visual direction study. Final engineering must cover deadline persistence, cross-tab/session identity, visibility transitions, and device performance separately. A good desktop preview is not evidence of smoothness or Shortcut reliability on an iPhone.

## Screen compositions

### Pause

Small pause name → brief invitation → organic stage → breath cue. Keep layout height stable across the transition. At completion, the visual settles and the decision area becomes the focus. Two clearly labeled actions, plus one quiet route to alternatives. “Continue” is visually secondary but fully readable and reachable.

### Alternative

A compact sheet or in-place card contains one user-selected suggestion, “Show another,” “Choose this,” and a simple dismiss action. No full list of habits at the moment of impulse. Choosing one records the intended alternative and returns a calm receipt. If opened after Not now, amend the same event. If opened before deciding, choosing it resolves that same pause as an alternative outcome.

### Receipt

Attention: “Choice recorded.” Spending: “₹150 added to your plan.” Supporting copy can show “Estimated spending avoided: ₹400.” Neither should say that money was transferred. Undo is clearly visible; a later activity edit covers a missed toast. A completed alternative is never claimed merely because it was selected.

### Goal

“Apple Watch” or the user's goal name, actual moved amount and target, a simple progress bar, planned amount, and “Record money moved.” No preset personal target in production. Preview figures are illustrative. When there is no goal, Home remains useful and offers a small optional invitation.

## Design acceptance

Review the full experience, not just screenshots: start, crest, release, decision reveal, alternative selection, receipt, return to Home, theme change, and reduced motion. Test at 320px width, the user's actual phone size, and with large text. The motion should feel pleasant after repeated use. If the layered form looks busy or has visible edge wobble, reduce the secondary layer and contour amplitude before adding more effects.

## Implemented motion treatment

Use a single blended translucent SVG form with soft internal light, subtle contour variation, and smooth inflation/deflation. Avoid separated halos and heavy jelly-like deformation. Full and Gentle use the same breathing rhythm with different expansion ranges. Still and the operating system’s reduced-motion preference hold the form static while time advances. The default ten-second cycle expands for four seconds and releases for six; custom durations preserve that ratio. Motion stops when hidden and resumes from the actual deadline.
