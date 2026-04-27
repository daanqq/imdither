# Ubiquitous Language

## Image Lifecycle

| Term                 | Definition                                                                                          | Aliases to avoid                              |
| -------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Source Image**     | The user-provided or bundled demo image before IMDITHER processing.                                 | Input image, uploaded image, original file    |
| **Demo Image**       | The bundled **Source Image** available before the user loads their own image.                       | Sample, placeholder                           |
| **Processed Image**  | The image produced by applying the current **Editor Settings** to the **Source Image**.             | Result image, output image, after image       |
| **Reduced Preview**  | A lower-resolution **Processed Image** used for responsive on-screen editing.                       | Preview only, draft output, temporary output  |
| **Screen Preview**   | A **Processed Image** sized for the current on-screen **Display Frame** in **Fit View**.            | Fit output, screen output, display output     |
| **Full Output**      | The **Processed Image** at the selected **Output Size**.                                            | Full preview, final render, full-size preview |
| **Export File**      | The downloaded image file encoded from the **Full Output** using the selected **Export Format**.    | Download, export PNG, final image             |
| **Output Size**      | The selected width and height used for **Full Output** and **Export File**.                         | Resolution, dimensions, image size            |
| **Output Cap**       | The maximum allowed browser pixel budget for **Output Size**.                                       | Ready %, capacity, render cap, limit          |
| **Source Intake**    | The decision flow that accepts or rejects a **Source Image** before processing.                     | Upload handling, import pipeline              |
| **Source Notice**    | A short user-facing message about **Source Intake** or **Output Size** policy changes.              | Status badge, toast, alert                    |
| **Pixel Buffer**     | The in-memory pixel data and dimensions used for local processing and preview rendering.            | Image data, typed array, buffer blob          |
| **Alpha Flattening** | The stage that composites transparent source pixels onto an **Alpha Background** before processing. | Transparency handling, alpha removal          |
| **Alpha Background** | The black or white background used during **Alpha Flattening**.                                     | Matte color, flatten color                    |

## Export

| Term                       | Definition                                                                                                      | Aliases to avoid                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Export Preferences**     | Persisted editor UI preferences that control how **Full Output** is encoded into an **Export File**.            | Export settings, output settings   |
| **Export Format**          | The selected file format for an **Export File**, currently PNG, WebP, or JPEG.                                  | File type, download type           |
| **Export Format Option**   | A selectable **Export Format** entry with stable id, label, MIME type, extension, and quality support.          | Format item, select option         |
| **Export Quality**         | The shared lossy encoder quality used for WebP and JPEG **Export Files**.                                       | Compression, quality setting       |
| **Quality Control**        | The **Export Drawer** control that changes **Export Quality** when the **Export Format** supports it.           | Quality slider, compression slider |
| **Format Selector**        | The **Export Drawer** control that changes **Export Format**.                                                   | Format dropdown, export dropdown   |
| **Export Action**          | The format-neutral editor command that starts an **Export Job** and downloads an **Export File**.               | Export PNG button, download button |
| **Export Drawer**          | The responsive drawer that owns **Export Format**, **Export Quality**, and the final **Export Action**.         | Export panel, download drawer      |
| **Export Layer**           | The browser-side layer that encodes a **Pixel Buffer** into an **Export File**.                                 | Image helper, canvas helper        |
| **Browser Encoder**        | The browser canvas encoder used by the **Export Layer** to create a file blob for an **Export Format**.         | Canvas export, toBlob path         |
| **Encoder Failure**        | The explicit failure state when a **Browser Encoder** cannot produce the requested **Export Format**.           | Fallback, silent PNG fallback      |
| **JPEG Alpha Flattening**  | The export-time alpha compositing used before JPEG encoding because JPEG has no alpha channel.                  | JPEG transparency handling         |
| **Export Metadata Format** | The actual **Export Format** recorded in **Processing Metadata** for the most recent **Export File**.           | Metadata format, output format     |
| **Export Entry Point**     | The **Preview Stage** button that opens the **Export Drawer**.                                                  | Export button, download entry      |
| **Preview Action Row**     | The row below the preview where `Upload` and **Export Entry Point** align left while undo and redo align right. | Bottom toolbar, preview buttons    |

## Public Contracts

| Term                          | Definition                                                                                                           | Aliases to avoid                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **Product Contract**          | The maintained description of current IMDITHER product behavior and boundaries.                                      | Product docs, app description          |
| **Settings Schema Reference** | The public reference for **Editor Settings** schema version 2 and **Settings JSON** normalization rules.             | Settings docs, JSON docs               |
| **Schema Version 1**          | The legacy **Editor Settings** compatibility shape accepted by normalization.                                        | Current settings version               |
| **Schema Version 2**          | The current **Editor Settings** compatibility baseline with **Color Depth** and **Matching Mode**.                   | v2 settings, settings version          |
| **Public Hardening Baseline** | The Phase 0 baseline of license, docs, tests, fixtures, and performance reports that future roadmap work builds on.  | Cleanup, docs pass, prep work          |
| **Visual Contract**           | Deterministic test coverage that protects preview, processing, compare, and export behavior without screenshot diff. | Visual tests, screenshot baseline      |
| **Core Pixel Golden**         | A compact expected pixel fixture for public core processing output.                                                  | Golden image, snapshot image           |
| **Export Contract Fixture**   | A test fixture for encoder request and pre-encode behavior without byte-for-byte encoded snapshots.                  | Export golden, encoded file snapshot   |
| **Performance Baseline**      | A non-gating timing report for representative current processing scenarios.                                          | Benchmark, speed test, perf threshold  |
| **Performance Threshold**     | A pass/fail timing limit that is intentionally out of scope until runtime noise is calibrated.                       | Performance baseline, benchmark target |

## Processing

