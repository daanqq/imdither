import { createLookSnapshot, type LookSnapshot } from "./look-snapshot"
import { extractPaletteFromSource } from "./palette-extraction"
import { DEFAULT_SETTINGS, normalizeSettings } from "./settings"
import type { EditorSettings, PixelBuffer } from "./types"

export type AutoTuneArchetypeId =
  | "clean-reduction"
  | "fine-ordered-mono"
  | "high-contrast-ink"
  | "screenprint-color"
  | "texture-noise-look"
  | "soft-poster"
  | "newsprint-mono"
  | "low-noise-photo"
  | "arcade-color"
  | "ink-wash"

export type AutoTuneContext = {
  settings: EditorSettings
  sourceDimensions?: {
    width: number
    height: number
  }
  outputDimensions?: {
    width: number
    height: number
  }
}

export type AutoTuneAnalysis = {
  histogramSpread: number
  colorEntropy: number
  edgeDensity: number
  paletteSuitability: number
  outputSize: number
  flatAreaRatio: number
  gradientAreaRatio: number
  noiseEstimate: number
  meanSaturation: number
  uniqueColorApprox: number
}

export type AutoTuneRecommendation = {
  id: AutoTuneArchetypeId
  label: string
  intent: string
  snapshot: LookSnapshot
  rank: number
  recommended: boolean
}

type AutoTuneCandidate = Omit<AutoTuneRecommendation, "rank" | "recommended">

const AUTO_TUNE_CREATED_AT = "2026-04-26T00:00:00.000Z"

export function analyzeAutoTuneImage(
  source: PixelBuffer,
  context: AutoTuneContext
): AutoTuneAnalysis {
  assertUsableSource(source)

  const sample = sampleSource(source)
  const bins = new Array<number>(32).fill(0)
  const colorBins = new Set<number>()
  let lumaMin = 255
  let lumaMax = 0
  let saturationTotal = 0
  let opaquePixels = 0
  let edgePixels = 0
  let flatBlocks = 0
  let gradientBlocks = 0
  let noisyBlocks = 0
  let blockCount = 0

  for (let y = 0; y < sample.height; y += 1) {
    for (let x = 0; x < sample.width; x += 1) {
      const pixel = readPixel(sample, x, y)

      if (pixel.alpha === 0) {
        continue
      }

      opaquePixels += 1
      const luma = getLuma(pixel)
      const saturation = getSaturation(pixel.red, pixel.green, pixel.blue)
      const bin = Math.min(31, Math.floor(luma / 8))
      const colorBin =
        ((pixel.red >> 3) << 10) | ((pixel.green >> 3) << 5) | (pixel.blue >> 3)

      bins[bin] += 1
      colorBins.add(colorBin)
      lumaMin = Math.min(lumaMin, luma)
      lumaMax = Math.max(lumaMax, luma)
      saturationTotal += saturation

      if (x > 0 && y > 0 && x < sample.width - 1 && y < sample.height - 1) {
        const dx =
          getLuma(readPixel(sample, x + 1, y)) -
          getLuma(readPixel(sample, x - 1, y))
        const dy =
          getLuma(readPixel(sample, x, y + 1)) -
          getLuma(readPixel(sample, x, y - 1))

        if (Math.hypot(dx, dy) > 42) {
          edgePixels += 1
        }
      }
    }
  }

  for (let y = 0; y < sample.height; y += 4) {
    for (let x = 0; x < sample.width; x += 4) {
      const block = analyzeBlock(sample, x, y)

      if (!block) {
        continue
      }

      blockCount += 1

      if (block.variance < 90) {
        flatBlocks += 1
      }

      if (block.variance < 520 && block.range > 18) {
        gradientBlocks += 1
      }

      if (block.variance > 1250 && block.edgeTransitions > 7) {
        noisyBlocks += 1
      }
    }
  }

  const entropy = getEntropy(bins, Math.max(1, opaquePixels))
  const uniqueColorApprox = colorBins.size
  const paletteSuitability = clamp01(1 - uniqueColorApprox / 512)
  const outputPixels =
    context.outputDimensions?.width && context.outputDimensions?.height
      ? context.outputDimensions.width * context.outputDimensions.height
      : context.settings.resize.width * context.settings.resize.height

  return {
    histogramSpread: clamp01((lumaMax - lumaMin) / 255),
    colorEntropy: entropy,
    edgeDensity: clamp01(edgePixels / Math.max(1, opaquePixels)),
    paletteSuitability,
    outputSize: clamp01(outputPixels / 1_000_000),
    flatAreaRatio: clamp01(flatBlocks / Math.max(1, blockCount)),
    gradientAreaRatio: clamp01(gradientBlocks / Math.max(1, blockCount)),
    noiseEstimate: clamp01(noisyBlocks / Math.max(1, blockCount)),
    meanSaturation: clamp01(saturationTotal / Math.max(1, opaquePixels)),
    uniqueColorApprox,
  }
}

