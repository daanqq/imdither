# Editor Settings Transition Module PRD

Status: done
Last updated: 2026-04-25

## Problem Statement

Editor Settings changes are currently handled in several places. Some changes are simple patches, while others must preserve domain rules such as aspect locking, Output Cap enforcement, palette default color mode, Settings JSON normalization, and reset behavior.

This makes the editor harder to reason about. A UI control can accidentally bypass one of the rules by calling a lower-level state setter directly. The main editor component also carries transition logic that belongs to the domain of changing settings, not rendering controls or coordinating preview jobs.

Users do not need new visible behavior from this refactor. They need the same controls to keep behaving consistently while the rules for changing Editor Settings become centralized, testable, and harder to misuse.

## Solution

Create an Editor Settings Transition Module that owns the rules for turning a current editing context plus a user intent into one next Editor Settings value and optional Source Notice.

The module should accept a current Editor Settings object, optional Source Image dimensions, and a typed transition request. It returns the next Editor Settings after applying all required rules: aspect lock, Output Size clamping, palette default color mode, normalized Settings JSON, defaults reset, and source-intake recommended Output Size.

The Zustand store should remain the persistence and UI state holder. The React editor should remain the coordinator for source intake, preview jobs, export, clipboard I/O, and control rendering. Both should delegate settings math and policy decisions to the transition module instead of duplicating rules.

## User Stories

1. As an IMDITHER user, I want changing output width to keep the current source aspect ratio, so that the output does not become accidentally distorted.
2. As an IMDITHER user, I want the inferred output height to update predictably, so that the resolution label matches the actual settings.
3. As an IMDITHER user, I want output dimensions to stay inside the Output Cap, so that the browser remains responsive.
4. As an IMDITHER user, I want output clamping to show a clear notice, so that I understand why the requested size changed.
5. As an IMDITHER user, I want source intake to recommend a valid Output Size, so that newly loaded images start at a usable resolution.
6. As an IMDITHER user, I want changing the Source Image to preserve aspect-safe Output Size rules, so that preview and export stay aligned with the loaded image.
7. As an IMDITHER user, I want changing Resize Fit to keep the current Output Size, so that only the crop or fit behavior changes.
8. As an IMDITHER user, I want changing resize kernel to keep the current Output Size, so that only scaling quality changes.
9. As an IMDITHER user, I want changing brightness to affect only brightness, so that other settings do not drift.
10. As an IMDITHER user, I want changing contrast to affect only contrast, so that tone controls are predictable.
11. As an IMDITHER user, I want changing gamma to affect only gamma, so that advanced tone editing remains precise.
12. As an IMDITHER user, I want toggling invert to affect only invert, so that the setting is safe to use while comparing output.
13. As an IMDITHER user, I want changing color mode manually to keep the selected palette, so that I can override palette defaults deliberately.
14. As an IMDITHER user, I want changing palette to apply that palette's default color mode, so that presets produce their intended look by default.
15. As an IMDITHER user, I want changing algorithm to keep my other settings, so that I can compare algorithms without rebuilding the whole setup.
16. As an IMDITHER user, I want Bayer matrix changes to apply only when Bayer is active, so that irrelevant controls do not create confusing output changes.
17. As an IMDITHER user, I want alpha background changes to keep all other settings, so that transparency handling is isolated.
18. As an IMDITHER user, I want pasted Settings JSON to be normalized before use, so that partial or older settings do not break the editor.
19. As an IMDITHER user, I want pasted Settings JSON to respect the current source aspect ratio, so that importing settings does not distort the loaded image unexpectedly.
20. As an IMDITHER user, I want invalid Settings JSON to be rejected before state changes, so that the editor does not enter a broken state.
21. As an IMDITHER user, I want defaults reset to preserve aspect-safe Output Size for the current source, so that reset remains useful after loading a custom image.
22. As an IMDITHER user, I want persisted settings to avoid stale image dimensions, so that a page reload starts from a reliable size for the next source.
23. As an IMDITHER user, I want copied Settings JSON to represent the current Editor Settings, so that I can reproduce the same processing choices later.
24. As an IMDITHER user, I want changing settings to continue triggering Preview Jobs, so that live preview remains responsive.
25. As an IMDITHER user, I want Export PNG to keep using the current Editor Settings at Full Output, so that refactoring settings changes does not affect export.
26. As a maintainer, I want one module to define Settings Transition rules, so that UI controls cannot bypass domain policy accidentally.
27. As a maintainer, I want transitions to return one next Editor Settings object, so that state updates remain simple and predictable.
28. As a maintainer, I want transition outputs to include notices when policy changes a requested value, so that UI messaging is coupled to the rule that caused it.
29. As a maintainer, I want aspect-lock math in a pure module, so that it can be tested without React.
30. As a maintainer, I want Output Cap enforcement in the transition path, so that width, paste, reset, and source intake all share the same behavior.
31. As a maintainer, I want palette default color mode behavior centralized, so that adding palettes does not require hunting through UI controls.
32. As a maintainer, I want Settings JSON application centralized, so that clipboard paste and future import flows use the same validation path.
33. As a maintainer, I want the store to expose intent-oriented actions, so that components do not construct nested partial settings by hand.
34. As a maintainer, I want existing store persistence behavior preserved, so that this refactor does not become a migration feature.
35. As a maintainer, I want tests to describe user-visible transitions, so that internal refactors can continue without breaking test intent.