| Term                           | Definition                                                                                                                                    | Aliases to avoid                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Editor Settings**            | The versioned processing configuration that determines the current **Processed Image**.                                                       | Config, preset, options                      |
| **Settings JSON**              | A serialized **Editor Settings** payload used for reproducible clipboard copy and paste.                                                      | Preset JSON, config JSON, import/export JSON |
| **Look Snapshot**              | A shareable artifact that wraps normalized **Editor Settings** with lightweight look metadata.                                                | Settings JSON, preset file, saved state      |
| **Look Payload**               | The compact, gzip-compressed, base64url transport form of one **Look Snapshot**.                                                              | Settings payload, URL state, compressed JSON |
| **URL Look Import**            | The one-shot flow that applies a **Look Payload** from `#look=<payload>` and then clears the hash.                                            | URL state sync, route import, live hash      |
| **Clipboard Look**             | The clipboard text flow that copies or pastes a **Look Payload** as a full URL or bare payload.                                               | Clipboard settings, settings paste           |
| **Settings Transition**        | A user intent that produces one next **Editor Settings** value while preserving domain rules.                                                 | Settings patch, state update                 |
| **Settings History**           | The session-local undo and redo stack for **Editor Settings** changes.                                                                        | History, edit history, undo stack            |
| **Undo Settings Change**       | The command that restores the previous **Editor Settings** entry from **Settings History**.                                                   | Undo, revert change                          |
| **Redo Settings Change**       | The command that reapplies the next **Editor Settings** entry from **Settings History** after undo.                                           | Redo, reapply change                         |
| **Transition Context**         | The current source dimensions used by a **Settings Transition** when applying aspect rules.                                                   | Source context, transition data              |
| **Aspect Lock**                | The rule that keeps **Output Size** proportional to the current **Source Image**.                                                             | Keep ratio, proportional resize              |
| **Processing Preset**          | A curated starting recipe that applies selected processing fields without becoming stored state.                                              | Recipe mode, settings preset                 |
| **Processing Recipe**          | The set of **Editor Settings** fields controlled by one **Processing Preset**.                                                                | Preset config, preset payload                |
| **Active Recipe**              | The **Processing Preset** currently matched from actual **Editor Settings**.                                                                  | Selected preset, stored preset               |
| **Custom Recipe State**        | The selector state shown when **Editor Settings** do not match any **Processing Preset**.                                                     | Custom preset, unsaved recipe                |
| **Default Processing Preset**  | The first **Processing Preset** whose **Processing Recipe** matches **Default Settings**.                                                     | Startup preset, initial recipe               |
| **Default Settings**           | The initial **Editor Settings** used before user changes or persisted state are applied.                                                      | Factory settings, initial config             |
| **Dither Algorithm**           | The selected method for producing spatial tone or color patterns from a **Palette**.                                                          | Filter, effect                               |
| **Dither Algorithm Id**        | The stable settings value that identifies a **Dither Algorithm** across sessions and JSON.                                                    | Algorithm name, label                        |
| **No Dither**                  | Direct palette mapping without spatial patterning or error diffusion.                                                                         | Plain quantize, none algorithm               |
| **Bayer Dithering**            | Ordered dithering using a 2x2, 4x4, or 8x8 Bayer matrix.                                                                                      | Bayer, ordered                               |
| **Matt Parker Dithering**      | Palette-aware pattern dithering based on a Parker-style threshold matrix.                                                                     | Matt Parker, Parker                          |
| **Floyd-Steinberg Dithering**  | Error diffusion using the Floyd-Steinberg kernel.                                                                                             | Floyd, FS                                    |
| **Atkinson Dithering**         | Error diffusion using the Atkinson kernel.                                                                                                    | Atkinson                                     |
| **Bayer Size**                 | The selected Bayer matrix dimension: 2, 4, or 8.                                                                                              | Matrix size, Bayer matrix                    |
| **Palette**                    | A named set of colors available to palette mapping and dithering.                                                                             | Color set, swatches                          |
| **Palette Preset**             | A built-in **Palette** shipped with the app.                                                                                                  | Default palette, built-in palette            |
| **Custom Palette**             | The one active user-defined **Palette** stored in **Editor Settings** and shown as `Custom` in the Palette control.                           | User palette, manual palette                 |
| **Palette Asset**              | A standalone reusable palette payload imported or exported separately from full **Settings JSON**.                                            | Palette settings, preset JSON                |
| **Palette Import**             | The file picker or clipboard flow that parses HEX/plain text, GPL, palette JSON, JSON hex arrays, or Settings JSON into a **Custom Palette**. | Palette upload, palette paste                |
| **Palette Export**             | The flow that downloads or copies the active **Custom Palette** as palette JSON or GPL without exporting processing settings.                 | Settings export, palette save                |
| **Palette Extraction**         | The command that derives a **Custom Palette** from the current **Source Image** using deterministic source-buffer analysis.                   | Auto palette, sampled palette                |
| **Extraction Size**            | The requested number of colors for **Palette Extraction**, currently 2, 4, 8, 16, or 32.                                                      | Palette size, color depth                    |
| **Palette Resolution**         | The rule that chooses the actual **Palette** from **Editor Settings** before processing.                                                      | Palette lookup, palette selection            |
| **Effective Palette**          | The palette actually used for processing after **Color Depth** is applied.                                                                    | Trimmed palette, processing palette          |
| **Full Palette Depth**         | The **Color Depth** mode where the **Effective Palette** contains every color from the active **Palette**.                                    | Full color depth, unlimited colors           |
| **Limited Palette Depth**      | The **Color Depth** mode where the **Effective Palette** contains only the first 2, 4, 8, or 16 colors from the active **Palette**.           | Palette trim, color count                    |
| **Color Depth**                | The **Editor Settings** field that chooses **Full Palette Depth** or **Limited Palette Depth**.                                               | Palette size, extraction size                |
| **Matching Mode**              | The **Editor Settings** field that chooses RGB or perceptual nearest-color distance.                                                          | Match quality, color match                   |
| **RGB Matching**               | The **Matching Mode** that chooses nearest palette colors by squared distance in encoded sRGB channels.                                       | RGB distance, default matching               |
| **Perceptual Matching**        | The **Matching Mode** that chooses nearest palette colors by squared distance in Oklab coordinates.                                           | Oklab matching, perceptual color             |
| **Palette Matcher**            | The processing contract that prepares a palette and resolves the nearest color for a selected **Matching Mode**.                              | Color matcher, nearest-color helper          |
| **Palette Default Color Mode** | The **Color Mode** applied automatically when a **Palette Preset** is selected.                                                               | Palette color preset, palette mode           |
| **Color Mode**                 | The choice between grayscale-first and color-preserve processing.                                                                             | Source color mode, color handling            |
| **Preprocessing**              | Tone and color adjustment applied before palette mapping and dithering.                                                                       | Adjustment, correction, filters              |
| **Resize Fit**                 | The rule that maps source dimensions into output dimensions using contain, cover, or stretch.                                                 | Crop mode, fit mode                          |
| **Resize Mode**                | The sampling method used by resize, currently bilinear or nearest-neighbor.                                                                   | Resample mode, scaling mode                  |
| **Processing Metadata**        | The export-facing facts that describe the processing result and last **Export Metadata Format**.                                              | Export details, render metadata              |
| **Preview Target Override**    | A temporary processing size used by a **Preview Job** without changing **Editor Settings**.                                                   | Preview settings, screen settings            |