export function recommendAutoTuneLooks(
  source: PixelBuffer,
  context: AutoTuneContext
): AutoTuneRecommendation[] {
  const analysis = analyzeAutoTuneImage(source, context)

  return rankAutoTuneLookCandidatesFromAnalysis(
    source,
    context,
    analysis
  ).slice(0, getRecommendationCount(analysis))
}

export function rankAutoTuneLookCandidates(
  source: PixelBuffer,
  context: AutoTuneContext
): AutoTuneRecommendation[] {
  const analysis = analyzeAutoTuneImage(source, context)

  return rankAutoTuneLookCandidatesFromAnalysis(source, context, analysis)
}

function rankAutoTuneLookCandidatesFromAnalysis(
  source: PixelBuffer,
  context: AutoTuneContext,
  analysis: AutoTuneAnalysis
): AutoTuneRecommendation[] {
  const candidates = createCandidates(source, context, analysis)

  return candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate.id, analysis),
    }))
    .sort((left, right) => right.score - left.score)
    .map(({ candidate }, index) => ({
      ...candidate,
      rank: index + 1,
      recommended: index === 0,
    }))
}

function createCandidates(
  source: PixelBuffer,
  context: AutoTuneContext,
  analysis: AutoTuneAnalysis
): AutoTuneCandidate[] {
  const settings = context.settings
  const base = {
    ...DEFAULT_SETTINGS,
    ...settings,
    resize: {
      ...settings.resize,
      width: context.outputDimensions?.width ?? settings.resize.width,
      height: context.outputDimensions?.height ?? settings.resize.height,
    },
  }

  return [
    {
      id: "clean-reduction",
      label: "Clean Reduction",
      intent: "Plain mapped color with minimal texture for logos and flat art.",
      snapshot: snapshot("Clean Reduction", {
        ...base,
        algorithm: "none",
        paletteId: "custom",
        customPalette: extractPaletteOrFallback(source, analysis, 8),
        colorDepth: {
          mode: "limit",
          count: analysis.paletteSuitability > 0.72 ? 8 : 16,
        },
        matchingMode: "perceptual",
        preprocess: {
          ...base.preprocess,
          contrast: 0,
          gamma: 1,
          colorMode: "color-preserve",
        },
      }),
    },
    {
      id: "fine-ordered-mono",
      label: "Fine Ordered Mono",
      intent:
        "Controlled monochrome Bayer texture for photos and soft gradients.",
      snapshot: snapshot("Fine Ordered Mono", {
        ...base,
        algorithm: "bayer",
        bayerSize: 8,
        paletteId: "gray-4",
        customPalette: undefined,
        colorDepth: { mode: "full" },
        matchingMode: "rgb",
        preprocess: {
          ...base.preprocess,
          contrast: analysis.histogramSpread < 0.45 ? 10 : 0,
          gamma: 1,
          colorMode: "grayscale-first",
        },
      }),
    },
    {
      id: "high-contrast-ink",
      label: "High Contrast Ink",
      intent: "Graphic black and white output with firm edge emphasis.",
      snapshot: snapshot("High Contrast Ink", {
        ...base,
        algorithm: analysis.edgeDensity > 0.22 ? "atkinson" : "floyd-steinberg",
        paletteId: "black-white",
        customPalette: undefined,
        colorDepth: { mode: "full" },
        matchingMode: "rgb",
        preprocess: {
          ...base.preprocess,
          contrast: 28,
          gamma: analysis.histogramSpread < 0.4 ? 0.85 : 1,
          colorMode: "grayscale-first",
        },
      }),
    },
    {
      id: "screenprint-color",
      label: "Screenprint Color",
      intent: "Color-preserving print palette with perceptual matching.",
      snapshot: snapshot("Screenprint Color", {
        ...base,
        algorithm: "none",
        paletteId:
          analysis.paletteSuitability > 0.46 && analysis.meanSaturation > 0.2
            ? "custom"
            : "screenprint-16",
        customPalette:
          analysis.paletteSuitability > 0.46 && analysis.meanSaturation > 0.2
            ? extractPaletteOrFallback(source, analysis, 32)
            : undefined,
        colorDepth: { mode: "full" },
        matchingMode: "perceptual",
        preprocess: {
          ...base.preprocess,
          contrast: 6,
          gamma: 1,
          colorMode: "color-preserve",
        },
      }),
    },
    {
      id: "texture-noise-look",
      label: "Texture/Noise Look",
      intent:
        "Visible screen texture for smooth fields and atmospheric images.",
      snapshot: snapshot("Texture/Noise Look", {
        ...base,
        algorithm:
          analysis.gradientAreaRatio > 0.28 ? "blue-noise" : "halftone-dot",
        paletteId: analysis.meanSaturation > 0.28 ? "risograph" : "blue-ink",
        customPalette: undefined,
        colorDepth: { mode: "full" },
        matchingMode: "perceptual",
        preprocess: {
          ...base.preprocess,
          contrast: analysis.noiseEstimate > 0.25 ? -4 : 8,
          gamma: 1,
          colorMode:
            analysis.meanSaturation > 0.28
              ? "color-preserve"
              : "grayscale-first",
        },
      }),
    },
    {
      id: "soft-poster",
      label: "Soft Poster",
      intent: "Reduced poster color with a quieter tonal curve.",
      snapshot: snapshot("Soft Poster", {
        ...base,
        algorithm: analysis.noiseEstimate > 0.22 ? "stucki" : "none",
        paletteId: analysis.meanSaturation > 0.24 ? "soft-8" : "gray-6",
        customPalette: undefined,
        colorDepth: { mode: "full" },
        matchingMode: "perceptual",
        preprocess: {
          ...base.preprocess,
          contrast: -2,
          gamma: 1.08,
          colorMode:
            analysis.meanSaturation > 0.24
              ? "color-preserve"
              : "grayscale-first",
        },
      }),
    },
    {
      id: "newsprint-mono",
      label: "Newsprint Mono",
      intent: "Halftone newspaper texture with a hard monochrome palette.",
      snapshot: snapshot("Newsprint Mono", {
        ...base,
        algorithm: "halftone-dot",
        paletteId: "black-white",
        customPalette: undefined,
        colorDepth: { mode: "full" },
        matchingMode: "rgb",
        preprocess: {
          ...base.preprocess,
          contrast: 22,
          gamma: 0.95,
          colorMode: "grayscale-first",
        },
      }),
    },
    {
      id: "low-noise-photo",
      label: "Low Noise Photo",
      intent: "Gentler diffusion for scans and noisy photographic sources.",
      snapshot: snapshot("Low Noise Photo", {
        ...base,
        algorithm: analysis.noiseEstimate > 0.18 ? "sierra-lite" : "atkinson",
        paletteId: analysis.meanSaturation > 0.22 ? "screenprint-16" : "gray-6",
        customPalette: undefined,
        colorDepth: { mode: "full" },
        matchingMode: "perceptual",
        preprocess: {
          ...base.preprocess,
          contrast: analysis.noiseEstimate > 0.18 ? -4 : 2,
          gamma: 1,
          colorMode:
            analysis.meanSaturation > 0.22
              ? "color-preserve"
              : "grayscale-first",
        },
      }),
    },
    {
      id: "arcade-color",
      label: "Arcade Color",
      intent: "Game-like ordered color using a compact retro palette.",
      snapshot: snapshot("Arcade Color", {
        ...base,
        algorithm: analysis.edgeDensity > 0.14 ? "bayer" : "sierra-lite",
        bayerSize: 4,
        paletteId: analysis.paletteSuitability > 0.58 ? "pico-8" : "c64",
        customPalette: undefined,
        colorDepth: { mode: "full" },
        matchingMode: "rgb",
        resize: {
          ...base.resize,
          mode: "nearest",
        },
        preprocess: {
          ...base.preprocess,
          contrast: 8,
          gamma: 1,
          colorMode: "color-preserve",
        },
      }),
    },
    {
      id: "ink-wash",
      label: "Ink Wash",
      intent: "Soft monochrome wash with visible grain and less edge bite.",
      snapshot: snapshot("Ink Wash", {
        ...base,
        algorithm: analysis.gradientAreaRatio > 0.22 ? "blue-noise" : "burkes",
        paletteId: analysis.meanSaturation > 0.18 ? "warm-mono" : "blue-ink",
        customPalette: undefined,
        colorDepth: { mode: "full" },
        matchingMode: "perceptual",
        preprocess: {
          ...base.preprocess,
          contrast: 12,
          gamma: 1.12,
          colorMode: "grayscale-first",
        },
      }),
    },
  ]
}

