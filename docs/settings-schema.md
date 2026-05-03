# Editor Settings Schema

Status: current
Last updated: 2026-05-03

This document is the public reference for IMDITHER Settings JSON. The root PRD
remains the product contract; this file defines the versioned JSON shape that
copy/paste settings uses.

## Contract

Editor Settings describe deterministic image processing only. They do not
include source image bytes, preview state, export preferences, runtime job
status, or UI-only controls.

Current schema version: `4`

```ts
type EditorSettings = {
  schemaVersion: 4;
  algorithm:
    | "none"
    | "bayer"
    | "matt-parker"
    | "floyd-steinberg"
    | "atkinson"
    | "burkes"
    | "stucki"
    | "sierra-lite"
    | "jarvis-judice-ninke"
    | "sierra"
    | "two-row-sierra"
    | "ostromoukhov"
    | "blue-noise"
    | "halftone-dot";
  bayerSize: 2 | 4 | 8;
  paletteId: string;
  customPalette?: string[];
  alphaBackground: "black" | "white";
  colorDepth: { mode: "full" } | { mode: "limit"; count: 2 | 4 | 8 | 16 };
  matchingMode: "rgb" | "perceptual";
  effectStack: Array<{
    instanceId: string;
    kind: "pre" | "quantize" | "dither" | "post";
    enabled: boolean;
    params: Record<string, string | number | boolean>;
  }>;
  resize: {
    mode: "bilinear" | "nearest";
    fit: "contain" | "cover" | "stretch";
    width: number;
    height: number;
  };
  preprocess: {
    brightness: number;
    contrast: number;
    gamma: number;
    invert: boolean;
    colorMode: "grayscale-first" | "color-preserve";
  };
  halftoneScreen: {
    dotShape: "round" | "square" | "line";
    angle: number;
    frequency: number;
    patternSize: 4 | 6 | 8;
  };
};
```

## Included

- `schemaVersion`: literal `4`.
- `algorithm`: one registry-backed dithering algorithm id.
- `bayerSize`: Bayer matrix size used when the selected algorithm supports it.
- `paletteId`: preset palette id, or `custom` when the active settings use a
  custom palette.
- `customPalette`: optional active custom palette colors. Values normalize to
  lowercase 6-digit hex with a leading `#`, must contain 2 to 256 unique colors,
  and do not support alpha.
- `alphaBackground`: background used when transparent pixels must be flattened.
- `colorDepth`: processing palette depth. `full` uses the full active palette;
  `limit` uses the first 2, 4, 8, or 16 colors without mutating the palette.
- `matchingMode`: nearest-color distance mode. `rgb` uses squared distance in
  encoded sRGB channels; `perceptual` uses squared distance in Oklab
  coordinates.
- `effectStack`: serializable ordered processing stages. It includes stable
  Stage Instance Ids, Stage Kinds, enabled state, and plain scalar params. It
  must not include Pixel Buffers, binary data, DOM handles, worker handles, or
  runtime job state.
- `resize`: output dimensions, resize kernel, and fit mode.
- `preprocess`: brightness, contrast, gamma, invert, and color mode.
- `halftoneScreen`: print-like screen parameters used when `algorithm` is
  `halftone-dot`. `angle` is bounded from `0` to `360`; `frequency` is bounded
  from `1` to `100`; `patternSize` is `4`, `6`, or `8`.

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

Palette JSON/GPL export is a palette asset flow, not Settings JSON. Settings
JSON copy/paste may still include `customPalette` so palette-dependent output is
reproducible.

Look Snapshot copy/paste is a separate share flow. A Look Snapshot wraps
normalized Settings JSON in lightweight metadata and transports it as a compact,
gzip-compressed, base64url payload, but it still applies back to Editor Settings
only.

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

Schema version `1` payloads remain accepted and normalize to schema version `4`
with `colorDepth: { mode: "full" }`, `matchingMode: "rgb"`, a compatibility
Effect Stack, and default Halftone Screen settings.

Schema version `2` payloads remain accepted and normalize to schema version `4`
with a compatibility Effect Stack and default Halftone Screen settings.

Schema version `3` payloads remain accepted and normalize to schema version `4`
with default Halftone Screen settings.

Schema version `4` is the current compatibility baseline. Future additive
fields should keep old version `4` payloads valid through default merging when
possible. Any breaking change must introduce a new schema version and a
migration path.