## Algorithm Registry

| Term                            | Definition                                                                                           | Aliases to avoid               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Dither Algorithm Registry**   | The core source of truth for supported algorithm ids, labels, capabilities, execution, and metadata. | Algorithm list, switch list    |
| **Dither Algorithm Option**     | The selectable representation of a **Dither Algorithm** shown by the editor.                         | Select item, UI option         |
| **Dither Algorithm Capability** | A declared feature of a **Dither Algorithm** that controls algorithm-specific editor controls.       | Special case, hard-coded check |
| **Algorithm Metadata Label**    | The human-readable algorithm label written into **Processing Metadata**.                             | Algorithm name, display string |
| **Algorithm Selector**          | The editor control that chooses one **Dither Algorithm Option**.                                     | Dropdown, algorithm menu       |
| **Bayer Matrix Control**        | The editor control that changes **Bayer Size** when the selected algorithm supports it.              | Bayer toggle, matrix selector  |

## Processing Presets

| Term                            | Definition                                                                                                 | Aliases to avoid                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Processing Preset Registry**  | The core source of truth for curated **Processing Presets**, lookup, and matching.                         | UI preset list, recipe list        |
| **Processing Preset Id**        | The stable registry value that identifies a **Processing Preset** but is not stored in settings.           | Recipe id in settings, preset key  |
| **Processing Preset Option**    | The selectable representation of a **Processing Preset** shown by the **Recipe Selector**.                 | Recipe option, dropdown item       |
| **Recipe Selector**             | The editor control that applies a **Processing Preset** or shows **Custom Recipe State**.                  | Preset dropdown, recipe dropdown   |
| **Recipe-Controlled Field**     | An **Editor Settings** field owned by a **Processing Recipe** when matching or applying a preset.          | Preset field, recipe setting       |
| **Effective Recipe Color Mode** | The **Color Mode** a **Processing Recipe** controls, either explicit or inherited from its palette.        | Preset color mode, recipe mode     |
| **Bayer Recipe**                | A **Processing Preset** whose recipe selects **Bayer Dithering** and controls **Bayer Size**.              | Bayer preset, ordered preset       |
| **Non-Bayer Recipe**            | A **Processing Preset** whose recipe does not control **Bayer Size**.                                      | Regular preset, non-ordered preset |
| **Fine Mono Bayer**             | The default **Processing Preset** for ordered grayscale output with the 4 Gray palette and 8x8 Bayer size. | Fine preset, first preset          |

## Auto-Tune

| Term                              | Definition                                                                                                   | Aliases to avoid                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| **Auto-Tune**                     | The image-aware workflow that recommends normal **Look Snapshots** from the current **Source Image**.        | Magic preset, AI preset, auto mode    |
| **Auto-Tune Panel**               | The editor panel that shows generated Auto-Tune looks, inline Auto-Tune states, and the recommendation list. | Assistant panel, smart controls       |
| **Auto-Tune Candidate**           | One deterministic candidate look generated and ranked by core before shortlist selection.                    | Hidden recommendation, generated item |
| **Auto-Tune Recommendation**      | A ranked candidate look shown to the user as a normal applicable **Look Snapshot**.                          | Auto preset, suggested preset         |
| **Auto-Tune Shortlist**           | The visible 3 to 5 **Auto-Tune Recommendations** selected from the ranked candidate pool.                    | Results, recommendation pool          |
| **Recommended Marker**            | The visual marker on the top-ranked **Auto-Tune Recommendation**.                                            | Best badge, confidence score          |
| **Applied Recommendation Marker** | The runtime marker showing which visible **Auto-Tune Recommendation** was last applied.                      | Active auto preset, selected look     |
| **Demo Auto-Tune Seed**           | The bundled demo recommendation fixture shown immediately for the **Demo Image** before runtime analysis.    | Demo preset list, cached results      |
| **Auto-Tune Analysis**            | The deterministic source-image metrics used to rank **Auto-Tune Candidates**.                                | Reasoning, ML inference, score data   |

## Preview And Comparison

