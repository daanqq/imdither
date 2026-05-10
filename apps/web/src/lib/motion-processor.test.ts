import { describe, expect, it } from "vitest"
import {
  DEFAULT_SETTINGS,
  PRESET_PALETTES,
  processImage,
  type FrameSequence,
} from "@workspace/core"
import { decodeGifToFrameSequence } from "./gif-intake"
import { encodeFrameSequenceToGif } from "./gif-export"
import { processFrameSequence } from "./motion-processor"

describe("motion frame processor", () => {
  it("produces identical output for identical frames (deterministic processing)", async () => {
    const w = 4
    const h = 4
    const data = new Uint8ClampedArray(w * h * 4)

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const index = (y * w + x) * 4
        const value = x * 56 + y * 24

        data[index] = value
        data[index + 1] = value
        data[index + 2] = value
        data[index + 3] = 255
      }
    }

    const frameSequence: FrameSequence = {
      frames: [
        { width: w, height: h, data },
        { width: w, height: h, data },
      ],
      durationsMs: [100, 100],
      loopCount: 0,
      sourceWidth: w,
      sourceHeight: h,
    }

    const palette = PRESET_PALETTES[0]
    const settings = {
      ...DEFAULT_SETTINGS,
      algorithm: "floyd-steinberg" as const,
      paletteId: palette.id,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: w,
        height: h,
        mode: "nearest" as const,
        fit: "stretch" as const,
      },
    }

    const processed = await processFrameSequence(frameSequence, settings)

    expect(processed).toHaveLength(2)
    expect(Array.from(processed[0].image.data)).toEqual(
      Array.from(processed[1].image.data)
    )
  })

  it("processes each frame with the same EditorSettings", async () => {
    const palette = PRESET_PALETTES[0]
    const frameSequence = createTestFrameSequence()
    const settings = {
      ...DEFAULT_SETTINGS,
      algorithm: "floyd-steinberg" as const,
      paletteId: palette.id,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: frameSequence.sourceWidth,
        height: frameSequence.sourceHeight,
        mode: "nearest" as const,
        fit: "stretch" as const,
      },
    }
    const gifBytes = encodeFrameSequenceToGif(frameSequence, palette)
    const gifBuffer = gifBytes.buffer.slice(
      gifBytes.byteOffset,
      gifBytes.byteOffset + gifBytes.byteLength
    ) as ArrayBuffer

    const decoded = decodeGifToFrameSequence(gifBuffer)
    const processed = await processFrameSequence(decoded, settings)

    expect(processed).toHaveLength(decoded.frames.length)

    // Verify each frame was processed by comparing against direct processImage calls
    for (let i = 0; i < processed.length; i += 1) {
      const direct = processImage(decoded.frames[i], settings)
      expect(processed[i].frameIndex).toBe(i)
      expect(Array.from(processed[i].image.data)).toEqual(
        Array.from(direct.image.data)
      )
    }
  })

  it("produces deterministic output for identical input frames", async () => {
    const palette = PRESET_PALETTES[0]
    const frameSequence = createTestFrameSequence()
    const settings = {
      ...DEFAULT_SETTINGS,
      algorithm: "bayer" as const,
      bayerSize: 4 as const,
      paletteId: palette.id,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: frameSequence.sourceWidth,
        height: frameSequence.sourceHeight,
        mode: "nearest" as const,
        fit: "stretch" as const,
      },
    }

    const [first, second] = await Promise.all([
      processFrameSequence(frameSequence, settings),
      processFrameSequence(frameSequence, settings),
    ])

    for (let i = 0; i < first.length; i += 1) {
      expect(Array.from(first[i].image.data)).toEqual(
        Array.from(second[i].image.data)
      )
    }
  })

  it("produces different output when settings change between runs", async () => {
    const palette = PRESET_PALETTES[0]
    const frameSequence = createTestFrameSequence()
    const defaultSettings = {
      ...DEFAULT_SETTINGS,
      algorithm: "floyd-steinberg" as const,
      paletteId: palette.id,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: frameSequence.sourceWidth,
        height: frameSequence.sourceHeight,
        mode: "nearest" as const,
        fit: "stretch" as const,
      },
    }

    const [floydResult, noneResult] = await Promise.all([
      processFrameSequence(frameSequence, defaultSettings),
      processFrameSequence(frameSequence, {
        ...defaultSettings,
        algorithm: "none" as const,
      }),
    ])

    for (let i = 0; i < floydResult.length; i += 1) {
      expect(Array.from(floydResult[i].image.data)).not.toEqual(
        Array.from(noneResult[i].image.data)
      )
    }
  })
})

function createTestFrameSequence(): FrameSequence {
  const w = 4
  const h = 4
  const data1 = new Uint8ClampedArray(w * h * 4)
  const data2 = new Uint8ClampedArray(w * h * 4)

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const index = (y * w + x) * 4
      const value1 = x * 56 + y * 24
      const value2 = 255 - value1

      data1[index] = value1
      data1[index + 1] = value1
      data1[index + 2] = value1
      data1[index + 3] = 255

      data2[index] = value2
      data2[index + 1] = value2
      data2[index + 2] = value2
      data2[index + 3] = 255
    }
  }

  return {
    frames: [
      { width: w, height: h, data: data1 },
      { width: w, height: h, data: data2 },
    ],
    durationsMs: [100, 200],
    loopCount: 0,
    sourceWidth: w,
    sourceHeight: h,
  }
}
