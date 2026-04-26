# IMDITHER PRD

Status: done
Last updated: 2026-04-26

## 1. Product Summary

IMDITHER is an open source, browser-first image dithering workstation. It lets a user load one image, choose a curated processing recipe or direct settings, inspect the original versus processed result, and export a raster image without sending the source image to a server.

Primary value:

- load an image by upload, drag-and-drop, clipboard paste, or bundled demo
- resize and prepare tones locally
- apply a processing recipe or choose palette, color mode, and dithering algorithm directly
- limit palette depth and choose RGB or perceptual nearest-color matching
- compare original and processed output in a stable preview surface
- copy, paste, and URL-apply repeatable processing looks without sharing source image data
- export the final full-resolution processed output as PNG, WebP, or JPEG

The current product is a single-screen, local-only editor. It is optimized for desktop precision, remains usable on mobile, and keeps heavy image work behind explicit browser-side job boundaries.

## 2. Goals

- Provide a fast, deterministic, testable dithering editor for one image at a time.
- Keep image processing local, private, and reproducible.
- Make good visual starting points discoverable through curated processing recipes.
- Keep palette, algorithm, preview, export, and settings contracts explicit enough for OSS maintenance.
- Separate the DOM-free image-processing engine from web-only UI, source-intake, preview, and export layers.
- Maintain a distinctive dark-first, Nothing-inspired workstation interface with high information density.

## 3. Non-Goals for the Current Product

- No backend image processing.
- No account system, cloud sync, or remote storage.
- No remote URL import.
- No palette library or named saved palette collection.
- No palette drag-and-drop or remote palette URL import.
- No custom recipe creation or recipe marketplace.
- No general URL state sync beyond one-shot Look Payload import.
- No router or multi-page product shell.
- No batch processing.
- No WebGL/WebGPU pipeline.
- No SVG, GIF, AVIF, TIFF, PDF, or image-sequence export.
- No hardware-accurate device emulation presets.

## 4. Target Users

- Designers and artists making retro, monochrome, limited-palette, print-like, or posterized imagery.
- Developers and makers preparing visuals for experimental interfaces, pixel-art workflows, or generative tools.
- OSS users who want transparent algorithms, local processing, and reproducible settings.

## 5. Core Jobs To Be Done

- "I want to quickly turn a source image into a dithered image with a controlled visual character."
- "I want a good starting recipe without losing access to the underlying palette and algorithm controls."
- "I want to compare original and processed output without coordinate drift or preview-only artifacts."
- "I want the exported file to match my committed processing settings and chosen file format."
- "I want settings to be reproducible without embedding transient UI state or file-encoding preferences."
- "I want to share a repeatable processing look without sharing my source image."
- "I want the tool to feel local, responsive, and private."

## 6. Product Principles

- Local first: image processing and file export run in the browser.
- Deterministic output: the same source image and committed editor settings produce the same processed pixels.
- Editor first: immediate visual feedback and stable controls matter more than workflow ceremony.
- Truthful preview: `Fit` should be a clean screen preview, while Manual zoom should inspect output pixels.
- Engine/UI separation: the processing core stays DOM-free and reusable outside React.
- Explicit boundaries: source intake, settings transitions, preview jobs, slide compare, and export encoding are separate contracts.
- Restraint in UI: the interface should feel precise, compact, and instrument-like.

## 7. How Dithering Works in IMDITHER

At a high level:

1. Accept or reject the source image through Source Intake.
2. Decode the source into a local pixel buffer.
3. Apply an editor settings transition when the user changes settings or applies a recipe.
4. Flatten transparency onto the selected alpha background where processing or export requires it.
5. Apply resize fit and resize kernel.
6. Apply preprocessing such as brightness, contrast, gamma, invert, and color mode.
7. Resolve the selected palette.
8. Run the selected registry-backed dithering algorithm.
9. Render a preview from a preview job target.
10. Export the final output from a full-resolution export job and browser-side encoder.

Supported dithering families:

- Direct quantization: `none`
- Ordered dithering: `bayer`
- Palette-aware special algorithms: `matt-parker`, `blue-noise`, `halftone-dot`
- Error diffusion: `floyd-steinberg`, `atkinson`, `burkes`, `stucki`, `sierra-lite`

