import { describe, expect, it } from "vitest"

import { PRESET_PALETTES, getEffectivePalette } from "./palettes"
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

  it("maps colors to the nearest palette color", () => {
    const blackWhite = PRESET_PALETTES[0]

    expect(nearestPaletteColor([12, 12, 12], blackWhite)).toEqual([0, 0, 0])
    expect(nearestPaletteColor([240, 240, 240], blackWhite)).toEqual([
      255, 255, 255,
    ])
  })

  it("keeps palette ids unique and processable", () => {
    const ids = PRESET_PALETTES.map((palette) => palette.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(PRESET_PALETTES.length)

    for (const palette of PRESET_PALETTES) {
      expect(palette.colors.length).toBeGreaterThanOrEqual(2)
      expect(palette.colors.every((color) => color.rgb.length === 3)).toBe(true)
    }
  })

  it("normalizes partial settings into schema version 2", () => {
    expect(
      normalizeSettings({
        algorithm: "atkinson",
        resize: { width: 32, height: 24 },
      }).schemaVersion
    ).toBe(2)
  })

  it("limits processing to the first N palette colors without mutating the active palette", () => {
    const palette = PRESET_PALETTES.find((item) => item.id === "poster-12")!
    const effective = getEffectivePalette(palette, {
      mode: "limit",
      count: 4,
    })

    expect(effective.colors.map((color) => color.hex)).toEqual(
      palette.colors.slice(0, 4).map((color) => color.hex)
    )
    expect(palette.colors).toHaveLength(12)
  })

  it("reports effective palette size and uses it for output processing", () => {
    const input = fixtureBuffer()
    const result = processImage(input, {
      ...DEFAULT_SETTINGS,
      algorithm: "none",
      paletteId: "poster-12",
      colorDepth: { mode: "limit", count: 2 },
      preprocess: {
        ...DEFAULT_SETTINGS.preprocess,
        colorMode: "color-preserve",
      },
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: input.width,
        height: input.height,
        mode: "nearest",
        fit: "stretch",
      },
    })

    expect(result.metadata.paletteSize).toBe(2)
    expect(collectRgbTriples(result.image).size).toBeLessThanOrEqual(2)
    expect(result.palette.colors).toHaveLength(12)
  })

  it("applies matching mode through nearest-color processing", () => {
    const input: PixelBuffer = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray([0, 5, 0, 255]),
    }
    const settings = {
      ...DEFAULT_SETTINGS,
      algorithm: "none" as const,
      paletteId: "custom",
      customPalette: ["#ff0000", "#00ff00", "#0000ff"],
      preprocess: {
        ...DEFAULT_SETTINGS.preprocess,
        colorMode: "color-preserve" as const,
      },
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 1,
        height: 1,
        mode: "nearest" as const,
        fit: "stretch" as const,
      },
    }

    const rgb = processImage(input, {
      ...settings,
      matchingMode: "rgb",
    }).image.data
    const perceptual = processImage(input, {
      ...settings,
      matchingMode: "perceptual",
    }).image.data

    expect(Array.from(rgb)).toEqual([0, 255, 0, 255])
    expect(Array.from(perceptual)).toEqual([0, 0, 255, 255])
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

  it("processes blue-noise dithering with its own ordered mask", () => {
    const input = grayscaleGradientBuffer(16, 16)
    const sharedSettings = {
      ...DEFAULT_SETTINGS,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: input.width,
        height: input.height,
        mode: "nearest" as const,
        fit: "stretch" as const,
      },
    }

    const blueNoise = processImage(input, {
      ...sharedSettings,
      algorithm: "blue-noise",
    }).image.data
    const bayer = processImage(input, {
      ...sharedSettings,
      algorithm: "bayer",
      bayerSize: 8,
    }).image.data

    expect(Array.from(blueNoise)).not.toEqual(Array.from(bayer))
  })

  it("processes halftone-dot dithering as a distinct clustered pattern", () => {
    const input = grayscaleGradientBuffer(16, 16)
    const sharedSettings = {
      ...DEFAULT_SETTINGS,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: input.width,
        height: input.height,
        mode: "nearest" as const,
        fit: "stretch" as const,
      },
    }

    const halftone = processImage(input, {
      ...sharedSettings,
      algorithm: "halftone-dot",
    }).image.data
    const blueNoise = processImage(input, {
      ...sharedSettings,
      algorithm: "blue-noise",
    }).image.data
    const bayer = processImage(input, {
      ...sharedSettings,
      algorithm: "bayer",
      bayerSize: 8,
    }).image.data

    expect(Array.from(halftone)).not.toEqual(Array.from(blueNoise))
    expect(Array.from(halftone)).not.toEqual(Array.from(bayer))
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
