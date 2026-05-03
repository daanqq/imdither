import { describe, expect, it } from "vitest"

import {
  DITHER_ALGORITHM_OPTIONS,
  DEFAULT_SETTINGS,
  getAlgorithmsByFamily,
  getDitherAlgorithmMetadataLabel,
  normalizeSettings,
  processImage,
} from "./index"
import type {
  DitherAlgorithmFamily,
  EditorSettings,
  PixelBuffer,
} from "./types"

describe("dither algorithm registry", () => {
  it("exposes stable selectable algorithms with family metadata", () => {
    expect(DITHER_ALGORITHM_OPTIONS).toEqual([
      {
        id: "none",
        label: "None",
        family: "Direct Mapping",
        capabilities: { bayerSize: false },
      },
      {
        id: "bayer",
        label: "Bayer",
        family: "Ordered",
        capabilities: { bayerSize: true },
      },
      {
        id: "matt-parker",
        label: "Matt Parker",
        family: "Ordered",
        capabilities: { bayerSize: false },
      },
      {
        id: "floyd-steinberg",
        label: "Floyd-Steinberg",
        family: "Error Diffusion",
        capabilities: { bayerSize: false },
      },
      {
        id: "atkinson",
        label: "Atkinson",
        family: "Error Diffusion",
        capabilities: { bayerSize: false },
      },
      {
        id: "burkes",
        label: "Burkes",
        family: "Error Diffusion",
        capabilities: { bayerSize: false },
      },
      {
        id: "stucki",
        label: "Stucki",
        family: "Error Diffusion",
        capabilities: { bayerSize: false },
      },
      {
        id: "sierra-lite",
        label: "Sierra Lite",
        family: "Error Diffusion",
        capabilities: { bayerSize: false },
      },
      {
        id: "jarvis-judice-ninke",
        label: "Jarvis-Judice-Ninke",
        family: "Error Diffusion",
        capabilities: { bayerSize: false },
      },
      {
        id: "sierra",
        label: "Sierra",
        family: "Error Diffusion",
        capabilities: { bayerSize: false },
      },
      {
        id: "two-row-sierra",
        label: "Two-Row Sierra",
        family: "Error Diffusion",
        capabilities: { bayerSize: false },
      },
      {
        id: "ostromoukhov",
        label: "Ostromoukhov",
        family: "Error Diffusion",
        capabilities: { bayerSize: false },
      },
      {
        id: "blue-noise",
        label: "Blue Noise",
        family: "Blue Noise",
        capabilities: { bayerSize: false },
      },
      {
        id: "halftone-dot",
        label: "Halftone Dot",
        family: "Halftone",
        capabilities: { bayerSize: false },
      },
    ])
  })

  it("processes all algorithms deterministically", () => {
    const input = grayscaleGradientBuffer(5, 5)

    for (const option of DITHER_ALGORITHM_OPTIONS) {
      const settings = normalizeSettings({
        ...DEFAULT_SETTINGS,
        algorithm: option.id,
        resize: {
          ...DEFAULT_SETTINGS.resize,
          width: input.width,
          height: input.height,
          mode: "nearest",
          fit: "stretch",
        },
      })

      const result = processImage(input, settings)

      expect(result.settings.algorithm).toBe(option.id)
      expect(result.image.width).toBe(input.width)
      expect(result.image.height).toBe(input.height)
      expect(result.metadata.algorithmName).toContain(option.label)
    }
  })

  it("keeps registry metadata labels compatible with existing exports", () => {
    expect(
      DITHER_ALGORITHM_OPTIONS.map((option) =>
        getDitherAlgorithmMetadataLabel({
          algorithm: option.id,
          bayerSize: 8,
          matchingMode: "rgb",
          halftoneScreen: {
            dotShape: "round",
            angle: 0,
            frequency: 50,
            patternSize: 8,
          },
        })
      )
    ).toEqual([
      "None",
      "Bayer 8x8",
      "Matt Parker",
      "Floyd-Steinberg",
      "Atkinson",
      "Burkes",
      "Stucki",
      "Sierra Lite",
      "Jarvis-Judice-Ninke",
      "Sierra",
      "Two-Row Sierra",
      "Ostromoukhov",
      "Blue Noise",
      "Halftone Dot",
    ])
  })

  it("groups algorithms by family", () => {
    const byFamily = getAlgorithmsByFamily()

    expect(byFamily.get("Direct Mapping")?.map((a) => a.id)).toEqual(["none"])
    expect(byFamily.get("Ordered")?.map((a) => a.id)).toEqual([
      "bayer",
      "matt-parker",
    ])
    expect(byFamily.get("Error Diffusion")?.map((a) => a.id)).toEqual([
      "floyd-steinberg",
      "atkinson",
      "burkes",
      "stucki",
      "sierra-lite",
      "jarvis-judice-ninke",
      "sierra",
      "two-row-sierra",
      "ostromoukhov",
    ])
    expect(byFamily.get("Blue Noise")?.map((a) => a.id)).toEqual(["blue-noise"])
    expect(byFamily.get("Halftone")?.map((a) => a.id)).toEqual(["halftone-dot"])
  })

  it("produces deterministic output for Ostromoukhov adaptive diffusion", () => {
    const input = grayscaleGradientBuffer(9, 9)
    const settings: Partial<EditorSettings> = {
      algorithm: "ostromoukhov",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 9,
        height: 9,
        mode: "nearest",
        fit: "stretch",
      },
    }

    const first = processImage(input, {
      ...DEFAULT_SETTINGS,
      ...settings,
    }).image.data
    const second = processImage(input, {
      ...DEFAULT_SETTINGS,
      ...settings,
    }).image.data

    expect(Array.from(first)).toEqual(Array.from(second))
  })

  it("produces different output than Floyd-Steinberg for an adaptive gradient", () => {
    const input = grayscaleGradientBuffer(16, 16)
    const sharedSettings: Partial<EditorSettings> = {
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: input.width,
        height: input.height,
        mode: "nearest",
        fit: "stretch",
      },
    }

    const ostromoukhovResult = processImage(input, {
      ...DEFAULT_SETTINGS,
      ...sharedSettings,
      algorithm: "ostromoukhov",
    }).image.data
    const floydResult = processImage(input, {
      ...DEFAULT_SETTINGS,
      ...sharedSettings,
      algorithm: "floyd-steinberg",
    }).image.data

    expect(Array.from(ostromoukhovResult)).not.toEqual(Array.from(floydResult))
  })
})

describe("dither algorithm families", () => {
  it("defines canonical family union", () => {
    const families: DitherAlgorithmFamily[] = [
      "Direct Mapping",
      "Ordered",
      "Error Diffusion",
      "Blue Noise",
      "Halftone",
    ]

    const familiesInRegistry = new Set(
      DITHER_ALGORITHM_OPTIONS.map((a) => a.family)
    )

    expect(Array.from(familiesInRegistry).sort()).toEqual(families.sort())
  })
})

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