## 8. Functional Requirements

### 8.1 Input

The app supports:

- drag and drop
- file picker
- paste image from clipboard
- one bundled demo image

The app does not support remote URL import.

### 8.2 Image Limits

The app enforces browser-friendly image limits:

- maximum source dimension: 4096px
- maximum output pixel count: 12 MP

Oversized source images are rejected during Source Intake with clear user-facing messaging. Accepted sources may still receive an auto-sized output recommendation when the selected output would exceed the output cap.

### 8.3 Source Intake

Source Intake owns:

- accepted versus rejected source decisions
- source dimensions and source identity
- bundled demo source notices
- oversized source rejection messages
- output auto-size notices
- async intake behavior for upload, drop, paste, and demo flows

Source Intake must not silently downscale an oversized source.

### 8.4 Settings and Transitions

Editor Settings are versioned and describe processing, not transient UI state.

Settings transitions own:

- output-size aspect locking
- output-cap enforcement
- source-intake recommended output size
- palette default color mode
- processing recipe application
- Settings JSON normalization
- defaults reset behavior

React components emit user intents. They should not duplicate domain policy for settings changes.

### 8.5 Processing Recipes

Processing Presets are curated recipes, not persisted modes.

The Recipe selector applies a subset of Editor Settings:

- palette
- algorithm
- optional Bayer size
- optional color mode
- optional matching mode

Palette, Algorithm, Bayer Matrix, and Color Mode remain visible and editable after a recipe is applied. The active recipe is derived from current settings; if the controlled fields no longer match a recipe, the selector shows Custom. Recipe identity is not stored in Editor Settings, Settings JSON, processing metadata, or export metadata.

Current curated recipes:

- Fine Mono Bayer
- Mono Bayer
- Sea Glass Atkinson
- Redline Floyd
- Poster Blocks
- Blue Ink Noise
- Halftone Mono
- Game Boy Sierra
- Screenprint 16 RGB
- Screenprint 16 Perceptual

### 8.6 Algorithms

The Dither Algorithm Registry is the source of truth for algorithm ids, labels, capabilities, metadata labels, option ordering, and execution dispatch.

Current algorithms:

- `none`
- `bayer`
- `matt-parker`
- `floyd-steinberg`
- `atkinson`
- `burkes`
- `stucki`
- `sierra-lite`
- `blue-noise`
- `halftone-dot`

Rules:

- Bayer supports matrix sizes `2x2`, `4x4`, and `8x8`.
- The default settings use Bayer with `8x8`.
- Error diffusion algorithms remain deterministic.
- Algorithm options in the UI are derived from registry metadata.
- Algorithm-specific controls are driven by registry capabilities where practical.

### 8.7 Palettes

The app supports preset palettes and one active custom palette in Editor Settings.

Current palette families include:

- monochrome and grayscale palettes
- terminal/phosphor palettes
- handheld and retro-computer palettes
- creative multi-color palettes such as DawnBringer, Sweetie, AAP, Endesga, PICO-8, Poster, Risograph, Redline, Screenprint, and Sea Glass

Custom palette workflow:

- the Palette control shows `Custom` when `customPalette` is active
- users can convert the current preset palette into a custom palette
- users can add, edit, and delete custom palette colors in the Control Panel
- manual editing is capped at 32 colors; valid imported Settings JSON can preserve 33 to 256 colors
- custom palette colors normalize to lowercase 6-digit hex with a leading `#`
- duplicate colors are removed and palettes must contain 2 to 256 unique colors
- selecting a Palette Preset or applying a Processing Preset clears the active Custom Palette and shows a short notice

Palette asset import/export:

- import supports file picker and clipboard text
- accepted palette text includes HEX/plain text, GIMP Palette (`.gpl`), IMDITHER palette JSON, JSON hex arrays, and Settings JSON with `customPalette`
- export supports `imdither-palette.json` and `imdither-palette.gpl`
- full Settings JSON copy/paste remains separate from palette asset export

Source palette extraction:

- users can extract a custom palette from the current Source Image
- extraction uses the original Source Image buffer, not the processed preview
- supported extraction sizes are 2, 4, 8, 16, and 32 colors; the initial extraction size is 8
- extraction uses deterministic median-cut quantization and returns luminance-sorted hex colors

Architectural requirements:

- the engine is palette-agnostic and accepts a resolved palette array
- palette presets define default color mode
- palette parsing/export and source extraction live in DOM-free core modules

### 8.8 Color, Resize, and Preprocessing

Color modes:

- `grayscale-first`
- `color-preserve`

Color quality controls:

- Color Depth can use the full active palette or limit processing to the first
  2, 4, 8, or 16 colors.
- Color Depth never mutates preset palettes, custom palettes, or palette asset
  exports.
- Image preview and export use the effective limited palette.
- Color Matching supports `rgb` and `perceptual`.
- `rgb` remains the default and uses squared distance in encoded sRGB channels.
- `perceptual` uses squared distance in Oklab coordinates.
- Matt Parker dithering remains a tonal level algorithm and does not use the
  matching-mode selector.

Resize:

- resize kernels: `bilinear`, `nearest`
- resize fit modes in settings: `contain`, `cover`, `stretch`
- resize happens before dithering

Preprocessing controls:

- brightness
- contrast
- gamma
- invert
- color mode

Slider-like preprocessing controls use draft-on-drag and commit-on-release behavior so transient slider movement does not start preview jobs or persist draft values.

### 8.9 Preview and Compare

Preview modes:

- processed
- original
- slide before/after

View scale:

- `Fit`
- `Manual` zoom with 100% and slider controls

Inspection controls:

- pointer-drag pan in Manual mode
- wheel zoom rounded to 50% percentage steps
- optional pixel inspector with image coordinates and visible original/processed hex values

Slide comparison:

- renders original and processed layers in one shared frame
- keeps original and processed viewport transforms locked in Manual mode
- keeps original on the left and processed output on the right
- uses a draggable divider with pointer, click/tap, and keyboard support
- clamps the divider between 2% and 98%
- keeps divider position runtime-only and resets on reload
- shows original output when processed output is not ready

Screen-sized preview:

- `Fit` preview uses a measured CSS-pixel preview target to avoid browser downscaling artifacts
- Manual zoom keeps output-pixel inspection behavior without mutating processing settings
- preview target overrides do not mutate Editor Settings
- export jobs ignore preview target overrides and always use final output settings

### 8.10 Processing Jobs and Responsiveness

The editor keeps heavy local image work behind explicit async boundaries:

- Source Intake handles source loading and rejection.
- Processing Jobs own preview scheduling, reduced preview, refined preview, cancellation, and export coordination.
- The worker protocol stays typed.
- Stale preview results must not overwrite newer source or settings state.
- Large pixel buffers must stay out of global Zustand state.
- The previous preview should remain visible while replacement work is queued or processing.

Preview jobs may run reduced work first, then a refined preview. Export jobs are full-output operations and should report status clearly.

### 8.11 Export and Persistence

Export formats:

- PNG
- WebP
- JPEG

Rules:

- PNG is the default export format.
- WebP and JPEG share one lossy quality preference.
- default lossy quality: `0.92`
- quality range: `0.1` through `1.0`, step `0.05`
- export format and quality are persisted editor preferences, not Editor Settings.
- Settings JSON copy/paste excludes export format and quality.
- Look copy/paste wraps normalized Editor Settings in a shareable Look Snapshot
  and excludes source image data, source file names, compare mode, preview
  viewport, export preferences, runtime state, metadata, notices, and recipe id.
- Look payloads use `#look=<payload>` for URL sharing. The payload is compact
  JSON, gzip-compressed with `fflate`, and base64url encoded.
- URL look import applies once after a source image is available, then clears
  the look hash from the address bar.
- Clipboard look import accepts either a full URL containing `#look=<payload>`
  or a bare payload.
- JPEG export flattens alpha using the current alpha background setting.
- PNG preserves alpha.
- WebP preserves alpha where browser encoding supports it.
- unsupported browser encoder failures must fail explicitly, not silently fall back to PNG.
- filenames use the selected format extension.

The visible export action is format-neutral: `Export`.

### 8.12 Metadata

