# IMDITHER Context

This is the canonical domain context for agents working in IMDITHER. Read this
before changing code, writing PRDs, naming tests, or proposing architecture
changes.

For full historical detail, see:

- [Product PRD](docs/PRD.md) for the current product contract.
- [PRD Index](docs/prd-index.md) for implemented and planned feature PRDs.
- [Legacy Glossary](UBIQUITOUS_LANGUAGE.md) for older expanded vocabulary.
- [Settings Schema](docs/settings-schema.md) for public Settings JSON.

## Product Boundary

IMDITHER is a local-first browser image dithering workstation. The core product
flow is:

1. accept a Source Image by upload, paste, or bundled demo;
2. process it with Editor Settings in the browser;
3. inspect the result through Preview and Compare Mode;
4. export a Full Output file.

The product intentionally stays browser-local. Do not introduce backend,
accounts, cloud processing, telemetry, or multi-page app shell assumptions
unless a future PRD explicitly changes that boundary.

## Documentation Structure

This repo uses the single-context layout from [domain.md](docs/agents/domain.md):

- `CONTEXT.md` is the current domain language and architecture context.
- `docs/adr/` is reserved for durable architecture decisions.
- `docs/**/PRD.md` files are historical or active feature contracts.
- `.scratch/**/PRD.md` files are local issue-tracker PRDs that are not yet
  promoted into `docs/`.

Do not create `CONTEXT-MAP.md` unless the repo is deliberately split into
multiple bounded contexts with one `CONTEXT.md` per context.

## Core Terms

| Term            | Meaning                                                                                  | Avoid                       |
| --------------- | ---------------------------------------------------------------------------------------- | --------------------------- |
| Source Image    | The user-provided or bundled demo image before processing.                               | input image, uploaded image |
| Demo Image      | The bundled Source Image available before user import.                                   | sample, placeholder         |
| Processed Image | The image produced from the Source Image and current Editor Settings.                    | result image, after image   |
| Screen Preview  | A Processed Image sized for the current on-screen Display Frame in Fit View.             | fit output, screen output   |
| Full Output     | The Processed Image at the selected Output Size.                                         | full preview, final render  |
| Export File     | The downloaded file encoded from the Full Output.                                        | download, final image       |
| Pixel Buffer    | In-memory pixel data plus dimensions used by processing and preview rendering.           | image blob, raw image       |
| Editor Settings | Versioned processing configuration that determines the Processed Image.                  | config, options             |
| Settings JSON   | Serialized Editor Settings used for reproducible copy and paste.                         | preset JSON                 |
| Look Snapshot   | Shareable artifact that wraps normalized Editor Settings with lightweight look metadata. | saved state                 |
| Look Payload    | Compact compressed transport form of one Look Snapshot.                                  | URL state                   |
| Look Recipe     | One-shot style recipe that applies selected Editor Settings fields, including stack.      | stack preset                |
| Effect Stack    | Serializable ordered processing stages stored inside Editor Settings.                    | filter chain, layer stack   |
| Effect Stage    | One ordered operation inside an Effect Stack.                                            | effect layer                |

## Processing Context

The deterministic processing engine lives in `packages/core`. The web app owns
interaction, worker orchestration, source intake, and export.

Use these terms consistently:

- Dither Algorithm: the selected method for spatial tone or color patterning.
- Dither Algorithm Id: the stable settings value for an algorithm.
- Palette: a named set of colors used by mapping and dithering.
- Palette Preset: a built-in Palette shipped with the app.
- Custom Palette: the active user-defined Palette stored in Editor Settings.
- Processing Preset: a curated starting recipe that applies selected Editor
  Settings fields without becoming separate stored state.
- Look Recipe: a curated or user-saved style recipe that applies selected
  Editor Settings fields, including Effect Stack, palette, dither, color, and
  adjust fields, while preserving output geometry.
- Effect Stack: an ordered, serializable part of Editor Settings that extends
  processing beyond one dither pass while staying copy/paste and Look Payload
  safe.
