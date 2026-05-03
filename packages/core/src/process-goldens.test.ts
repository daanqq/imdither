import { describe, expect, it } from "vitest"

import { processImage } from "./process"
import { DEFAULT_SETTINGS } from "./settings"
import type { EditorSettings, PixelBuffer } from "./types"

type GoldenCase = {
  name: string
  settings: Partial<EditorSettings>
  expected: number[][]
}

const GOLDEN_CASES: GoldenCase[] = [
  {
    name: "ordered Bayer",
    settings: {
      algorithm: "bayer",
      bayerSize: 4,
      paletteId: "gray-4",
      preprocess: {
        ...DEFAULT_SETTINGS.preprocess,
        colorMode: "color-preserve",
      },
    },
    expected: [
      [85, 85, 85, 85],
      [85, 85, 170, 85],
      [85, 85, 85, 85],
      [85, 85, 170, 85],
    ],
  },
  {
    name: "error diffusion",
    settings: {
      algorithm: "floyd-steinberg",
      paletteId: "gray-4",
    },
    expected: [
      [170, 170, 85, 85],
      [170, 170, 170, 85],
      [170, 85, 85, 85],
      [170, 170, 85, 85],
    ],
  },
  {
    name: "direct quantization",
    settings: {
      algorithm: "none",
      paletteId: "gray-4",
    },
    expected: [
      [170, 170, 170, 85],
      [170, 170, 85, 85],
      [170, 170, 85, 85],
      [170, 85, 85, 85],
    ],
  },
  {
    name: "special halftone",
    settings: {
      algorithm: "halftone-dot",
      paletteId: "gray-4",
    },
    expected: [
      [170, 170, 170, 85],
      [170, 170, 85, 85],
      [170, 170, 85, 85],
      [170, 85, 85, 0],
    ],
  },
  {
    name: "Jarvis-Judice-Ninke diffusion",
    settings: {
      algorithm: "jarvis-judice-ninke",
      paletteId: "gray-4",
    },
    expected: [
      [170, 170, 170, 85],
      [170, 170, 85, 85],
      [170, 170, 85, 85],
      [170, 85, 85, 85],
    ],
  },
  {
    name: "full Sierra diffusion",
    settings: {
      algorithm: "sierra",
      paletteId: "gray-4",
    },
    expected: [
      [170, 170, 170, 85],
      [170, 170, 85, 85],
      [170, 170, 85, 85],
      [170, 85, 85, 85],
    ],
  },
  {
    name: "Two-Row Sierra diffusion",
    settings: {
      algorithm: "two-row-sierra",
      paletteId: "gray-4",
    },
    expected: [
      [170, 170, 170, 85],
      [170, 170, 85, 85],
      [170, 170, 85, 85],
      [170, 85, 85, 85],
    ],
  },
  {
    name: "Ostromoukhov adaptive diffusion",
    settings: {
      algorithm: "ostromoukhov",
      paletteId: "gray-4",
    },
    expected: [
      [170, 170, 85, 85],
      [170, 170, 170, 85],
      [170, 85, 85, 85],
      [170, 170, 85, 85],
    ],
  },
  {
    name: "halftone square 4x4",
    settings: {
      algorithm: "halftone-dot",
      paletteId: "gray-4",
      halftoneScreen: {
        dotShape: "square",
        angle: 0,
        frequency: 50,
        patternSize: 4,
      },
    },
    expected: [
      [170, 170, 85, 85],
      [170, 85, 85, 85],
      [170, 85, 85, 85],
      [170, 170, 85, 85],
    ],
  },
  {
    name: "halftone line 8x8",
    settings: {
      algorithm: "halftone-dot",
      paletteId: "gray-4",
      halftoneScreen: {
        dotShape: "line",
        angle: 0,
        frequency: 50,
        patternSize: 8,
      },
    },
    expected: [
      [170, 170, 85, 85],
      [170, 85, 85, 85],
      [170, 85, 85, 85],
      [170, 85, 85, 85],
    ],
  },
]

describe("core pixel goldens", () => {
  it.each(GOLDEN_CASES)(
    "protects deterministic public processing output for $name",
    ({ settings, expected }) => {
      const result = processImage(goldenInput(), {
        ...DEFAULT_SETTINGS,
        ...settings,
        resize: {
          ...DEFAULT_SETTINGS.resize,
          width: 4,
          height: 4,
          mode: "nearest",
          fit: "stretch",
        },
        preprocess: {
          ...DEFAULT_SETTINGS.preprocess,
          ...settings.preprocess,
        },
      })

      expect(toGrayscaleRows(result.image)).toEqual(expected)
      expect(allAlphaOpaque(result.image)).toBe(true)
    }
  )
})

function goldenInput(): PixelBuffer {
  const width = 4
  const height = 4
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const value = x * 56 + y * 24

      data[index] = value
      data[index + 1] = 255 - value
      data[index + 2] = Math.round(value / 2)
      data[index + 3] = 255
    }
  }

  return { width, height, data }
}

function toGrayscaleRows(buffer: PixelBuffer): number[][] {
  const rows: number[][] = []

  for (let y = 0; y < buffer.height; y += 1) {
    const row: number[] = []

    for (let x = 0; x < buffer.width; x += 1) {
      row.push(buffer.data[(y * buffer.width + x) * 4])
    }

    rows.push(row)
  }

  return rows
}

function allAlphaOpaque(buffer: PixelBuffer): boolean {
  for (let index = 3; index < buffer.data.length; index += 4) {
    if (buffer.data[index] !== 255) {
      return false
    }
  }

  return true
}
