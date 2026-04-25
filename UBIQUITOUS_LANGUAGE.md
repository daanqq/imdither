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

| Term                           | Definition                                                                                              | Aliases to avoid                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Export Preferences**         | Persisted editor UI preferences that control how **Full Output** is encoded into an **Export File**.    | Export settings, output settings   |
| **Export Format**              | The selected file format for an **Export File**, currently PNG, WebP, or JPEG.                          | File type, download type           |
| **Export Format Option**       | A selectable **Export Format** entry with stable id, label, MIME type, extension, and quality support.  | Format item, select option         |
| **Export Quality**             | The shared lossy encoder quality used for WebP and JPEG **Export Files**.                               | Compression, quality setting       |
| **Quality Control**            | The **Preview Stage** control that changes **Export Quality** when the **Export Format** supports it.   | Quality slider, compression slider |
| **Quality Slot**               | The reserved **Preview Stage** layout area for **Quality Control**, kept stable even when hidden.       | Slider area, quality wrapper       |
| **Format Selector**            | The **Preview Stage** control that changes **Export Format**.                                           | Format dropdown, export dropdown   |
| **Export Action**              | The format-neutral editor command that starts an **Export Job** and downloads an **Export File**.       | Export PNG button, download button |
| **Export Layer**               | The browser-side layer that encodes a **Pixel Buffer** into an **Export File**.                         | Image helper, canvas helper        |
| **Browser Encoder**            | The browser canvas encoder used by the **Export Layer** to create a file blob for an **Export Format**. | Canvas export, toBlob path         |
| **Encoder Failure**            | The explicit failure state when a **Browser Encoder** cannot produce the requested **Export Format**.   | Fallback, silent PNG fallback      |
| **JPEG Alpha Flattening**      | The export-time alpha compositing used before JPEG encoding because JPEG has no alpha channel.          | JPEG transparency handling         |
| **Export Metadata Format**     | The actual **Export Format** recorded in **Processing Metadata** for the most recent **Export File**.   | Metadata format, output format     |
| **Export Controls**            | The **Preview Stage** group containing **Export Action**, **Format Selector**, and **Quality Control**. | Export toolbar, download controls  |
| **Centered Export Actions**    | The layout rule that **Upload** and **Export Action** stay centered relative to the **Preview**.        | Centered buttons, main actions     |
| **Export Preference Controls** | The right-side **Preview Stage** controls for **Format Selector** and **Quality Slot**.                 | Format and quality controls        |

## Processing

| Term                           | Definition                                                                                       | Aliases to avoid                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| **Editor Settings**            | The versioned processing configuration that determines the current **Processed Image**.          | Config, preset, options                      |
| **Settings JSON**              | A serialized **Editor Settings** payload used for reproducible clipboard copy and paste.         | Preset JSON, config JSON, import/export JSON |
| **Settings Transition**        | A user intent that produces one next **Editor Settings** value while preserving domain rules.    | Settings patch, state update                 |
| **Transition Context**         | The current source dimensions used by a **Settings Transition** when applying aspect rules.      | Source context, transition data              |
| **Aspect Lock**                | The rule that keeps **Output Size** proportional to the current **Source Image**.                | Keep ratio, proportional resize              |
| **Processing Preset**          | A curated starting recipe that applies selected processing fields without becoming stored state. | Recipe mode, settings preset                 |
| **Processing Recipe**          | The set of **Editor Settings** fields controlled by one **Processing Preset**.                   | Preset config, preset payload                |
| **Active Recipe**              | The **Processing Preset** currently matched from actual **Editor Settings**.                     | Selected preset, stored preset               |
| **Custom Recipe State**        | The selector state shown when **Editor Settings** do not match any **Processing Preset**.        | Custom preset, unsaved recipe                |
| **Default Processing Preset**  | The first **Processing Preset** whose **Processing Recipe** matches **Default Settings**.        | Startup preset, initial recipe               |
| **Default Settings**           | The initial **Editor Settings** used before user changes or persisted state are applied.         | Factory settings, initial config             |
| **Dither Algorithm**           | The selected method for producing spatial tone or color patterns from a **Palette**.             | Filter, effect                               |
| **Dither Algorithm Id**        | The stable settings value that identifies a **Dither Algorithm** across sessions and JSON.       | Algorithm name, label                        |
| **No Dither**                  | Direct palette mapping without spatial patterning or error diffusion.                            | Plain quantize, none algorithm               |
| **Bayer Dithering**            | Ordered dithering using a 2x2, 4x4, or 8x8 Bayer matrix.                                         | Bayer, ordered                               |
| **Matt Parker Dithering**      | Palette-aware pattern dithering based on a Parker-style threshold matrix.                        | Matt Parker, Parker                          |
| **Floyd-Steinberg Dithering**  | Error diffusion using the Floyd-Steinberg kernel.                                                | Floyd, FS                                    |
| **Atkinson Dithering**         | Error diffusion using the Atkinson kernel.                                                       | Atkinson                                     |
| **Bayer Size**                 | The selected Bayer matrix dimension: 2, 4, or 8.                                                 | Matrix size, Bayer matrix                    |
| **Palette**                    | A named set of colors available to palette mapping and dithering.                                | Color set, swatches                          |
| **Palette Preset**             | A built-in **Palette** shipped with the app.                                                     | Default palette, built-in palette            |
| **Custom Palette**             | A user-defined **Palette** supported by the model but not exposed as a v1 editor flow.           | User palette, manual palette                 |
| **Palette Resolution**         | The rule that chooses the actual **Palette** from **Editor Settings** before processing.         | Palette lookup, palette selection            |
| **Palette Default Color Mode** | The **Color Mode** applied automatically when a **Palette Preset** is selected.                  | Palette color preset, palette mode           |
| **Color Mode**                 | The choice between grayscale-first and color-preserve processing.                                | Source color mode, color handling            |
| **Preprocessing**              | Tone and color adjustment applied before palette mapping and dithering.                          | Adjustment, correction, filters              |
| **Resize Fit**                 | The rule that maps source dimensions into output dimensions using contain, cover, or stretch.    | Crop mode, fit mode                          |
| **Resize Mode**                | The sampling method used by resize, currently bilinear or nearest-neighbor.                      | Resample mode, scaling mode                  |
| **Processing Metadata**        | The export-facing facts that describe the processing result and last **Export Metadata Format**. | Export details, render metadata              |
| **Preview Target Override**    | A temporary processing size used by a **Preview Job** without changing **Editor Settings**.      | Preview settings, screen settings            |

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

