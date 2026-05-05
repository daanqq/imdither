# Phase 6.2 PRD: Video Intake and WebM Export

Status: implemented
Last updated: 2026-05-05

## Problem Statement

IMDITHER supports GIF and APNG as animated formats. Video files (MP4, WebM, MOV,
MKV, AVI, MPEG-TS) are a much larger class of motion sources but cannot be
imported. Users who want to process video clips for dithering effects must
pre-convert them outside the tool. Video export is also unavailable — users
cannot produce lossy WebM clips from processed frames, which is the standard
format for sharing short motion looks on the web.

## Solution

Add video intake (demux + decode → Frame Sequence with optional Audio Track) and
WebM export (encode processed frames + remux audio → WebM file) through the
existing Frame Sequence contract. Use Mediabunny for demuxing and muxing,
WebCodecs VideoDecoder/VideoEncoder for codec operations, and the existing
Motion Worker for the full intake-and-export pipeline.

## User Stories

1. As a visual maker, I want to import video files (MP4, WebM, MOV, etc.), so
   that I can apply dithering looks to video clips without pre-converting them.
2. As a visual maker, I want imported video audio to survive processing and
   export, so that my processed WebM clips retain their soundtrack.
3. As a visual maker, I want video frames sampled uniformly across the full
   timeline, so that my processed output represents the whole clip rather than
   only the opening seconds.
4. As a visual maker, I want to export processed frames as WebM video with VP9
   encoding, so that I can produce compressed, shareable motion clips from any
   animated source (GIF, APNG, or video intake).
5. As a visual maker, I want a frame cap to prevent long videos from exhausting
   memory, so that the tool stays responsive even with large source files.
6. As a visual maker, I want the same temporal stability and dithering settings
   to apply to video frames, so that motion looks are consistent across all
   animated formats.
7. As a visual maker, I want to control WebM export quality, so that I can
   balance file size against visual fidelity.
8. As a maintainer, I want video intake and export to use the same Frame
   Sequence contract as GIF and APNG, so that motion semantics stay unified
   across all formats.
9. As a maintainer, I want video codec work offloaded to the Motion Worker, so
   that decode and encode do not block the main thread.
10. As a user on a browser without WebCodecs, I want a clear message that video
    features are unavailable, so that I understand the limitation.
11. As a still-image user, I want still export and preview to remain stable, so
    that video support does not destabilize the existing product.

## Implementation Decisions

### Dependency: Mediabunny

- Single dependency for demux (all supported containers) and mux (WebM).
- Pure TypeScript, zero dependencies, tree-shakable (5KB gzipped for WebM-only).
- Supersedes both `mp4-muxer` and `webm-muxer` (deprecated by same author).
- License: MPL-2.0 (file-level copyleft, compatible with project).
- Works in Web Workers.
- Built-in WebCodecs encoder/decoder abstractions for simplified pipeline.

### Frame Cap and Uniform Sampling

Videos can contain hundreds or thousands of frames. A Frame Cap (default 120)
limits decoded frames to prevent memory exhaustion.

Uniform Frame Sampling extracts every Nth frame across the full timeline:

```
step = max(1, ceil(totalFrames / cap))
```

For a 30fps 10s video (300 frames) with cap 120: extract every 3rd frame
(100 frames total). Frame durations (`durationsMs`) are scaled proportionally so
playback speed matches the original duration.

When sampling is needed (step > 1), the Audio Track is dropped because trimmed
video frames would desync from the full-length audio passthrough.

### Audio Track

Video intake preserves the source audio track as an `AudioTrack` on the
Frame Sequence. The audio is stored passthrough (encoded bytes, no
re-encoding). During WebM export, the audio track is remuxed alongside the
processed video frames via the Mediabunny muxer.

Audio is only preserved when all source frames are decoded (no sampling).
When uniform sampling drops frames, the audio track is discarded with a
source notice: "Audio dropped due to frame sampling (clip too long)."

### FrameSequence Extension

```ts
type AudioTrack = {
  codec: string
  data: ArrayBuffer
  sampleRate: number
  numberOfChannels: number
}

type FrameSequence = {
  frames: PixelBuffer[]
  durationsMs: number[]
  loopCount: number
  sourceWidth: number
  sourceHeight: number
  audioTrack?: AudioTrack
}
```

### Intake Pipeline

```
Video File
  → Mediabunny demuxer (extract video coded samples + audio track)
  → WebCodecs VideoDecoder (coded samples → VideoFrame)
  → VideoFrame → canvas → PixelBuffer
  → Uniform Frame Sampling (if needed)
  → FrameSequence { frames, durations, audioTrack? }
  → Per-frame processing (processImage) via Motion Worker
```

### WebM Export Pipeline

