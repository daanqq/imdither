# Dither Algorithm Registry PRD

Status: done
Last updated: 2026-04-25

## Problem Statement

The Dither Algorithm list is currently encoded in several separate places: settings validation, TypeScript types, processing dispatch, metadata labels, and the editor control list. This duplication makes the codebase easy to drift.

Adding or changing an algorithm requires remembering every duplicate list and every switch statement. A missing update can create broken settings, incorrect metadata, a UI option that does not process correctly, or a processing branch that cannot be selected.

Users do not need new algorithms from this refactor. They need the existing algorithm choices to remain deterministic and reproducible while the architecture becomes safer for future algorithm work.

## Solution

Create a Dither Algorithm Registry as the single source of truth for algorithm identity, user-facing labels, processing execution, metadata labels, and UI option ordering.

The registry should describe each supported algorithm with a stable id, display label, optional settings dependencies, and an execution function. The core processing pipeline should ask the registry to resolve and run the selected algorithm instead of owning a local switch. Metadata should ask the registry for the selected algorithm label. The web editor should derive the algorithm selector options from exported registry metadata instead of hard-coding a second list.

The registry must preserve the existing algorithms and behavior: None, Bayer, Matt Parker, Floyd-Steinberg, and Atkinson. Bayer remains the only algorithm with a Bayer Size setting. All algorithms remain deterministic and palette-aware where they already are.

## User Stories

1. As an IMDITHER user, I want the same algorithm options to remain available, so that my current editing workflow does not change.
2. As an IMDITHER user, I want None to keep mapping pixels to the selected palette, so that I can preview palette mapping without dithering.
3. As an IMDITHER user, I want Bayer dithering to keep using the selected Bayer Size, so that ordered dithering remains controllable.
4. As an IMDITHER user, I want Matt Parker dithering to keep working with current palettes, so that the added algorithm remains useful across presets.
5. As an IMDITHER user, I want Floyd-Steinberg dithering to keep producing deterministic diffusion output, so that repeated exports match.
6. As an IMDITHER user, I want Atkinson dithering to keep producing deterministic diffusion output, so that repeated exports match.
7. As an IMDITHER user, I want algorithm labels in metadata to match the selected algorithm, so that exported results remain understandable.
8. As an IMDITHER user, I want Bayer metadata to include its matrix size, so that output details remain reproducible.
9. As an IMDITHER user, I want the algorithm selector to show every supported algorithm, so that no valid processing option is hidden.
10. As an IMDITHER user, I want the algorithm selector order to remain stable, so that muscle memory is not disrupted.
11. As an IMDITHER user, I want pasted Settings JSON with a supported algorithm to keep working, so that saved settings stay useful.
12. As an IMDITHER user, I want invalid algorithm ids to remain rejected or normalized by settings validation, so that the editor does not enter a broken processing state.
13. As an IMDITHER user, I want Export PNG to keep using the same algorithm as the preview, so that visible output and downloaded output match.
14. As an IMDITHER user, I want algorithm changes to keep triggering Preview Jobs, so that comparison remains live.
15. As an IMDITHER user, I want no backend processing to be introduced, so that image processing remains local.
16. As a maintainer, I want one registry to list supported algorithms, so that adding an algorithm has one obvious entry point.
17. As a maintainer, I want processing dispatch to use the registry, so that algorithm execution is not duplicated in a switch.
18. As a maintainer, I want metadata labels to come from the registry, so that labels cannot drift from processing behavior.
19. As a maintainer, I want UI algorithm options to come from registry metadata, so that the editor cannot hide or invent algorithms accidentally.
20. As a maintainer, I want algorithm ids to remain stable, so that persisted settings and Settings JSON stay compatible.
21. As a maintainer, I want Bayer-specific controls to be driven by algorithm capabilities, so that future algorithm-specific options have a clear pattern.
22. As a maintainer, I want the registry to be DOM-free, so that it belongs to the core package and can run in workers.
23. As a maintainer, I want the registry to be fully typed, so that missing algorithm handlers are compile-time visible.
24. As a maintainer, I want tests to prove every registered algorithm can process an image, so that the registry never contains a dead option.
25. As a maintainer, I want tests to prove every selectable algorithm is in settings validation, so that UI and schema cannot drift.
26. As a maintainer, I want tests to prove metadata labels for registered algorithms, so that export details remain reliable.
27. As a maintainer, I want algorithm-specific metadata to be handled through registry rules, so that Bayer size does not require scattered special cases.
28. As a maintainer, I want the registry to preserve palette-aware behavior, so that algorithms that use palettes do not regress to hard-coded black and white.
29. As a maintainer, I want the registry to be small at the interface boundary, so that the processing pipeline stays simple.
30. As a maintainer, I want implementation functions to remain testable directly where useful, so that low-level algorithm tests still have value.

