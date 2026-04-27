# Auto-Tune Candidate Variants PRD

Status: done
Last updated: 2026-04-27

## Problem Statement

Auto-Tune now ranks a bounded pool of rendered candidate variants and shows a
3 to 5 recommendation shortlist. This gives users stronger starting points than
the original source-only ranker, but the hidden candidate pool is still shallow.
Each visible archetype currently expands through a small generic variant pattern:
alternate algorithm, alternate palette, matching-mode flip, contrast/resize
tweak, and fallback contrast variants.

From the user's perspective, this can leave good look directions unexplored. The
visible recommendation list stays compact, but the hidden pool may miss useful
palette sizes, tone curves, algorithm-family alternates, or source-specific
extracted palette variants. Adding many new visible archetypes would create UI
noise and weaken the product language. The better path is to add more hidden
variants behind the existing visible archetypes.

The product needs a richer candidate pool that improves Auto-Tune quality
without turning the Looks panel into a large list of near-duplicate generated
looks.

## Solution

Add roughly 20 additional hidden Auto-Tune candidate variants while keeping the
visible archetype set stable.

Auto-Tune should keep ten visible archetypes and continue returning only a 3 to
5 item shortlist. Candidate expansion should become more explicit and more
domain-aware: each archetype should declare which variant axes are allowed and
which values are meaningful for that archetype.

Instead of a single generic alternate algorithm and alternate palette path, the
candidate definition layer should own real variant configuration. Candidate
Expansion should consume this configuration and produce a deterministic bounded
candidate pool of about 70 to 80 candidates. Rendered scoring and score-aware
shortlist selection should then decide which candidates earn visibility.

The additional hidden variants should focus on:

- extracted palette size variants for color-preserving archetypes
- algorithm-family alternates per archetype
- gamma variants for tone-sensitive sources
- contrast up/down variants
- palette-family alternates per archetype
- resize-mode variants only when stylistically valid
- matching-mode variants only when color comparison matters

This is a candidate-depth slice, not a UI expansion slice.

## User Stories

1. As an IMDITHER user, I want Auto-Tune to explore more hidden look options, so that the visible recommendations are stronger.
2. As an IMDITHER user, I want the visible recommendation list to stay compact, so that Auto-Tune remains easy to scan.
3. As an IMDITHER user, I want Auto-Tune to keep the current archetype language, so that generated looks remain understandable.
4. As an IMDITHER user, I want source-colored images to try more extracted palette sizes, so that color-preserving looks can fit the image better.
5. As an IMDITHER user, I want flat graphics to try clean palette and no-texture variants, so that logos and simple art do not get unnecessary dithering.
6. As an IMDITHER user, I want gradients to try multiple texture strengths, so that smooth areas can become intentional dither patterns without ugly banding.
7. As an IMDITHER user, I want noisy photos and scans to try gentler algorithm variants, so that Auto-Tune does not amplify noise.
8. As an IMDITHER user, I want high-edge sources to try crisp monochrome variants, so that strong shapes remain readable.
9. As an IMDITHER user, I want saturated sources to try color-preserving variants before monochrome variants dominate, so that color-rich images stay expressive.
10. As an IMDITHER user, I want pixel-art-like sources to try nearest-resize retro variants, so that small graphic sources keep a compact game-like style.
11. As an IMDITHER user, I want print-like sources to try halftone and screenprint variants, so that Auto-Tune can discover strong print directions.
12. As an IMDITHER user, I want Auto-Tune to compare RGB and Perceptual matching only where useful, so that irrelevant variant noise stays limited.
13. As an IMDITHER user, I want Auto-Tune to try small gamma changes, so that tone-sensitive images get better light/dark balance.
14. As an IMDITHER user, I want Auto-Tune to try small contrast changes, so that edge and poster looks can be tuned automatically.
15. As an IMDITHER user, I want Auto-Tune to avoid many near-identical hidden variants, so that scoring time is spent on meaningful alternatives.
16. As an IMDITHER user, I want the top visible recommendation to stay stable for the same image and settings, so that Auto-Tune does not feel random.
17. As an IMDITHER user, I want recommendations to remain normal editable settings after application, so that I can continue manual tuning.
18. As an IMDITHER user, I want applied recommendations to remain undoable, so that exploring more generated options stays safe.
19. As an IMDITHER user, I want Auto-Tune to stay responsive despite a larger pool, so that source load does not freeze the editor.
20. As an IMDITHER user, I want demo recommendations to remain truthful, so that the bundled demo still reflects runtime behavior.
21. As a maintainer, I want variant axes to be real configuration, so that future candidates are added intentionally rather than through ad hoc code.
22. As a maintainer, I want candidate definitions to own archetype-specific variant rules, so that expansion logic stays generic.
23. As a maintainer, I want candidate expansion to remain deterministic, so that tests can trust stable pool order.
24. As a maintainer, I want the expanded pool to stay bounded, so that adding variants cannot accidentally create a large render workload.
25. As a maintainer, I want candidate uniqueness to include algorithm, palette, matching, resize, contrast, gamma, and extracted palette size, so that variants do not overwrite each other.
26. As a maintainer, I want candidate expansion tests to fail when an archetype has no meaningful variants, so that the hidden pool stays useful.
27. As a maintainer, I want score-aware shortlist selection to keep using rendered scores, so that more variants improve quality rather than simply increasing noise.
28. As a maintainer, I want no visible UI changes in this slice, so that candidate-pool tuning remains core-owned.
29. As a maintainer, I want no new Editor Settings fields, so that candidates remain normal Look Snapshots.
30. As a maintainer, I want the full verification gate to stay green, so that variant growth does not weaken existing contracts.