function scoreCandidate(
  id: AutoTuneArchetypeId,
  analysis: AutoTuneAnalysis
): number {
  switch (id) {
    case "clean-reduction":
      return (
        analysis.flatAreaRatio * 2.2 +
        analysis.paletteSuitability * 1.7 -
        analysis.gradientAreaRatio * 0.8 -
        analysis.noiseEstimate * 0.7
      )
    case "fine-ordered-mono":
      return (
        analysis.gradientAreaRatio * 1.5 +
        (1 - analysis.meanSaturation) * 0.9 +
        analysis.colorEntropy * 0.5
      )
    case "high-contrast-ink":
      return analysis.edgeDensity * 2.1 + analysis.histogramSpread * 0.8
    case "screenprint-color":
      return (
        analysis.meanSaturation * 1.8 +
        analysis.colorEntropy * 0.9 +
        analysis.paletteSuitability * 0.4
      )
    case "texture-noise-look":
      return (
        analysis.gradientAreaRatio * 1.2 +
        analysis.flatAreaRatio * 0.7 +
        analysis.outputSize * 0.4 -
        analysis.noiseEstimate * 0.5
      )
    case "soft-poster":
      return (
        analysis.colorEntropy * 0.8 +
        analysis.paletteSuitability * 0.9 +
        (1 - analysis.edgeDensity) * 0.5 -
        analysis.noiseEstimate * 0.4
      )
    case "newsprint-mono":
      return (
        (1 - analysis.meanSaturation) * 0.7 +
        analysis.histogramSpread * 0.7 +
        analysis.edgeDensity * 0.5
      )
    case "low-noise-photo":
      return (
        analysis.noiseEstimate * 1.8 +
        analysis.colorEntropy * 0.7 +
        (1 - analysis.edgeDensity) * 0.4
      )
    case "arcade-color":
      return (
        analysis.meanSaturation * 1.1 +
        analysis.paletteSuitability * 1.1 +
        analysis.edgeDensity * 0.6 -
        analysis.gradientAreaRatio * 0.4
      )
    case "ink-wash":
      return (
        (1 - analysis.meanSaturation) * 0.8 +
        analysis.gradientAreaRatio * 0.7 +
        analysis.flatAreaRatio * 0.3
      )
  }
}

