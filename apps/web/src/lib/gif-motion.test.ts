import { describe, expect, it } from "vitest"
import {
  DEFAULT_SETTINGS,
  PRESET_PALETTES,
  processImage,
  type FrameSequence,
  type Palette,
} from "@workspace/core"
import { decodeGifToFrameSequence } from "./gif-intake"
import { encodeFrameSequenceToGif } from "./gif-export"

function createTestFrameSequence(): FrameSequence {
  const width = 2
  const height = 2

  const frame1 = new Uint8ClampedArray(width * height * 4)
  frame1.set([
    0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255,
  ])

  const frame2 = new Uint8ClampedArray(width * height * 4)
  frame2.set([
    255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255,
  ])

  return {
    frames: [
      { width, height, data: frame1 },
      { width, height, data: frame2 },
    ],
    durationsMs: [100, 200],
    loopCount: 0,
    sourceWidth: width,
    sourceHeight: height,
  }
}

describe("GIF round-trip contract", () => {
  it("encodes and decodes a frame sequence preserving dimensions and frame count", () => {
    const original = createTestFrameSequence()
    const palette = PRESET_PALETTES[0]
    const gifBytes = encodeFrameSequenceToGif(original, palette)
    const gifBuffer = gifBytes.buffer.slice(
      gifBytes.byteOffset,
      gifBytes.byteOffset + gifBytes.byteLength
    ) as ArrayBuffer

    const decoded = decodeGifToFrameSequence(gifBuffer)

    expect(decoded.frames).toHaveLength(2)
    expect(decoded.sourceWidth).toBe(2)
    expect(decoded.sourceHeight).toBe(2)
    expect(decoded.loopCount).toBe(0)
  })

  it("preserves duration metadata through encode-decode", () => {
    const original = createTestFrameSequence()
    const palette = PRESET_PALETTES[0]
    const gifBytes = encodeFrameSequenceToGif(original, palette)
    const gifBuffer = gifBytes.buffer.slice(
      gifBytes.byteOffset,
      gifBytes.byteOffset + gifBytes.byteLength
    ) as ArrayBuffer

    const decoded = decodeGifToFrameSequence(gifBuffer)

    expect(decoded.durationsMs).toHaveLength(2)
    // gifuct-js returns delay already in milliseconds
    for (let i = 0; i < decoded.durationsMs.length; i += 1) {
      const decodedMs = decoded.durationsMs[i]
      const originalMs = original.durationsMs[i]
      // tolerate centisecond rounding
      expect(Math.abs(decodedMs - originalMs)).toBeLessThanOrEqual(10)
    }
  })

  it("rejects palette with more than 256 colors for GIF export", () => {
    const frameSequence = createTestFrameSequence()
    const largePalette: Palette = {
      id: "large",
      name: "Large",
      colors: Array.from({ length: 257 }, (_, i) => ({
        name: `c${i}`,
        hex: `#${i.toString(16).padStart(2, "0").repeat(3)}`,
        rgb: [i % 256, i % 256, i % 256] as const,
      })),
      defaultColorMode: "color-preserve",
    }

    expect(() => encodeFrameSequenceToGif(frameSequence, largePalette)).toThrow(
      "256"
    )
  })

  it("processes decoded frames through the still-image pipeline", () => {
    const palette = PRESET_PALETTES[0]
    const frameSequence = createTestFrameSequence()
    const gifBytes = encodeFrameSequenceToGif(frameSequence, palette)
    const gifBuffer = gifBytes.buffer.slice(
      gifBytes.byteOffset,
      gifBytes.byteOffset + gifBytes.byteLength
    ) as ArrayBuffer

    const decoded = decodeGifToFrameSequence(gifBuffer)

    for (const frame of decoded.frames) {
      const result = processImage(frame, {
        ...DEFAULT_SETTINGS,
        algorithm: "none",
        paletteId: palette.id,
        resize: {
          ...DEFAULT_SETTINGS.resize,
          width: frame.width,
          height: frame.height,
          mode: "nearest",
          fit: "stretch",
        },
      })

      expect(result.image.width).toBe(frame.width)
      expect(result.image.height).toBe(frame.height)
      expect(result.metadata.paletteSize).toBeLessThanOrEqual(
        palette.colors.length
      )
    }
  })
})