```
Processed frames + FrameSequence metadata
  → WebCodecs VideoEncoder (VP9, configured quality)
  → EncodedVideoChunk stream
  → Mediabunny WebM muxer (video track + optional audio track)
  → Uint8Array → Blob("video/webm")
```

All encoding and muxing runs in the Motion Worker. The main thread receives
only the final Blob.

### Motion Worker Protocol Extension

New request types:

```ts
| { type: "process-video"; jobId: number; file: File; settings: EditorSettings }
| { type: "process-and-encode-webm"; jobId: number; frameSequence: FrameSequence; settings: EditorSettings; videoExport: VideoExportSettings }
```

New response type:

```ts
| { type: "webm-blob"; jobId: number; blob: Blob }
```

The `process-video` request decodes the video file, produces a Frame Sequence
(via `decoded` response), then processes frames (via `frame` responses), and
finishes with `complete`.

The `process-and-encode-webm` request takes an already-decoded Frame Sequence,
processes frames, encodes them via VideoEncoder, muxes into WebM, and sends the
Blob back via `webm-blob`.

### Animated Export Format Selector

Export drawer shows format picker when `isAnimated = true`:
- Animated GIF (256-color limit, indexed)
- Animated PNG (RGBA, full-color, lossless)
- WebM Video (VP9, full-color, lossy)

WebM is hidden when `window.VideoEncoder` is undefined with a message:
"WebM requires WebCodecs (Chrome 94+, Firefox 130+, Safari 16.4+)".

### Video Export Settings

New transient state:

```ts
type AnimatedExportFormat = "gif" | "apng" | "webm"

type VideoExportSettings = {
  crf: number  // VP9 CRF 0-63, default 30
}
```

CRF slider in export drawer: 0 (best) to 63 (worst), default 30. Lower values
produce larger files.

### WebCodecs Gate

At app startup: `typeof VideoEncoder !== "undefined"`. Result stored as React
state `webCodecsAvailable`. Used to:
- Hide WebM from animated format selector when unavailable
- Reject video file intake with a clear error message
- Disable video-related UI with a fallback label

### Video File Detection

Accepted MIME types and extensions:
- `video/mp4`, `.mp4`, `.m4v`
- `video/webm`, `.webm`
- `video/quicktime`, `.mov`
- `video/x-matroska`, `.mkv`
- `video/x-msvideo`, `.avi`
- `video/mpeg`, `.mpeg`, `.mpg`
- `video/mp2t`, `.ts`

Detection in `handleFile` runs before still/GIF logic. Video files are routed
to `handleAnimatedFile` with format `"video"`.

### Modules

| Module | Purpose |
|--------|---------|
| `video-intake.ts` | `decodeVideoToFrameSequence(file, cap)` using Mediabunny + WebCodecs |
| `video-intake.test.ts` | Contract tests for video decode and sampling |
| `webm-export.ts` | `encodeFrameSequenceToWebM(fs, settings, audioTrack?)` using Mediabunny + VideoEncoder |
| `webm-export.test.ts` | Contract tests for WebM encode and audio remux |
| `motion-types.ts` (modify) | Add `AnimatedExportFormat`, `VideoExportSettings` |
| `motion-protocol.ts` (modify) | Add `process-video`, `process-and-encode-webm`, `webm-blob` types |
| `motion.worker.ts` (modify) | Handle video intake pipeline and WebM encode pipeline |
| `motion-worker-client.ts` (modify) | Expose `runMotionVideoJob()`, `runMotionWebMEncodeJob()` |
| `export-motion.ts` (modify) | `exportWebMSequence()`, dispatch GIF/APNG/WebM |
| `export-drawer-content.tsx` (modify) | Animated format selector with WebM, CRF slider |
| `preview-stage.tsx` (modify) | Pass animated format and WebCodecs gate down |
| `App.tsx` (modify) | WebCodecs detection, video file routing, WebM export path |
| `types.ts` (core, modify) | Add `AudioTrack` type |

### System Context Diagram

```
handleFile(file)
  ├── video type/ext → handleAnimatedFile(file, "video")
  ├── image/gif → handleAnimatedFile(file, "gif")
  ├── image/png + acTL → handleAnimatedFile(file, "apng")
  └── else → executeSourceLoadCommand (still)

handleAnimatedFile(animatedFile, format)
  ├── GIF:  runMotionGifJob → worker decodes → process frames
  ├── APNG: runMotionApngJob → worker decodes → process frames
  └── Video: runMotionVideoJob → worker demux/decode/sample → process frames

handleExport()
  ├── "gif"  → exportGifSequence → gifenc
  ├── "apng" → exportApngSequence → fast-png
  └── "webm" → exportWebMSequence → Mediabunny + WebCodecs (in worker)
```