## Preview And Comparison

| Term                               | Definition                                                                                                 | Aliases to avoid                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Preview**                        | The on-screen rendering of the **Source Image**, **Processed Image**, or both.                             | Canvas view, display, preview mode |
| **Compare Mode**                   | The preview selection among processed-only, original-only, and slide comparison.                           | Preview mode, split mode           |
| **Processed View**                 | A **Compare Mode** that shows only the **Processed Image**.                                                | Result view, output view           |
| **Original View**                  | A **Compare Mode** that shows only the **Source Image**.                                                   | Source view, before view           |
| **Slide Compare**                  | A **Compare Mode** that overlays source and processed images in one frame with a draggable divider.        | Split compare, before-after slider |
| **Slide Divider**                  | The draggable vertical control that sets the reveal boundary in **Slide Compare**.                         | Slider, handle, divider            |
| **View Scale**                     | The desktop preview sizing mode, currently fit or 1:1.                                                     | Zoom mode, scale mode              |
| **Fit View**                       | A **View Scale** that fits the preview within the available preview area.                                  | Fit, fit to screen                 |
| **1:1 View**                       | A **View Scale** that displays preview pixels at actual pixel size.                                        | Actual size, pixel view            |
| **Display Frame**                  | The actual on-screen rectangle used to display a **Preview Surface**.                                      | Preview pane, container, frame     |
| **Fit Inset**                      | The spacing subtracted from the measured preview area before sizing a **Display Frame** in **Fit View**.   | Padding, margin, frame gap         |
| **CSS Pixel Preview Target**       | A **Preview Target Override** expressed in CSS pixels rather than device pixels.                           | DPR target, retina preview target  |
| **Screen-Sized Preview**           | The behavior where **Fit View** generates a **Screen Preview** instead of browser-scaling **Full Output**. | Screen preview mode, fit render    |
| **Desktop Reduced Preview Notice** | A desktop-only overlay that says the on-screen preview is reduced while export remains full size.          | Preview only, warning banner       |
| **Preview Refinement**             | A follow-up **Preview Job** that replaces a fast **Reduced Preview** with a larger preview buffer.         | Final preview, preview catch-up    |
| **Processing Preview**             | The visible state where a **Preview Job** is queued or running while the previous preview remains usable.  | Loading preview, rendering state   |
| **Preview Only Notice**            | A visible notice that the current on-screen preview is not the full export-quality **Full Output**.        | Preview only, preview-only state   |

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