- Effect Stage: one Effect Stack item with a Stage Instance Id, Stage Kind,
  enabled state, and serializable parameters.
- Stage Instance Id: a stable per-stage identity used for UI ordering and
  history, not for processing behavior.
- Stage Kind: the pipeline group (`pre`, `quantize`, `dither`, `post`) that
  determines execution order for an Effect Stage. Stage Kind is not the
  behavior identity; the specific effect (e.g. `pre.blur`, `post.grain`) is
  stored in `params.effect`.
- Settings Transition: a user intent that produces one next Editor Settings
  value while preserving domain rules.
- Settings History: session-local undo and redo stack for Editor Settings.
- Editor Settings Command Application: browser-side seam that owns
  reset-defaults, set-output-width, and generic Settings Transition commands
  with consistent applied-marker clearing through a runtime adapter.
- Palette Action Application: browser-side seam that owns palette import,
  export JSON/GPL, copy JSON, and palette extraction commands through a
  single runtime adapter and discriminated command interface.
- Clipboard Settings Application: browser-side seam that owns Settings JSON
  copy/paste, Look Payload copy/paste, and palette clipboard import through
  a single runtime adapter and discriminated command interface.

Preserve this distinction: Processing Presets are legacy dithering recipes;
Look Recipes are stack-aware style recipes; Editor Settings are the state;
Settings JSON and Look Payloads are transport formats.

Effect Stack data must contain Stage Instance Ids, Stage Kinds, stable ordering,
enabled state, and serializable parameters only. It must not contain Pixel
Buffers, binary assets, DOM objects, browser-only handles, or runtime job state.

In the Phase 4 core model, the existing palette, matching mode, dither
algorithm, and Bayer size settings remain the source of truth for palette
mapping and dithering behavior. Quantize and dither stages wrap the current
processing path instead of duplicating those settings.

The Phase 4 Effect Stack uses fixed group ordering: built-in source preparation
first, then `pre` stages, existing preprocessing, quantize/dither core stages,
and `post` stages. Users may reorder optional stages inside the `pre` group or
inside the `post` group, but Phase 4 does not allow arbitrary cross-group
ordering, multiple dither stages, or moving resize and alpha flattening into the
stack.

Effect Stack UI belongs in an Inspector `Stack` tab between `Looks` and
`Adjust`. The app remains dithering-first: existing controls stay primary, and
the Stack tab exposes the workstation model without replacing the preview-first
editor.

The Stack tab may mirror palette and dither controls as editable Core stages.
Until the older Adjust and Palette tabs are retired, those mirrored controls
must use the same Settings Transition commands and must not create duplicate
settings state.

## Preview And Comparison Context

Preview is the on-screen rendering of the Source Image, Processed Image, or
both. It is view-local and should not change image-processing semantics.

Use these terms consistently:

- Compare Mode: processed-only, original-only, or Slide Compare.
- Processed View: Compare Mode that shows only the Processed Image.
- Original View: Compare Mode that shows only the Source Image.
- Slide Compare: Compare Mode that overlays source and processed images in one
  frame with a draggable divider.
- Slide Divider: the draggable vertical control that sets the reveal boundary.
- Preview Viewport: view-local state containing mode, zoom, image-space center,
  grid preference, and inspector preference.
- Fit View / Screen Fit: mode that fits the preview within the available area.
- Manual View / Real Pixels: mode that uses numeric zoom and image-space center
  coordinates for inspection.
- Display Frame: the actual on-screen rectangle used to display a Preview
  Surface.
- Pixel Inspector: preview-local readout of image coordinates and visible
  original or processed hex values under the cursor.

Architecture terms:

- Preview Stage: owns preview layout, controls, drop affordances, overlays,
  export entry, and history actions.
- Preview Presentation: renders preview surfaces from Preview Product State
  without changing processing semantics.
