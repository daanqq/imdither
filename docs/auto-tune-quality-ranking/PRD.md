# Auto-Tune Quality Ranking PRD

Status: done
Last updated: 2026-04-27

## Problem Statement

Auto-Tune currently gives users deterministic image-aware starting points, but
its ranking is based mainly on source-image analysis and fixed archetype
scoring. This helps choose a likely direction, but it does not directly check
whether a candidate look actually produces a better processed result.

From the user's perspective, this can make the top recommendation feel plausible
but not always visibly strongest. Similar candidates can also crowd the visible
shortlist, and the candidate pool is still small enough that some useful
dithering directions are not explored.

The product needs a stronger Auto-Tune system that keeps the current local-first,
deterministic, editable Look Snapshot contract while improving candidate
coverage and ranking quality.

## Solution

Add a second-generation Auto-Tune ranking pipeline.

Auto-Tune should keep its current public behavior: analyze the current Source
Image, rank candidate looks in core, return a 3 to 5 recommendation shortlist,
mark one recommendation as strongest, and apply recommendations as normal Look
Snapshots through the existing settings transition path.

Internally, Auto-Tune should evolve from a source-only heuristic ranker into a
two-stage scorer:

1. A fast source-analysis stage classifies the image and produces scoring priors.
2. A rendered-candidate stage processes candidate looks on a small deterministic
   sample and scores the actual output against image-quality and style-fit metrics.

The candidate pool should expand from fixed one-off archetype entries into
archetype definitions with controlled variants. Variants may explore palette
choice, extracted palette size, dithering algorithm, Bayer size, matching mode,
resize mode, and small preprocessing deltas. The expanded pool should remain
bounded so Auto-Tune stays responsive in the browser.

The visible shortlist should use diversity-aware selection instead of taking the
top scores blindly. Users should see meaningfully different directions rather
than several near-identical variants of the same look.

## User Stories

1. As an IMDITHER user, I want Auto-Tune to recommend visibly stronger looks, so that the first suggestion is more often useful.
2. As an IMDITHER user, I want Auto-Tune to evaluate generated outputs, so that recommendations are based on the actual processed result.
3. As an IMDITHER user, I want Auto-Tune to keep returning multiple options, so that I can choose a creative direction rather than accept one opaque result.
4. As an IMDITHER user, I want Auto-Tune results to remain deterministic, so that the same source and settings produce stable recommendations.
5. As an IMDITHER user, I want Auto-Tune to stay local-first, so that my image is not sent to a backend service.
6. As an IMDITHER user, I want Auto-Tune to remain fast enough for normal editing, so that recommendation generation does not interrupt the workstation.
7. As an IMDITHER user, I want the visible shortlist to contain different styles, so that I can compare real alternatives.
8. As an IMDITHER user, I want similar candidate variants to be collapsed or deprioritized, so that the panel is not filled with duplicates.
9. As an IMDITHER user, I want Auto-Tune to preserve fine image structure when that suits the source, so that detailed photos and scans do not become muddy.
10. As an IMDITHER user, I want Auto-Tune to preserve flat graphic areas when that suits the source, so that logos and flat art do not get unnecessary texture.
11. As an IMDITHER user, I want Auto-Tune to judge palette fit perceptually, so that color recommendations feel closer to the source than plain RGB matching.
12. As an IMDITHER user, I want Auto-Tune to use extracted palettes when they beat preset palettes, so that source-specific color can be represented well.
13. As an IMDITHER user, I want Auto-Tune to prefer preset palettes when they create a better stylized result, so that recommendations are not always source-matching reductions.
14. As an IMDITHER user, I want Auto-Tune to explore monochrome and color directions separately, so that good mono looks are not hidden by saturated color scores.
15. As an IMDITHER user, I want Auto-Tune to include print-like candidates, so that halftone and screenprint looks are easy to discover.
16. As an IMDITHER user, I want Auto-Tune to include low-noise candidates, so that noisy photos and scans can get gentler recommendations.
17. As an IMDITHER user, I want Auto-Tune to include high-texture candidates, so that smooth gradients can become intentional dithered surfaces.
18. As an IMDITHER user, I want Auto-Tune to include arcade and pixel-style candidates, so that low-resolution or graphic images can get compact game-like looks.
19. As an IMDITHER user, I want Auto-Tune to include newsprint-style mono candidates, so that the documented candidate set is actually available.
20. As an IMDITHER user, I want Auto-Tune to retain output dimensions when applying a recommendation, so that the recommendation does not surprise my export target.
21. As an IMDITHER user, I want applying an Auto-Tune recommendation to remain undoable, so that trying generated looks is safe.
22. As an IMDITHER user, I want applied recommendations to remain normal editable settings, so that I can continue manual tuning.
23. As an IMDITHER user, I want recommendation labels and intents to stay concise, so that I can scan the Looks panel quickly.
24. As an IMDITHER user, I want Auto-Tune failures to remain inline, so that a recommendation issue does not break the whole editor.
25. As an IMDITHER user, I want the bundled demo recommendations to keep matching the runtime contract, so that the first-run experience is truthful.
26. As a maintainer, I want candidate definitions to live behind a small core interface, so that adding or tuning looks does not require editing ranking flow directly.
27. As a maintainer, I want output-quality scoring to be isolated in a deep module, so that scoring metrics can evolve without changing UI code.
28. As a maintainer, I want diversity selection to be isolated in a deep module, so that shortlist behavior can be tested independently from image analysis.
29. As a maintainer, I want sample rendering to reuse the normal processing pipeline, so that Auto-Tune recommendations reflect real editor behavior.
30. As a maintainer, I want rendered scoring to use bounded samples, so that tests and browser runtime remain predictable.
31. As a maintainer, I want deterministic tie-breaking, so that ranking does not flicker when scores are close.
32. As a maintainer, I want candidate expansion to have hard caps, so that future variant growth cannot accidentally create slow recommendation runs.
33. As a maintainer, I want the current public recommendation interface to stay stable, so that web UI wiring and Look Snapshot application do not need a new model.
34. As a maintainer, I want tests to assert external recommendation behavior, so that ranking internals can be tuned without brittle snapshots.
35. As a maintainer, I want the existing documentation/code mismatch around candidate count resolved, so that the product contract and runtime behavior agree.
36. As a maintainer, I want no persisted Auto-Tune state, so that Editor Settings remains the processing contract.

