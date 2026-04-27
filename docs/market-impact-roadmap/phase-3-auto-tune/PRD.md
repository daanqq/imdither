# Phase 3.3 PRD: Auto-Tune

Status: done
Last updated: 2026-04-27

## Problem Statement

IMDITHER has curated recipes and manual palette extraction, but users still need
to choose a good starting direction themselves. That is difficult for users who
do not already know whether an image wants clean reduction, ordered mono,
diffusion, screenprint color, blue-noise texture, or halftone treatment.

The product should offer image-aware starting points without hiding the editor
behind one opaque magic result. Recommendations should remain deterministic,
local-first, shareable, and reversible.

## Solution

Add an Auto-Tune analysis pass that reads the current Source Image and returns 3
to 5 recommended Look Snapshots.

Auto-Tune analyzes histogram structure, entropy, edge density, palette
suitability, output size, flatness, gradient structure, noise, and saturation.
It ranks ten deterministic v1 candidate looks:

1. Clean Reduction
2. Fine Ordered Mono
3. High Contrast Ink
4. Screenprint Color
5. Texture/Noise Look
6. Soft Poster
7. Newsprint Mono
8. Low Noise Photo
9. Arcade Color
10. Ink Wash

The user-facing recommendation list remains a 3 to 5 item shortlist selected
from this ranked candidate pool.

Auto-Tune does not apply a recommendation automatically. Users inspect the
recommendation list and apply one through the normal settings transition path.
Applied recommendations are undoable and shareable because they use the same
Look Snapshot contract as the look payload slice.

The slice exit criterion is that users can ask for image-aware starting points,
receive multiple predictable look options, apply one safely, and still edit the
result through normal controls.

## User Stories

1. As an IMDITHER user, I want Auto-Tune to analyze the current Source Image, so
   that recommendations respond to the image I am editing.
2. As an IMDITHER user, I want Auto-Tune to return multiple recommended looks,
   so that I can choose a direction rather than accept one opaque magic result.
3. As an IMDITHER user, I want Auto-Tune recommendations to be deterministic, so
   that the same image and settings produce stable suggestions.
4. As an IMDITHER user, I want Auto-Tune to avoid applying a recommendation
   automatically, so that I stay in control of the current look.
5. As an IMDITHER user, I want applying an Auto-Tune recommendation to use the
   normal settings transition path, so that it works with undo, redo, preview,
   export, and sharing.
6. As an IMDITHER user, I want Auto-Tune to consider histogram structure, so
   that recommendations reflect tonal distribution.
7. As an IMDITHER user, I want Auto-Tune to consider entropy, so that
   recommendations distinguish simple images from visually complex images.
8. As an IMDITHER user, I want Auto-Tune to consider edge density, so that
   detailed images can get crisp or high-contrast options.
9. As an IMDITHER user, I want Auto-Tune to consider palette suitability, so
   that recommendations do not force a poor palette match when extracted color
   would work better.
10. As an IMDITHER user, I want Auto-Tune to consider output size, so that
    recommendations respect the current processing scale.
11. As an IMDITHER user, I want Auto-Tune to include a clean reduction option,
    so that low-edge images can become simple palette-mapped looks.
12. As an IMDITHER user, I want Auto-Tune to include a fine ordered mono option,
    so that photos and soft gradients can get a structured dither direction.
13. As an IMDITHER user, I want Auto-Tune to include a high contrast ink option,
    so that edge-heavy images can become strong graphic output.
14. As an IMDITHER user, I want Auto-Tune to include a screenprint color option,
    so that color images can get a perceptual print-like starting point.
15. As an IMDITHER user, I want Auto-Tune to include a texture or noise option,
    so that smooth areas can get visible screen texture.
16. As an IMDITHER user, I want Auto-Tune to use extracted custom palettes where
    useful, so that recommendations can respond to image colors.
17. As an IMDITHER user, I want Auto-Tune to avoid persisting palette source
    separately, so that the result remains normal Editor Settings.
18. As an IMDITHER user, I want one recommendation to be visually marked as the
    strongest starting point, so that I can choose quickly without losing the
    option to inspect alternatives.
19. As an IMDITHER user, I want Auto-Tune recommendations to become normal
    editable settings after application, so that I can keep tuning the look.
20. As an IMDITHER user, I want applied Auto-Tune recommendations to be
    undoable, so that trying a generated look is safe.
21. As an IMDITHER user, I want applied Auto-Tune recommendations to be
    shareable, so that a good generated starting point can become a repeatable
    look.
22. As an IMDITHER user, I want Auto-Tune to fail clearly when no source image
    is loaded, so that I understand why recommendations cannot be created.
