import { describe, expect, it } from "vitest"

import {
  analyzeAutoTuneImage,
  DEFAULT_SETTINGS,
  editorSettingsSchema,
  rankAutoTuneLookCandidates,
  recommendAutoTuneLooks,
} from "./index"
import type { PixelBuffer } from "./types"

describe("Auto-Tune public recommendation contract", () => {
  it("returns stable valid Look Snapshot recommendations with one recommended item", () => {
    const source = createRepresentativeSource()
    const context = {
      settings: DEFAULT_SETTINGS,
      sourceDimensions: { width: source.width, height: source.height },
      outputDimensions: { width: 320, height: 240 },
    }

    const first = recommendAutoTuneLooks(source, context)
    const second = recommendAutoTuneLooks(source, context)

    expect(first).toEqual(second)
    expect(first.length).toBeGreaterThanOrEqual(3)
    expect(first.length).toBeLessThanOrEqual(5)
    expect(
      first.filter((recommendation) => recommendation.recommended)
    ).toHaveLength(1)

    for (const [index, recommendation] of first.entries()) {
      expect(recommendation.rank).toBe(index + 1)
      expect(recommendation.id).toMatch(/^[a-z0-9-]+$/)
      expect(recommendation.label.length).toBeGreaterThan(0)
      expect(recommendation.intent.length).toBeGreaterThan(0)
      expect(recommendation.snapshot).toMatchObject({
        format: "imdither-look",
        version: 1,
        kind: "look-snapshot",
      })
      expect(
        editorSettingsSchema.safeParse(recommendation.snapshot.settings).success
      ).toBe(true)
    }
  })

  it("reports deterministic bounded analysis metrics that distinguish flat and gradient sources", () => {
    const flat = analyzeAutoTuneImage(createFlatSource(), {
      settings: DEFAULT_SETTINGS,
    })
    const gradient = analyzeAutoTuneImage(createRepresentativeSource(), {
      settings: DEFAULT_SETTINGS,
    })

    expect(flat).toEqual(
      analyzeAutoTuneImage(createFlatSource(), { settings: DEFAULT_SETTINGS })
    )

    for (const analysis of [flat, gradient]) {
      expect(analysis.histogramSpread).toBeGreaterThanOrEqual(0)
      expect(analysis.histogramSpread).toBeLessThanOrEqual(1)
      expect(analysis.colorEntropy).toBeGreaterThanOrEqual(0)
      expect(analysis.colorEntropy).toBeLessThanOrEqual(1)
      expect(analysis.edgeDensity).toBeGreaterThanOrEqual(0)
      expect(analysis.edgeDensity).toBeLessThanOrEqual(1)
      expect(analysis.paletteSuitability).toBeGreaterThanOrEqual(0)
      expect(analysis.paletteSuitability).toBeLessThanOrEqual(1)
      expect(analysis.flatAreaRatio).toBeGreaterThanOrEqual(0)
      expect(analysis.flatAreaRatio).toBeLessThanOrEqual(1)
      expect(analysis.gradientAreaRatio).toBeGreaterThanOrEqual(0)
      expect(analysis.gradientAreaRatio).toBeLessThanOrEqual(1)
      expect(analysis.noiseEstimate).toBeGreaterThanOrEqual(0)
      expect(analysis.noiseEstimate).toBeLessThanOrEqual(1)
      expect(analysis.meanSaturation).toBeGreaterThanOrEqual(0)
      expect(analysis.meanSaturation).toBeLessThanOrEqual(1)
    }

    expect(flat.flatAreaRatio).toBeGreaterThan(gradient.flatAreaRatio)
    expect(gradient.gradientAreaRatio).toBeGreaterThan(flat.gradientAreaRatio)
    expect(gradient.uniqueColorApprox).toBeGreaterThan(flat.uniqueColorApprox)
  })

  it("ranks ten candidate looks while keeping the public recommendation shortlist at 3 to 5", () => {
    const source = createRepresentativeSource()
    const context = {
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 640, height: 480 },
    }
    const candidates = rankAutoTuneLookCandidates(source, context)
    const recommendations = recommendAutoTuneLooks(source, context)

    expect(candidates).toHaveLength(10)
    expect(recommendations.length).toBeGreaterThanOrEqual(3)
    expect(recommendations.length).toBeLessThanOrEqual(5)
    expect(candidates.map((recommendation) => recommendation.id)).toEqual(
      expect.arrayContaining([
        "clean-reduction",
        "fine-ordered-mono",
        "high-contrast-ink",
        "screenprint-color",
        "texture-noise-look",
        "soft-poster",
        "newsprint-mono",
        "low-noise-photo",
        "arcade-color",
        "ink-wash",
      ])
    )
    expect(recommendations).toEqual(candidates.slice(0, recommendations.length))

    const screenprint = candidates.find(
      (recommendation) => recommendation.id === "screenprint-color"
    )
    const clean = candidates.find(
      (recommendation) => recommendation.id === "clean-reduction"
    )

    expect(screenprint?.snapshot.settings.customPalette?.length).toBe(32)
    expect(screenprint?.snapshot.settings.colorDepth).toEqual({ mode: "full" })
    expect(
      clean?.snapshot.settings.customPalette?.length
    ).toBeGreaterThanOrEqual(8)
    expect(clean?.snapshot.settings.colorDepth).toEqual({
      mode: "limit",
      count: 16,
    })
  })
})

function createRepresentativeSource(): PixelBuffer {
  const width = 16
  const height = 12
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const ramp = Math.round((x / (width - 1)) * 255)
      data[index] = ramp
      data[index + 1] = Math.round((y / (height - 1)) * 180)
      data[index + 2] = x % 4 === 0 ? 220 : 80
      data[index + 3] = 255
    }
  }

  return { width, height, data }
}

function createFlatSource(): PixelBuffer {
  const width = 12
  const height = 12
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const isLeft = x < width / 2
      data[index] = isLeft ? 20 : 230
      data[index + 1] = isLeft ? 40 : 220
      data[index + 2] = isLeft ? 60 : 200
      data[index + 3] = 255
    }
  }

  return { width, height, data }
}
