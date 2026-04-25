# Ubiquitous Language

## Image Lifecycle

| Term                 | Definition                                                                                          | Aliases to avoid                              |
| -------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Source Image**     | The user-provided or bundled demo image before IMDITHER processing.                                 | Input image, uploaded image, original file    |
| **Demo Image**       | The bundled **Source Image** available before the user loads their own image.                       | Sample, placeholder                           |
| **Processed Image**  | The image produced by applying the current **Editor Settings** to the **Source Image**.             | Result image, output image, after image       |
| **Reduced Preview**  | A lower-resolution **Processed Image** used for responsive on-screen editing.                       | Preview only, draft output, temporary output  |
| **Full Output**      | The **Processed Image** at the selected **Output Size**.                                            | Full preview, final render, full-size preview |
| **Export PNG**       | The downloaded PNG encoded from the **Full Output**.                                                | Download, export file, final image            |
| **Output Size**      | The selected width and height used for **Full Output** and **Export PNG**.                          | Resolution, dimensions, image size            |
| **Output Cap**       | The maximum allowed browser pixel budget for **Output Size**.                                       | Ready %, capacity, render cap, limit          |
| **Source Intake**    | The decision flow that accepts or rejects a **Source Image** before processing.                     | Upload handling, import pipeline              |
| **Source Notice**    | A short user-facing message about **Source Intake** or **Output Size** policy changes.              | Status badge, toast, alert                    |
| **Alpha Flattening** | The stage that composites transparent source pixels onto an **Alpha Background** before processing. | Transparency handling, alpha removal          |
| **Alpha Background** | The black or white background used during **Alpha Flattening**.                                     | Matte color, flatten color                    |

## Processing

| Term                           | Definition                                                                                    | Aliases to avoid                             |
| ------------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Editor Settings**            | The versioned processing configuration that determines the current **Processed Image**.       | Config, preset, options                      |
| **Settings JSON**              | A serialized **Editor Settings** payload used for reproducible clipboard copy and paste.      | Preset JSON, config JSON, import/export JSON |
| **Settings Transition**        | A user intent that produces one next **Editor Settings** value while preserving domain rules. | Settings patch, state update                 |
| **Transition Context**         | The current source dimensions used by a **Settings Transition** when applying aspect rules.   | Source context, transition data              |
| **Aspect Lock**                | The rule that keeps **Output Size** proportional to the current **Source Image**.             | Keep ratio, proportional resize              |
| **Dither Algorithm**           | The selected method for producing spatial tone or color patterns from a **Palette**.          | Filter, effect                               |
| **Dither Algorithm Id**        | The stable settings value that identifies a **Dither Algorithm** across sessions and JSON.    | Algorithm name, label                        |
| **No Dither**                  | Direct palette mapping without spatial patterning or error diffusion.                         | Plain quantize, none algorithm               |
| **Bayer Dithering**            | Ordered dithering using a 2x2, 4x4, or 8x8 Bayer matrix.                                      | Bayer, ordered                               |
| **Matt Parker Dithering**      | Palette-aware pattern dithering based on a Parker-style threshold matrix.                     | Matt Parker, Parker                          |
| **Floyd-Steinberg Dithering**  | Error diffusion using the Floyd-Steinberg kernel.                                             | Floyd, FS                                    |
| **Atkinson Dithering**         | Error diffusion using the Atkinson kernel.                                                    | Atkinson                                     |
| **Bayer Size**                 | The selected Bayer matrix dimension: 2, 4, or 8.                                              | Matrix size, Bayer matrix                    |
| **Palette**                    | A named set of colors available to palette mapping and dithering.                             | Color set, swatches                          |
| **Preset Palette**             | A built-in **Palette** shipped with the app.                                                  | Built-in palette, default palette            |
| **Custom Palette**             | A user-defined **Palette** supported by the model but not exposed as a v1 editor flow.        | User palette, manual palette                 |
| **Palette Resolution**         | The rule that chooses the actual **Palette** from **Editor Settings** before processing.      | Palette lookup, palette selection            |
| **Palette Default Color Mode** | The **Color Mode** applied automatically when a **Preset Palette** is selected.               | Palette color preset, palette mode           |
| **Color Mode**                 | The choice between grayscale-first and color-preserve processing.                             | Source color mode, color handling            |
| **Preprocessing**              | Tone and color adjustment applied before palette mapping and dithering.                       | Adjustment, correction, filters              |
| **Resize Fit**                 | The rule that maps source dimensions into output dimensions using contain, cover, or stretch. | Crop mode, fit mode                          |
| **Resize Mode**                | The sampling method used by resize, currently bilinear or nearest-neighbor.                   | Resample mode, scaling mode                  |
| **Processing Metadata**        | The export-facing facts that describe the processing result.                                  | Export details, render metadata              |

## Algorithm Registry