## Implementation Decisions

- Keep Auto-Tune as an image-aware starting-point workflow, not a persisted mode.
- Keep the public recommendation contract: stable archetype id, label, concise intent, Look Snapshot, rank, and recommended marker.
- Keep the user-facing shortlist at 3 to 5 recommendations.
- Keep one recommendation marked as strongest and do not auto-apply it.
- Keep applying recommendations routed through the existing settings transition path.
- Keep Auto-Tune logic in core; the web app only renders recommendation state and apply actions.
- Preserve deterministic, local-first behavior. No backend scoring service is introduced.
- Resolve the current candidate contract mismatch by making the runtime candidate set and documentation agree.
- Add the missing Newsprint Mono candidate if the ten-candidate contract remains the intended product contract.
- Replace hard-coded one-off candidate creation with an Auto-Tune candidate definition module.
- Candidate definitions should describe archetype identity, label, intent, base settings, variant axes, source-analysis priors, and hard variant limits.
- Add an Auto-Tune candidate expansion module that turns definitions into bounded candidate snapshots.
- Candidate expansion should support controlled variants for palette source, extracted palette size, dithering algorithm, Bayer size, matching mode, resize mode, and small preprocessing deltas.
- Candidate expansion should cap the total pool before rendered scoring. A practical target is 40 to 60 low-resolution candidates.
- Keep candidate variants normal Editor Settings. Do not add recommendation-only settings fields.
- Add a rendered-candidate scoring module that processes candidate snapshots against a deterministic sample.
- Rendered scoring should reuse the normal image-processing pipeline so the score represents real output behavior.
- Rendered scoring should not run against full output size. It should use a bounded sample sized for ranking, not export fidelity.
- Add output metrics for structure retention, edge retention, perceptual color distance, palette fit, texture level, banding risk, and noise amplification.
- Structure retention may use SSIM-style luminance comparison on the source sample and processed output.
- Edge retention may use a simple deterministic edge map comparison.
- Perceptual color distance should use a perceptual color space or color-difference formula rather than plain RGB distance.
- Palette fit should score how well the selected or extracted palette represents source colors after preprocessing.
- Texture scoring should distinguish intentional dithering texture from noisy source amplification.
- Banding scoring should penalize smooth gradients that collapse into visibly poor posterization when the candidate intent is not clean poster reduction.
- Rendered scoring should combine output metrics with source-analysis priors instead of replacing source analysis entirely.
- Scoring weights should be deterministic constants in core, not UI configuration.
- Add diversity-aware shortlist selection so the visible recommendations are not near-duplicates.
- Diversity selection should penalize candidates with the same archetype, same algorithm/palette combination, and highly similar output metrics.
- Diversity selection should preserve the highest-scoring candidate as the strongest recommendation unless a validity guard excludes it.
- Add deterministic tie-breaking by score, archetype priority, variant priority, and stable id.
- Keep Auto-Tune errors inline in the panel.
- Keep demo recommendation data conforming to the same public contract as runtime recommendations.
- Optional ML image classification is not part of the default implementation. If explored later, it must be local/browser-only and hidden behind a separate adapter.
- Do not introduce CLIP, NIMA, LPIPS, or ONNX runtime dependencies in this slice unless a later PRD explicitly accepts the bundle, performance, and privacy tradeoffs.