| Term                               | Definition                                                                                                                | Aliases to avoid                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Preview**                        | The on-screen rendering of the **Source Image**, **Processed Image**, or both.                                            | Canvas view, display, preview mode |
| **Compare Mode**                   | The preview selection among processed-only, original-only, and slide comparison.                                          | Preview mode, split mode           |
| **Processed View**                 | A **Compare Mode** that shows only the **Processed Image**.                                                               | Result view, output view           |
| **Original View**                  | A **Compare Mode** that shows only the **Source Image**.                                                                  | Source view, before view           |
| **Slide Compare**                  | A **Compare Mode** that overlays source and processed images in one frame with a draggable divider.                       | Split compare, before-after slider |
| **Slide Divider**                  | The draggable vertical control that sets the reveal boundary in **Slide Compare**.                                        | Slider, handle, divider            |
| **View Scale**                     | The legacy desktop preview sizing concept now represented by **Preview Viewport** mode.                                   | Zoom mode, scale mode              |
| **Screen Fit**                     | The user-facing **Fit View** control that shows the whole image as a screen-sized preview.                                | Fit, fit to screen                 |
| **Real Pixels**                    | The user-facing **Manual View** control for inspecting output pixels with zoom, pan, 1:1, and **Pixel Inspector**.        | Pixels, 1:1 mode, actual pixels    |
| **Fit View**                       | A **Preview Viewport** mode that fits the preview within the available preview area.                                      | Fit, fit to screen                 |
| **1:1 View**                       | The legacy preview sizing mode that migrates to **Manual View** at 100% zoom.                                             | Actual size, pixel view            |
| **Preview Viewport**               | The view-local preview state containing mode, zoom, image-space center, and inspector preference.                         | View scale, zoom state             |
| **Manual View**                    | A **Preview Viewport** mode that uses numeric zoom and image-space center coordinates instead of fitting the whole image. | 1:1 view, actual mode              |
| **1:1 Zoom**                       | The zoom command that sets **Manual View** to 100%, where one image pixel maps to one CSS pixel.                          | 100%, actual size button           |
| **Wheel Zoom Step**                | The reciprocal quarter-octave wheel zoom rule that can return to 100% from the 25% and 1600% bounds.                      | Zoom tick, mouse step              |
| **Touch Pinch Zoom**               | The two-finger gesture that switches the **Preview Viewport** into **Manual View** and changes zoom around a midpoint.    | Mobile zoom, browser pinch         |
| **Touch Pan**                      | The touch gesture that moves the **Preview Viewport** center while preserving the existing zoom.                          | Drag scroll, mobile pan            |
| **Gesture Anchor**                 | The screen point kept tied to the same image region while a zoom gesture changes the **Preview Viewport**.                | Pinch center, focal point          |
| **Preview Surface Controls**       | The floating compare and view controls rendered over the loaded **Preview Surface**.                                      | Preview toolbar, overlay controls  |
| **Pixel Inspector**                | A preview-local readout of image coordinates and visible original or processed hex values under the cursor.               | Loupe, eyedropper                  |
| **Display Frame**                  | The actual on-screen rectangle used to display a **Preview Surface**.                                                     | Preview pane, container, frame     |
| **Fit Inset**                      | The spacing subtracted from the measured preview area before sizing a **Display Frame** in **Fit View**.                  | Padding, margin, frame gap         |
| **CSS Pixel Preview Target**       | A **Preview Target Override** expressed in CSS pixels rather than device pixels.                                          | DPR target, retina preview target  |
| **Screen-Sized Preview**           | The behavior where **Fit View** generates a **Screen Preview** instead of browser-scaling **Full Output**.                | Screen preview mode, fit render    |
| **Desktop Reduced Preview Notice** | A desktop-only overlay that says the on-screen preview is reduced while export remains full size.                         | Preview only, warning banner       |
| **Preview Refinement**             | A follow-up **Preview Job** that replaces a fast **Reduced Preview** with a larger preview buffer.                        | Final preview, preview catch-up    |
| **Processing Preview**             | The visible state where a **Preview Job** is queued or running while the previous preview remains usable.                 | Loading preview, rendering state   |
| **Preview Only Notice**            | A visible notice that the current on-screen preview is not the full export-quality **Full Output**.                       | Preview only, preview-only state   |

## Runtime Responsiveness

| Term                            | Definition                                                                                                               | Aliases to avoid                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| **Direct Slider Movement**      | The property that a slider thumb follows pointer movement without waiting for React or worker work.                      | Smooth slider, fast slider, instant drag |
| **Draft Slider Value**          | The transient value shown while a slider is being dragged before it becomes **Committed Settings**.                      | Temporary setting, live setting          |
| **Committed Settings**          | The current **Editor Settings** value that is allowed to start **Preview Jobs**, clipboard copy, and export.             | Real settings, saved settings            |
| **Commit-on-Release**           | The slider rule where **Draft Slider Value** becomes **Committed Settings** only after pointer release or blur.          | Debounce, delayed update                 |
| **Reset Commit**                | A slider reset action that immediately writes the slider default into **Committed Settings**.                            | Reset draft, default click               |
| **Native Range Slider**         | A browser-owned range input used when **Direct Slider Movement** matters more than primitive composition.                | Custom slider, Radix slider              |
| **Slider Primitive**            | A general-purpose UI slider component that owns accessibility and composition behavior for non-hot-path slider controls. | Native slider, browser slider            |
| **Hot Drag Path**               | The work executed repeatedly while the pointer is moving a slider thumb.                                                 | Drag handler, input loop                 |
| **Render Boundary**             | A component boundary that prevents unrelated state changes from rebuilding a protected UI area.                          | Memo wrapper, render fix                 |
| **Preview Stage**               | The editor area that owns preview layout, preview controls, drop affordances, and preview-local interactions.            | Preview card, canvas area                |
| **Preview Presentation**        | The UI layer that displays preview surfaces without changing image processing semantics.                                 | Preview rendering, canvas rendering      |
| **Preview Surface**             | A visible canvas or placeholder inside **Preview Presentation**.                                                         | Canvas, preview component                |
| **Canvas Redraw Boundary**      | The rule that a canvas redraw happens only when its **Pixel Buffer** identity changes.                                   | Canvas memo, draw optimization           |
| **Ready Preview Surface**       | A **Preview Surface** with a buffer already drawn and not dependent on processing status text.                           | Ready canvas, stable canvas              |
| **Preview Placeholder**         | A **Preview Surface** shown while a processed buffer is missing.                                                         | Empty preview, loading canvas            |
| **Status-only Update**          | A **Processing Status** change that does not include a new **Pixel Buffer**.                                             | Status render, worker ping               |
| **Processing Status**           | The current lifecycle label for queued, processing, ready, exporting, idle, or error work.                               | Status, job state                        |
| **Worker Status Update**        | A **Status-only Update** emitted by worker orchestration while preview or export work progresses.                        | Worker update, worker render             |
| **Control Tree**                | The rendered settings controls that should update only from control-relevant state.                                      | Control panel render tree, sidebar tree  |
| **View-local State**            | Interaction state owned by a view and not persisted in **Editor Settings**.                                              | Local state, UI state                    |
| **Preview Display Measurement** | The debounced observation of **Display Frame** size used to restart **Screen-Sized Preview** work.                       | Resize tracking, frame measurement       |
| **Resize Threshold**            | The minimum **Display Frame** size change required before restarting preview processing.                                 | Resize debounce, resize tolerance        |

## Editor Experience

| Term                   | Definition                                                                                                                             | Aliases to avoid                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Editor**             | The single-screen workstation where users load, adjust, preview, and export an image.                                                  | App, tool, workspace                       |
| **Inspector**          | The tabbed editor panel containing generated looks, adjustment controls, palette management, clipboard actions, and advanced settings. | Control panel, settings panel, sidebar     |
| **Advanced Controls**  | Collapsible controls for less frequent or more technical settings.                                                                     | Advanced panel, extra settings             |
| **Theme**              | The persistent light or dark visual appearance selected from the header.                                                               | Color scheme, mode                         |
| **Local Processing**   | The app behavior where images are decoded, processed, previewed, and exported in the browser.                                          | Client-side processing, offline processing |
| **Processing Job**     | A browser processing run that produces a **Processed Image** for preview or export.                                                    | Worker job, render job                     |
| **Preview Job**        | A cancellable **Processing Job** that updates the on-screen **Preview**.                                                               | Worker job, render job                     |
| **Preview Cycle**      | The user-visible sequence from a **Settings Transition** through **Processing Preview** to an updated **Preview**.                     | Render cycle, processing cycle             |
| **Export Job**         | A **Processing Job** that produces **Full Output** for an **Export File**.                                                             | Download job, final job                    |
| **Clipboard Settings** | The copy/paste flow that transfers **Settings JSON** through the system clipboard.                                                     | Settings file, import/export file          |
| **Responsive Editing** | The property that editor controls remain interactive during **Source Intake**, **Preview Jobs**, and **Export Jobs** where practical.  | Non-blocking UI, smooth UI                 |

