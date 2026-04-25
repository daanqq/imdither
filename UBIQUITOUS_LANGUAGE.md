# Ubiquitous Language

## Image lifecycle

| Term                 | Definition                                                                                          | Aliases to avoid                              |
| -------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Source Image**     | The user-provided or bundled demo image before IMDITHER processing.                                 | Input image, uploaded image, original file    |
| **Demo Image**       | The bundled **Source Image** available before the user loads their own image.                       | Sample, placeholder                           |
| **Processed Image**  | The image produced by applying the current **Editor Settings** to the **Source Image**.             | Result image, output image, after image       |
| **Reduced Preview**  | A lower-resolution **Processed Image** used for responsive on-screen editing.                       | Preview only, draft output, temporary output  |
| **Full Output**      | The **Processed Image** at the selected output dimensions.                                          | Full preview, final render, full-size preview |
| **Export PNG**       | The downloaded PNG encoded from the **Full Output**.                                                | Download, export file, final image            |
| **Output Size**      | The selected width and height used for **Full Output** and **Export PNG**.                          | Resolution, dimensions, image size            |
| **Output Cap**       | The maximum allowed pixel budget for **Output Size** in the browser.                                | Ready %, capacity, render cap                 |
| **Source Intake**    | The decision flow that accepts or rejects a **Source Image** before processing.                     | Upload handling, import pipeline              |
| **Source Notice**    | A short user-facing message about **Source Intake** or **Output Size** changes.                     | Status badge, toast, alert                    |
| **Alpha Flattening** | The stage that composites transparent source pixels onto an **Alpha Background** before processing. | Transparency handling, alpha removal          |
| **Alpha Background** | The black or white background used during **Alpha Flattening**.                                     | Matte color, flatten color                    |

## Processing

| Term                          | Definition                                                                                    | Aliases to avoid                             |
| ----------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Editor Settings**           | The versioned processing configuration that determines the current **Processed Image**.       | Config, preset, options                      |
| **Settings JSON**             | A serialized **Editor Settings** payload used for reproducible copy and paste.                | Preset JSON, config JSON, import/export JSON |
| **Dither Algorithm**          | The selected method for producing spatial tone or color patterns from a **Palette**.          | Algorithm, filter, effect                    |
| **No Dither**                 | Direct palette mapping without spatial patterning or error diffusion.                         | None, plain quantize                         |
| **Bayer Dithering**           | Ordered dithering using a 2x2, 4x4, or 8x8 Bayer matrix.                                      | Bayer, ordered                               |
| **Matt Parker Dithering**     | Pattern dithering based on a Parker-style threshold matrix.                                   | Matt Parker, Parker                          |
| **Floyd-Steinberg Dithering** | Error diffusion using the Floyd-Steinberg kernel.                                             | Floyd, FS                                    |
| **Atkinson Dithering**        | Error diffusion using the Atkinson kernel.                                                    | Atkinson                                     |
| **Bayer Size**                | The selected Bayer matrix dimension: 2, 4, or 8.                                              | Matrix size, Bayer matrix                    |
| **Palette**                   | A named set of colors available to palette mapping and dithering.                             | Color set, swatches                          |
| **Preset Palette**            | A built-in **Palette** shipped with the app.                                                  | Built-in palette, default palette            |
| **Custom Palette**            | A user-defined **Palette** supported by the model but not exposed as a v1 editor flow.        | User palette, manual palette                 |
| **Color Mode**                | The choice between grayscale-first and color-preserve processing.                             | Source color mode, color handling            |
| **Preprocessing**             | Tone and color adjustment applied before palette mapping and dithering.                       | Adjustment, correction, filters              |
| **Resize Fit**                | The rule that maps source dimensions into output dimensions using contain, cover, or stretch. | Crop mode, fit mode                          |
| **Resize Mode**               | The sampling method used by resize, currently bilinear or nearest-neighbor.                   | Resample mode, scaling mode                  |
| **Settings Transition**       | A user intent that changes **Editor Settings** while preserving product invariants.           | Settings patch, state update                 |

## Preview and comparison

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

## Editor experience

