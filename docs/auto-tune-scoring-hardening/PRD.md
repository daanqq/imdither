# Auto-Tune Scoring Hardening PRD

Status: done
Last updated: 2026-04-27

## Problem Statement

Auto-Tune now has a stronger second-generation ranking path: it expands
archetypes into bounded candidate variants, renders candidates on a sample,
scores the rendered outputs, selects a diverse shortlist, and includes the
previously missing Newsprint Mono candidate.

The implementation is functionally validated, but the scoring layer is still not
as truthful as its interface suggests. Some metric names imply perceptual or
palette-aware comparison while the current behavior is simpler. Shortlist
diversity also risks over-weighting difference after the first recommendation,
which can make weaker candidates appear only because they are different. The
Auto-Tune module has also grown large enough that candidate generation, rendered
scoring, and shortlist selection are harder to reason about and tune in
isolation.

From the user's perspective, this means Auto-Tune can look more advanced while
still occasionally recommending a visibly weaker option, crowding out a strong
candidate, or behaving unpredictably when heuristics are tuned later.

## Solution

Harden Auto-Tune scoring without changing the public Auto-Tune workflow.

Auto-Tune should keep returning deterministic 3 to 5 Look Snapshot
recommendations, keep one strongest recommendation marker, avoid auto-apply, and
keep all applied recommendations as normal editable Editor Settings.

Internally, the next slice should make the scoring layer truthful and testable:

1. Split the current large Auto-Tune implementation into deep core modules:
   candidate definitions, candidate expansion, rendered scoring, and shortlist
   selection.
2. Replace placeholder scoring metrics with explicit deterministic metrics whose
   names match their behavior.
3. Introduce perceptual color distance for rendered output comparison.
4. Make palette fit a real palette/source-fit metric rather than an alias of
   rendered color fit.
5. Make shortlist diversity score-aware, so diversity broadens the shortlist
   without admitting obviously weak candidates.
6. Add a compact fixture matrix that exercises flat graphics, gradients, noisy
   scans, saturated color, high-edge ink-like content, and low-resolution graphic
   sources.
7. Keep browser responsiveness visible by defining and testing a bounded scoring
   budget at the core interface level.

This slice is a hardening pass. It should not add new visible controls, new
settings fields, backend services, or machine-learning dependencies.

## User Stories

