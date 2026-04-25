# Import and Processing Responsiveness PRD

## Problem Statement

When an IMDITHER user imports a Source Image, the editor can become temporarily unresponsive while the app is decoding the image, converting it into a pixel buffer, sending data into processing, or presenting the result back onto the preview surface.

This is confusing because the app already has a Web Worker for image processing. From the user's perspective, worker-backed processing should mean the Control Panel, Compare Mode, view controls, upload affordances, and visible status state remain usable while work is happening. Instead, the UI can feel frozen during the exact moments where responsiveness matters most: import, initial preview generation, and processing updates after settings changes.

The product problem is not only raw processing speed. The product problem is that the user cannot trust the workstation to stay interactive while heavy local image work is in progress.

## Solution

Make import and processing responsiveness an explicit product requirement across the whole local image pipeline, not only inside the dithering algorithm worker.

The editor should keep the UI interactive during Source Intake, Preview Jobs, and Export Jobs. Heavy image work should run behind async job boundaries with clear status events, cancellation where appropriate, and minimal main-thread pixel copying. The UI should render status changes before expensive work starts, preserve existing source-size rejection behavior, and keep the current local-only browser model.

The final user experience should be:

- Importing a supported image immediately updates the interface into an importing or processing state.
- Controls remain usable while import and preview work continue.
- If a new image or setting change supersedes old preview work, stale preview work is canceled or ignored.
- The user can still change settings, compare mode, theme, view scale, and advanced controls while processing is active.
- Large but allowed images do not make the editor feel stuck without feedback.
- Unsupported or oversized images still fail with a clear Source Intake error.
- Export may remain a deliberate heavier operation, but it should report state clearly and avoid freezing non-export controls where practical.

## User Stories

1. As an IMDITHER user, I want the editor to stay interactive while I import an image, so that the app does not feel frozen.
2. As an IMDITHER user, I want the status to change immediately after I choose a file, so that I know the app accepted my action.
3. As an IMDITHER user, I want the Control Panel to remain usable during image import, so that I can inspect or adjust settings while waiting.
4. As an IMDITHER user, I want Compare Mode controls to remain usable during processing, so that I can keep navigating the preview.
5. As an IMDITHER user, I want theme controls to remain usable during processing, so that global UI controls do not feel blocked by image work.
6. As an IMDITHER user, I want view scale controls to remain usable during processing, so that I can switch between fit and actual size without waiting.
7. As an IMDITHER user, I want drag-and-drop import to show state quickly, so that the app does not appear to ignore the drop.
8. As an IMDITHER user, I want paste import to show state quickly, so that clipboard import has the same responsiveness as file upload.
9. As an IMDITHER user, I want the old preview to remain visible while a new preview is being prepared, so that the workspace does not flash blank.
10. As an IMDITHER user, I want processing overlays to describe the current state, so that I understand why the processed image has not updated yet.
11. As an IMDITHER user, I want allowed large images to process without freezing the whole UI, so that the source limit feels useful rather than risky.
12. As an IMDITHER user, I want oversized images to be rejected clearly, so that responsiveness work does not reintroduce silent downscaling.
13. As an IMDITHER user, I want rapid setting changes to remain responsive, so that tuning dithering controls feels interactive.
14. As an IMDITHER user, I want stale preview work to stop affecting the current preview, so that old results do not overwrite newer settings.
15. As an IMDITHER user, I want reduced preview work to appear quickly, so that I get visual feedback before refinement finishes.
16. As an IMDITHER user, I want refined preview work to update smoothly, so that quality improves without disrupting the workflow.
17. As an IMDITHER user, I want export state to be explicit, so that I can distinguish preview processing from final output generation.
18. As an IMDITHER user, I want export to avoid locking unrelated UI where practical, so that the workstation still feels alive.
19. As an IMDITHER user, I want errors during import or processing to preserve the rest of the UI, so that one failed image does not break the session.
20. As an IMDITHER user, I want local-only processing to remain local-only, so that my images are not sent to a backend.
21. As an IMDITHER user, I want the app to preserve image privacy while improving responsiveness, so that performance work does not change the trust model.
22. As an IMDITHER user, I want the image size limits to remain understandable, so that I know which files are accepted.
23. As an IMDITHER user, I want responsive behavior to work for bundled demo images, so that the default experience matches real import behavior.
24. As an IMDITHER user, I want responsive behavior to work for uploaded files, so that normal desktop usage is reliable.
25. As an IMDITHER user, I want responsive behavior to work for pasted images, so that clipboard workflows remain first-class.
26. As an IMDITHER user, I want the app to avoid unnecessary layout shifts while processing, so that the interface remains stable.
27. As an IMDITHER user, I want status labels to be specific, so that I can tell import, preview processing, refinement, and export apart.
28. As an IMDITHER user, I want the preview surface to show progress state without blocking controls, so that feedback and interactivity happen together.
29. As an IMDITHER user, I want the same final image output as before, so that responsiveness changes do not alter dithering results.
30. As an IMDITHER user, I want settings JSON copy and paste to remain available during processing, so that settings workflows are not blocked.
31. As a maintainer, I want responsiveness to be tested at module boundaries, so that regressions are caught without brittle implementation tests.
32. As a maintainer, I want Source Intake to expose a simple async interface, so that import behavior can evolve without changing the editor.
33. As a maintainer, I want Processing Jobs to keep owning preview scheduling, so that debounce, cancellation, and refinement remain centralized.
34. As a maintainer, I want the worker protocol to stay typed, so that image work boundaries remain explicit.
35. As a maintainer, I want large pixel buffers to cross boundaries with transfer semantics where possible, so that avoidable copies do not block the main thread.
36. As a maintainer, I want the editor store to avoid holding unnecessary transient work state, so that React updates stay cheap.
37. As a maintainer, I want preview presentation to be treated as a performance-sensitive stage, so that drawing results does not become a hidden freeze point.
38. As a maintainer, I want browser capability differences to be handled deliberately, so that responsiveness degrades predictably where advanced APIs are unavailable.
39. As a maintainer, I want telemetry-like timings in development or metadata where useful, so that import, queue, processing, and draw delays can be diagnosed.
40. As a maintainer, I want no backend dependency, so that the app remains deployable as a static local-processing web app.

