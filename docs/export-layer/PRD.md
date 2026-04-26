# Export Layer PRD

Status: done
Last updated: 2026-04-26

## Problem Statement

IMDITHER currently exports only PNG files. The existing export path is reliable, but it is hard-coded around one file format: the editor runs the full-output processing job, encodes the resulting pixel buffer as PNG, and downloads a `.png` file.

Users need control over the exported file format. PNG should remain the lossless default, but some workflows need smaller files or broader sharing compatibility. Without a dedicated export layer, adding formats risks scattering format-specific behavior across the editor, canvas helpers, metadata, file naming, and UI controls.

From the maintainer's perspective, export format support should not weaken the existing processing model. Preview, dithering, palettes, output size, Settings JSON, and worker behavior should remain focused on producing the final pixel buffer. File encoding should be a separate browser-side layer that turns that buffer into a selected file format.

## Solution

Add a browser-side export layer that supports PNG, WebP, and JPEG output from the full-resolution processed pixel buffer.

PNG remains the default and lossless baseline. WebP and JPEG use a shared lossy quality preference. The selected export format and quality are persisted as editor UI preferences, but they are not part of Editor Settings or Settings JSON because they do not affect image processing or preview generation.

The Preview Stage shows a compact format selector next to the export action. The export button becomes format-neutral and says `Export`. When the selected format supports quality, a `Quality` control is available for export encoding. Changing export format or quality does not restart preview processing.

JPEG export flattens alpha using the existing alpha background setting. PNG and WebP preserve the processed pixel buffer as the browser encoder supports it. Export metadata records the actual exported file format for the most recent export.

If a browser cannot encode the selected format, export fails explicitly with a clear error instead of silently falling back to a different format.

## User Stories

1. As an IMDITHER user, I want to export PNG files, so that my existing lossless workflow keeps working.
2. As an IMDITHER user, I want to export WebP files, so that I can create smaller image files for web sharing.
3. As an IMDITHER user, I want to export JPEG files, so that I can use the output in places that expect JPEG.
4. As an IMDITHER user, I want PNG to remain the default export format, so that existing behavior is preserved unless I choose otherwise.
5. As an IMDITHER user, I want the export format selector near the export button, so that the file format decision is visible where I export.
6. As an IMDITHER user, I want the export button to say `Export`, so that the control does not resize or change wording for each format.
7. As an IMDITHER user, I want the selected export format to persist between sessions, so that I do not repeat the same choice every time.
8. As an IMDITHER user, I want export quality to persist between sessions, so that my preferred lossy compression setting is remembered.
9. As an IMDITHER user, I want a quality control for WebP and JPEG, so that I can choose between smaller files and visual fidelity.
10. As an IMDITHER user, I want no quality control for PNG, so that the UI does not show a meaningless setting.
11. As an IMDITHER user, I want WebP and JPEG to share one quality setting, so that export configuration stays simple.
12. As an IMDITHER user, I want the default lossy quality to be high, so that first exports do not unexpectedly look degraded.
13. As an IMDITHER user, I want JPEG alpha handling to follow the existing alpha background setting, so that transparent areas become predictable black or white pixels.
14. As an IMDITHER user, I want PNG export to keep preserving the processed pixel buffer, so that sharp dithered output remains lossless.
15. As an IMDITHER user, I want WebP export to preserve alpha where the browser encoder supports it, so that transparent outputs can remain useful.
16. As an IMDITHER user, I want exported file extensions to match the selected format, so that downloaded files are named correctly.
17. As an IMDITHER user, I want export errors to name the failed format, so that I understand what went wrong.
18. As an IMDITHER user, I want unsupported WebP or JPEG export to fail clearly, so that I am not given a misleading fallback file.
19. As an IMDITHER user, I want changing export format to avoid restarting preview processing, so that export choice feels lightweight.
20. As an IMDITHER user, I want changing export quality to avoid restarting preview processing, so that compression tuning does not interrupt editing.
21. As an IMDITHER user, I want the exported file to use the current full output dimensions, so that export quality is not reduced by screen preview behavior.
22. As an IMDITHER user, I want preview and export to keep using the same current image settings, so that the exported image matches the chosen recipe.
23. As an IMDITHER user, I want copied Settings JSON to exclude export format and quality, so that settings remain a processing recipe.
24. As an IMDITHER user, I want pasted Settings JSON to avoid changing my export format, so that file output preference stays independent.
25. As an IMDITHER user, I want the metadata panel to show the real last exported format, so that export details stay accurate.
26. As a maintainer, I want file encoding behind an export layer, so that format behavior is not scattered across the editor.
27. As a maintainer, I want export format options defined once, so that labels, extensions, MIME types, and quality support cannot drift.
28. As a maintainer, I want the export layer to stay browser-side, so that the core processing package remains DOM-free.
29. As a maintainer, I want processing to keep returning a pixel buffer, so that file format support does not change dithering code.
30. As a maintainer, I want export metadata to support PNG, WebP, and JPEG, so that the metadata type matches product behavior.
31. As a maintainer, I want the default processing metadata behavior to remain compatible, so that non-export callers are not forced to choose a browser file format.
32. As a maintainer, I want JPEG alpha flattening to be tested directly, so that transparent inputs do not produce browser-dependent surprises.
33. As a maintainer, I want unsupported encoder failures to be testable, so that error behavior remains explicit.
34. As a maintainer, I want export controls tested at the component boundary, so that UI wiring remains stable without over-testing canvas internals.
35. As a maintainer, I want the full repository quality gate to pass after implementation, so that format support does not regress existing behavior.