- Preview Presentation Core: pure calculations for sizing, viewport movement,
  coordinate mapping, and divider mapping.
- Preview Presentation Shell: React runtime layer for measurement, pointer
  capture, gestures, wheel zoom, and Pixel Inspector sampling.
- Preview Cycle: React runtime layer that owns Screen Preview target
  calculation, Preview Job start/cancel wiring, reduced/refined Preview updates,
  and Preview Refinement state before Preview Stage receives renderable state.
- Preview Viewport Interaction: the view-local interaction module that owns
  Preview Viewport gesture policy, including wheel zoom, Manual View pan, Touch
  Pinch Zoom, pointer capture decisions, live viewport updates, and
  commit-on-release outcomes.
- Preview Surface Adapter: surface-specific layer for buffers, labels, canvas
  drawing, and unique interactions.
- Preview Product State: compare mode, viewport, pixel buffers, output
  dimensions, preview target, status, and precision capability.

Important invariant: Slide Divider coordinate spaces differ by concern. In Fit
View, handle placement maps through the actual Display Frame, including Fit
Inset. In Manual View, the visible handle, divider line, and processed canvas
clip must share the same viewport-clamped split.

Important invariant: Preview Viewport Interaction works in Full Output image
coordinates even when Fit View is rendering a reduced Screen Preview. Wheel zoom
from Screen Fit into Real Pixels must anchor around the cursor in Full Output
space, not around the temporary Screen Preview Pixel Buffer dimensions.

## Runtime Responsiveness Context

Responsiveness is a domain constraint, not only a performance concern.

Use these terms consistently:

- Direct Slider Movement: a slider thumb follows pointer movement without
  waiting for React or worker work.
- Draft Slider Value: transient value shown while dragging.
- Committed Settings: Editor Settings value allowed to start Preview Jobs,
  clipboard copy, and export.
- Commit-on-Release: Draft Slider Value becomes Committed Settings only after
  pointer release or blur.
- Hot Drag Path: work executed repeatedly while a pointer moves.
- Render Boundary: component boundary that prevents unrelated state changes
  from rebuilding protected UI.
- Canvas Redraw Boundary: canvas redraw happens only when its Pixel Buffer
  identity or explicit restore trigger changes.
- Status-only Update: Processing Status change without a new Pixel Buffer.

Do not write Committed Settings or Preview Viewport state on every pointer move
unless a PRD explicitly accepts the responsiveness tradeoff.

## Export Context

Export is format-neutral until the Export Layer encodes a Full Output.

Use these terms consistently:

- Export Preferences: persisted editor UI preferences for encoding.
- Export Format: PNG, WebP, or JPEG.
- Export Quality: shared lossy encoder quality for WebP and JPEG.
- Export Action: command that starts an Export Job, passes the Full Output
  through the Browser Encoder, downloads an Export File, and reports export
  metadata, status, and errors.
- Export Action Application: browser-side seam that applies an Export Action to
  editor runtime state without making the App Shell own Export Job ordering,
  Browser Encoder calls, download naming, metadata updates, status, or errors.
- Export Drawer: responsive drawer that owns Export Format, Export Quality, and
  the final Export Action.
- Export Layer: browser-side layer that encodes a Pixel Buffer.
- Browser Encoder: canvas encoder used by the Export Layer.
- Encoder Failure: explicit failure state when the Browser Encoder cannot
  produce the requested Export Format.

Preserve the rule that PNG remains the default export path unless a feature
explicitly widens the behavior.
An Export Action without a current Source Image is a safe no-op; the UI should
normally disable the action, but the Export Action Application should not report
an error or change status for this case.
The current runtime uses one shared Job Status for preview and export. Until a
future PRD changes that model, a successful Export Action sets status to ready
and a failed Export Action sets status to error.
After successful Browser Encoder output, Export Action metadata reports the
selected Export Format label. Browser MIME fallback detection is separate
Encoder Failure hardening, not part of the Export Action Application seam.

## Auto-Tune Context

