# Editor Settings Schema

Status: current
Last updated: 2026-04-26

This document is the public reference for IMDITHER Settings JSON. The root PRD
remains the product contract; this file defines the versioned JSON shape that
copy/paste settings uses.

## Contract

Editor Settings describe deterministic image processing only. They do not
include source image bytes, preview state, export preferences, runtime job
status, or UI-only controls.

Current schema version: `1`

```ts
type EditorSettings = {
  schemaVersion: 1
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

## Included

- `schemaVersion`: literal `1`.
- `algorithm`: one registry-backed dithering algorithm id.
- `bayerSize`: Bayer matrix size used when the selected algorithm supports it.
- `paletteId`: preset palette id, or the palette identity used by the current
  settings.
- `customPalette`: optional hex colors for schema-level custom palette support.
- `alphaBackground`: background used when transparent pixels must be flattened.
- `resize`: output dimensions, resize kernel, and fit mode.
- `preprocess`: brightness, contrast, gamma, invert, and color mode.

## Excluded

- source image data or source file name
- processing recipe id
- compare mode
- slide divider position
- view scale
- preview target dimensions
- runtime job status
- processing metadata
- export format
- export quality
- theme and other UI preferences

Processing Presets are applied recipes. The active recipe is derived from the
current settings and is never persisted as a second settings model.

Export format and export quality are browser encoding preferences. They are
persisted separately by the web app and are excluded from Settings JSON so the
same processing settings remain reproducible across PNG, WebP, and JPEG export.

## Normalization

Pasted settings are merged with current defaults before validation. This means
partial settings may be accepted when the missing fields have valid defaults.

Invalid settings are rejected instead of forcing the editor into an unsupported
state. Examples include unknown algorithm ids, unsupported Bayer sizes, invalid
hex colors, output dimensions outside the supported range, or preprocessing
values outside their documented bounds.

Unknown object properties are not part of the public contract. They are ignored
by normalization and must not be relied on for persistence.

## Compatibility

Schema version `1` is the compatibility baseline. Future additive fields should
keep old version `1` payloads valid through default merging when possible. Any
breaking change must introduce a new schema version and a migration path.