## Implementation Decisions

- Keep the ten current visible Auto-Tune archetypes.
- Do not add 20 new visible archetypes.
- Add roughly 20 additional hidden candidate variants across the existing archetypes.
- Increase the expanded candidate cap from about 60 to about 80.
- Keep the public Auto-Tune recommendation contract unchanged.
- Keep the public shortlist at 3 to 5 recommendations.
- Keep exactly one recommendation marked as strongest.
- Keep recommendations as normal Look Snapshots containing normal Editor Settings.
- Keep Auto-Tune state and scoring internals out of Editor Settings.
- Replace string-only `variantAxes` with typed variant configuration.
- Candidate Definitions should declare allowed variant axes and values for each archetype.
- Candidate Expansion should consume definitions and produce candidate snapshots without hardcoding archetype behavior in the expansion flow.
- Candidate Expansion should remain deterministic and stable.
- Candidate Expansion should dedupe variants by meaningful settings identity.
- Variant identity should include archetype id, algorithm, palette id, extracted palette size when present, matching mode, resize mode, contrast, gamma, and color mode.
- Extracted palette size variants should be limited to archetypes where extracted custom palettes make sense.
- Clean Reduction should explore extracted palette sizes and no-dither palette mapping variants.
- Screenprint Color should explore preset screenprint, extracted color, RGB matching, and Perceptual matching variants.
- Soft Poster should explore quieter palette and gamma variants.
- Texture/Noise Look should explore blue-noise and halftone families with controlled contrast and palette alternates.
- Newsprint Mono should explore halftone, black-white, gray, and contrast/gamma variants.
- Low Noise Photo should explore Atkinson, Sierra Lite, restrained contrast, and soft color or gray palettes.
- Arcade Color should explore Bayer, Sierra Lite, PICO-8, C64, Game Boy, nearest resize, and restrained ordered-size variants.
- Ink Wash should explore blue-noise, Burkes, warm mono, blue ink, and softer gamma variants.
- High Contrast Ink should explore black-white, gray, Atkinson, Floyd-Steinberg, and higher contrast variants.
- Fine Ordered Mono should explore Bayer size, gray palettes, and grayscale tone variants.
- Matching-mode variants should not be generated for archetypes where color mode and palette make the variant redundant.
- Resize-mode variants should only be generated for archetypes where nearest versus bilinear is stylistically meaningful.
- Gamma variants should be small bounded deltas, not a new broad tone-search system.
- Contrast variants should be small bounded deltas and should not replace rendered scoring.
- More candidates should feed the existing rendered scoring and score-aware shortlist path.
- Candidate expansion should expose a count that tests can assert without exposing UI.
- This slice should not change Auto-Tune panel layout, labels, or apply behavior.