23. As a maintainer, I want Auto-Tune analysis in a pure module, so that image
    heuristics are reusable by future package or CLI surfaces.
24. As a maintainer, I want Auto-Tune recommendations to be Look Snapshots, so
    that the recommendation feature does not invent a second look model.
25. As a maintainer, I want the web app to own recommendation display and apply
    actions, so that browser UI stays separate from deterministic analysis.

## Implementation Decisions

- This is Phase 3 slice 3: `auto-tune`.
- This slice depends on `history-core` and `look-payloads`.
- Auto-Tune analyzes the current Source Image and returns recommendations
  without mutating the editor.
- Auto-Tune returns 3 to 5 recommended Look Snapshots.
- Auto-Tune may mark one recommendation as the strongest recommendation, but it
  does not auto-apply it.
- Applying an Auto-Tune recommendation uses the same settings transition path as
  applying a pasted look.
- Applying an Auto-Tune recommendation creates one normal settings history step.
  Auto-Tune does not add a separate history model. A UI/history label such as
  `Apply Auto-Tune: Clean Reduction` may be used only if the existing history
  transition path supports labels without changing the history contract.
- Auto-Tune analysis includes histogram structure, entropy, edge density,
  palette suitability, output size, flat area ratio, gradient area ratio, noise
  estimate, and mean saturation.
- Auto-Tune v1 uses the added flatness, gradient, noise, and saturation signals
  only to rank and select normal Look Snapshot recommendations. It does not add
  new persisted tuning controls.
- Auto-Tune v1 produces deterministic candidate looks selected by heuristics.
- Auto-Tune v1 candidate looks are Clean Reduction, Fine Ordered Mono, High
  Contrast Ink, Screenprint Color, Texture/Noise Look, Soft Poster, Newsprint
  Mono, Low Noise Photo, Arcade Color, and Ink Wash.
- These archetype labels are canonical for v1 and should be used in the UI
  rather than introducing a second shorter naming set.
- Auto-Tune now keeps ten visible candidate archetypes in core, expands them
  into a bounded hidden candidate pool, and returns the strongest 3 to 5
  user-facing recommendations.
- Auto-Tune ranking now combines deterministic source analysis with rendered
  candidate scoring. Hidden candidates are processed against a bounded sample
  and scored for rendered output fit, perceptual color distance, palette fit,
  structure, edge, texture, banding, and noise signals.
- Auto-Tune v1 marks the top-ranked returned archetype as the recommended
  starting point. `Recommended` is a marker on one normal archetype, not a sixth
  synthetic recommendation.
- The web app does not run recommendation heuristics. It renders the ranked
  recommendation contract returned by core.
- The core recommendation contract includes stable archetype id, label, concise
  visual intent, Look Snapshot, rank, and recommended marker. The web app derives
  compact visual chips from the snapshot and registry metadata.
- Core exposes the Auto-Tune public API from `packages/core/src/auto-tune.ts`
  and re-exports it from `packages/core/src/index.ts`.
- Core API names:
  - `analyzeAutoTuneImage(source: PixelBuffer, context: AutoTuneContext): AutoTuneAnalysis`
  - `rankAutoTuneLookCandidates(source: PixelBuffer, context: AutoTuneContext): AutoTuneRecommendation[]`
  - `recommendAutoTuneLooks(source: PixelBuffer, context: AutoTuneContext): AutoTuneRecommendation[]`
- `AutoTuneContext` includes the current normalized `EditorSettings` and source
  or output dimensions needed to produce valid recommendation settings.
- `AutoTuneAnalysis` is a deterministic metrics object for histogram, entropy,
  edge density, palette suitability, output size, flatness, gradient, noise, and
  saturation signals.
- `AutoTuneRecommendation` contains `id`, `label`, `intent`, `snapshot`, `rank`,
  and `recommended`. The `snapshot` field is a normal `LookSnapshot`.
- Clean Reduction favors direct palette mapping with perceptual matching and
  extracted custom palette variants of 8, 16, or 32 colors for low edge density
  images.
- Fine Ordered Mono favors Bayer 8x8 with grayscale palettes for photos and soft
  gradients.
- High Contrast Ink favors black and white with Atkinson or Floyd-Steinberg and
  a contrast adjustment for high edge density images.
- Screenprint Color favors Screenprint 16 with perceptual matching and
  color-preserving preprocessing for color images.
- Screenprint Color may use an extracted custom palette of 16 or 32 colors when
  the source image fits adaptive color better than the preset screenprint
  palette.
- Texture/Noise Look favors blue-noise or halftone-dot algorithms for images
  with large smooth areas.
