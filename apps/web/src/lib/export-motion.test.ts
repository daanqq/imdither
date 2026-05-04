import { describe, expect, it } from "vitest"
import {
  DEFAULT_SETTINGS,
  PRESET_PALETTES,
  type FrameSequence,
} from "@workspace/core"
import { decodeGifToFrameSequence } from "./gif-intake"
import { encodeFrameSequenceToGif } from "./gif-export"
import { exportGifSequence, makeMotionExportName } from "./export-motion"

describe("exportGifSequence", () => {
  it("produces a valid GIF blob from a frame sequence", async () => {
    const palette = PRESET_PALETTES[0]
    const frameSequence = createTestFrameSequence()
    const gifBytes = encodeFrameSequenceToGif(frameSequence, palette)
    const gifBuffer = gifBytes.buffer.slice(
      gifBytes.byteOffset,
      gifBytes.byteOffset + gifBytes.byteLength
    ) as ArrayBuffer

    const decoded = decodeGifToFrameSequence(gifBuffer)
    const blob = await exportGifSequence(decoded, {
      ...DEFAULT_SETTINGS,
      algorithm: "none",
      paletteId: palette.id,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: decoded.sourceWidth,
        height: decoded.sourceHeight,
        mode: "nearest",
        fit: "stretch",
      },
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe("image/gif")
    expect(blob.size).toBeGreaterThan(0)

    // Decode the exported GIF to verify it's valid
    const exportedArrayBuffer = await blob.arrayBuffer()
    const reDecoded = decodeGifToFrameSequence(exportedArrayBuffer)

    expect(reDecoded.frames).toHaveLength(decoded.frames.length)
    expect(reDecoded.sourceWidth).toBe(decoded.sourceWidth)
    expect(reDecoded.sourceHeight).toBe(decoded.sourceHeight)
  })

  it("rejects palettes with more than 256 colors", async () => {
    const frameSequence = createTestFrameSequence()
    const palette = PRESET_PALETTES.find((p) => p.colors.length > 256)

    if (palette && palette.colors.length <= 256) {
      return // skip if no >256 palette exists
    }

    // Use a custom 257-color palette through settings
    const largeHexColors = Array.from(
      { length: 257 },
      (_, i) =>
        `#${Math.min(i, 255).toString(16).padStart(2, "0")}${Math.min(i, 255)
          .toString(16)
          .padStart(2, "0")}${Math.min(i, 255).toString(16).padStart(2, "0")}`
    )

    const promise = exportGifSequence(frameSequence, {
      ...DEFAULT_SETTINGS,
      algorithm: "none",
      paletteId: "custom",
      customPalette: largeHexColors,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: frameSequence.sourceWidth,
        height: frameSequence.sourceHeight,
        mode: "nearest",
        fit: "stretch",
      },
    })

    await expect(promise).rejects.toThrow("256")
  })
})

describe("makeMotionExportName", () => {
  it("replaces extension with .gif", () => {
    expect(makeMotionExportName("demo.png")).toBe("demo.gif")
    expect(makeMotionExportName("image.webp")).toBe("image.gif")
    expect(makeMotionExportName("photo.jpeg")).toBe("photo.gif")
  })

  it("appends .gif when no extension", () => {
    expect(makeMotionExportName("myfile")).toBe("myfile.gif")
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