## Testing Decisions

- Good tests should assert candidate-pool quality, determinism, and bounds rather than exact score constants.
- Candidate Definition tests should verify each archetype declares typed variant configuration.
- Candidate Definition tests should verify visible archetype ids, labels, and intents remain stable.
- Candidate Expansion tests should verify deterministic output for the same base candidates.
- Candidate Expansion tests should verify the pool grows into the expected 70 to 80 candidate range.
- Candidate Expansion tests should verify additional hidden variants do not change the visible archetype count.
- Candidate Expansion tests should verify every generated candidate has valid Editor Settings.
- Candidate Expansion tests should verify uniqueness using the expanded variant identity.
- Candidate Expansion tests should verify extracted palette size variants appear only for allowed archetypes.
- Candidate Expansion tests should verify gamma variants stay within schema bounds.
- Candidate Expansion tests should verify contrast variants stay within schema bounds.
- Candidate Expansion tests should verify nearest-resize variants appear only where intended.
- Public Auto-Tune tests should verify recommendation count remains 3 to 5.
- Public Auto-Tune tests should verify one recommended marker.
- Public Auto-Tune tests should verify ranked candidates still collapse to one winner per visible archetype.
- Public Auto-Tune tests should verify recommendations remain valid Look Snapshots.
- Public Auto-Tune tests should verify stable output for the compact fixture matrix.
- Rendered scoring tests should continue to verify stronger candidates beat obviously weaker candidates on representative fixtures.
- Shortlist selection tests should continue to verify diversity does not admit very weak candidates.
- Performance-oriented tests should assert candidate pool caps, not wall-clock timing in the default gate.
- Existing Auto-Tune tests are prior art for deterministic recommendation contracts.
- Existing candidate definition and expansion tests are prior art for registry and bounded-pool behavior.
- Existing rendered scoring tests are prior art for validating candidate quality without UI snapshots.
- Existing Look Snapshot tests are prior art for payload validity.
- Existing settings schema tests are prior art for verifying candidates remain normal Editor Settings.

## Out of Scope

- Adding 20 new visible Auto-Tune archetypes.
- Changing Auto-Tune panel UI.
- Showing hidden variants directly in the UI.
- Adding a visible confidence score.
- Persisting candidate ids, variant ids, scores, or reasoning in Editor Settings.
- New Editor Settings fields.
- New Look Snapshot schema.
- Backend recommendation services.
- Online ML or local ML dependencies.
- Full-resolution candidate rendering.
- Worker migration unless a separate performance slice proves it is required.
- Changing export behavior.
- Changing undo/redo behavior.
- Changing processing algorithms themselves.
- Replacing score-aware shortlist selection.

## Further Notes

The current system already has the right shape: visible archetypes, hidden
candidate expansion, rendered scoring, palette fit, perceptual color distance,
and score-aware shortlist selection. This slice deepens the hidden candidate
pool without making the product language broader.

The main architectural move is to turn `variantAxes` from descriptive strings
into real variant configuration. Once definitions own the allowed axes and
values, Candidate Expansion becomes a deeper module: callers provide base
candidates and definitions, and receive a bounded deterministic pool. Future
look-quality work can then tune candidates by editing definitions instead of
rewriting expansion or ranking flow.