- Soft Poster favors `none` or Stucki with Soft 8 or 6 Gray palettes and a
  quieter tonal curve.
- Newsprint Mono favors Halftone Dot with Black / White and high contrast.
- Low Noise Photo favors Atkinson or Sierra Lite with Gray 6 or Screenprint 16
  and restrained contrast.
- Arcade Color favors Bayer 4x4 or Sierra Lite with PICO-8 or C64 and nearest
  resize.
- Ink Wash favors Blue Noise or Burkes with Warm Mono or Blue Ink and softer
  monochrome tone.
- Auto-Tune may use extracted palettes as normal custom palettes only for Clean
  Reduction and Screenprint Color hidden candidate variants.
- Fine Ordered Mono, High Contrast Ink, and Texture/Noise Look keep their
  stylistic intent through preset palettes rather than image-extracted custom
  palette variants.
- Auto-Tune may create a 32-color custom palette, but it does not add a
  `colorDepth.limit` value of 32 or require an Editor Settings schema change.
- Auto-Tune preprocessing recommendations are limited to existing Editor
  Settings fields: brightness, contrast, gamma, invert, and color mode. It does
  not describe or require future blur, sharpen, or denoise fields.
- Auto-Tune does not persist palette source, palette analysis data, or internal
  recommendation reasoning in Editor Settings.
- Auto-Tune domain logic belongs in the core package so future package, CLI, or
  automation surfaces can reuse it.
- Auto-Tune core APIs accept DOM-free pixel buffers plus explicit context such
  as current Editor Settings and output size. Browser-only objects such as
  `ImageData`, `File`, `HTMLImageElement`, or canvas references stay in the web
  source-intake and orchestration layers.
- The web app runs Auto-Tune v1 on the main thread against a sampled or
  downscaled pixel buffer when a Source Image is loaded or replaced. Worker
  protocol changes are out of scope unless implementation evidence shows the
  analysis blocks the UI enough to require a follow-up performance slice.
- Auto-Tune v1 analysis uses a sampled image with a maximum long edge of 256 px.
  This sample is used for classification and ranking only; recommendation
  application still produces normal full-output Editor Settings.
- Browser recommendation display, user notifications, and apply actions belong
  in the web app.
- The web app presents Auto-Tune as the generated looks section in the `Looks`
  tab. Auto-Tune is the simplest first path through the app; the inspector
  remains the detailed manual editing surface for users who want deeper control.
- Auto-Tune is deterministic and local-first; it does not use a backend service
  or ML model.

## Testing Decisions

- Good tests should assert deterministic recommendation contracts and valid
  settings output rather than internal heuristic implementation details.
- TDD implementation starts with a core public recommendation contract tracer
  test before UI panel work. The first tracer should verify that a compact
  representative source returns stable valid Look Snapshot recommendations with
  one recommended item.
- Auto-Tune analysis tests should verify deterministic histogram, entropy, edge
  density, palette suitability, output-size, flatness, gradient, noise, and
  saturation analysis on compact fixtures.
- Auto-Tune recommendation tests should verify that the same input returns
  stable recommendations.
- Auto-Tune recommendation tests should verify that recommendations are valid
  Look Snapshots with valid Editor Settings.
- Auto-Tune recommendation tests should verify that recommendation count stays
  within the 3 to 5 item contract.
- Auto-Tune recommendation tests should verify that core ranks one winner per
  visible candidate archetype while the public recommendation shortlist stays
  within the 3 to 5 item contract.
- Auto-Tune recommendation tests should verify that extracted custom palettes,
  when used, are normal custom palettes in Editor Settings.
- Auto-Tune tests should verify that bundled/precomputed demo recommendations
  conform to the same public recommendation contract as runtime-generated
  recommendations.
- Auto-Tune recommendation tests should verify that applying a recommendation is
  represented as a normal settings application, not a separate settings model.
- Palette extraction tests are prior art for deterministic image-derived
  palette behavior.
- Processing preset tests are prior art for validating curated look definitions
  without persisting recipe identity.
- Look Snapshot tests from the previous slice are prior art for recommendation
  payload validation.
- Component tests, if added, should assert visible recommendation controls and
  emitted apply intents, not internal React state.

## UI Component Decisions

- Add a dedicated Auto-Tune panel component instead of embedding Auto-Tune
  heuristics inside manual controls.
- Place the Auto-Tune panel at the top of the `Looks` inspector tab.
- The Auto-Tune panel should read as the primary quick-start work surface: more
  prominent than manual controls, but still quiet, utilitarian, and consistent
  with the editor. It should not use marketing copy, assistant-like theatrics, or
  decorative motion.