## Platform Behavior

| Term                    | Definition                                                                                                                 | Aliases to avoid                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Desktop Experience**  | The layout that exposes **View Scale** controls and desktop reduced-preview messaging.                                     | Desktop mode, wide layout          |
| **Mobile Experience**   | The layout that keeps compact preview controls, hides reduced-preview messaging, and supports touch preview gestures.      | Mobile mode, phone layout          |
| **Mobile Fit Preview**  | The mobile preview behavior that maximizes visible image area while still allowing gesture entry into **Manual View**.     | Mobile 1:1, phone zoom             |
| **Main Thread Freeze**  | A user-visible pause caused by expensive browser work on the thread that handles editor input and rendering.               | UI lock, app stuck, frozen UI      |
| **Worker Source Cache** | The worker-side retained **Source Image** data used to avoid resending a large **Pixel Buffer** for every **Preview Job**. | Worker cache, source cache         |
| **Trace Capture**       | A browser performance recording used to identify where **Responsive Editing** is lost.                                     | Performance trace, profiler trace  |
| **Dev Instrumentation** | Browser or React development tooling that observes renders and can add overhead to **Pixel Buffer** props.                 | DevTools overhead, React profiling |

## Relationships

- A **Source Image** produces zero or one current **Processed Image** for the active **Editor Settings**.
- A **Processed Image** may be rendered as **Reduced Preview**, **Screen Preview**, or **Full Output**.
- An **Export File** must be encoded from **Full Output**, not from **Reduced Preview** or **Screen Preview**.
- An **Export File** must ignore **Preview Target Override**.
- **Export Preferences** are persisted editor UI state, not **Editor Settings**.
- **Settings JSON** must not contain **Export Preferences**, **Export Format**, or **Export Quality**.
- Applying **Settings JSON** must not change **Export Preferences**.
- **Export Format** determines one **Export Format Option**.
- **Export Format Option** determines file extension, MIME type, label, and whether **Quality Control** is meaningful.
- **Export Quality** applies to WebP and JPEG **Export Files**, not PNG **Export Files**.
- **JPEG Alpha Flattening** uses **Alpha Background** at export time.
- **Encoder Failure** must not silently produce a different **Export Format**.
- **Export Metadata Format** records the **Export Format** actually downloaded by the last **Export Action**.
- **Export Entry Point** lives in **Preview Stage**, not in the inspector.
- **Export Drawer** owns **Format Selector**, **Quality Control**, and final
  **Export Action**.
- **Preview Action Row** keeps `Upload` and **Export Entry Point** on the left
  and undo/redo on the right.
- **Reduced Preview** may differ in dimensions from **Output Size**.
- **Screen Preview** may differ in dimensions from **Output Size**.
- **Screen Preview** must not exceed **Full Output** dimensions.
- **Output Size** must stay within the **Output Cap**.
- **Source Intake** produces either an accepted **Source Image** or a rejected source.
- **Source Intake** may produce a **Source Notice**.
- A **Source Image** owns one current **Pixel Buffer** after **Source Intake** accepts it.
- **Editor Settings** select exactly one **Dither Algorithm** and one **Palette** per processing run.
- **Default Settings** must match exactly one **Default Processing Preset**.
- The **Default Processing Preset** should be first in the **Processing Preset Registry**.
- A **Dither Algorithm Id** identifies exactly one registered **Dither Algorithm**.
- The **Dither Algorithm Registry** owns all **Dither Algorithm Options**.
- A **Dither Algorithm Option** has zero or more **Dither Algorithm Capabilities**.
- The **Bayer Matrix Control** is visible only when the selected **Dither Algorithm** has the Bayer size capability.
- The **Algorithm Metadata Label** for **Bayer Dithering** includes the selected **Bayer Size**.
- **Palette Resolution** happens before a **Dither Algorithm** processes pixels.
- A **Custom Palette** is active when **Editor Settings** contain `customPalette`; the Palette control shows `Custom`.
- Selecting a **Palette Preset** clears the active **Custom Palette** and applies the **Palette Default Color Mode**.
- **Palette Import** and **Palette Extraction** create or replace the active **Custom Palette**.
- **Palette Export** requires an active **Custom Palette** and does not export full **Editor Settings**.
- **Extraction Size** is a command input for **Palette Extraction**, not a persisted **Editor Settings** field.
- A **Settings Transition** produces one next **Editor Settings** object.
- A **Settings Transition** may use **Transition Context** to preserve **Aspect Lock**.
- **Settings History** records **Editor Settings** snapshots, not **View-local State** or **Export Preferences**.
- **Undo Settings Change** and **Redo Settings Change** produce **Editor Settings** changes through the same preview cycle as other settings transitions.
- Source-intake output-size recommendations may bypass **Settings History** so loading a source does not create a confusing undo entry.
- A **Processing Preset** applies through one **Settings Transition**.
- A **Processing Recipe** controls one **Palette**, one **Dither Algorithm**, optionally **Bayer Size**, optionally **Color Mode**, and optionally **Matching Mode**.
- A **Bayer Recipe** must control **Bayer Size**.
- A **Non-Bayer Recipe** must preserve the current **Bayer Size**.
- **Active Recipe** is derived from **Editor Settings**, not stored in **Settings JSON**.
- **Settings JSON** must not contain a **Processing Preset Id**.
- **Custom Recipe State** appears when any **Recipe-Controlled Field** stops matching a curated **Processing Preset**.
- **Custom Palette** prevents **Active Recipe** matching.
- Applying a **Processing Preset** clears **Custom Palette**.
- **Effective Recipe Color Mode** is compared when deriving **Active Recipe**.
- **Clipboard Settings** copies and pastes one **Settings JSON** payload.
- **Settings JSON** contains one versioned **Editor Settings** object.
- A **Look Snapshot** contains one normalized **Editor Settings** object plus look metadata.
- A **Look Payload** must not contain **Source Image** data, source file names, **Compare Mode**, **Preview Viewport**, **Export Preferences**, runtime state, **Processing Metadata**, **Source Notice**, or **Processing Preset Id**.
- **Clipboard Look** and **URL Look Import** apply through **Settings Transition** so **Settings History** can undo them.
- **URL Look Import** is one-shot import, not general URL state sync.
- **Auto-Tune** analyzes one current **Source Image** and ranks ten **Auto-Tune
  Candidates**.
