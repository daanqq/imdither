import { describe, expect, it } from "vitest"

import {
  analyzeAutoTuneImage,
  createLookSnapshot,
  createAutoTuneAnalysisSample,
  DEFAULT_SETTINGS,
  editorSettingsSchema,
  expandAutoTuneLookCandidates,
  getAutoTuneCandidateDefinitions,
  getPerceptualColorDistance,
  rankAutoTuneLookCandidates,
  recommendAutoTuneLooks,
  scorePaletteFit,
  scoreRenderedAutoTuneCandidate,
  selectDiverseAutoTuneRecommendations,
} from "./index"
import type { AutoTuneCandidate } from "./index"
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

  it("creates a deterministic bounded Auto-Tune analysis sample", () => {
    const source = createLargeGradientSource(640, 320)
    const sample = createAutoTuneAnalysisSample(source)
    const second = createAutoTuneAnalysisSample(source)

    expect(sample).toEqual(second)
    expect(sample.width).toBe(256)
    expect(sample.height).toBe(128)
    expect(sample.data).toHaveLength(256 * 128 * 4)
    expect(sample.data.slice(0, 4)).toEqual(source.data.slice(0, 4))
  })

  it("keeps small Auto-Tune analysis samples at source dimensions", () => {
    const source = createRepresentativeSource()
    const sample = createAutoTuneAnalysisSample(source)

    expect(sample.width).toBe(source.width)
    expect(sample.height).toBe(source.height)
    expect(sample.data).toEqual(source.data)
  })

  it("keeps public recommendations valid across the compact scoring fixture matrix", () => {
    const fixtures = [
      createFlatSource(),
      createRepresentativeSource(),
      createNoisyScanSource(),
      createSaturatedColorSource(),
      createHighEdgeSource(),
      createLowResolutionGraphicSource(),
    ]

    for (const source of fixtures) {
      const context = {
        settings: DEFAULT_SETTINGS,
        sourceDimensions: { width: source.width, height: source.height },
        outputDimensions: { width: 96, height: 64 },
      }
      const recommendations = recommendAutoTuneLooks(source, context)

      expect(recommendations).toEqual(recommendAutoTuneLooks(source, context))
      expect(recommendations.length).toBeGreaterThanOrEqual(3)
      expect(recommendations.length).toBeLessThanOrEqual(5)
      expect(
        recommendations.filter((recommendation) => recommendation.recommended)
      ).toHaveLength(1)
      expect(
        new Set(recommendations.map((recommendation) => recommendation.id)).size
      ).toBe(recommendations.length)
    }
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
    expect(recommendations[0]?.id).toBe(candidates[0]?.id)
    expect(
      recommendations.every((recommendation) =>
        candidates.some((candidate) => candidate.id === recommendation.id)
      )
    ).toBe(true)
    expect(new Set(recommendations.map((candidate) => candidate.id)).size).toBe(
      recommendations.length
    )

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

  it("expands archetypes into a deterministic richer bounded candidate pool", () => {
    const source = createRepresentativeSource()
    const context = {
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 640, height: 480 },
    }
    const analysis = analyzeAutoTuneImage(source, context)

    const first = expandAutoTuneLookCandidates(source, context, analysis)
    const second = expandAutoTuneLookCandidates(source, context, analysis)

    expect(first).toEqual(second)
    expect(first.length).toBeGreaterThanOrEqual(70)
    expect(first.length).toBeLessThanOrEqual(80)
    expect(new Set(first.map((candidate) => candidate.id))).toEqual(
      new Set([
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
    expect(
      new Set(
        first.map((candidate) =>
          [
            candidate.id,
            candidate.snapshot.settings.algorithm,
            candidate.snapshot.settings.paletteId,
            candidate.snapshot.settings.bayerSize,
            candidate.snapshot.settings.matchingMode,
            candidate.snapshot.settings.resize.mode,
            candidate.snapshot.settings.preprocess.contrast,
            candidate.snapshot.settings.preprocess.gamma,
            candidate.snapshot.settings.preprocess.colorMode,
            candidate.snapshot.settings.customPalette?.length ?? 0,
          ].join(":")
        )
      ).size
    ).toBe(first.length)

    for (const candidate of first) {
      expect(
        editorSettingsSchema.safeParse(candidate.snapshot.settings).success
      ).toBe(true)
    }
  })

  it("scopes hidden variants to meaningful archetype axes", () => {
    const source = createRepresentativeSource()
    const context = {
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 640, height: 480 },
    }
    const analysis = analyzeAutoTuneImage(source, context)
    const candidates = expandAutoTuneLookCandidates(source, context, analysis)
    const byId = groupCandidatesById(candidates)

    expect(
      new Set(
        byId
          .get("clean-reduction")!
          .map((candidate) => candidate.snapshot.settings.customPalette?.length)
          .filter(Boolean)
      )
    ).toEqual(new Set([8, 16, 32]))
    expect(
      byId
        .get("newsprint-mono")!
        .every(
          (candidate) => candidate.snapshot.settings.paletteId !== "custom"
        )
    ).toBe(true)
    expect(
      byId
        .get("arcade-color")!
        .some(
          (candidate) => candidate.snapshot.settings.resize.mode === "nearest"
        )
    ).toBe(true)
    expect(
      byId
        .get("newsprint-mono")!
        .every(
          (candidate) => candidate.snapshot.settings.resize.mode !== "nearest"
        )
    ).toBe(true)

    const gammaValues = candidates.map(
      (candidate) => candidate.snapshot.settings.preprocess.gamma
    )
    const contrastValues = candidates.map(
      (candidate) => candidate.snapshot.settings.preprocess.contrast
    )

    expect(Math.min(...gammaValues)).toBeGreaterThanOrEqual(0.2)
    expect(Math.max(...gammaValues)).toBeLessThanOrEqual(3)
    expect(Math.min(...contrastValues)).toBeGreaterThanOrEqual(-100)
    expect(Math.max(...contrastValues)).toBeLessThanOrEqual(100)
  })

  it("declares stable candidate definitions with typed hidden variant configuration", () => {
    const definitions = getAutoTuneCandidateDefinitions()

    expect(definitions.map((definition) => definition.id)).toEqual([
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

    for (const definition of definitions) {
      expect(definition.label.length).toBeGreaterThan(0)
      expect(definition.intent.length).toBeGreaterThan(0)
      expect(definition.variants.algorithms.length).toBeGreaterThan(0)
      expect(definition.variants.palettes.length).toBeGreaterThan(0)
      expect(definition.variants.contrastDeltas.length).toBeGreaterThan(0)
    }

    expect(
      definitions.find((definition) => definition.id === "clean-reduction")
        ?.variants.extractedPaletteSizes
    ).toEqual([8, 16, 32])
    expect(
      definitions.find((definition) => definition.id === "arcade-color")
        ?.variants.resizeModes
    ).toEqual(["nearest"])
  })

  it("scores rendered candidate output deterministically against source fit", () => {
    const source = createSaturatedColorSource()
    const context = {
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 96, height: 64 },
    }
    const analysis = analyzeAutoTuneImage(source, context)
    const candidates = expandAutoTuneLookCandidates(source, context, analysis)
    const screenprint = candidates.find(
      (candidate) => candidate.id === "screenprint-color"
    )
    const newsprint = candidates.find(
      (candidate) => candidate.id === "newsprint-mono"
    )

    expect(screenprint).toBeDefined()
    expect(newsprint).toBeDefined()

    const first = scoreRenderedAutoTuneCandidate(source, screenprint!, analysis)
    const second = scoreRenderedAutoTuneCandidate(
      source,
      screenprint!,
      analysis
    )
    const mono = scoreRenderedAutoTuneCandidate(source, newsprint!, analysis)

    expect(first).toEqual(second)
    expect(first.totalScore).toBeGreaterThan(mono.totalScore)
    expect(first.perceptualColorFit).toBeGreaterThan(mono.perceptualColorFit)
    expect(first.structureRetention).toBeGreaterThanOrEqual(0)
    expect(first.structureRetention).toBeLessThanOrEqual(1)
  })

  it("uses perceptual color distance ordering rather than plain RGB channel distance", () => {
    const redToDarkRed = getPerceptualColorDistance(
      { red: 255, green: 0, blue: 0 },
      { red: 128, green: 0, blue: 0 }
    )
    const redToPurple = getPerceptualColorDistance(
      { red: 255, green: 0, blue: 0 },
      { red: 255, green: 0, blue: 127 }
    )

    expect(redToDarkRed).toBeLessThan(redToPurple)
  })

  it("scores source palette fit independently from rendered color fit", () => {
    const source = createSaturatedColorSource()
    const matchingPalette = scorePaletteFit(source, [
      "#e600f0",
      "#e628f0",
      "#14d23c",
      "#14283c",
    ])
    const unrelatedPalette = scorePaletteFit(source, [
      "#000000",
      "#333333",
      "#777777",
      "#ffffff",
    ])

    expect(matchingPalette).toBeGreaterThan(unrelatedPalette)
  })

  it("ranks archetype winners from rendered candidates with deterministic tie-breaking", () => {
    const source = createSaturatedColorSource()
    const context = {
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 96, height: 64 },
    }

    const ranked = rankAutoTuneLookCandidates(source, context)
    const second = rankAutoTuneLookCandidates(source, context)

    expect(ranked).toEqual(second)
    expect(ranked).toHaveLength(10)
    expect(new Set(ranked.map((candidate) => candidate.id)).size).toBe(10)
    expect(ranked[0]?.recommended).toBe(true)
    expect(ranked.slice(1).every((candidate) => !candidate.recommended)).toBe(
      true
    )
    expect(ranked[0]?.id).not.toBe("newsprint-mono")
    const screenprintRank = ranked.find(
      (candidate) => candidate.id === "screenprint-color"
    )?.rank
    const newsprintRank = ranked.find(
      (candidate) => candidate.id === "newsprint-mono"
    )?.rank

    expect(screenprintRank).toBeDefined()
    expect(newsprintRank).toBeDefined()
    expect(screenprintRank!).toBeLessThan(newsprintRank!)
  })

  it("selects a diverse shortlist instead of crowding it with near-duplicate variants", () => {
    const source = createRepresentativeSource()
    const context = {
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 96, height: 64 },
    }
    const analysis = analyzeAutoTuneImage(source, context)
    const expanded = expandAutoTuneLookCandidates(source, context, analysis)
    const duplicateHeavyPool = [
      ...expanded.filter((candidate) => candidate.id === "clean-reduction"),
      ...expanded.filter((candidate) => candidate.id === "screenprint-color"),
      ...expanded.filter((candidate) => candidate.id === "newsprint-mono"),
    ]

    const recommendations = selectDiverseAutoTuneRecommendations(
      duplicateHeavyPool,
      5
    )

    expect(recommendations).toHaveLength(5)
    expect(recommendations[0]?.id).toBe("clean-reduction")
    expect(new Set(recommendations.map((candidate) => candidate.id)).size).toBe(
      3
    )
    expect(
      recommendations.filter((candidate) => candidate.recommended)
    ).toHaveLength(1)
  })

  it("does not select a very weak candidate only because it is diverse", () => {
    const strong = createSelectionCandidate(
      "clean-reduction",
      "bayer",
      "gray-4",
      1
    )
    const strongVariant = createSelectionCandidate(
      "clean-reduction",
      "blue-noise",
      "gray-4",
      0.95
    )
    const weakUnique = createSelectionCandidate(
      "arcade-color",
      "halftone-dot",
      "pico-8",
      0.1
    )

    const recommendations = selectDiverseAutoTuneRecommendations(
      [strong, strongVariant, weakUnique],
      2
    )

    expect(recommendations.map((candidate) => candidate.id)).toEqual([
      "clean-reduction",
      "clean-reduction",
    ])
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

function createLargeGradientSource(width: number, height: number): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      data[index] = x % 256
      data[index + 1] = y % 256
      data[index + 2] = (x + y) % 256
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

function createSaturatedColorSource(): PixelBuffer {
  const width = 16
  const height = 12
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      data[index] = x < width / 2 ? 230 : 20
      data[index + 1] = y < height / 2 ? 40 : 210
      data[index + 2] = x % 3 === 0 ? 240 : 60
      data[index + 3] = 255
    }
  }

  return { width, height, data }
}

function createNoisyScanSource(): PixelBuffer {
  const width = 16
  const height = 12
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const noise = (x * 37 + y * 53) % 90
      const base = 96 + noise
      data[index] = base
      data[index + 1] = base - 12
      data[index + 2] = base - 20
      data[index + 3] = 255
    }
  }

  return { width, height, data }
}

