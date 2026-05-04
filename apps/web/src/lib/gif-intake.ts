import { parseGIF, decompressFrames, type ParsedFrame } from "gifuct-js"
import type { FrameSequence } from "@workspace/core"

export function decodeGifToFrameSequence(buffer: ArrayBuffer): FrameSequence {
  const parsed = parseGIF(buffer)
  // @ts-expect-error gifuct-js types are outdated — decompressFrames works with ParsedGIF
  const frames: ParsedFrame[] = decompressFrames(parsed, true)
  const loopCount = extractLoopCount(parsed)

  if (frames.length === 0) {
    throw new Error("GIF contains no frames")
  }

  const sourceWidth = parsed.lsd.width
  const sourceHeight = parsed.lsd.height

  // gifuct-js decodes each frame's sub-rectangle into `patch`.
  // We must manually compose full frames using disposal/blend.
  // Disposal types: 0=none, 1=do-not-dispose, 2=restore-to-background,
  // 3=restore-to-previous. We treat 0/1 the same (keep) and 2 (clear to
  // black). Type 3 is not implemented by gifuct-js and is rare.
  const backgroundIndex = parsed.lsd.backgroundColorIndex
  const bgColor = gctColor(parsed.gct, backgroundIndex)

  const pixelBuffers = composeFullFrames(
    frames,
    sourceWidth,
    sourceHeight,
    bgColor
  )
  const durationsMs = frames.map((frame) => frame.delay)

  return {
    frames: pixelBuffers,
    durationsMs,
    loopCount,
    sourceWidth,
    sourceHeight,
  }
}

function composeFullFrames(
  frames: ParsedFrame[],
  fullWidth: number,
  fullHeight: number,
  bgColor: [number, number, number, number]
) {
  const fullSize = fullWidth * fullHeight * 4
  const canvas = new Uint8ClampedArray(fullSize)

  // Fill canvas with black (fully transparent or opaque depending on bg)
  for (let i = 0; i < fullSize; i += 4) {
    canvas[i] = bgColor[0]
    canvas[i + 1] = bgColor[1]
    canvas[i + 2] = bgColor[2]
    canvas[i + 3] = bgColor[3]
  }

  const results = []

  for (const frame of frames) {
    const { left, top, width, height } = frame.dims

    // Apply patch pixels onto canvas
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcOffset = (y * width + x) * 4
        const alpha = frame.patch[srcOffset + 3]

        if (alpha === 0) {
          continue // transparent — keep canvas pixel
        }

        const dstOffset = ((top + y) * fullWidth + (left + x)) * 4
        canvas[dstOffset] = frame.patch[srcOffset]
        canvas[dstOffset + 1] = frame.patch[srcOffset + 1]
        canvas[dstOffset + 2] = frame.patch[srcOffset + 2]
        canvas[dstOffset + 3] = 255
      }
    }

    // Snapshot composed frame
    const snapshot = new Uint8ClampedArray(canvas)
    results.push({ width: fullWidth, height: fullHeight, data: snapshot })

    // Apply disposal for next frame
    switch (frame.disposalType) {
      case 0: // unspecified — keep
      case 1: // do-not-dispose — keep
        break
      case 2: // restore-to-background — clear to bg
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const offset = ((top + y) * fullWidth + (left + x)) * 4
            canvas[offset] = bgColor[0]
            canvas[offset + 1] = bgColor[1]
            canvas[offset + 2] = bgColor[2]
            canvas[offset + 3] = bgColor[3]
          }
        }
        break
      case 3: // restore-to-previous — not fully supported, treat as keep
        break
      default:
        break
    }
  }

  return results
}

function gctColor(
  gct: [number, number, number][],
  index: number
): [number, number, number, number] {
  if (index >= 0 && index < gct.length) {
    const [r, g, b] = gct[index] ?? [0, 0, 0]

    return [r, g, b, 255]
  }

  return [0, 0, 0, 255]
}

function extractLoopCount(parsed: ReturnType<typeof parseGIF>): number {
  for (const frame of parsed.frames) {
    if (
      "application" in frame &&
      frame.application.id === "NETSCAPE2.0" &&
      frame.application.blocks.length >= 3
    ) {
      return frame.application.blocks[1] + (frame.application.blocks[2] << 8)
    }
  }

  return 0
}