- **Auto-Tune** regenerates the **Auto-Tune Shortlist** when a **Source Image**
  is loaded or replaced.
- **Auto-Tune Shortlist** contains 3 to 5 **Auto-Tune Recommendations**.
- An **Auto-Tune Recommendation** contains one normal **Look Snapshot**.
- Applying an **Auto-Tune Recommendation** uses **Settings Transition** and
  produces normal **Editor Settings**.
- **Recommended Marker** belongs to the visible **Auto-Tune Shortlist**, not to
  **Editor Settings**.
- **Applied Recommendation Marker** is runtime UI state and must clear after
  manual settings changes.
- **Demo Auto-Tune Seed** must use the same recommendation contract as runtime
  **Auto-Tune**.
- **Auto-Tune Analysis** must not be stored in **Editor Settings**,
  **Settings JSON**, or **Look Snapshot**.
- **Schema Version 1** payloads normalize into **Schema Version 2** **Editor Settings**.
- **Color Depth** determines the **Effective Palette** without mutating the active **Palette**.
- **Full Palette Depth** preserves the active **Palette** size in the **Effective Palette**.
- **Limited Palette Depth** uses the first N colors of the active **Palette** for the **Effective Palette**.
- **Palette Export** uses the full active **Palette**, not the **Effective Palette**.
- **RGB Matching** is the default **Matching Mode**.
- **Perceptual Matching** uses Oklab distance through the **Palette Matcher**.
- **Matt Parker Dithering** is tonal and does not use **Matching Mode**.
- **Mobile Experience** starts from **Mobile Fit Preview** and may enter **Manual View** through **Touch Pinch Zoom**, **Touch Pan**, or explicit controls.
- **Desktop Experience** may use **Screen Fit** or **Real Pixels**.
- **Screen Fit** maps to **Fit View**.
- **Real Pixels** maps to **Manual View**.
- **Fit View** may use **Screen-Sized Preview**.
- **Manual View** displays inspectable preview pixels subject to preview budget behavior.
- **1:1 Zoom**, the zoom slider, and **Pixel Inspector** switch the **Preview Viewport** into **Real Pixels** when used.
- **Preview Viewport** is **View-local State**, not **Editor Settings**.
- **Preview Viewport** must not be serialized into **Settings JSON**.
- **Wheel Zoom Step** applies to mouse-wheel zoom, not to the toolbar zoom slider.
- **Touch Pinch Zoom** uses a **Gesture Anchor** and must not invoke browser page zoom or page scroll over the preview surface.
- **Touch Pan** updates **Preview Viewport** center and must stay clamped to image bounds.
- **Gesture Anchor** is gesture-local state and must not be serialized into **Settings JSON** or **Look Payloads**.
- **Preview Surface Controls** must not affect **Editor Settings** or **Export
  Preferences**.
- **Pixel Inspector** must not affect **Processed Image**, **Full Output**, or **Export File**.
- A **CSS Pixel Preview Target** must account for the **Fit Inset** so the processed buffer matches the **Display Frame**.
- **Desktop Reduced Preview Notice** may appear only in **Desktop Experience**.
- **Slide Compare** uses one **Source Image** layer and one **Processed Image** layer in the same **Display Frame**.
- **Slide Compare** should draw the source layer into the same **Display Frame** dimensions as the processed layer when **Screen Preview** is ready.
- A **Preview Job** may be cancelled by newer **Settings Transitions**.
- A **Preview Job** may include one **Preview Refinement**.
- A **Preview Job** may use one **Preview Target Override**.
- A **Preview Cycle** begins with one **Settings Transition** and may produce **Processing Preview**, **Reduced Preview**, and **Preview Refinement** states.
- **Preview Display Measurement** may start a new **Preview Cycle** only when the **Resize Threshold** is met.
- **Processing Preview** should preserve **Responsive Editing** for the **Inspector** and **Slide Compare**.
- **Worker Source Cache** may hold one or more accepted **Source Images** to reduce repeated **Pixel Buffer** transfer.
- An **Export Job** should ignore preview-size shortcuts and produce **Full Output** at **Output Size**.
- A **Trace Capture** can reveal a **Main Thread Freeze** even when the **Processing Job** itself runs in a worker.
- **Dev Instrumentation** must not define domain behavior, but it can expose performance risks when **Pixel Buffer** data is passed through the editor.
- **Direct Slider Movement** happens inside the **Hot Drag Path**.
- A **Draft Slider Value** must not become **Committed Settings** until **Commit-on-Release** or **Reset Commit**.
- **Committed Settings** are the only slider values that may start **Preview Jobs**.
- A **Native Range Slider** may replace a **Slider Primitive** when **Direct Slider Movement** is the primary requirement.
- **Quality Control** may use a **Slider Primitive** because changing **Export Quality** does not start **Preview Jobs**.
- **Product Contract** links to the current **Settings Schema Reference** when Settings JSON behavior is part of the shipped product.
- **Schema Version 2** is the compatibility baseline for **Settings JSON**.
- **Settings Schema Reference** defines which **Editor Settings** fields are included and which **Export Preferences** and **View-local State** are excluded.
- A **Public Hardening Baseline** must not add product features or change the local-only processing model.
- A **Core Pixel Golden** protects public `processImage` behavior, not private processing stages.
- An **Export Contract Fixture** protects **Browser Encoder** requests and JPEG pre-encode pixels, not byte-for-byte encoded files.
- A **Visual Contract** may be covered by deterministic unit and component tests before screenshot-diff infrastructure exists.
- A **Performance Baseline** is report-style and non-gating until a calibrated **Performance Threshold** is introduced.
- **Preview Stage** owns **Preview Presentation** and **View-local State** for drop affordance and **Slide Divider** position.
- A **Preview Stage** contains one or more **Preview Surfaces**.
- A **Ready Preview Surface** should ignore a **Status-only Update**.
- A **Preview Placeholder** should reflect a **Status-only Update** because its visible text depends on **Processing Status**.
- A **Canvas Redraw Boundary** depends on **Pixel Buffer** identity, not on **Processing Status**.
- **Worker Status Updates** should not rebuild the **Control Tree** unless the controls display that status.