## Implementation Decisions

- Treat the current worker as covering the core dithering stage only. The responsiveness requirement applies to the whole local image pipeline: Source Intake, worker dispatch, preview scheduling, result transfer, and canvas presentation.
- Keep the deterministic image-processing engine DOM-free and reusable.
- Preserve the current local-only architecture. No backend processing, upload service, account model, or cloud queue is introduced.
- Preserve the hard Source Image dimension rejection policy. Responsiveness improvements must not silently downscale oversized sources during import.
- Keep Source Intake as the boundary that accepts or rejects Source Images and produces Source Notices.
- Deepen Source Intake into a stable async module boundary that can hide decode, metadata read, pixel extraction, and capability-specific behavior behind one simple accepted-or-rejected result.
- Keep Processing Jobs as the module that owns preview scheduling, queue delay, reduced preview, refined preview, cancellation, and export coordination.
- Keep the core Processing Job worker protocol typed and explicit.
- Consider a dedicated import worker or shared image-work worker for expensive decode and pixel extraction, but decide through the Source Intake interface rather than coupling the editor directly to worker details.
- Consider worker-side image decoding and pixel extraction with browser-supported APIs when available.
- Provide a main-thread fallback for browsers where worker-side image decode or offscreen canvas APIs are unavailable.
- In fallback paths, yield control before heavy work and between expensive chunks where possible so status updates and user input can render.
- Prefer transferring large pixel buffers over cloning them when crossing thread boundaries.
- Avoid repeated full-buffer copies for the same Source Image when the worker can safely cache or reuse a source.
- Avoid keeping large pixel buffers in global UI state unless the UI needs them for rendering.
- Treat preview canvas drawing as a separate performance stage, not as free UI work.
- Keep the currently visible preview on screen while replacement work is queued or processing.
- Preserve stale-job safety: results from older jobs must not overwrite newer source or settings state.
- Keep Preview Jobs cancellable. Export Jobs may be durable, but should not make preview state ambiguous.
- Status should distinguish import, queued preview, processing, refined preview, export, ready, and error states where the UI needs that clarity.
- The implementation should not change algorithm output, palette behavior, preprocessing behavior, resize semantics, metadata schema, or PNG export format.
- The implementation should fit the existing single-screen workstation UI and avoid adding a wizard or multi-step import flow.

## Testing Decisions

- Good tests should verify externally visible behavior: accepted/rejected intake results, emitted job events, cancellation behavior, stale result handling, status transitions, and UI interactivity expectations.
- Tests should avoid asserting private worker internals, timer implementation details beyond observable event order, or exact implementation choices such as whether a particular browser API is used.
- Source Intake should be tested through its public async interface.
- Source Intake tests should cover accepted images, oversized rejection, decode failure, Source Notice output, and fallback behavior where practical.
- Processing Jobs should remain covered through emitted events and cancellation behavior.
- Worker client tests should cover request/response behavior, source caching behavior, abort behavior, stale job behavior, and transfer-friendly message construction where practical.
- Editor integration tests should verify that file import sets visible busy state before long-running work resolves.
- Editor integration tests should verify that controls remain clickable or changeable while import and preview jobs are pending.
- Preview presentation tests should verify that the previous preview remains visible while a new preview is pending.
- Export tests should verify that export state is explicit and that errors restore a usable editor state.
- Prior art in the codebase: Source Intake tests cover accepted/rejected source behavior, Processing Jobs tests cover event sequencing and cancellation, slide preview tests cover observable UI behavior around canvas-driven preview surfaces, and core processing tests cover deterministic image output.
- If browser-level regression coverage is added, use an end-to-end test with a large synthetic image and assert responsiveness through observable UI actions rather than measuring exact frame timing.

## Out of Scope

- No implementation work is included in this PRD step.
- No change to dithering algorithms.
- No change to palette presets.
- No change to preprocessing controls.
- No change to resize semantics or output cap policy.
- No change to the hard source dimension limit.
- No backend image processing.
- No cloud upload.
- No account system.
- No batch processing.
- No import wizard.
- No replacement of the existing UI design system.
- No guarantee that final export of very large outputs is instant.
- No requirement to support unsupported browser APIs without fallback.

## Further Notes

The current architecture already has a worker for core image processing, but a frozen UI can still happen if heavy stages remain on the main thread before or after that worker stage.

Known risk areas to investigate before implementation:

- Source Image decode and conversion into a pixel buffer.
- Full-size canvas reads during Source Intake.
- Large pixel-buffer cloning before worker dispatch.
- React state updates carrying large image data.
- Canvas writes when presenting original or processed buffers.
- Export PNG generation.

The implementation should begin by measuring which stage blocks the UI in the current app, then move or reshape the smallest responsible boundary. The desired product outcome is not "everything is in a worker"; the desired outcome is "the editor remains usable while local image work is happening."