## Implementation Decisions

- Build a browser-side Export Image module as the export layer.
- Keep the export layer out of the core processing package because encoding uses DOM and canvas APIs.
- Support exactly PNG, WebP, and JPEG in the first version.
- Keep PNG as the default export format.
- Do not include SVG in the first version because the processed output is a raster pixel buffer, not a vector representation.
- Define export format options in one place with stable ids, labels, file extensions, MIME types, and quality support.
- Encode output from the full-resolution processed pixel buffer, not from preview buffers.
- Keep the processing pipeline responsible for producing pixels, not for browser file encoding.
- Store the selected export format as a persisted editor preference.
- Store lossy export quality as a persisted editor preference.
- Keep export format and export quality outside Editor Settings.
- Keep export format and export quality outside Settings JSON clipboard copy and paste.
- Use one shared quality value for WebP and JPEG.
- Use a default quality of `0.92`.
- Use a quality range from `0.1` to `1.0`.
- Use a quality step of `0.05`.
- Show the quality control only for formats that support lossy quality.
- Use the existing alpha background setting when flattening JPEG output.
- Do not add a separate export background setting in the first version.
- Preserve alpha for PNG.
- Preserve alpha for WebP where browser encoding supports it.
- Fail explicitly when the selected browser encoder cannot produce a blob.
- Do not silently fall back to PNG when WebP or JPEG export fails.
- Keep the selected format unchanged after an export failure.
- Rename the visible export action to `Export`.
- Place a compact export format selector next to the export button in the Preview Stage.
- Keep export controls in the Preview Stage rather than the main processing control panel.
- Keep export status format-neutral.
- Extend export metadata format support to PNG, WebP, and JPEG.
- Let the web export layer apply the actual selected format to the final export metadata after processing.
- Keep default processing metadata compatible for callers that do not pass through the web export layer.
- Generate downloaded filenames with the correct extension for the selected format.

## Testing Decisions

- Good tests should verify public behavior and stable contracts, not private implementation details such as internal registry object shape or exact hook ordering.
- Test the export layer directly with pixel buffers and export options.
- Test that PNG, WebP, and JPEG map to the expected MIME types and file extensions.
- Test that PNG encoding does not use lossy quality controls.
- Test that WebP and JPEG pass the selected quality to browser encoding.
- Test that JPEG export flattens alpha against the current alpha background.
- Test that encoder failures return explicit format-specific errors.
- Test that unsupported WebP or JPEG export does not silently create a PNG fallback.
- Test filename generation for all supported formats.
- Test store persistence for export format and quality as editor preferences.
- Test that persisted export preferences are not included in Settings JSON.
- Test that applying Settings JSON does not change export format or quality.
- Test Preview Stage wiring so format selection and export action call the expected callbacks.
- Test that the quality control appears for WebP and JPEG and is absent for PNG.
- Test that changing export format or quality does not trigger preview processing.
- Test that export jobs still run at full output size and ignore preview sizing behavior.
- Test that metadata shown after export reports the selected format.
- Existing image helper tests are prior art for canvas-based pixel buffer behavior.
- Existing processing job tests are prior art for export job lifecycle and full-output guarantees.
- Existing Preview Stage tests are prior art for keeping upload and export side effects behind callbacks.
- Existing store tests and settings transition tests are prior art for persisted editor preferences and Settings JSON boundaries.
- Run the repository quality gate with `bun verify` after implementation.

## Out of Scope

- No SVG export.
- No GIF export.
- No AVIF export.
- No TIFF export.
- No PDF export.
- No image sequence or batch export.
- No delivery-method export targets such as copy image to clipboard, open in new tab, or share sheet.
- No custom export background control.
- No per-format quality profiles.
- No PNG compression-level control.
- No WebP lossless toggle.
- No JPEG chroma subsampling control.
- No metadata embedding in exported files.
- No changes to dithering algorithms.
- No changes to palette behavior.
- No changes to preprocessing behavior.
- No changes to resize semantics.
- No changes to source intake limits.
- No changes to preview comparison modes.
- No backend or cloud export service.
- No replacement of the current canvas-based browser encoding path.

## Further Notes

The key product distinction is that Editor Settings describe how the image is processed, while Export Preferences describe how the finished pixel buffer is encoded as a file.

The export layer should follow the same architectural direction as the algorithm registry: a small public contract, one source of truth for options, and tests around behavior rather than private shape. Unlike the algorithm registry, this layer belongs in the web app because browser encoders are not DOM-free.

The highest-risk detail is alpha handling for JPEG. Using the existing alpha background setting keeps the first version understandable without adding another control.