## Testing Decisions

- Video intake tests cover: valid MP4/WebM decode to FrameSequence, uniform
  sampling with correct step calculation, frame cap enforcement, audio track
  preservation, audio track drop on sampling, unsupported codec errors, empty
  files.
- WebM export tests cover: FrameSequence to WebM bytes round-trip via
  Mediabunny, CRF quality propagation, audio remux into WebM container, encoder
  unavailable fallback, encoder failure handling.
- Motion worker tests cover: `process-video` request routing, `process-and-
  encode-webm` request routing, cancel during decode, cancel during encode,
  worker error recovery, Blob transfer back to main thread.
- WebCodecs gate tests cover: feature detection with VideoEncoder
  available/unavailable, animated format selector hides/shows WebM, video file
  rejection when gate is closed.
- Export drawer tests cover: animated format selector with three options, CRF
  slider visible for WebM only, format switch resets quality slider, frame
  duration and loop count visible for GIF and APNG but loop count hidden for
  WebM.
- Regression: all existing still-image export tests pass unchanged. GIF and APNG
  motion tests pass unchanged. Frame Strip controls unchanged.
- Prior art: `gif-motion.test.ts` for intake contract shape,
  `export-motion.test.ts` for export encoder boundary mocking,
  `motion-worker-client.test.ts` for worker job lifecycle mocking.

## Out of Scope

- Audio re-encoding or manipulation. Audio is passthrough only.
- Audio trimming to match sampled frame timeline.
- Streaming video intake (decode on demand). All frames are decoded upfront
  up to the frame cap.
- MP4/H.264 export. Only WebM/VP9 as the first video export target.
- Frame-by-frame video preview scrubbing for long clips (current Frame Strip
  controls handle up to N frames without pagination).
- Video source dimensions exceeding MAX_SOURCE_DIMENSION (4096). Oversized
  videos are rejected during intake.
- Batch or CLI video processing.
- GPU or WASM acceleration for video encode/decode (WebCodecs is hardware-
  accelerated by the browser when available).

## Further Notes

This PRD is part of Phase 6 Motion Pipeline. Video intake and export sit
alongside GIF and APNG behind narrow format adapters, sharing the Frame
Sequence contract and Editor Settings processing pipeline.

WebCodecs availability gates all video features. When the gate is closed, the
tool behaves exactly as before — GIF and APNG remain fully functional.

## Post‑Implementation Deviations

### Mediabunny removed from intake pipeline
`video-intake.ts` uses `<video>` element + `OffscreenCanvas` for frame
extraction instead of Mediabunny demuxer. Reason: Mediabunny's internal
EBML/Matroska modules caused a top‑level runtime error
(`SeekHead` property access on undefined enum) when bundled through Vite's
worker code‑splitting. The `<video>` approach is simpler, requires no third‑party
dependency, and works in all browsers.

Mediabunny remains in use for **WebM export** (`webm-export.ts`), where only
the muxer (`EncodedVideoPacketSource` + `Output` + `BufferTarget` + `WebMOutputFormat`)
is imported — no EBML/Matroska demuxer code is loaded.

### Video intake runs in main thread, not Worker
Video intake (`decodeVideoToFrameSequence`) accesses DOM APIs
(`HTMLVideoElement`, `document.createElement('canvas')`), so it runs in the
main thread, not in the Motion Worker. After intake, the resulting
`FrameSequence` is sent to the Worker for dithering via the existing
`process-frame-sequence` protocol — same as GIF/APNG.

### No audio passthrough
The `<video>` element pipeline does not preserve the source audio track.
Audio passthrough requires Mediabunny demuxer which was removed. WebM exports
produced by `encodeFrameSequenceToWebM` do not include an audio track.

### Frame sampling via `<video>.currentTime seek`
Instead of uniform frame sampling from encoded packet count, video intake
estimates frame rate at 30 fps and seeks to `(frameIndex / 30)` on the
`<video>` element. Frame count is capped at 120.

### WebM export quality
CRF (0–63) maps to a bitrate multiplier per resolution tier.
`VideoEncoderConfig.bitrateMode` is set to `"variable"`. VP9 is always
lossy — for lossless animated output use APNG export.

## Out of Scope (unchanged from original PRD)

- Audio re-encoding or manipulation.
- Audio trimming to match sampled frame timeline.
- Streaming video intake (decode on demand).
- MP4/H.264 export. Only WebM/VP9 as the first video export target.
- Frame-by-frame video preview scrubbing for long clips.
- Video source dimensions exceeding MAX_SOURCE_DIMENSION (4096).
- Batch or CLI video processing.
- GPU or WASM acceleration for video encode/decode.