| Term                            | Definition                                                                                           | Aliases to avoid               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Dither Algorithm Registry**   | The core source of truth for supported algorithm ids, labels, capabilities, execution, and metadata. | Algorithm list, switch list    |
| **Dither Algorithm Option**     | The selectable representation of a **Dither Algorithm** shown by the editor.                         | Select item, UI option         |
| **Dither Algorithm Capability** | A declared feature of a **Dither Algorithm** that controls algorithm-specific editor controls.       | Special case, hard-coded check |
| **Algorithm Metadata Label**    | The human-readable algorithm label written into **Processing Metadata**.                             | Algorithm name, display string |
| **Algorithm Selector**          | The editor control that chooses one **Dither Algorithm Option**.                                     | Dropdown, algorithm menu       |
| **Bayer Matrix Control**        | The editor control that changes **Bayer Size** when the selected algorithm supports it.              | Bayer toggle, matrix selector  |

## Preview And Comparison

| Term                               | Definition                                                                                          | Aliases to avoid                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Preview**                        | The on-screen rendering of the **Source Image**, **Processed Image**, or both.                      | Canvas view, display, preview mode |
| **Compare Mode**                   | The preview selection among processed-only, original-only, and slide comparison.                    | Preview mode, split mode           |
| **Processed View**                 | A **Compare Mode** that shows only the **Processed Image**.                                         | Result view, output view           |
| **Original View**                  | A **Compare Mode** that shows only the **Source Image**.                                            | Source view, before view           |
| **Slide Compare**                  | A **Compare Mode** that overlays source and processed images in one frame with a draggable divider. | Split compare, before-after slider |
| **Slide Divider**                  | The draggable vertical control that sets the reveal boundary in **Slide Compare**.                  | Slider, handle, divider            |
| **View Scale**                     | The desktop preview sizing mode, currently fit or 1:1.                                              | Zoom mode, scale mode              |
| **Fit View**                       | A **View Scale** that fits the preview within the available preview area.                           | Fit, fit to screen                 |
| **1:1 View**                       | A **View Scale** that displays preview pixels at actual pixel size.                                 | Actual size, pixel view            |
| **Desktop Reduced Preview Notice** | A desktop-only overlay that says the on-screen preview is reduced while export remains full size.   | Preview only, warning banner       |
| **Preview Refinement**             | A follow-up **Preview Job** that replaces a fast **Reduced Preview** with a larger preview buffer.  | Final preview, preview catch-up    |

## Editor Experience

| Term                   | Definition                                                                                    | Aliases to avoid                           |
| ---------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Editor**             | The single-screen workstation where users load, adjust, preview, and export an image.         | App, tool, workspace                       |
| **Control Panel**      | The panel containing processing, resize, compare, clipboard, and advanced settings.           | Settings panel, sidebar                    |
| **Advanced Controls**  | Collapsible controls for less frequent or more technical settings.                            | Advanced panel, extra settings             |
| **Theme**              | The persistent light or dark visual appearance selected from the header.                      | Color scheme, mode                         |
| **Local Processing**   | The app behavior where images are decoded, processed, previewed, and exported in the browser. | Client-side processing, offline processing |
| **Processing Job**     | A browser processing run that produces a **Processed Image** for preview or export.           | Worker job, render job                     |
| **Preview Job**        | A cancellable **Processing Job** that updates the on-screen **Preview**.                      | Worker job, render job                     |
| **Export Job**         | A **Processing Job** that produces **Export PNG** from **Full Output**.                       | Download job, final job                    |
| **Clipboard Settings** | The copy/paste flow that transfers **Settings JSON** through the system clipboard.            | Settings file, import/export file          |

## Platform Behavior

| Term                   | Definition                                                                                    | Aliases to avoid          |
| ---------------------- | --------------------------------------------------------------------------------------------- | ------------------------- |
| **Desktop Experience** | The layout that exposes **View Scale** controls and desktop reduced-preview messaging.        | Desktop mode, wide layout |
| **Mobile Experience**  | The layout that keeps **Fit View** and hides reduced-preview messaging.                       | Mobile mode, phone layout |
| **Mobile Fit Preview** | The mobile-only preview behavior that maximizes visible image area without offering 1:1 view. | Mobile 1:1, phone zoom    |

## Relationships