| Term                   | Definition                                                                                                                            | Aliases to avoid                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Editor**             | The single-screen workstation where users load, adjust, preview, and export an image.                                                 | App, tool, workspace                       |
| **Control Panel**      | The panel containing processing, resize, compare, clipboard, and advanced settings.                                                   | Settings panel, sidebar                    |
| **Advanced Controls**  | Collapsible controls for less frequent or more technical settings.                                                                    | Advanced panel, extra settings             |
| **Theme**              | The persistent light or dark visual appearance selected from the header.                                                              | Color scheme, mode                         |
| **Local Processing**   | The app behavior where images are decoded, processed, previewed, and exported in the browser.                                         | Client-side processing, offline processing |
| **Processing Job**     | A browser processing run that produces a **Processed Image** for preview or export.                                                   | Worker job, render job                     |
| **Preview Job**        | A cancellable **Processing Job** that updates the on-screen **Preview**.                                                              | Worker job, render job                     |
| **Preview Cycle**      | The user-visible sequence from a **Settings Transition** through **Processing Preview** to an updated **Preview**.                    | Render cycle, processing cycle             |
| **Export Job**         | A **Processing Job** that produces **Full Output** for an **Export File**.                                                            | Download job, final job                    |
| **Clipboard Settings** | The copy/paste flow that transfers **Settings JSON** through the system clipboard.                                                    | Settings file, import/export file          |
| **Responsive Editing** | The property that editor controls remain interactive during **Source Intake**, **Preview Jobs**, and **Export Jobs** where practical. | Non-blocking UI, smooth UI                 |

## Platform Behavior

| Term                    | Definition                                                                                                                 | Aliases to avoid                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Desktop Experience**  | The layout that exposes **View Scale** controls and desktop reduced-preview messaging.                                     | Desktop mode, wide layout          |
| **Mobile Experience**   | The layout that keeps **Fit View** and hides reduced-preview messaging.                                                    | Mobile mode, phone layout          |
| **Mobile Fit Preview**  | The mobile-only preview behavior that maximizes visible image area without offering 1:1 view.                              | Mobile 1:1, phone zoom             |
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
- **Export Controls** live in **Preview Stage**, not in **Control Panel**.
- **Centered Export Actions** must not move when **Quality Control** appears or disappears.
- **Export Preference Controls** may sit beside **Centered Export Actions** but must not participate in their centering.
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
- A **Settings Transition** produces one next **Editor Settings** object.
- A **Settings Transition** may use **Transition Context** to preserve **Aspect Lock**.
- A **Processing Preset** applies through one **Settings Transition**.
- A **Processing Recipe** controls one **Palette**, one **Dither Algorithm**, optionally **Bayer Size**, and optionally **Color Mode**.
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
- **Mobile Experience** always uses **Mobile Fit Preview**.
- **Desktop Experience** may use **Fit View** or **1:1 View**.
- **Fit View** may use **Screen-Sized Preview**.
- **1:1 View** displays **Full Output** pixels subject to preview budget behavior.
- A **CSS Pixel Preview Target** must account for the **Fit Inset** so the processed buffer matches the **Display Frame**.
- **Desktop Reduced Preview Notice** may appear only in **Desktop Experience**.
- **Slide Compare** uses one **Source Image** layer and one **Processed Image** layer in the same **Display Frame**.
- **Slide Compare** should draw the source layer into the same **Display Frame** dimensions as the processed layer when **Screen Preview** is ready.
- A **Preview Job** may be cancelled by newer **Settings Transitions**.
- A **Preview Job** may include one **Preview Refinement**.
- A **Preview Job** may use one **Preview Target Override**.
- A **Preview Cycle** begins with one **Settings Transition** and may produce **Processing Preview**, **Reduced Preview**, and **Preview Refinement** states.
- **Preview Display Measurement** may start a new **Preview Cycle** only when the **Resize Threshold** is met.
- **Processing Preview** should preserve **Responsive Editing** for the **Control Panel** and **Slide Compare**.
- **Worker Source Cache** may hold one or more accepted **Source Images** to reduce repeated **Pixel Buffer** transfer.
- An **Export Job** should ignore preview-size shortcuts and produce **Full Output** at **Output Size**.
- A **Trace Capture** can reveal a **Main Thread Freeze** even when the **Processing Job** itself runs in a worker.
- **Dev Instrumentation** must not define domain behavior, but it can expose performance risks when **Pixel Buffer** data is passed through the editor.
- **Direct Slider Movement** happens inside the **Hot Drag Path**.
- A **Draft Slider Value** must not become **Committed Settings** until **Commit-on-Release** or **Reset Commit**.
- **Committed Settings** are the only slider values that may start **Preview Jobs**.
- A **Native Range Slider** may replace a **Slider Primitive** when **Direct Slider Movement** is the primary requirement.
- **Quality Control** may use a **Slider Primitive** because changing **Export Quality** does not start **Preview Jobs**.
- **Preview Stage** owns **Preview Presentation** and **View-local State** for drop affordance and **Slide Divider** position.
- A **Preview Stage** contains one or more **Preview Surfaces**.
- A **Ready Preview Surface** should ignore a **Status-only Update**.
- A **Preview Placeholder** should reflect a **Status-only Update** because its visible text depends on **Processing Status**.
- A **Canvas Redraw Boundary** depends on **Pixel Buffer** identity, not on **Processing Status**.
- **Worker Status Updates** should not rebuild the **Control Tree** unless the controls display that status.

