import { performance } from "node:perf_hooks"

import { processImage } from "../src/process"
import { DEFAULT_SETTINGS } from "../src/settings"
import type { EditorSettings, PixelBuffer } from "../src/types"

type PerformanceScenario = {
  name: string
  input: PixelBuffer
  settings: EditorSettings
  iterations: number
}

const scenarios: PerformanceScenario[] = [
  {
    name: "ordered-preview-960x640",
    input: gradientBuffer(960, 640),
    settings: {
      ...DEFAULT_SETTINGS,
      algorithm: "bayer",
      bayerSize: 8,
      paletteId: "gray-4",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 960,
        height: 640,
        fit: "stretch",
      },
    },
    iterations: 5,
  },
  {
    name: "diffusion-preview-960x640",
    input: gradientBuffer(960, 640),
    settings: {
      ...DEFAULT_SETTINGS,
      algorithm: "floyd-steinberg",
      paletteId: "gray-4",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 960,
        height: 640,
        fit: "stretch",
      },
    },
    iterations: 5,
  },
  {
    name: "export-sized-halftone-1600x1200",
    input: gradientBuffer(1600, 1200),
    settings: {
      ...DEFAULT_SETTINGS,
      algorithm: "halftone-dot",
      paletteId: "screenprint-16",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 1600,
        height: 1200,
        fit: "stretch",
      },
      preprocess: {
        ...DEFAULT_SETTINGS.preprocess,
        colorMode: "color-preserve",
        contrast: 12,
      },
    },
    iterations: 3,
  },
]

console.log("IMDITHER performance baseline")
console.log(
  "Non-gating report. Compare medians manually before acceleration work."
)
console.log("")

for (const scenario of scenarios) {
  const timings = runScenario(scenario)
  const sorted = [...timings].sort((left, right) => left - right)
  const median = sorted[Math.floor(sorted.length / 2)]
  const average =
    timings.reduce((total, timing) => total + timing, 0) / timings.length

  console.log(
    [
      scenario.name,
      `input=${scenario.input.width}x${scenario.input.height}`,
      `output=${scenario.settings.resize.width}x${scenario.settings.resize.height}`,
      `algorithm=${scenario.settings.algorithm}`,
      `iterations=${scenario.iterations}`,
      `median=${median.toFixed(2)}ms`,
      `average=${average.toFixed(2)}ms`,
    ].join(" | ")
  )
}

function runScenario(scenario: PerformanceScenario): number[] {
  processImage(scenario.input, scenario.settings)

  return Array.from({ length: scenario.iterations }, () => {
    const start = performance.now()
    processImage(scenario.input, scenario.settings)
    return performance.now() - start
  })
}

function gradientBuffer(width: number, height: number): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const horizontal = x / Math.max(1, width - 1)
      const vertical = y / Math.max(1, height - 1)
      const value = Math.round((horizontal * 0.7 + vertical * 0.3) * 255)

      data[index] = value
      data[index + 1] = 255 - value
      data[index + 2] = Math.round(128 + (horizontal - vertical) * 96)
      data[index + 3] = 255
    }
  }

  return { width, height, data }
}