The UI exposes concise technical metadata:

- source dimensions
- output dimensions
- palette size
- algorithm name
- processing time
- export format

Metadata is informational. It must not become a dashboard or a second settings model.

### 8.13 Accessibility

Baseline accessibility:

- keyboard-accessible controls
- visible focus states
- semantic labels and aria support
- accessible slide-divider slider semantics
- sufficient contrast
- reduced-motion support
- no canvas-only critical information without text mirrors

## 9. Experience and Interface

### 9.1 Layout

IMDITHER is a single-screen workstation, not a wizard.

High-level layout:

- primary: preview stage
- secondary: control panel
- tertiary: metadata, utility, and status information

The preview stage owns upload/drop affordances, preview surfaces, processing overlays, compare presentation, view-scale controls, and export controls. The control panel owns recipe, palette, algorithm, output, color, and preprocessing controls.

### 9.2 Visual Direction

The interface is dark-first and Nothing-inspired:

- OLED black background
- white and gray hierarchy
- red as a rare accent
- strong typography
- technical labels in mono
- compact, instrument-like UI

Fonts:

- `Doto`
- `Space Grotesk`
- `Space Mono`

Light mode exists as a theme surface, but the product identity remains dark-first.

### 9.3 UI Foundation

The project uses `shadcn/ui` and Radix-backed primitives as the accessibility and composition foundation.

Important constraints:

- `shadcn/ui` is structural foundation, not the final visual language
- components are restyled to match IMDITHER tokens and the Nothing-inspired system
- shared primitives live in `packages/ui`
- the web app consumes shared primitives from `apps/web`
- product identity comes from custom tokens, spacing, typography, and composition

## 10. Technical Architecture

### 10.1 Repository Structure

The project uses a workspace layout:

- `apps/web`: Vite + React application
- `packages/core`: DOM-free image-processing engine
- `packages/ui`: shared UI primitives and tokens

### 10.2 Processing Core

`packages/core` remains independent from DOM-specific APIs.

Core buffer format:

```ts
type PixelBuffer = {
  width: number
  height: number
  data: Uint8ClampedArray
}
```

Boundary adapters may convert to and from browser APIs such as `ImageData`, but internal processing operates on `PixelBuffer`.

### 10.3 Core API Shape

Core owns:

- settings schema and normalization
- output limit helpers
- palette definitions and palette resolution
- processing preset registry and matching
- dither algorithm registry
- low-level pixel stages
- high-level `processImage(input, settings)`

Low-level stages include:

- alpha flattening
- resize
- preprocessing
- palette mapping
- ordered dithering
- error diffusion and special dithering algorithms

### 10.4 Worker Model

Processing runs behind a dedicated Web Worker.

Requirements:

- typed request/response protocol
- source-key based source reuse where practical
- stale preview cancellation or stale result ignoring
- full-output export jobs
- preview target override support for screen-sized Fit previews
- large buffers kept out of global Zustand state

### 10.5 Web App Modules

The web app owns browser-specific and React-specific layers:

- Source Intake
- Editor Settings Transition Module
- Settings History
- Processing Jobs
- Worker Client
- Preview Stage
- Slide Compare Preview Module
- Preview Viewport geometry
- Pixel Inspector
- Preview Frame and Screen Preview sizing
- Export Image layer
- editor store persistence

These modules should expose small contracts and avoid pushing domain policy into broad React components.

### 10.6 State Management

The app uses `zustand` narrowly.

Persisted editor preferences include:

- normalized settings without stale output dimensions
- compare mode
- preview viewport
- export format
- export quality
- advanced panel state

Runtime state includes:

- session-local settings history
- source image buffer
- processed preview buffer
- source id/name
- processing status
- source notices
- errors
- metadata
- slide divider position

Large source and processed pixel buffers must not be stored in Zustand.

Settings History is session-local and wraps Editor Settings transitions only.
Undo and redo do not include source images, preview viewport, compare mode,
export preferences, runtime status, notices, metadata, or panel state.

### 10.7 Settings Schema

Editor Settings describe processing only.

Current shape:

```ts
type EditorSettings = {
  schemaVersion: 2
  algorithm:
    | "none"
    | "bayer"
    | "matt-parker"
    | "floyd-steinberg"
    | "atkinson"
    | "burkes"
    | "stucki"
    | "sierra-lite"
    | "blue-noise"
    | "halftone-dot"
  bayerSize: 2 | 4 | 8
  paletteId: string
  customPalette?: string[]
  alphaBackground: "black" | "white"
  colorDepth: { mode: "full" } | { mode: "limit"; count: 2 | 4 | 8 | 16 }
  matchingMode: "rgb" | "perceptual"
  resize: {
    mode: "bilinear" | "nearest"
    fit: "contain" | "cover" | "stretch"
    width: number
    height: number
  }
  preprocess: {
    brightness: number
    contrast: number
    gamma: number
    invert: boolean
    colorMode: "grayscale-first" | "color-preserve"
  }
}
```

Editor Settings do not include:

- recipe id
- compare mode
- view scale
- export format
- export quality
- source image data
- preview target dimensions
- runtime job status

## 11. Testing Strategy

Tooling:

- `Vitest` for unit and component tests
- repository quality gate: `bun verify`

Test layers:

- unit tests for pixel math, palette mapping, preprocessing, resize, output caps, and dithering algorithms
- registry tests for algorithm, palette, and processing preset drift
- transition tests for editor settings policy
- source-intake tests for acceptance, rejection, and notices
- processing-job tests for event order, cancellation, reduced/refined preview, and export guarantees
- export-layer tests for format options, quality, alpha handling, filename generation, and encoder failure behavior
- component tests for control wiring, preview stage, slide compare, sliders, and store persistence

Test posture:

- assert public behavior and stable contracts
- avoid brittle tests for private object shapes or exact React nesting unless accessibility or visible behavior depends on it
- keep deterministic core output covered by small fixtures
- use browser-facing tests only where browser behavior is the actual contract

## 12. Deployment and Workflow

The app deploys as a static site.

Implications:

- no production backend required
- hosting can be any static platform
- Bun is used for package management and developer workflow
- manual publish workflows should be gated by successful CI for the target SHA
- release visibility may include GitHub Deployments metadata where configured

## 13. Current Scope

Included:

- one-page local editor
- demo image
- upload, drop, paste
- hard oversized source rejection
- output cap and auto-size notices
- worker-based local processing
- algorithm registry
- processing recipes
- preset palettes and active custom palette editing
- resize, alpha background, color mode, and preprocessing controls
- commit-on-release slider behavior
- original, processed, and slide compare modes
- Fit and Manual preview viewport
- zoom, pan, and pixel inspector UI state
- screen-sized Fit preview
- PNG, WebP, and JPEG export
- settings JSON copy/paste for processing settings
- Look Snapshot copy/paste and one-shot `#look=<payload>` URL import
- local preference persistence
- dark-first Nothing-inspired UI on top of shared primitives
- deterministic tests across core, web modules, and UI wiring

Explicitly out:

- palette library or named saved palette collection
- custom recipe editor
- general URL state sync beyond one-shot Look Payload import
- multi-page app shell
- free pan/zoom editor
- batch processing
- device-specific output presets
- WebGL/WebGPU rendering pipeline
- vector export
- backend/cloud processing

## 14. Implemented PRD Modules

The current product contract is informed by the implemented feature PRDs in this folder:

- Dither Algorithm Registry
- Editor Settings Transition Module
- Import and Processing Responsiveness
- Editor Runtime Responsiveness
- Slide Before/After Preview
- Slide Compare Preview Module
- Screen-Sized Preview
- Processing Presets
- Export Layer
- Market Impact Roadmap Phase 1 Palette Platform MVP
- Market Impact Roadmap Phase 3 Look Payloads

These feature PRDs are subordinate detail documents. This root PRD should stay aligned with their implemented contracts and with the current code state.

## 15. Roadmap Candidates

Candidates for later releases:

- palette library and named saved palettes
- custom recipe creation
- palette quality refinements such as k-means or perceptual extraction
- additional curated recipes
- additional export formats where they fit the raster model
- richer docs and algorithm comparisons
- light mode polish
- device presets
- CLI or published `@imdither/core`