Auto-Tune is deterministic, local, and image-aware. It recommends normal Look
Snapshots from the current Source Image.

Use these terms consistently:

- Auto-Tune Panel: editor panel that shows generated looks and recommendation
  state.
- Auto-Tune Candidate Archetype: visible look family that can produce hidden
  candidate variants.
- Hidden Candidate Variant: normal Look Snapshot variant generated before
  ranking.
- Candidate Expansion: deterministic step that creates a bounded hidden pool.
- Rendered Candidate Scoring: core scoring step that processes a candidate on a
  bounded sample and measures output fit.
- Palette Fit: score for how well a candidate palette represents sampled source
  colors.
- Auto-Tune Recommendation: ranked candidate look shown to the user.
- Auto-Tune Shortlist: visible 3 to 5 recommendations.
- Auto-Tune Worker: dedicated browser worker that generates recommendations
  after the first preview is ready.
- Auto-Tune Apply Application: browser-side seam that applies an Auto-Tune
  Recommendation through Settings Transition with current output size
  preservation, mark-applied tracking, notice reporting, and error handling
  through a runtime adapter.

Do not describe Auto-Tune as AI, inference, or cloud intelligence. It is a
deterministic local recommendation workflow.

## Source Intake Context

Source Intake accepts or rejects a Source Image before processing.

Use these terms consistently:

- Source Intake: decision flow that accepts or rejects a Source Image.
- Source Load Command: user intent to load a Source Image from upload, paste,
  drop, or the bundled demo before Source Intake applies browser decoding and
  policy.
- Source Load Command starts after raw browser events have been normalized to a
  file or demo intent; DOM events remain owned by the App Shell or Preview
  Stage.
- Source Intake Application exposes one Source Load Command interface for demo
  and file-backed loads; upload, drop, and paste converge before that seam.
- Source Intake Application: browser-side seam that applies accepted/rejected
  Source Load Commands and Source Intake results to source state, Preview
  Viewport reset, Preview Cycle reset, Output Size transition, Source Notice,
  status, and error state.
- Source Intake Runtime Adapter: browser-side adapter that lets Source Intake
  Application update editor runtime state without exposing individual React or
  store setters as its interface.
- Source Notice: short user-facing message about intake or Output Size policy.
- Output Cap: maximum browser pixel budget for Output Size.
- Output Size Policy: web-facing seam over core Output Cap math that owns Source
  Image rejection checks, output auto-size recommendations, output clamp
  notices, and source rejection copy.
- Alpha Flattening: compositing transparent source pixels onto an Alpha
  Background before processing.
- Auto-Tune Analysis Sample: runtime-only bounded Pixel Buffer created during
  Source Intake for recommendations.
- Auto-Tune applied-marker state belongs to Auto-Tune runtime state, not Source
  Intake Application; Source Intake only supplies the Source Image and
  Auto-Tune Analysis Sample.

Source rejection and output-budget limiting are separate policies.
Rejected Source Intake is non-destructive: it reports an error without clearing
the current Source Image, Preview Cycle state, Preview Viewport, or Editor
Settings.
Accepted Source Intake may apply an Output Size transition as load-time
baseline state, but that transition is not recorded in Settings History.
Responsive Preview Viewport enforcement, such as forcing Fit View on mobile,
is Preview Viewport policy and does not belong to Source Intake Application.

## Terms To Avoid

Avoid these ambiguous names in code, docs, issue titles, and tests:

- `preview mode` when the concept is Compare Mode or Preview Viewport mode.
- `slider` when the concept is Slide Divider.
- `actual pixels` when the user-facing term is Real Pixels.
- `config` when the concept is Editor Settings.
- `preset JSON` when the concept is Settings JSON, Look Snapshot, or Look
  Payload.
- `AI preset` when the concept is Auto-Tune Recommendation.
- `download image` when the concept is Export File or Export Action.

If a required concept is missing from this context, add the term here before
using a new synonym across the repo.