## Example Dialogue

> **Dev:** "When the user clicks **Undo Settings Change**, should it restore the last **Preview Viewport** too?"
>
> **Domain expert:** "No. **Settings History** records **Editor Settings** only. **Preview Viewport** is **View-local State**."
>
> **Dev:** "So **Screen Fit** versus **Real Pixels** never appears in **Settings JSON**?"
>
> **Domain expert:** "Correct. **Screen Fit** maps to **Fit View**, **Real Pixels** maps to **Manual View**, and both stay outside **Editor Settings**."
>
> **Dev:** "What happens when they use **1:1 Zoom** from **Screen Fit**?"
>
> **Domain expert:** "That switches the **Preview Viewport** into **Real Pixels** at 100% zoom. It does not change the **Processed Image**."
>
> **Dev:** "Does **Touch Pinch Zoom** create a new processing setting?"
>
> **Domain expert:** "No. It updates the **Preview Viewport** using a **Gesture Anchor**. The exported pixels and shared settings stay unchanged."
>
> **Dev:** "Should the hidden **Quality Control** be undoable?"
>
> **Domain expert:** "No. **Export Quality** belongs to **Export Preferences**, so it is independent from **Settings History**."
>
> **Dev:** "Is a copied **Look Snapshot** just **Settings JSON** with a different button?"
>
> **Domain expert:** "No. **Settings JSON** is the processing contract, while a **Look Snapshot** is the share artifact. Its **Look Payload** may travel through **Clipboard Look** or **URL Look Import**, but it still applies only **Editor Settings**."
>
> **Dev:** "Is an **Auto-Tune Recommendation** another kind of persisted preset?"
>
> **Domain expert:** "No. **Auto-Tune** ranks **Auto-Tune Candidates** and shows an **Auto-Tune Shortlist**, but each visible recommendation applies a normal **Look Snapshot**."
>
> **Dev:** "So the **Recommended Marker** and **Applied Recommendation Marker** should not be copied into **Settings JSON**?"
>
> **Domain expert:** "Correct. Those markers are runtime UI state. The applied result is only **Editor Settings**."

## Flagged Ambiguities

