# Editor Runtime Responsiveness PRD

Status: done
Last updated: 2026-04-25

## Problem Statement

When an IMDITHER user drags a preprocessing slider quickly, the thumb can feel like it does not keep up with the cursor.

The expected behavior is direct manipulation: while the pointer is down, the slider thumb and numeric value should feel immediate. The preview does not need to recompute during the drag. The current suspicion is that the drag path is sharing too much React work with the preview and editor shell. React DevTools observations showed the preview card rendering while a slider is being dragged, which suggests the preview tree is not isolated enough from control-only interaction.

The problem is broader than one slider implementation detail. The editor currently mixes control rendering, preview rendering, runtime image state, persisted view preferences, processing status, upload/drop UI, export controls, and store subscriptions in a large shell. That makes per formance-sensitive interactions vulnerable to unrelated rendering work.

The product problem is: controls should feel responsive while the loaded-image editor is running, even when preview rendering, processing status, canvas presentation, or worker updates are active elsewhere.

## Solution

Improve runtime editor responsiveness by creating explicit render and state boundaries between controls, preview presentation, and committed editor settings.

The first priority is eliminating noticeable slider lag during fast drag. During drag, a slider should update only its local draft UI: thumb position, displayed numeric value, and reset button state. It should not commit settings, update persisted store state, start preview jobs, change preview status, redraw canvases, or cause the preview card to render. Committed settings should update only on release or reset.

The broader solution is a phased refactor:

- Phase 1 isolates the render path for the current editor UI.
- Phase 2 conditionally deepens slider internals if render isolation alone does not remove lag.
- Phase 3 improves preview presentation boundaries so worker and canvas updates do not unnecessarily affect controls.

The implementation should preserve visible UI design, image processing behavior, preview quality, algorithm output, export behavior, and existing local-only architecture.

## User Stories

1. As an IMDITHER user, I want slider thumbs to follow my cursor during fast drag, so that tone tuning feels direct and precise.
2. As an IMDITHER user, I want the slider number to update while I drag, so that I can see the temporary value before committing it.
3. As an IMDITHER user, I want the preview to update after I release the slider, so that drag remains smooth while the final value still affects the image.
4. As an IMDITHER user, I want dragging Brightness to feel smooth, so that I can tune lightness without fighting the UI.
5. As an IMDITHER user, I want dragging Contrast to feel smooth, so that I can tune image punch without input lag.
6. As an IMDITHER user, I want dragging Gamma to feel smooth, so that advanced tone adjustment remains usable.
7. As an IMDITHER user, I want reset buttons to keep working, so that I can return a slider to its default quickly.
8. As an IMDITHER user, I want reset to commit immediately, so that the preview reflects the default value without extra steps.
9. As an IMDITHER user, I want preview processing to begin only from committed slider values, so that partial drag positions do not start stale work.
10. As an IMDITHER user, I want the old preview to remain visible while I drag a slider, so that the workspace does not flicker or blank.
11. As an IMDITHER user, I want preview overlays to stay stable during slider drag, so that status feedback does not distract from input.
12. As an IMDITHER user, I want compare mode to keep working after the responsiveness refactor, so that preview workflows are unchanged.
13. As an IMDITHER user, I want Fit and 1:1 view modes to keep working, so that preview inspection is unchanged.
14. As an IMDITHER user, I want upload and export controls to remain in the preview card, so that the layout stays familiar.
15. As an IMDITHER user, I want drag-and-drop import affordances to keep working, so that source replacement remains convenient.
16. As an IMDITHER user, I want the slide comparison divider to keep working smoothly, so that before/after inspection is unchanged.
17. As an IMDITHER user, I want preview worker status updates not to make controls feel sluggish, so that background work does not interfere with editing.
18. As an IMDITHER user, I want worker preview updates to refresh the preview without rebuilding the whole control panel, so that the UI stays responsive.
19. As an IMDITHER user, I want the final processed output to match committed settings, so that responsiveness changes do not alter image semantics.
20. As an IMDITHER user, I want settings copy and paste to keep using committed settings, so that transient drag values are not persisted accidentally.
21. As an IMDITHER user, I want local-only processing to remain local-only, so that private images stay in the browser.
22. As an IMDITHER user, I want no visual redesign, so that the workstation still feels like the same app.
23. As an IMDITHER user, I want no new workflow steps, so that responsiveness improvements do not add friction.
24. As a maintainer, I want slider drag state to be local UI state, so that committed settings remain clean and predictable.
25. As a maintainer, I want committed settings to be the only values that start preview jobs, so that processing remains easy to reason about.
26. As a maintainer, I want the editor store to avoid broad subscriptions, so that unrelated store updates do not render the entire editor.
27. As a maintainer, I want a dedicated Preview Stage module, so that preview rendering and controls have a clear boundary.
28. As a maintainer, I want Preview Stage to own preview-card layout, so that upload, export, drop affordances, overlays, and preview surfaces stay cohesive.
29. As a maintainer, I want Preview Stage to own view-local interaction state such as drag-over and slide divider position, so that those interactions do not render the editor shell.
30. As a maintainer, I want Control Panel to be memoizable, so that preview worker updates do not rebuild controls without changed control props.
31. As a maintainer, I want callbacks passed across memoized boundaries to be stable, so that memoization is not defeated by function identity churn.
32. As a maintainer, I want preview canvases to redraw only when their image buffers change, so that control updates do not cause unnecessary canvas work.
33. As a maintainer, I want tests to cover committed behavior rather than implementation details, so that internals can evolve safely.
34. As a maintainer, I want the first implementation phase to stay small, so that the slider lag fix is not buried in a broad rewrite.
35. As a maintainer, I want later phases to handle deeper presentation performance, so that the app has a path beyond the immediate slider symptom.