## Implementation Decisions

- Build a dedicated Editor Settings Transition Module.
- Keep the module pure and DOM-free.
- Keep the module independent from React and Zustand.
- Keep Zustand as the owner of persisted editor state.
- Keep React components as intent emitters, not owners of transition policy.
- Model changes as typed Settings Transitions rather than arbitrary nested patches where domain rules are required.
- Return one next Editor Settings object from each transition.
- Return an optional Source Notice when a transition changes a requested Output Size because of Output Cap policy.
- Preserve existing visible behavior for all controls.
- Preserve current clipboard Settings JSON copy and paste behavior.
- Preserve current persistence behavior that does not persist output dimensions.
- Preserve current Preview Job and Export Job behavior.
- Use source dimensions when aspect-locking Output Size.
- Fall back to current Output Size aspect ratio when no Source Image is available.
- Use Output Cap enforcement for width changes, source-intake recommended size, pasted settings, and defaults reset.
- Keep palette selection responsible for applying palette default color mode.
- Keep manual color mode changes as explicit user overrides.
- Keep algorithm, Bayer size, alpha background, resize fit, resize kernel, and preprocess controls as targeted transitions.
- Keep comparison mode, view scale, advanced panel state, status, error, source notice, metadata, and preview image outside this module.
- Keep source rejection and source decoding inside Source Intake, not Settings Transition.
- Keep preview-size shortcuts inside Processing Jobs, not Settings Transition.
- Do not move core processing schema validation out of the core package.
- Reuse existing core settings normalization and Output Cap helpers.

## Testing Decisions

- Good tests should verify transition behavior through public transition APIs, not internal helper structure.
- Test aspect-locked width changes using Source Image dimensions.
- Test aspect-locked width changes without Source Image dimensions using the current Output Size ratio.
- Test Output Cap clamping and Source Notice output.
- Test source-intake recommended Output Size application.
- Test palette changes applying the selected palette's default color mode.
- Test manual color mode changes preserving palette selection.
- Test pasted Settings JSON normalization through the transition path.
- Test defaults reset with current source aspect ratio.
- Test that unrelated settings remain unchanged for targeted transitions.
- Test store actions through public store methods after they delegate to the transition module.
- Keep pure transition tests fast and DOM-free.
- Use existing store migration tests as prior art for state behavior.
- Use existing Source Intake and Processing Job tests as prior art for testing behavior through module APIs.
- Avoid tests that assert exact object construction order or private helper calls.

## Out of Scope

- No new editor controls.
- No visual redesign.
- No changes to dithering algorithms.
- No changes to palette data.
- No custom palette UI.
- No new Settings JSON schema version unless required by core validation.
- No backend or cloud storage for settings.
- No change to source decoding.
- No change to oversized Source Image rejection.
- No change to Preview Job scheduling.
- No change to Export Job scheduling.
- No change to PNG output.
- No change to Compare Mode behavior.
- No change to Slide Compare behavior.
- No persisted output dimensions after reload.

## Further Notes

This is a behavior-preserving architecture refactor. The key invariant is that every settings-changing control should go through a transition that preserves the same domain rules users already rely on.

The module should make illegal or incomplete updates harder to express. Components should say what the user intended, while the transition module decides how that intent becomes valid Editor Settings.