- A **Source Image** produces zero or one current **Processed Image** for the active **Editor Settings**.
- A **Processed Image** may be rendered as **Reduced Preview** or **Full Output**.
- **Export PNG** must be encoded from **Full Output**, not from **Reduced Preview**.
- **Reduced Preview** may differ in dimensions from **Output Size**.
- **Output Size** must stay within the **Output Cap**.
- **Source Intake** produces either an accepted **Source Image** or a rejected source.
- **Source Intake** may produce a **Source Notice**.
- **Editor Settings** select exactly one **Dither Algorithm** and one **Palette** per processing run.
- A **Dither Algorithm Id** identifies exactly one registered **Dither Algorithm**.
- The **Dither Algorithm Registry** owns all **Dither Algorithm Options**.
- A **Dither Algorithm Option** has zero or more **Dither Algorithm Capabilities**.
- The **Bayer Matrix Control** is visible only when the selected **Dither Algorithm** has the Bayer size capability.
- The **Algorithm Metadata Label** for **Bayer Dithering** includes the selected **Bayer Size**.
- **Palette Resolution** happens before a **Dither Algorithm** processes pixels.
- A **Settings Transition** produces one next **Editor Settings** object.
- A **Settings Transition** may use **Transition Context** to preserve **Aspect Lock**.
- **Clipboard Settings** copies and pastes one **Settings JSON** payload.
- **Settings JSON** contains one versioned **Editor Settings** object.
- **Mobile Experience** always uses **Mobile Fit Preview**.
- **Desktop Experience** may use **Fit View** or **1:1 View**.
- **Desktop Reduced Preview Notice** may appear only in **Desktop Experience**.
- **Slide Compare** uses one **Source Image** layer and one **Processed Image** layer in the same displayed frame.
- A **Preview Job** may be cancelled by newer **Settings Transitions**.
- A **Preview Job** may include one **Preview Refinement**.
- An **Export Job** should ignore preview-size shortcuts and produce **Export PNG** at **Output Size**.

## Example Dialogue

> **Dev:** "If the **Algorithm Selector** shows **Bayer Dithering**, should the **Bayer Matrix Control** check for the string `bayer`?"
>
> **Domain expert:** "No. The **Dither Algorithm Registry** should say whether the selected **Dither Algorithm** has the Bayer size capability."
>
> **Dev:** "So the **Dither Algorithm Option** controls what the user sees, and the same registry controls processing?"
>
> **Domain expert:** "Exactly. The **Dither Algorithm Id** in **Editor Settings** resolves through the registry, then processing uses the resolved **Palette** and the selected algorithm."
>
> **Dev:** "When I paste **Settings JSON**, can I patch width directly after validation?"
>
> **Domain expert:** "Use a **Settings Transition**. It applies **Aspect Lock**, **Output Cap**, and any **Source Notice** rules before the next **Editor Settings** is stored."
>
> **Dev:** "Does **Export PNG** ever use **Reduced Preview** if the **Preview Job** is still refining?"
>
> **Domain expert:** "No. **Export PNG** comes from **Full Output** at **Output Size**, using the same **Dither Algorithm** and **Palette** selected by **Editor Settings**."

## Flagged Ambiguities

- "Algorithm" was used for ids, labels, UI options, and execution. Use **Dither Algorithm** for the method, **Dither Algorithm Id** for persisted settings, **Dither Algorithm Option** for UI selection, and **Algorithm Metadata Label** for export-facing text.
- "Registry" can sound like a UI list. In this domain, **Dither Algorithm Registry** is the core source of truth for selection, execution, capabilities, and metadata.
- "None" is a UI label and stable id, but the domain behavior is **No Dither**: direct palette mapping without spatial dithering.
- "Bayer Matrix" was used for both the setting and the control. Use **Bayer Size** for the value and **Bayer Matrix Control** for the editor UI.
- "Preview Only" sounded like a broken app state. Canonical terms: **Reduced Preview** for the image state and **Desktop Reduced Preview Notice** for the desktop overlay.
- "Preview" was used for displayed canvas, reduced buffer, and compare selection. Canonical terms: **Preview**, **Reduced Preview**, and **Compare Mode**.
- "Output" was used for processed pixels and downloaded file. Canonical terms: **Processed Image**, **Full Output**, and **Export PNG**.
- "Cap", "limit", "budget", and "ready %" overlapped in UI and architecture discussion. Use **Output Cap** for the pixel budget and **Output Size** for the selected dimensions.
- "Original" and **Source Image** overlap. Use **Source Image** for the image entity and **Original View** for the compare mode.
- "Fit" was used for both preview zoom and resize fitting. Use **Fit View** for preview sizing and **Resize Fit** for contain / cover / stretch.
- "Full preview" suggested the screen should always catch up to full resolution. Use **Full Output** for selected output dimensions and keep it tied to export semantics.
- "Split" and **Slide Compare** both referred to before/after comparison. Canonical term: **Slide Compare**; keep `split` only as legacy persisted state.
- "Settings", "preset", and "config" overlap. Use **Editor Settings** for active state and **Settings JSON** for serialized clipboard exchange.
- "Patch settings", "state update", and "settings change" blur UI mechanics with domain rules. Use **Settings Transition** when aspect lock, palette defaults, or **Output Cap** rules must be preserved.
- "Context" is vague by itself. Use **Transition Context** only for source dimensions and other facts required to turn a **Settings Transition** into valid **Editor Settings**.
- "Clipboard" in settings discussions means **Clipboard Settings** text, not a file import/export path.
- Oversized **Source Image** handling is a **Source Intake** rejection. **Output Size** may still be auto-sized to stay within the **Output Cap**.
- **Custom Palette** exists in the processing model but is not a current v1 editor flow. Treat it as future-capable domain language, not exposed functionality.