- The Auto-Tune panel owns the generated looks header, loading state, empty
  state, inline error state, and ranked recommendation list.
- Even though the app normally starts with the bundled demo source, no-source
  Auto-Tune availability is represented as an inline disabled/empty panel state
  rather than a global app error.
- Runtime Auto-Tune analysis failures are shown inline in the Auto-Tune panel.
  Global app errors remain reserved for broader import, processing, and export
  failures.
- Auto-Tune runs automatically when a Source Image is loaded or replaced. It
  does not recalculate recommendations while users adjust manual controls.
- Loading a different Source Image clears the previous recommendation list so
  stale image-specific recommendations are not shown for the new source.
- Because the app starts with a bundled demo source, the web app may seed the
  Auto-Tune panel with precomputed recommendations for `source.id === "demo"` so
  the initial experience does not need to run analysis on every page load.
- For the bundled demo source, precomputed recommendations may appear in the
  Auto-Tune panel immediately after demo load. User-loaded sources run the
  normal runtime Auto-Tune path after upload.
- The precomputed demo seed shows the same top 5 shortlist that runtime
  analysis currently returns for the bundled `demo.png`: Fine Ordered Mono,
  Screenprint Color, Texture/Noise Look, Newsprint Mono, and Clean Reduction.
  Runtime analysis for user-loaded sources still returns the strongest 3 to 5
  ranked recommendations from the ten-candidate pool.
- Precomputed demo recommendations must use the same Auto-Tune recommendation
  contract as runtime analysis. They are a bundled demo shortcut, not persisted
  recommendation history or a separate settings model.
- The core runtime recommendation path remains the source of truth. The demo
  shortcut must not become the only way to produce demo-compatible
  recommendations.
- Precomputed demo recommendations are stored as typed TypeScript
  recommendation/settings fixtures, not encoded Look payload strings, so schema
  validation and diffs remain readable.
- Store bundled demo recommendation fixtures in `apps/web/src/lib/demo-auto-tune.ts`
  because they are a web onboarding shortcut, not the core source of truth.
- Recommendation cards show the archetype label, optional `Recommended` marker,
  concise visual intent, and compact setting chips such as algorithm, palette,
  color mode, and tonal direction.
- Recommendation cards do not show numeric confidence or score values in v1.
  Ranking is communicated by list order and the `Recommended` marker.
- Applying a recommendation from the Auto-Tune panel emits the same normal
  settings application used by pasted Look Snapshots.
- After a recommendation is applied, the Auto-Tune panel remains visible and
  keeps the recommendation list open. The applied recommendation is marked, and
  the user can still apply another recommendation or continue manual editing in
  the inspector.
- The applied marker is local to the current recommendation list and records the
  recommendation the user clicked. It is not derived from recipe matching or a
  hidden recommendation identity in Editor Settings.
- Manual settings changes clear the applied marker so the UI does not imply the
  current edited look still exactly matches the clicked recommendation.
- The inspector does not own Auto-Tune heuristics or recommendation state. It
  remains the manual editing surface after a recommendation has been applied.
- Auto-Tune recommendation state, loading state, error state, and applied marker
  are runtime UI state owned by the app shell or a local hook. They are not
  persisted in the Zustand editor store.
- Use a dedicated local hook at
  `apps/web/src/lib/use-auto-tune-recommendations.ts` to own recommendation
  state, loading state, inline error state, demo seeding, source resets, and
  applied marker clearing. `App.tsx` remains responsible for source wiring and
  applying selected recommendation settings through the existing transition path.
- Manual settings changes clear the applied marker through an explicit hook
  action from manual transition paths, not by observing every `settings` object
  change. This avoids clearing the marker immediately after applying an
  Auto-Tune recommendation.

## Out of Scope

- No automatic application of Auto-Tune results.
- No ML or neural recommendation model.
- No backend analysis service.
- No render-and-score loop for generated candidate outputs.
- No persistent recommendation history.
- No recipe marketplace.
- No custom recipe editor.
- No effect stack work.
- No dithering strength or diffusion amount control.
- No blur, sharpen, or denoise preprocessing controls.
- No alpha dithering, transparency dithering, matte auto-selection, or separate
  alpha recommendation model.
- No motion, batch, CLI, WASM, or GPU work.
- No storing palette source, analysis metrics, or recommendation reasoning in
  Editor Settings.
- No new Editor Settings schema version unless implementation discovers a
  processing-field requirement that cannot be handled through current schema
  version 2.

## Further Notes

Auto-Tune should feel like a deterministic recommendation engine, not magic
editing. It proposes normal looks, the user chooses, and the rest of the editor
continues to operate on ordinary Editor Settings.