## Implementation Decisions

- Build a Dither Algorithm Registry in the core domain.
- Keep the registry DOM-free and worker-safe.
- Keep the existing algorithm ids unchanged.
- Keep the existing algorithm order unless there is a clear product reason to change it.
- Keep None, Bayer, Matt Parker, Floyd-Steinberg, and Atkinson as the supported algorithms.
- Do not add new algorithms as part of this refactor.
- Move algorithm execution dispatch behind a registry lookup.
- Move algorithm metadata label generation behind the registry.
- Export lightweight algorithm option metadata for the web editor.
- Keep Bayer Size as a capability of the Bayer algorithm.
- Keep Bayer Size values at 2, 4, and 8.
- Keep the default Bayer Size at 4.
- Keep existing stage functions as low-level implementations.
- Keep palette resolution outside the registry.
- Pass the resolved palette into the selected algorithm executor.
- Keep preprocessing, resize, alpha flattening, and palette resolution outside this registry.
- Keep settings schema validation in the core settings model, but derive its allowed ids from the same source if the validation library and typing allow it cleanly.
- If schema derivation would make validation harder to read or less type-safe, add tests that enforce registry and schema consistency.
- Derive the web Algorithm select items from exported registry metadata.
- Keep the Bayer Matrix control conditional on algorithm capability rather than a hard-coded id check where practical.
- Preserve Settings JSON compatibility.
- Preserve Processing Metadata shape.
- Preserve Preview Job and Export Job behavior.

## Testing Decisions

- Good tests should verify public behavior: registered ids, selectable options, processing output, metadata labels, and schema consistency.
- Test that every registered algorithm id is accepted by settings normalization.
- Test that every supported algorithm can process a small image through the public processing pipeline.
- Test that algorithm metadata labels match existing behavior.
- Test that Bayer metadata includes the selected Bayer Size.
- Test that UI option metadata includes all supported algorithms in stable order.
- Test that the web editor consumes exported algorithm options rather than maintaining a separate manual list where possible.
- Test that invalid algorithm ids remain rejected or normalized according to the existing settings behavior.
- Keep low-level algorithm tests for deterministic output where they already exist.
- Add focused registry tests in the core package rather than broad UI tests for every algorithm.
- Use existing core processing tests as prior art for deterministic algorithm behavior.
- Use existing store and module tests as prior art for checking drift between public APIs.
- Avoid tests that assert private registry object shape beyond the exported contract.

## Out of Scope

- No new dithering algorithms.
- No changes to algorithm math.
- No changes to palette presets.
- No custom palette UI.
- No changes to preprocessing.
- No changes to resize or alpha flattening.
- No changes to Source Intake.
- No changes to Settings Transition behavior.
- No changes to Preview Job scheduling.
- No changes to Export Job scheduling.
- No changes to PNG encoding.
- No change to Settings JSON schema version unless required by validation refactoring.
- No backend or cloud processing.
- No algorithm documentation redesign beyond keeping labels and options consistent.

## Further Notes

This refactor should make algorithm drift hard to introduce. The registry should be the place a maintainer reads first when asking, "Which algorithms does IMDITHER support, how are they displayed, and how are they run?"

The key invariant is compatibility: existing saved settings, preview behavior, export behavior, and metadata labels should continue to work after the registry is introduced.