## Implementation Decisions

- Treat absence of noticeable slider lag as the primary product acceptance criterion.
- The user will manually verify perceived slider lag after implementation.
- Automated verification for the implementation phase should use unit/component tests plus typecheck, lint, test, and build.
- Do not require a browser-based lag scenario in the current implementation iteration.
- Keep slider preview behavior commit-based: preview updates after release or reset, not continuously while dragging.
- Keep the numeric slider value live during drag.
- Treat slider draft values as transient UI state.
- Do not write slider draft values into the editor store.
- Do not persist slider draft values to localStorage.
- Treat committed settings as the source of truth for preview jobs, settings copy/paste, export, and persisted settings.
- Do not change preview job debounce or cancellation behavior specifically for sliders in Phase 1.
- Split broad editor store subscription usage into narrow selectors or an equivalent narrow subscription pattern.
- Do not let the editor shell subscribe to the whole store object when it only needs selected fields and actions.
- Build a dedicated Preview Stage module rather than only wrapping existing JSX in a memo call.
- Preview Stage should own the preview card layout.
- Preview Stage should own the processing overlay presentation.
- Preview Stage should own the original, processed, and slide comparison preview switching.
- Preview Stage should own upload and export button placement.
- Preview Stage should receive side-effect callbacks for upload, drop, and export instead of owning those side effects.
- Preview Stage should own drag-and-drop active UI state.
- Preview Stage should receive a file-drop callback and let the editor shell handle source intake.
- Preview Stage should own slide divider percent as view-local state.
- Compare mode should remain in persisted view state.
- View scale should remain in persisted view state.
- Source image buffer should remain runtime session state, not persisted store state.
- Processed preview buffer should remain runtime session state, not persisted store state.
- Processing status may remain store state, but updates should only render components that need status.
- Keep source and preview buffers out of Zustand for this PRD.
- Memoize Preview Stage so unrelated control updates do not rebuild the preview tree.
- Memoize Control Panel so preview/status updates do not rebuild controls unless control props change.
- Use stable callbacks or an equivalent stable command interface across Preview Stage and Control Panel boundaries.
- Presentation-level canvas optimization is in scope.
- Canvas drawing should happen only when the relevant buffer identity changes.
- Preview canvases should not remount or redraw because a slider draft value changed.
- Slide Compare Preview can remain a dedicated preview module and should keep its existing interaction semantics.
- Single Canvas Panel behavior should remain visually unchanged.
- If Phase 1 does not remove lag, Phase 2 should revisit slider internals and consider uncontrolled or imperative drag handling inside the field.
- Do not start with uncontrolled slider internals, because the earlier attempt did not resolve the symptom.
- Do not add profiling or measurement infrastructure in this PRD.
- Do not include import/source-intake responsiveness in this PRD; that is covered separately.
- Do not change image processing algorithms.
- Do not change preprocessing math.
- Do not change palette behavior.
- Do not change resize semantics.
- Do not change export output.
- Do not change preview quality targets.
- Do not change visual design, layout, or copy except where required by component extraction.