| Term                  | Definition                                                                                    | Aliases to avoid                           |
| --------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Editor**            | The single-screen workstation where users load, adjust, preview, and export an image.         | App, tool, workspace                       |
| **Control Panel**     | The panel containing processing, resize, compare, clipboard, and advanced settings.           | Settings panel, sidebar                    |
| **Advanced Controls** | Collapsible controls for less frequent or more technical settings.                            | Advanced panel, extra settings             |
| **Theme**             | The persistent light or dark visual appearance selected from the header.                      | Color scheme, mode                         |
| **Local Processing**  | The app behavior where images are decoded, processed, previewed, and exported in the browser. | Client-side processing, offline processing |
| **Processing Job**    | A browser processing run that produces a **Processed Image** for preview or export.           | Worker job, render job                     |
| **Preview Job**       | A cancellable **Processing Job** that updates the on-screen **Preview**.                      | Worker job, render job                     |
| **Export Job**        | A **Processing Job** that produces **Export PNG** from **Full Output**.                       | Download job, final job                    |

## Platform behavior

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
- **Mobile Experience** always uses **Mobile Fit Preview**.
- **Desktop Experience** may use **Fit View** or **1:1 View**.
- **Desktop Reduced Preview Notice** may appear only in **Desktop Experience**.
- **Slide Compare** uses one **Source Image** layer and one **Processed Image** layer in the same displayed frame.
- **Editor Settings** select exactly one **Dither Algorithm** and one **Palette** per processing run.
- A **Settings Transition** produces one next **Editor Settings** object.
- **Settings JSON** contains one versioned **Editor Settings** object.
- A **Preview Job** may be cancelled by newer **Settings Transitions**.
- A **Preview Job** may include one **Preview Refinement**.
- An **Export Job** should ignore preview-size shortcuts and produce **Export PNG** at **Output Size**.

## Example dialogue

> **Dev:** "When **Source Intake** accepts a 1920px **Source Image**, should we show a **Desktop Reduced Preview Notice**?"
>
> **Domain expert:** "No. In **Mobile Experience**, use **Mobile Fit Preview** and avoid reduced-preview messaging because the user cannot inspect **Full Output** at 1:1 anyway."
>
> **Dev:** "If a **Preview Job** starts with a smaller buffer, does **Export PNG** use that **Reduced Preview**?"
>
> **Domain expert:** "No. **Reduced Preview** is only for the **Preview**; **Export PNG** must still come from **Full Output** at **Output Size**."
>
> **Dev:** "Should a **Preview Refinement** change the selected **Output Size**?"
>
> **Domain expert:** "No. A **Preview Refinement** only improves the displayed **Preview**; **Output Size** remains controlled by **Editor Settings** and the **Output Cap**."
>
> **Dev:** "If **Slide Compare** is active, does that change the **Dither Algorithm** or **Palette**?"
>
> **Domain expert:** "No. **Slide Compare** is only a **Compare Mode** and must not affect **Editor Settings** or **Export PNG**."

## Flagged ambiguities

- "Preview Only" sounded like a broken app state. Canonical term: **Reduced Preview** for the image state and **Desktop Reduced Preview Notice** for the desktop overlay.
- "Preview" was used for displayed canvas, reduced buffer, and compare selection. Canonical terms: **Preview**, **Reduced Preview**, and **Compare Mode**.
- "Output" was used for processed pixels and downloaded file. Canonical terms: **Processed Image**, **Full Output**, and **Export PNG**.
- "Cap", "limit", "budget", and "ready %" overlapped in UI and architecture discussion. Use **Output Cap** for the pixel budget and **Output Size** for the selected dimensions.
- "Original" and **Source Image** overlap. Use **Source Image** for the image entity and **Original View** for the compare mode.
- "Fit" was used for both preview zoom and resize fitting. Use **Fit View** for preview sizing and **Resize Fit** for contain / cover / stretch.
- "Full preview" suggested the screen should always catch up to full resolution. Use **Full Output** for selected output dimensions and keep it tied to export semantics.
- "Split" and **Slide Compare** both referred to before/after comparison. Canonical term: **Slide Compare**; keep `split` only as legacy persisted state.
- "Settings", "preset", and "config" overlap. Use **Editor Settings** for active state and **Settings JSON** for serialized clipboard exchange.
- "Patch settings", "state update", and "settings change" blur UI mechanics with domain rules. Use **Settings Transition** when aspect lock, palette defaults, or **Output Cap** rules must be preserved.
- Oversized **Source Image** handling is currently a policy conflict: earlier PRD language said auto-downscale, later implementation direction preferred rejection. Keep the umbrella term **Source Intake** until the product decision is settled.
- **Custom Palette** exists in the processing model but is not a current v1 editor flow. Treat it as future-capable domain language, not exposed functionality.