function snapshot(name: string, settings: EditorSettings): LookSnapshot {
  return createLookSnapshot({
    createdAt: AUTO_TUNE_CREATED_AT,
    name,
    settings: normalizeSettings(settings),
  })
}

function getRecommendationCount(analysis: AutoTuneAnalysis): number {
  if (analysis.colorEntropy > 0.58 || analysis.gradientAreaRatio > 0.28) {
    return 5
  }

  return 3
}

function extractPaletteOrFallback(
  source: PixelBuffer,
  analysis: AutoTuneAnalysis,
  size: 8 | 16 | 32
): string[] {
  try {
    const targetSize =
      size === 32 && analysis.uniqueColorApprox < 24
        ? 16
        : size === 8 && analysis.uniqueColorApprox > 96
          ? 16
          : size

    return extractPaletteFromSource(source, targetSize)
  } catch {
    return size === 32
      ? [
          "#111111",
          "#1e3a5f",
          "#2e67b1",
          "#79b7d8",
          "#2f5d50",
          "#6fa35f",
          "#f5e7c8",
          "#e8b647",
          "#b6793b",
          "#9e4638",
          "#cc3d3d",
          "#d97b8f",
          "#6b4c8f",
          "#606975",
          "#a6a6a6",
          "#fffdf7",
        ]
      : ["#111111", "#606975", "#a6a6a6", "#fffdf7"]
  }
}

