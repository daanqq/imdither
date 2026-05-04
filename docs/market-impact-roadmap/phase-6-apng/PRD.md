# Phase 6.1 PRD: APNG Intake and Export

Status: planned
Last updated: 2026-05-04

## Problem Statement

IMDITHER supports GIF as the only animated format for intake and export. Users who
work with animated PNG assets cannot import them, and users who want higher-
fidelity animated output are limited to GIF's 256-color palette constraint. APNG
provides 24-bit RGBA per frame with better compression, and is supported across
all modern browsers.

## Solution

Add APNG intake (decode APNG files into Frame Sequence) and APNG export (encode
processed frames into APNG files) through the existing Frame Sequence contract.
Use `fast-png` as the single dependency for both decode and encode, keeping the
library behind a narrow adapter boundary.

## User Stories

1. As a visual maker, I want to import APNG files, so that I can process
   animated PNGs with the same Editor Settings used for GIFs and still images.
2. As a visual maker, I want to export processed frames as APNG, so that I can
   produce full-color animated output without GIF's 256-color limit.
3. As a visual maker, I want to choose between GIF and APNG export per session,
   so that I can target the appropriate format for different use cases.
4. As a visual maker, I want APNG export to use the same processing pipeline
   (palette matching, dithering, temporal stability) as GIF export, so that
   looks are consistent across formats.
5. As a maintainer, I want APNG intake and export to share the same Frame
   Sequence contract as GIF, so that motion semantics stay unified.
6. As a maintainer, I want APNG support through a single third-party library
   behind a narrow adapter, so that migration to a different library or browser
   API is cheap.
7. As a still-image user, I want ordinary PNG files to remain routed through the
   still pipeline, so that APNG support does not slow down or destabilize still
   image processing.

## Implementation Decisions

- Use `fast-png` for both APNG decode (intake) and APNG encode (export). One
  dependency covers both directions.
- Add `process-apng` request type to the motion worker protocol, mirroring the
  existing `process-gif` pattern.
- Detect APNG by reading the acTL chunk from the file header before dispatch.
  Ordinary PNG files without acTL continue through the still pipeline unchanged.
- Process APNG frames through the same `processImage` pipeline as GIF frames:
  palette matching, dithering, and temporal stability all apply. Only the final
  encoder step differs — APNG writes RGBA directly without GIF's indexed
  `applyPalette()` step.
- APNG export encoder takes `(frameSequence: FrameSequence) => Uint8Array`
  without a Palette parameter.
- Animated export format selection is transient per session. It defaults to GIF
  and is not persisted.
- Single-frame APNG files route through the animated path. The frame strip hides
  controls when `frameCount <= 1`.
- APNG files are accepted via upload, drop, and clipboard paste, same as GIF.

### Modules

| Module | Purpose |
|--------|---------|
| `apng-intake.ts` | `decodeApngToFrameSequence(buf)` using `fast-png` |
| `apng-export.ts` | `encodeFrameSequenceToApng(fs)` using `fast-png` |
| `apng-intake-detect.ts` | `hasAcTlChunk(file)` via header byte inspection |
| `motion-protocol.ts` (modify) | Add `process-apng` request type |
| `motion.worker.ts` (modify) | Handle `process-apng` requests |
| `motion-worker-client.ts` (modify) | Expose `runMotionApngJob()` |
| `export-motion.ts` (modify) | `exportApngSequence()`, dispatch GIF vs APNG |
| `export-drawer-content.tsx` (modify) | Animated format selector |
| `preview-stage.tsx` (modify) | Pass animated format down |
| `App.tsx` (modify) | acTL detection, APNG routing, APNG export path |

### Animated Export Format

```ts
type AnimatedExportFormat = "gif" | "apng"
```

- Default `"gif"` for backward compatibility.
- Transient — stored as React state in App.tsx, excluded from persisted store.
- Export drawer shows dropdown when `isAnimated=true`.

### acTL Detection Contract

```ts
function hasAcTlChunk(file: File): Promise<boolean>
```

Reads the first ~64 bytes of the file, scans for an `acTL` chunk signature after
the PNG header and IHDR. Returns `true` if found, `false` otherwise. Fails open:
I/O errors return `false` and fall through to still pipeline.

### System Context Diagram

```
handleFile(file)
  ├── file.type === "image/gif" → handleAnimatedFile(GIF)
  ├── hasAcTlChunk(file) === true → handleAnimatedFile(APNG)
  └── else → executeSourceLoadCommand (still)

handleAnimatedFile(animatedFile)
  ├── GIF:  runMotionGifJob  → worker decodes → FrameSequence → process frames
  └── APNG: runMotionApngJob → worker decodes → FrameSequence → process frames

handleExport()
  ├── isAnimated && format === "gif"  → exportGifSequence  → gifenc
  └── isAnimated && format === "apng" → exportApngSequence → fast-png
```

## Testing Decisions

- APNG intake tests cover: valid APNG decode to FrameSequence, single-frame
  APNG, APNG with non-standard color types, empty or malformed files.
- acTL detection tests cover: APNG with acTL returns true, ordinary PNG without
  acTL returns false, truncated file returns false.
- APNG export tests cover: FrameSequence to APNG bytes round-trip via fast-png,
  timing metadata preservation, single-frame export, encoder failure.
- Motion worker tests cover: `process-apng` request routing, cancel during
  decode, cancel during frame processing, worker error recovery.
- Export drawer tests cover: animated format selector renders when animated,
  GIF/APNG switch toggles encoder, frame duration and loop controls visible for
  both formats.
- Regression: all existing still-image export tests pass unchanged. GIF motion
  export tests pass unchanged. `export-action-application.test.ts` passes
  unchanged.
- Prior art: `gif-motion.test.ts` for intake contract shape,
  `export-image.test.ts` for encoder boundary mocking.

## Out of Scope

- WebM or video export via WebCodecs.
- APNG playback via native `<img>` — preview uses the existing canvas-based
  frame rendering.
- Persistence of Animated Export Format preference.
- Palette-based APNG encoding (indexed APNG). All APNG output is 24-bit RGBA.
- Batch or CLI APNG processing.

## Further Notes

This PRD is part of Phase 6 Motion Pipeline. The GIF path (gifuct-js +
gifenc) and APNG path (fast-png) coexist behind narrow adapters as required by
the Phase 6 PRD's third-party evaluation criteria. If fast-png is later replaced
by a browser API, only the adapter modules need to change.