1. As an IMDITHER user, I want Auto-Tune recommendations to match visible quality, so that the top recommendation is worth trying.
2. As an IMDITHER user, I want Auto-Tune to keep offering multiple directions, so that I can compare looks without accepting an opaque result.
3. As an IMDITHER user, I want the strongest recommendation to stay strong even when the shortlist is diverse, so that variety does not replace quality.
4. As an IMDITHER user, I want color-heavy sources to be judged by perceptual color fit, so that recommendations preserve important colors better.
5. As an IMDITHER user, I want monochrome recommendations to remain valid for suitable sources, so that color preservation does not wrongly dominate every image.
6. As an IMDITHER user, I want flat graphics to avoid unnecessary noisy texture, so that logos and simple art stay clean when that is the best direction.
7. As an IMDITHER user, I want gradients to keep intentional texture without ugly banding, so that smooth sources become attractive dithered output.
8. As an IMDITHER user, I want noisy scans and photos to receive gentler options, so that Auto-Tune does not amplify noise as detail.
9. As an IMDITHER user, I want saturated images to prefer color-preserving candidates when they are visibly better, so that Auto-Tune does not wash them out.
10. As an IMDITHER user, I want high-edge images to keep crisp structure, so that strong graphic output remains readable.
11. As an IMDITHER user, I want low-resolution graphic sources to keep pixel-style candidates available, so that Auto-Tune supports game-like art.
12. As an IMDITHER user, I want extracted palettes to be used only when they fit the source well, so that custom palettes do not become a default answer.
13. As an IMDITHER user, I want preset palettes to remain competitive, so that stylized recipes still appear when they produce better looks.
14. As an IMDITHER user, I want the visible shortlist to avoid duplicates, so that the Looks panel shows meaningful alternatives.
15. As an IMDITHER user, I want weak candidates to stay out of the shortlist even if they are different, so that every visible recommendation earns its slot.
16. As an IMDITHER user, I want Auto-Tune to stay responsive after source load, so that recommendation work does not block normal editing.
17. As an IMDITHER user, I want Auto-Tune failures to remain inline, so that a scoring issue does not break the workstation.
18. As an IMDITHER user, I want applying recommendations to keep output dimensions, so that generated looks do not surprise my export target.
19. As an IMDITHER user, I want applied recommendations to remain undoable, so that exploration stays safe.
20. As an IMDITHER user, I want applied recommendations to remain shareable Look Snapshots, so that a generated starting point can become a repeatable look.
21. As an IMDITHER user, I want recommendation labels and intent text to remain stable, so that scoring improvements do not change the visible language unnecessarily.
22. As an IMDITHER user, I want demo recommendations to remain truthful, so that the first-run experience reflects runtime behavior.
23. As a maintainer, I want scoring metric names to match behavior, so that future tuning does not rely on misleading abstractions.
24. As a maintainer, I want perceptual color comparison isolated behind a small interface, so that color math can improve without touching ranking flow.
25. As a maintainer, I want palette fit isolated behind a small interface, so that palette scoring can evolve separately from rendered output comparison.
26. As a maintainer, I want shortlist selection isolated behind a small interface, so that diversity behavior can be tested without rendering images.
27. As a maintainer, I want candidate definitions isolated from candidate expansion, so that adding archetypes does not require editing ranking logic.
28. As a maintainer, I want candidate expansion to keep hard caps, so that future variant axes cannot accidentally create slow scoring runs.
29. As a maintainer, I want rendered scoring to reuse normal processing behavior, so that Auto-Tune scores the same kind of output users will see.
30. As a maintainer, I want fixture-based tests across source classes, so that scoring changes are evaluated against representative cases.
31. As a maintainer, I want tests to assert ranking invariants rather than brittle exact score constants, so that weights can be tuned safely.
32. As a maintainer, I want deterministic tie-breaking, so that rank order does not flicker when scores are close.
33. As a maintainer, I want the public Auto-Tune interface to stay stable, so that web UI wiring does not churn during hardening.
34. As a maintainer, I want no Auto-Tune data persisted in Editor Settings, so that recommendations remain runtime state.
35. As a maintainer, I want the full verification gate to stay green, so that hardening does not weaken existing product contracts.

## Implementation Decisions

- Keep Auto-Tune as a runtime recommendation workflow, not a persisted mode.
- Keep the public recommendation contract stable: archetype id, label, intent, Look Snapshot, rank, and recommended marker.
- Keep the visible shortlist at 3 to 5 recommendations.
- Keep exactly one recommendation marked as strongest.
- Keep recommendation application routed through the existing settings transition path.
- Keep candidate settings as normal Editor Settings. Do not add recommendation-only settings fields.
- Keep scoring deterministic and local-first.
- Keep no backend scoring service and no online model calls.
- Split Auto-Tune internals into deep modules with small interfaces.
- Candidate Definitions should own archetype identity, visible language, base settings intent, and available variant axes.
- Candidate Expansion should own deterministic expansion from definitions into bounded candidate snapshots.
- Rendered Scoring should own sample rendering and output metrics.
- Perceptual Color Metrics should own color-space conversion and color-distance calculation.
- Palette Fit Metrics should own source-to-palette fit and extracted-palette/preset-palette comparison.
- Shortlist Selection should own score-aware diversity selection and recommendation rank assignment.
- The top-ranked candidate should remain the first visible recommendation unless invalidated by a clear guard.
- Diversity selection should use a score-aware formula rather than minimizing diversity penalty alone.
- Diversity penalties should consider archetype identity, algorithm/palette combination, same algorithm, same palette, and optionally similar rendered metrics.
- Diversity should broaden the shortlist but should not admit candidates below a minimum score gap threshold when stronger alternatives remain.
- Rendered scoring should use bounded deterministic samples, not full output size.
- Rendered scoring should continue to reuse the normal processing pipeline.
- Perceptual color distance should replace plain RGB distance for the metric currently exposed as perceptual color fit.
- Palette fit should become an independent metric that compares source colors against the candidate palette or extracted palette.
- Structure retention should be either renamed to match the current luminance-difference behavior or upgraded to an SSIM-style luminance/contrast/structure score.
- Banding risk should remain explicit and should be validated on gradient fixtures.
- Noise amplification should remain explicit and should be validated on noisy fixtures.
- Metric values should remain normalized and deterministic.
- Scoring weights should remain core constants, not UI configuration.
- The public ranked-candidate function should continue to return one winner per archetype.
- The expanded candidate pool should remain capped.
- Demo recommendation data should continue to satisfy the same public recommendation contract as runtime recommendations.
- The web app should not own ranking logic.
- Main-thread recommendation generation should be observed for cost after this hardening. Worker migration is not part of this slice unless hard evidence shows unacceptable blocking.

