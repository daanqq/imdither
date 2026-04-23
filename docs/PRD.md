# IMDITHER PRD

Status: draft v1
Last updated: 2026-04-24

## 1. Product Summary

IMDITHER is an open source web application for local image dithering. The product is built as a browser-first, single-page workstation for creative image processing and retro/palette-based output.

Primary value:
- upload an image
- resize and prepare tones
- choose a palette and dithering algorithm
- compare original vs processed output
- export the result as PNG

The first release is optimized for desktop, remains usable on mobile, and performs all processing locally in the browser without sending user images to a server.

## 2. Goals

- Ship a fast, deterministic, testable dithering editor for one image at a time.
- Make dithering understandable enough for practical use without turning the UI into a tutorial.
- Separate the image-processing engine from the web UI so the core can later be reused as an OSS package.
- Establish a distinctive dark-first, Nothing-inspired interface with strong typography and high information density.

## 3. Non-Goals for v1

- No backend image processing.
- No account system, cloud sync, or remote storage.
- No custom palette editor in v1.
- No automatic palette extraction in v1.
- No undo/redo history stack.
- No URL state sharing.
- No router or multi-page product shell.
- No WebGL/WebGPU pipeline in v1.
- No hardware-accurate device emulation presets in v1.
- No JPEG or SVG export.

## 4. Target Users

- Designers and artists making retro, monochrome, or limited-palette imagery.
- Developers and makers preparing visuals for experimental interfaces, pixel-art workflows, or generative tools.
- OSS users who want transparent algorithms and reproducible results.

## 5. Core Jobs To Be Done

- "I want to quickly turn a source image into a dithered image with a controlled visual character."
- "I want to compare algorithms and palettes without leaving the editor."
- "I want reproducible output and shareable settings."
- "I want the tool to feel local, responsive, and private."

## 6. Product Principles

- Local first: image processing runs in the browser.
- Deterministic output: the same input and settings produce the same result.
- Editor first: immediate visual feedback matters more than workflow ceremony.
- Engine/UI separation: processing code must stay reusable outside React.
- Restraint in UI: the interface should feel precise, not overloaded.

## 7. How Dithering Works in IMDITHER

At a high level:
1. Decode the input image.
2. Flatten transparency onto a chosen background color.
3. Crop or fit the image to the desired frame.
4. Resize the image to the intended output dimensions.
5. Apply preprocessing such as brightness, contrast, gamma, invert, and optional grayscale-first conversion.
6. Map pixels to the nearest color in the selected palette.
7. Apply the chosen dithering strategy.
8. Render a preview and export the final PNG.

Supported dithering families in v1:
- No dithering: direct palette quantization.
- Ordered dithering: Bayer matrices.
- Error diffusion: Floyd-Steinberg and Atkinson.

## 8. Functional Requirements

### 8.1 Input

The app must support:
- drag and drop
- file picker
- paste image from clipboard
- one bundled demo image

The app must not support remote URL import in v1.

### 8.2 Image Limits

To keep processing predictable in the browser, v1 should enforce reasonable limits:
- maximum source dimension: 4096px
- maximum processed pixel count: target range 8-12 MP

Oversized images should trigger an explicit auto-downscale path with user-facing messaging.

### 8.3 Pipeline Stages

The processing pipeline must support:
- alpha flattening to black or white
- crop/fit handling
- resizing
- preprocessing
- palette mapping
- dithering

The pipeline must use a light stage cache keyed by relevant setting subsets:
- decoded source
- flattened source
- resized image
- preprocessed image

### 8.4 Algorithms

v1 algorithms:
- `none`
- `bayer` with matrix sizes `2x2`, `4x4`, `8x8`
- `floyd-steinberg`
- `atkinson`

Rules:
- default Bayer size: `4x4`
- error diffusion scan mode: serpentine, internal only
- algorithms remain deterministic
- no seeded randomness in v1

### 8.5 Palettes

v1 supports preset palettes only.

Examples:
- black and white
- 4 gray
- Game Boy-inspired
- amber terminal
- limited creative multi-color sets

Architectural requirement:
- the engine must be palette-agnostic and accept an arbitrary palette array
- the settings model must already allow a future `customPalette` field

### 8.6 Color Modes

v1 supports:
- `grayscale-first`
- `color-preserve`

Presets may define a default color mode, but the user can override it.

### 8.7 Resize

v1 resize modes:
- `bilinear` as default
- `nearest` as optional

Resize always happens before dithering.

### 8.8 Preprocessing

v1 preprocessing controls:
- brightness
- contrast
- gamma
- invert
- grayscale-first toggle

UI hierarchy:
- basic controls shown by default
- advanced controls collapsed by default

### 8.9 Preview and Compare

v1 preview requirements:
- original view
- processed view
- split comparison
- `fit`
- `1:1`

Interaction requirements:
- preview updates live
- UI debounces worker requests
- stale jobs are canceled
- preview may use reduced working resolution if needed
- export always runs at the full selected output resolution

### 8.10 Export and Persistence

v1 output:
- PNG export as primary action
- settings JSON import/export as secondary action

Persistence:
- save lightweight editor preferences to localStorage
- do not persist source images in localStorage

Persisted items:
- last used settings
- selected theme
- compare mode
- last chosen preset palette

### 8.11 Metadata

The UI should expose concise technical metadata:
- source dimensions
- output dimensions
- palette size
- algorithm name
- last processing time
- export format

This metadata is informational, not a dashboard.

### 8.12 Accessibility