## Phasing

### Phase 1: Render Path Isolation

- Keep slider behavior commit-on-release.
- Ensure slider `onValueChange` updates only local draft UI.
- Ensure slider `onValueCommit` and reset are the only slider paths that commit settings.
- Split editor store subscriptions into narrow selectors.
- Extract Preview Stage as a deep UI module.
- Move preview-card layout, overlay, preview switching, upload/export placement, drop-active UI, and slide divider state into Preview Stage.
- Memoize Preview Stage with a small props contract.
- Memoize Control Panel where useful.
- Stabilize callbacks passed to Preview Stage and Control Panel.
- Add tests for slider local draft versus committed settings behavior.
- Add tests for preview/control boundary behavior where it can be verified without browser performance tooling.

### Phase 2: Slider Internal Responsiveness

- Start Phase 2 only if manual lag verification after Phase 1 still fails.
- Consider making slider thumb movement owned by Radix/DOM during drag.
- Consider throttling React draft display updates to animation frames.
- Keep parent-facing commits limited to release and reset.
- Preserve reset button behavior and accessibility.
- Preserve public component interface unless there is a strong reason to change it.

### Phase 3: Preview Presentation Hardening

- Ensure Canvas Panel redraws only when its buffer changes.
- Ensure Slide Compare Preview redraws original and processed canvases only when corresponding buffers change.
- Avoid remounting preview surfaces on unrelated control or store updates.
- Keep worker preview updates scoped to preview presentation.
- Keep control tree updates scoped to settings or view preference changes that controls actually display.

## Testing Decisions

- Good tests should verify behavior through public component and module interfaces, not private implementation details.
- Tests should describe user-visible or maintainer-relevant contracts: draft stays local, commits happen on release/reset, preview boundaries are not affected by draft-only interaction, and committed values still trigger settings transitions.
- Existing slider tests should remain the baseline for commit-on-release and reset behavior.
- Strengthen slider tests to verify `onValueChange` does not call the parent commit path.
- Strengthen slider tests to verify `onValueCommit` calls the parent commit path exactly once with the committed value.
- Add or keep reset tests that verify default reset commits immediately.
- Add tests that settings-facing transitions are not invoked for transient slider draft changes.
- Add tests around Preview Stage props or module behavior so control-only changes do not remount or redraw preview surfaces where this is observable in component tests.
- Add tests that slide divider state is local to Preview Stage if it is moved there.
- Add tests that drag/drop active state is local to Preview Stage if it is moved there.
- Add tests that Preview Stage still renders upload/export controls and calls external callbacks.
- Add tests that worker/status-driven preview updates do not require Control Panel behavior to change.
- Avoid tests that assert exact component nesting unless the nesting is part of accessibility or public module contract.
- Avoid tests that require exact render counts unless a render count is the only practical way to protect a performance boundary.
- Prefer testing prop stability and absence of parent-facing calls over testing React internals.
- Prior art in the codebase includes slider field tests, slide compare preview tests, preview frame tests, processing job event tests, and store tests.
- Full verification command set should include typecheck, lint, tests, and build.
- Manual lag verification is owned by the user after implementation.

## Out of Scope

- No import/source-intake responsiveness work.
- No profiling or telemetry layer.
- No browser automation requirement for this iteration.
- No changes to image decode.
- No OffscreenCanvas or worker-side canvas drawing requirement.
- No worker rewrite.
- No preview job scheduling changes for slider debounce.
- No algorithm changes.
- No palette changes.
- No preprocessing math changes.
- No output size policy changes.
- No PNG export format changes.
- No visual redesign.
- No new controls.
- No new compare modes.
- No persistence of slide divider position.
- No migration of large image buffers into Zustand.
- No backend processing.
- No cloud upload.
- No account system.

## Further Notes

The immediate suspected cause is not that preview recomputation happens on every slider movement. The current slider contract is intended to commit only on release. The stronger suspicion is that the editor render boundary is too broad: control interaction and preview presentation still live under a shared shell that can be invalidated by store updates, local runtime state, unstable callbacks, or preview job status changes.

This PRD intentionally starts with architecture that protects the drag path before changing the slider primitive itself. If the preview/control boundary is fixed and lag remains, Phase 2 can change the slider field internals with less uncertainty.

The key invariant is simple: while the pointer is down on a slider, the UI may update the slider thumb, slider number, and reset enabled state, but it should not do preview work or rebuild the preview tree.
