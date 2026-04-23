import { describe, expect, it } from "vitest"

import { PRESET_PALETTES } from "./palettes"
import { processImage } from "./process"
import { DEFAULT_SETTINGS, normalizeSettings } from "./settings"
import { flattenAlpha, nearestPaletteColor } from "./stages"
import type { PixelBuffer } from "./types"

describe("core pipeline", () => {
  it("flattens transparency against the selected background", () => {
    const input: PixelBuffer = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray([255, 255, 255, 128]),
    }

    expect(Array.from(flattenAlpha(input, "black").data)).toEqual([
      128, 128, 128, 255,
    ])
    expect(Array.from(flattenAlpha(input, "white").data)).toEqual([
      255, 255, 255, 255,
    ])
  })

  it("maps colors to the nearest preset palette color", () => {
    const blackWhite = PRESET_PALETTES[0]

    expect(nearestPaletteColor([12, 12, 12], blackWhite)).toEqual([0, 0, 0])
    expect(nearestPaletteColor([240, 240, 240], blackWhite)).toEqual([
      255, 255, 255,
    ])
  })

  it("normalizes partial settings into schema version 1", () => {
    expect(
      normalizeSettings({
        algorithm: "atkinson",
        resize: { width: 32, height: 24 },
      }).schemaVersion
    ).toBe(1)
  })

  it("produces deterministic output for diffusion algorithms", () => {
    const input = grayscaleGradientBuffer(9, 9)
    const settings = {
      ...DEFAULT_SETTINGS,
      algorithm: "floyd-steinberg" as const,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 9,
        height: 9,
        mode: "nearest" as const,
        fit: "stretch" as const,
      },
    }

    const first = processImage(input, settings).image.data
    const second = processImage(input, settings).image.data

    expect(Array.from(first)).toEqual(Array.from(second))
  })

  it("supports Matt Parker threshold dithering", () => {
    const input = grayscaleGradientBuffer(9, 9)
    const settings = {
      ...DEFAULT_SETTINGS,
      algorithm: "matt-parker" as const,
      paletteId: "sea-glass",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 9,
        height: 9,
        mode: "nearest" as const,
        fit: "stretch" as const,
      },
    }

    const result = processImage(input, settings)
    const colors = collectRgbTriples(result.image)
    const palette = PRESET_PALETTES.find((item) => item.id === "sea-glass")!

    expect(result.metadata.algorithmName).toBe("Matt Parker")
    expect(colors.size).toBeGreaterThan(2)
    expect(colors.size).toBeLessThanOrEqual(palette.colors.length)
  })
})

function fixtureBuffer(): PixelBuffer {
  const width = 4
  const height = 4
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const value = x * 48 + y * 24

      data[index] = value
      data[index + 1] = 255 - value
      data[index + 2] = value / 2
      data[index + 3] = 255
    }
  }

  return { width, height, data }
}

function collectRgbTriples(buffer: PixelBuffer): Set<string> {
  const colors = new Set<string>()

  for (let index = 0; index < buffer.data.length; index += 4) {
    colors.add(
      `${buffer.data[index]},${buffer.data[index + 1]},${buffer.data[index + 2]}`
    )
  }

  return colors
}

function grayscaleGradientBuffer(width: number, height: number): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const value = Math.round(((x + y) / (width + height - 2)) * 255)

      data[index] = value
      data[index + 1] = value
      data[index + 2] = value
      data[index + 3] = 255
    }
  }

  return { width, height, data }
}