Baseline accessibility for v1:
- keyboard-accessible controls
- visible focus states
- semantic labels and aria support
- sufficient contrast
- reduced-motion support
- no canvas-only critical information without text mirrors

## 9. Experience and Interface

### 9.1 Layout

IMDITHER v1 is a single-screen workstation, not a step-by-step wizard.

High-level layout:
- primary: preview area
- secondary: control panel
- tertiary: metadata and utility strip

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

Light mode should exist later as a first-class theme, but dark mode is the initial priority.

### 9.3 UI Foundation

The project will use `shadcn/ui` for accessible primitives and composition patterns.

Important constraint:
- `shadcn/ui` is a structural foundation, not the final visual language
- components must be restyled to match IMDITHER tokens and the Nothing-inspired system
- default shadcn appearance must not define the product identity

Planned usage:
- shared primitives live in `packages/ui`
- the web app consumes them from `apps/web`
- accessibility and interaction behavior come from the primitive layer
- brand expression comes from custom tokens, spacing, typography, and composition

## 10. Technical Architecture

### 10.1 Repository Structure

The project uses a workspace layout:
- `apps/web`: Vite + React application
- `packages/core`: image-processing engine
- `packages/ui`: shared UI primitives and tokens

### 10.2 Processing Core

`packages/core` must remain independent from DOM-specific APIs.

Core buffer format:

```ts
type PixelBuffer = {
  width: number
  height: number
  data: Uint8ClampedArray
}
```

Boundary adapters may convert to and from `ImageData`, but internal processing should operate on `PixelBuffer`.

### 10.3 Core API Shape

Two layers are required.

Low-level stage functions:
- `flattenAlpha`
- `resizeImage`
- `applyPreprocess`
- `mapToPalette`
- `ditherOrdered`
- `ditherFloydSteinberg`
- `ditherAtkinson`

High-level orchestration:
- `processImage(input, settings)`

### 10.4 Worker Model

The processing engine must run behind a dedicated Web Worker.

Requirements:
- typed message protocol
- cancel stale jobs
- keep large buffers out of the global Zustand store
- keep UI responsive during resize and dithering

### 10.5 State Management

The app uses `zustand`, but narrowly.

Zustand stores:
- editor settings
- theme
- session metadata
- job status
- UI mode
- errors

Zustand must not become the home for large binary buffers.

### 10.6 Settings Schema

Editor settings and exported JSON presets must be versioned from day one.

Example shape:

```ts
type EditorSettings = {
  schemaVersion: 1
  algorithm: "none" | "bayer" | "floyd-steinberg" | "atkinson"
  paletteId: string
  customPalette?: string[]
  resize: {
    mode: "bilinear" | "nearest"
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

## 11. Testing Strategy

Tooling:
- `Vitest` for unit and component tests
- `Playwright` for end-to-end tests

Test layers:
- unit tests for pixel math, palette mapping, preprocessing, and kernels
- golden tests for deterministic core output on small fixtures
- component tests for editor state and interaction logic
- 1-2 end-to-end happy-path tests

Golden strategy:
- exact matching for deterministic pure pipeline output
- tolerant visual checks or smoke coverage for browser-level snapshots

## 12. Deployment

v1 is deployed as a static site.

Implications:
- no production backend required
- hosting can be any static platform
- Bun is used for package management and local developer workflow, not as a required production server

## 13. MVP-1 Scope

Included in MVP-1:
- one-page editor
- demo image
- upload, drop, paste
- local worker-based processing
- preset palettes
- algorithms: none, Bayer, Floyd-Steinberg, Atkinson
- resize and preprocessing controls
- compare modes
- PNG export
- settings JSON import/export
- local preference persistence
- dark-first Nothing-inspired UI
- deterministic tests across core and UI wiring

Explicitly out of MVP-1:
- custom palette editor
- auto-palette extraction
- undo/redo
- URL share state
- multi-page app shell
- free pan/zoom editor
- device-specific output presets
- WebGL/WebGPU rendering pipeline
- JPEG and SVG export

## 14. Implementation Plan

### Phase 1: Foundation

- finalize workspace structure: `apps/web`, `packages/core`, `packages/ui`
- keep `shadcn/ui` as the primitive/component foundation in `packages/ui`
- replace template visual tokens with IMDITHER brand tokens
- add fonts and theme wiring
- define `EditorSettings` schema and Zod validation
- set up Zustand slices for editor/session state

### Phase 2: Core Engine

- create `PixelBuffer` and boundary adapters
- implement flatten, resize, preprocess, palette mapping
- implement `none`, `bayer`, `floyd-steinberg`, `atkinson`
- add stage cache
- expose `processImage()`

### Phase 3: Worker and App Wiring

- define typed worker protocol
- wire live preview with debounce and cancelation
- keep binary buffers out of Zustand
- connect preview rendering and metadata

### Phase 4: Editor UI

- build upload/empty state/demo flow
- build compare modes and view controls
- build basic and advanced control groups
- build export and settings actions
- restyle shared primitives into the final IMDITHER interface

### Phase 5: Tests and Docs

- unit and golden coverage for `packages/core`
- component tests for editor wiring
- Playwright smoke flows
- OSS-friendly README and algorithm docs

### Phase 6: Release Preparation

- static deployment config
- performance pass on large images
- fixture review
- license and contribution docs

## 15. Post-v1 Roadmap

Candidates for later releases:
- custom palette editor
- auto-palette extraction
- additional diffusion kernels
- light mode parity
- device presets
- CLI or published `@imdither/core`
- richer docs and algorithm comparisons