## Testing Decisions

- Good tests should assert observable Auto-Tune behavior: deterministic ranking, valid Look Snapshots, bounded candidate counts, diverse shortlists, and normal settings application.
- Tests should avoid locking down every internal scoring constant. Scoring internals should be tunable without rewriting broad expected arrays.
- Candidate definition tests should verify every archetype has stable identity, label, intent, valid base settings, and bounded variant expansion.
- Candidate expansion tests should verify hard caps and deterministic order.
- Rendered scoring tests should verify that output scoring is deterministic for compact fixtures.
- Rendered scoring tests should verify that obviously poor palette or structure matches score below stronger candidates for the same fixture.
- Diversity selection tests should verify that near-duplicate variants do not crowd the shortlist.
- Public recommendation tests should verify that the shortlist stays within the 3 to 5 item contract.
- Public recommendation tests should verify exactly one recommendation is marked recommended.
- Public recommendation tests should verify every returned recommendation contains a valid Look Snapshot.
- Public recommendation tests should verify the full ranked candidate pool includes the intended candidate contract, including Newsprint Mono if the ten-candidate contract is retained.
- Application tests should verify applying a recommendation remains a normal settings update and preserves output dimensions.
- Fixture tests should cover flat graphic art, soft gradient photo, high-edge ink-like source, noisy scan/photo, saturated color image, and low-resolution graphic/pixel-art source.
- Palette scoring tests should use compact synthetic fixtures before any large golden fixtures.
- Existing Auto-Tune recommendation tests are prior art for public contract coverage.
- Existing processing tests are prior art for reusing the normal image-processing pipeline in deterministic test fixtures.
- Existing palette extraction tests are prior art for deterministic image-derived palettes.
- Existing processing preset tests are prior art for validating curated look definitions without persisting recipe identity.
- Existing Look Snapshot tests are prior art for recommendation payload validation.
- Component tests, if touched, should assert visible recommendation controls and emitted apply intents, not internal React state.

## Out of Scope

- Backend scoring or server-side image upload.
- Non-deterministic online model calls.
- Persisting Auto-Tune state, scoring metadata, or recommendation reasoning inside Editor Settings.
- Adding a new settings schema version only for Auto-Tune.
- Auto-applying recommendations.
- Replacing the normal Look Snapshot contract.
- Full-resolution candidate rendering during ranking.
- Device-specific emulation presets.
- User-authored Auto-Tune training data.
- Personalization based on prior user choices.
- A new visible advanced scoring UI.
- Large ML model integration by default.
- Changing export formats or export quality behavior.
- Changing undo/redo semantics beyond the existing normal settings transition.

## Further Notes

This PRD intentionally improves the current deterministic system before adding
machine-learning classification. Modern model-based approaches can help with
source labeling or aesthetic scoring, but they add bundle size, runtime,
privacy, and explainability tradeoffs. The stronger first move is to score the
actual rendered candidates with deterministic perceptual metrics and expand the
candidate pool in a controlled way.

The deep modules implied by this slice are:

- Auto-Tune Candidate Definitions: a compact registry of archetypes and variant
  rules.
- Candidate Expansion: deterministic generation of bounded candidate snapshots.
- Rendered Candidate Scoring: sample rendering plus output-quality metrics.
- Diversity Selection: conversion from ranked candidates into a varied 3 to 5
  item shortlist.

Those modules keep leverage high: callers continue to ask for recommendations
through the same public Auto-Tune interface, while most future tuning stays
local to definitions, scoring, and shortlist selection.