function sampleSource(source: PixelBuffer): PixelBuffer {
  const maxLongEdge = 512
  const longEdge = Math.max(source.width, source.height)

  if (longEdge <= maxLongEdge) {
    return source
  }

  const scale = maxLongEdge / longEdge
  const width = Math.max(1, Math.round(source.width * scale))
  const height = Math.max(1, Math.round(source.height * scale))
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(source.width - 1, Math.floor(x / scale))
      const sourceY = Math.min(source.height - 1, Math.floor(y / scale))
      const from = (sourceY * source.width + sourceX) * 4
      const to = (y * width + x) * 4

      data[to] = source.data[from]
      data[to + 1] = source.data[from + 1]
      data[to + 2] = source.data[from + 2]
      data[to + 3] = source.data[from + 3]
    }
  }

  return { width, height, data }
}

function analyzeBlock(source: PixelBuffer, x: number, y: number) {
  const values: number[] = []
  let min = 255
  let max = 0
  let edgeTransitions = 0

  for (
    let offsetY = 0;
    offsetY < 4 && y + offsetY < source.height;
    offsetY += 1
  ) {
    for (
      let offsetX = 0;
      offsetX < 4 && x + offsetX < source.width;
      offsetX += 1
    ) {
      const luma = getLuma(readPixel(source, x + offsetX, y + offsetY))
      const previous = values.at(-1)

      if (previous !== undefined && Math.abs(previous - luma) > 36) {
        edgeTransitions += 1
      }

      values.push(luma)
      min = Math.min(min, luma)
      max = Math.max(max, luma)
    }
  }

  if (!values.length) {
    return null
  }

  const mean = values.reduce((total, value) => total + value, 0) / values.length
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) /
    values.length

  return { variance, range: max - min, edgeTransitions }
}

function getEntropy(bins: number[], total: number): number {
  const entropy = bins.reduce((sum, count) => {
    if (count === 0) {
      return sum
    }

    const probability = count / total
    return sum - probability * Math.log2(probability)
  }, 0)

  return clamp01(entropy / Math.log2(bins.length))
}

function readPixel(source: PixelBuffer, x: number, y: number) {
  const index = (y * source.width + x) * 4

  return {
    red: source.data[index],
    green: source.data[index + 1],
    blue: source.data[index + 2],
    alpha: source.data[index + 3],
  }
}

function getLuma(pixel: { red: number; green: number; blue: number }): number {
  return pixel.red * 0.2126 + pixel.green * 0.7152 + pixel.blue * 0.0722
}

function getSaturation(red: number, green: number, blue: number): number {
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)

  if (max === 0) {
    return 0
  }

  return (max - min) / max
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function assertUsableSource(source: PixelBuffer): void {
  if (
    source.width <= 0 ||
    source.height <= 0 ||
    source.data.length < source.width * source.height * 4
  ) {
    throw new Error("Auto-Tune requires a loaded Source Image")
  }
}