function createHighEdgeSource(): PixelBuffer {
  const width = 16
  const height = 12
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const isInk = x === y || x === width - y - 1 || x % 5 === 0
      data[index] = isInk ? 8 : 244
      data[index + 1] = isInk ? 8 : 244
      data[index + 2] = isInk ? 8 : 244
      data[index + 3] = 255
    }
  }

  return { width, height, data }
}

function createLowResolutionGraphicSource(): PixelBuffer {
  const width = 8
  const height = 8
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const colorIndex = (Math.floor(x / 2) + Math.floor(y / 2)) % 4
      const colors = [
        [18, 24, 64],
        [234, 65, 82],
        [52, 190, 94],
        [245, 213, 92],
      ]
      const [red, green, blue] = colors[colorIndex]
      data[index] = red
      data[index + 1] = green
      data[index + 2] = blue
      data[index + 3] = 255
    }
  }

  return { width, height, data }
}

function createSelectionCandidate(
  id: AutoTuneCandidate["id"],
  algorithm: AutoTuneCandidate["snapshot"]["settings"]["algorithm"],
  paletteId: string,
  score?: number
): AutoTuneCandidate & { score?: number } {
  const settings = {
    ...DEFAULT_SETTINGS,
    algorithm,
    paletteId,
    customPalette: undefined,
  }

  return {
    id,
    label: id,
    intent: id,
    score,
    snapshot: createLookSnapshot({
      createdAt: "2026-04-26T00:00:00.000Z",
      name: id,
      settings,
    }),
  }
}

function groupCandidatesById(
  candidates: AutoTuneCandidate[]
): Map<AutoTuneCandidate["id"], AutoTuneCandidate[]> {
  const groups = new Map<AutoTuneCandidate["id"], AutoTuneCandidate[]>()

  for (const candidate of candidates) {
    groups.set(candidate.id, [...(groups.get(candidate.id) ?? []), candidate])
  }

  return groups
}