## Testing Decisions

- Good tests should assert externally meaningful behavior: deterministic output, valid recommendations, stronger visible fits, bounded candidate pools, and quality-preserving shortlist selection.
- Tests should not lock down every scoring weight or exact floating-point metric unless the metric is itself the public behavior under test.
- Candidate Definitions tests should verify all archetypes have stable ids, labels, intents, valid settings intent, and declared variant axes.
- Candidate Expansion tests should verify deterministic expansion, uniqueness, and hard caps.
- Rendered Scoring tests should verify deterministic metric output for compact fixtures.
- Perceptual Color Metrics tests should verify known color-distance ordering, not broad aesthetic claims.
- Palette Fit Metrics tests should verify that a palette containing source colors scores above an unrelated palette.
- Structure tests should verify that a structure-preserving candidate beats an obviously destructive candidate on high-edge fixtures.
- Banding tests should verify that gradient-hostile candidates score worse on smooth gradient fixtures.
- Noise tests should verify that noise-amplifying candidates score worse on noisy fixtures when a gentler candidate is available.
- Shortlist Selection tests should verify that duplicate-heavy pools still produce varied recommendations.
- Shortlist Selection tests should verify that a very weak candidate is not selected only because it is diverse.
- Public Auto-Tune tests should verify the 3 to 5 recommendation contract.
- Public Auto-Tune tests should verify exactly one recommended marker.
- Public Auto-Tune tests should verify valid Look Snapshots.
- Public Auto-Tune tests should verify stable rankings for the same source and settings.
- Public Auto-Tune tests should verify one ranked winner per archetype.
- Fixture matrix tests should cover flat graphic art, soft gradient photo, noisy scan/photo, saturated color image, high-edge monochrome-like content, and low-resolution graphic source.
- Existing Auto-Tune public contract tests are prior art for recommendation behavior.
- Existing process tests are prior art for deterministic processing fixtures.
- Existing palette extraction tests are prior art for deterministic image-derived palette behavior.
- Existing processing preset tests are prior art for registry-style definitions.
- Existing Look Snapshot tests are prior art for payload validity.
- Web component tests should only be updated if visible behavior changes. They should assert recommendation rendering and apply intents, not scoring internals.

## Out of Scope

- New visible Auto-Tune controls.
- New Editor Settings fields.
- Persisting scoring metrics or recommendation reasoning.
- Changing the Look Snapshot schema.
- Auto-applying recommendations.
- Backend scoring or image upload.
- CLIP, NIMA, LPIPS, ONNX, TensorFlow.js, or other machine-learning dependencies.
- Full-resolution candidate rendering during ranking.
- Device-specific emulation presets.
- Personalization based on user history.
- Rewriting the general processing pipeline.
- Moving Auto-Tune to a worker unless profiling proves this slice cannot meet responsiveness goals on the main thread.
- Changing export formats, export quality, or export metadata behavior.
- Changing undo/redo semantics.

## Further Notes

This slice exists because the initial Auto-Tune quality-ranking implementation
landed the right shape but still needs truthfulness and locality. The current
public behavior is useful enough to keep, but the internal module should stop
presenting RGB distance as perceptual color fit and should stop treating palette
fit as the same value as rendered color fit.

The intended deep modules are:

- Candidate Definitions: archetype registry and visible language.
- Candidate Expansion: deterministic candidate variant generation and caps.
- Rendered Scoring: sample rendering and normalized output metrics.
- Perceptual Color Metrics: color-space conversion and distance functions.
- Palette Fit Metrics: source-to-palette and preset-vs-extracted palette fit.
- Shortlist Selection: score-aware diversity and rank assignment.

The implementation should preserve the current public Auto-Tune interface while
moving tuning knowledge into these modules. That gives future work locality:
candidate changes stay in definitions, color math stays in perceptual metrics,
palette behavior stays in palette fit, and shortlist behavior stays in selection.