- "Slider" was used for **Native Range Slider**, **Slider Primitive**, **Quality Control**, and **Slide Divider**. Use **Native Range Slider** for hot-path committed settings controls, **Slider Primitive** for general UI slider composition, **Quality Control** for export compression UI, and **Slide Divider** for before/after comparison.
- "Live value" can mean **Draft Slider Value** or **Committed Settings**. Use **Draft Slider Value** during drag and **Committed Settings** after **Commit-on-Release**.
- "Lag" should be described through the affected path: **Direct Slider Movement** when the thumb lags, **Main Thread Freeze** when the browser stalls, or slow **Preview Job** when processing output is late.
- "Rerender" is too broad by itself. Use **Render Boundary** for protected component isolation and **Canvas Redraw Boundary** for image surface redraw semantics.
- "Status update" can mean visible placeholder text or background worker progress. Use **Status-only Update** when no **Pixel Buffer** changes and **Worker Status Update** when it originates from worker orchestration.
- "Preview rendering" was used for both **Preview Presentation** and image processing. Use **Preview Presentation** for UI surfaces and **Preview Job** for producing a processed buffer.
- "Local state" should be narrowed to **View-local State** when it is UI interaction state and **Draft Slider Value** when it is transient slider input.
- "Algorithm" was used for ids, labels, UI options, and execution. Use **Dither Algorithm** for the method, **Dither Algorithm Id** for persisted settings, **Dither Algorithm Option** for UI selection, and **Algorithm Metadata Label** for export-facing text.
- "Registry" can sound like a UI list. In this domain, **Dither Algorithm Registry** is the core source of truth for selection, execution, capabilities, and metadata.
- "None" is a UI label and stable id, but the domain behavior is **No Dither**: direct palette mapping without spatial dithering.
- "Bayer Matrix" was used for both the setting and the control. Use **Bayer Size** for the value and **Bayer Matrix Control** for the editor UI.
- "Preview Only" sounded like a broken app state. Canonical terms: **Reduced Preview** for the image state and **Desktop Reduced Preview Notice** for the desktop overlay.
- "Processing Preview" and "Preview Only" were used as if they were separate blockers. Use **Processing Preview** for queued or running preview work and **Preview Only Notice** when the screen is showing a reduced or non-export-quality preview.
- "Preview" was used for displayed canvas, reduced buffer, and compare selection. Canonical terms: **Preview**, **Reduced Preview**, and **Compare Mode**.
- "Screen preview" and "preview target" can sound like persistent settings. Use **Screen Preview** for the generated image and **Preview Target Override** for the temporary processing size; neither belongs in **Settings JSON**.
- "Display size", "frame size", and "container size" overlap. Use **Display Frame** for the actual on-screen image rectangle and **Preview Display Measurement** for observing it.
- "CSS pixels" and device pixels overlap in high-DPI discussion. Use **CSS Pixel Preview Target** for this feature; do not imply device-pixel-ratio scaling unless the product decision changes.
- "Inset", "padding", and "margin" can hide the sizing rule. Use **Fit Inset** for the spacing subtracted before computing a **CSS Pixel Preview Target**.
- "Output" was used for processed pixels and downloaded file. Canonical terms: **Processed Image**, **Full Output**, and **Export File**.
- "Export settings" sounds like processing state. Use **Export Preferences** for persisted file-encoding choices and **Editor Settings** for processing choices.
- "Quality" can mean visual quality or encoder compression. Use **Export Quality** only for WebP/JPEG encoding, not for preview or dithering quality.
- "Download" and "export" overlapped after adding multiple formats. Use **Export Action** for the user command and **Export File** for the downloaded artifact.
- "Export format" and "metadata format" overlap. Use **Export Format** for the selected preference and **Export Metadata Format** for the value recorded after a completed export.
- "Fallback" is misleading for unsupported encoders. Use **Encoder Failure**; the app must not silently create a different **Export Format**.
- "Centered buttons" is stale for the current layout. Use **Preview Action Row** when the rule is left-aligned Upload/Export plus right-aligned undo/redo.
- "Golden" can imply a binary image snapshot. Use **Core Pixel Golden** for compact core pixel fixtures and **Export Contract Fixture** for export behavior tests.
- "Benchmark" can imply a gate. Use **Performance Baseline** for the current non-gating report and **Performance Threshold** only for a future calibrated pass/fail limit.
- "Visual drift" should not imply screenshot diffs in Phase 0. Use **Visual Contract** for deterministic unit and component coverage unless screenshot-diff infrastructure is explicitly added later.
- "Settings docs" is vague. Use **Settings Schema Reference** when describing the versioned **Settings JSON** contract.
- "Schema version" is now ambiguous between legacy and current payloads. Use **Schema Version 1** for accepted legacy payloads and **Schema Version 2** for the current **Settings JSON** baseline.
- "Color depth", "palette size", and **Extraction Size** can be confused. Use **Color Depth** for processing limits, **Extraction Size** for palette extraction, and **Palette** size for the stored color count.
- "Limited palette" can imply destructive editing. Use **Limited Palette Depth** for the setting and **Effective Palette** for the derived processing palette.
- "Perceptual" should mean **Perceptual Matching** backed by Oklab distance, not a generic quality mode.
- "Matching" can mean recipe matching or nearest-color matching. Use **Active Recipe** matching for recipe derivation and **Matching Mode** for nearest-color selection.
- "Hardening" should mean **Public Hardening Baseline** in Phase 0, not new UI features or product expansion.
- "Cap", "limit", "budget", and "ready %" overlapped in UI and architecture discussion. Use **Output Cap** for the pixel budget and **Output Size** for the selected dimensions.
- "Original" and **Source Image** overlap. Use **Source Image** for the image entity and **Original View** for the compare mode.
- "Fit" was used for both preview zoom and resize fitting. Use **Fit View** for preview sizing and **Resize Fit** for contain / cover / stretch.
- "Fit" and "Pixels" are short mobile labels. Use **Screen Fit** and **Real Pixels** for desktop-facing product language.
- "1:1" was replaced by **Manual View** language for the current viewport model; use **Manual View** for zoom/pan inspection and **1:1 Zoom** for the command that sets zoom to 100%.
- "Pinch" should mean **Touch Pinch Zoom** over the preview surface, not browser page zoom or trackpad zoom.
- "Touch drag" should be called **Touch Pan** when it moves the **Preview Viewport**, not scroll.
- "History" is too broad by itself. Use **Settings History** when undo and redo apply only to **Editor Settings**, not source images, **Preview Viewport**, or **Export Preferences**.
- "Loupe" was implemented as **Pixel Inspector** for coordinate and color readout, not as an optical magnifying sub-canvas.
- "Full preview" suggested the screen should always catch up to full resolution. Use **Full Output** for selected output dimensions and keep it tied to export semantics.
- "Split" and **Slide Compare** both referred to before/after comparison. Canonical term: **Slide Compare**; keep `split` only as legacy persisted state.
- "Settings", "preset", and "config" overlap. Use **Editor Settings** for active state and **Settings JSON** for serialized clipboard exchange.
- "Preset" is overloaded across **Processing Preset**, **Palette Preset**, and old "Settings JSON preset" wording. Use **Processing Preset** for curated processing recipes, **Palette Preset** for color sets, and **Settings JSON** for serialized settings.
- "Recipe" should mean **Processing Recipe** or **Active Recipe**, not a persistent settings mode. Use **Processing Recipe** for controlled fields and **Active Recipe** for the derived match.
- "Selected preset" can falsely imply persisted recipe identity. Use **Active Recipe** when derived from settings and **Processing Preset Id** only inside registry lookup and transition intent.
- "Custom" in the **Recipe Selector** means **Custom Recipe State**. "Custom" in the Palette control means the active **Custom Palette**.
- "Default" can mean **Default Settings**, **Default Processing Preset**, or **Palette Default Color Mode**. Name the specific default being discussed.
- "First preset" is a registry-order rule for the **Default Processing Preset**, not a fallback matching rule.
- "Patch settings", "state update", and "settings change" blur UI mechanics with domain rules. Use **Settings Transition** when aspect lock, palette defaults, or **Output Cap** rules must be preserved.
- "Context" is vague by itself. Use **Transition Context** only for source dimensions and other facts required to turn a **Settings Transition** into valid **Editor Settings**.
- "Clipboard" in settings discussions means **Clipboard Settings** text, not a file import/export path.
- "Share URL" can imply full URL state sync. Use **URL Look Import** for the one-shot `#look=<payload>` flow and avoid implying that source images, view state, or export preferences are stored in the URL.
- "Look", "settings", and "preset" overlap. Use **Look Snapshot** for a shareable artifact, **Settings JSON** for the processing contract, and **Processing Preset** for a curated starting recipe.
- "Payload" is too broad by itself. Use **Look Payload** for compact share transport, **Settings JSON** for serialized editor settings, and **Palette Asset** for standalone palette exchange.
- "Auto preset" is misleading. Use **Auto-Tune Recommendation** for a visible
  suggested look and **Processing Preset** for curated manual recipes.
- "Recommended" can sound like a persisted state or score. Use
  **Recommended Marker** for the top visible recommendation and avoid showing
  numeric confidence in v1.
- "Applied Auto-Tune" can imply a live link to the recommendation. Use
  **Applied Recommendation Marker** for the runtime marker and **Editor
  Settings** for the actual applied state.
- "Demo recommendations" should be called **Demo Auto-Tune Seed** when referring
  to the bundled shortcut; it must not be treated as the core source of truth.
- Oversized **Source Image** handling is a **Source Intake** rejection. **Output Size** may still be auto-sized to stay within the **Output Cap**.
- "Worker" was used to imply all UI freezes are solved. Use **Processing Job** for the worker-backed image run, **Worker Source Cache** for retained source data, and **Main Thread Freeze** for browser-side pauses outside worker compute.
- "Trace" should mean **Trace Capture**, not a product log or analytics event.
- "Buffer" should mean **Pixel Buffer** only when it carries image dimensions and pixel data; avoid using it for generic transport or cache objects.
- "DevTools freeze" should be described as **Dev Instrumentation** causing or exposing a **Main Thread Freeze**, not as core processing slowness unless a **Trace Capture** proves it.