## Example Dialogue

> **Dev:** "When the user chooses WebP in the **Format Selector**, should that update **Editor Settings** or **Settings JSON**?"
>
> **Domain expert:** "No. WebP is an **Export Format**, so it belongs to **Export Preferences**. **Editor Settings** still describe how to produce the **Processed Image**."
>
> **Dev:** "Does changing **Export Quality** restart the **Preview Job**?"
>
> **Domain expert:** "No. **Export Quality** only affects the **Browser Encoder** when the **Export Action** creates an **Export File** from **Full Output**."
>
> **Dev:** "Why do we keep a **Quality Slot** visible for PNG if PNG has no **Quality Control**?"
>
> **Domain expert:** "The slot is reserved so **Centered Export Actions** stay centered relative to the **Preview** when switching between PNG, WebP, and JPEG."
>
> **Dev:** "If JPEG is selected and the image has transparency, where is alpha handled?"
>
> **Domain expert:** "**JPEG Alpha Flattening** happens in the **Export Layer** using the current **Alpha Background**, then **Export Metadata Format** records JPEG for the downloaded **Export File**."

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
- "Centered buttons" should be named **Centered Export Actions** when the rule is about keeping Upload and Export centered relative to **Preview**.
- "Cap", "limit", "budget", and "ready %" overlapped in UI and architecture discussion. Use **Output Cap** for the pixel budget and **Output Size** for the selected dimensions.
- "Original" and **Source Image** overlap. Use **Source Image** for the image entity and **Original View** for the compare mode.
- "Fit" was used for both preview zoom and resize fitting. Use **Fit View** for preview sizing and **Resize Fit** for contain / cover / stretch.
- "Full preview" suggested the screen should always catch up to full resolution. Use **Full Output** for selected output dimensions and keep it tied to export semantics.
- "Split" and **Slide Compare** both referred to before/after comparison. Canonical term: **Slide Compare**; keep `split` only as legacy persisted state.
- "Settings", "preset", and "config" overlap. Use **Editor Settings** for active state and **Settings JSON** for serialized clipboard exchange.
- "Preset" is overloaded across **Processing Preset**, **Palette Preset**, and old "Settings JSON preset" wording. Use **Processing Preset** for curated processing recipes, **Palette Preset** for color sets, and **Settings JSON** for serialized settings.
- "Recipe" should mean **Processing Recipe** or **Active Recipe**, not a persistent settings mode. Use **Processing Recipe** for controlled fields and **Active Recipe** for the derived match.
- "Selected preset" can falsely imply persisted recipe identity. Use **Active Recipe** when derived from settings and **Processing Preset Id** only inside registry lookup and transition intent.
- "Custom" in the **Recipe Selector** means **Custom Recipe State**, not **Custom Palette**. A **Custom Palette** is one reason matching returns **Custom Recipe State**.
- "Default" can mean **Default Settings**, **Default Processing Preset**, or **Palette Default Color Mode**. Name the specific default being discussed.
- "First preset" is a registry-order rule for the **Default Processing Preset**, not a fallback matching rule.
- "Patch settings", "state update", and "settings change" blur UI mechanics with domain rules. Use **Settings Transition** when aspect lock, palette defaults, or **Output Cap** rules must be preserved.
- "Context" is vague by itself. Use **Transition Context** only for source dimensions and other facts required to turn a **Settings Transition** into valid **Editor Settings**.
- "Clipboard" in settings discussions means **Clipboard Settings** text, not a file import/export path.
- Oversized **Source Image** handling is a **Source Intake** rejection. **Output Size** may still be auto-sized to stay within the **Output Cap**.
- **Custom Palette** exists in the processing model but is not a current v1 editor flow. Treat it as future-capable domain language, not exposed functionality.
- "Worker" was used to imply all UI freezes are solved. Use **Processing Job** for the worker-backed image run, **Worker Source Cache** for retained source data, and **Main Thread Freeze** for browser-side pauses outside worker compute.
- "Trace" should mean **Trace Capture**, not a product log or analytics event.
- "Buffer" should mean **Pixel Buffer** only when it carries image dimensions and pixel data; avoid using it for generic transport or cache objects.
- "DevTools freeze" should be described as **Dev Instrumentation** causing or exposing a **Main Thread Freeze**, not as core processing slowness unless a **Trace Capture** proves it.
