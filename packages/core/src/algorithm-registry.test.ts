import { describe, expect, it } from "vitest"

import {
  DITHER_ALGORITHM_OPTIONS,
  DEFAULT_SETTINGS,
  getDitherAlgorithmMetadataLabel,
  normalizeSettings,
  processImage,
} from "./index"
import type { PixelBuffer } from "./types"

describe("dither algorithm registry", () => {
  it("exposes stable selectable algorithms that settings and processing accept", () => {
    const input = grayscaleGradientBuffer(5, 5)

    expect(DITHER_ALGORITHM_OPTIONS).toEqual([
      {
        id: "none",
        label: "None",
        capabilities: { bayerSize: false },
      },
      {
        id: "bayer",
        label: "Bayer",
        capabilities: { bayerSize: true },
      },
      {
        id: "matt-parker",
        label: "Matt Parker",
        capabilities: { bayerSize: false },
      },
      {
        id: "floyd-steinberg",
        label: "Floyd-Steinberg",
        capabilities: { bayerSize: false },
      },
      {
        id: "atkinson",
        label: "Atkinson",
        capabilities: { bayerSize: false },
      },
    ])

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
        })
      )
    ).toEqual([
      "None",
      "Bayer 8x8",
      "Matt Parker",
      "Floyd-Steinberg",
      "Atkinson",
    ])
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
