import { getPerceptualColorDistance } from "./auto-tune-perceptual-color"
import { scorePaletteFitForSettings } from "./auto-tune-palette-fit"
import { processImage } from "./process"
import { normalizeSettings } from "./settings"
import type {
  AutoTuneAnalysis,
  AutoTuneCandidate,
  AutoTuneRenderedScore,
} from "./auto-tune"
import type { EditorSettings, PixelBuffer } from "./types"

export function scoreRenderedAutoTuneCandidate(
  source: PixelBuffer,
  candidate: AutoTuneCandidate,
  analysis: AutoTuneAnalysis
): AutoTuneRenderedScore {
  const sample = sampleSource(source)
  const settings = createScoringSettings(candidate.snapshot.settings, sample)
  const rendered = processImage(sample, settings).image
  const metrics = {
    ...compareRenderedOutput(sample, rendered),
    paletteFit: scorePaletteFitForSettings(sample, candidate.snapshot.settings),
  }
  const styleFit =
    candidate.id === "newsprint-mono" || candidate.id === "fine-ordered-mono"
      ? 1 - analysis.meanSaturation * 0.65
      : candidate.snapshot.settings.preprocess.colorMode === "color-preserve"
        ? 0.7 + analysis.meanSaturation * 0.3
        : 0.75
  const totalScore =
    metrics.structureRetention * 0.95 +
    metrics.edgeRetention * 0.55 +
    metrics.perceptualColorFit * 1.35 +
    metrics.paletteFit * 0.55 +
    metrics.textureLevel * 0.2 +
    styleFit * 0.45 -
    metrics.bandingRisk * 0.3 -
    metrics.noiseAmplification * 0.35

  return {
    ...metrics,
    totalScore: roundMetric(totalScore),
  }
}

function createScoringSettings(
  settings: EditorSettings,
  sample: PixelBuffer
): EditorSettings {
  const maxLongEdge = 64
  const longEdge = Math.max(sample.width, sample.height)
  const scale = Math.min(1, maxLongEdge / longEdge)

  return normalizeSettings({
    ...settings,
    resize: {
      ...settings.resize,
      width: Math.max(1, Math.round(sample.width * scale)),
      height: Math.max(1, Math.round(sample.height * scale)),
    },
  })
}

function compareRenderedOutput(
  source: PixelBuffer,
  rendered: PixelBuffer
): Omit<AutoTuneRenderedScore, "totalScore" | "paletteFit"> {
  let lumaDifference = 0
  let colorDifference = 0
  let edgeDifference = 0
  let textureTotal = 0
  let noiseTotal = 0
  const lumaBins = new Set<number>()
  const pixelCount = rendered.width * rendered.height

  for (let y = 0; y < rendered.height; y += 1) {
    for (let x = 0; x < rendered.width; x += 1) {
      const sourcePixel = readScaledPixel(source, x, y, rendered)
      const renderedPixel = readPixel(rendered, x, y)
      const sourceLuma = getLuma(sourcePixel)
      const renderedLuma = getLuma(renderedPixel)
      const colorDistance = getPerceptualColorDistance(
        sourcePixel,
        renderedPixel
      )

      lumaDifference += Math.abs(sourceLuma - renderedLuma)
      colorDifference += colorDistance
      lumaBins.add(Math.round(renderedLuma / 16))

      if (x > 0 && y > 0 && x < rendered.width - 1 && y < rendered.height - 1) {
        const sourceEdge = getEdgeMagnitude(source, x, y, rendered)
        const renderedEdge = getEdgeMagnitude(rendered, x, y, rendered)
        edgeDifference += Math.abs(sourceEdge - renderedEdge)
        textureTotal += Math.min(1, renderedEdge / 255)
        noiseTotal += Math.max(0, renderedEdge - sourceEdge) / 255
      }
    }
  }

  const comparedEdges = Math.max(
    1,
    (rendered.width - 2) * (rendered.height - 2)
  )
  const structureRetention = 1 - lumaDifference / Math.max(1, pixelCount * 255)
  const perceptualColorFit = 1 - colorDifference / Math.max(1, pixelCount * 150)
  const edgeRetention = 1 - edgeDifference / Math.max(1, comparedEdges * 255)
  const textureLevel = textureTotal / comparedEdges
  const bandingRisk = clamp01(1 - lumaBins.size / 16)
  const noiseAmplification = noiseTotal / comparedEdges

  return {
    structureRetention: roundMetric(clamp01(structureRetention)),
    edgeRetention: roundMetric(clamp01(edgeRetention)),
    perceptualColorFit: roundMetric(clamp01(perceptualColorFit)),
    textureLevel: roundMetric(clamp01(textureLevel)),
    bandingRisk: roundMetric(bandingRisk),
    noiseAmplification: roundMetric(clamp01(noiseAmplification)),
  }
}

function sampleSource(source: PixelBuffer): PixelBuffer {
  const maxLongEdge = 256
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

function readScaledPixel(
  source: PixelBuffer,
  x: number,
  y: number,
  target: PixelBuffer
) {
  const sourceX = Math.min(
    source.width - 1,
    Math.floor((x / Math.max(1, target.width)) * source.width)
  )
  const sourceY = Math.min(
    source.height - 1,
    Math.floor((y / Math.max(1, target.height)) * source.height)
  )

  return readPixel(source, sourceX, sourceY)
}

function getEdgeMagnitude(
  source: PixelBuffer,
  x: number,
  y: number,
  target: PixelBuffer
): number {
  const left = getLuma(readScaledPixel(source, x - 1, y, target))
  const right = getLuma(readScaledPixel(source, x + 1, y, target))
  const top = getLuma(readScaledPixel(source, x, y - 1, target))
  const bottom = getLuma(readScaledPixel(source, x, y + 1, target))

  return clamp(Math.hypot(right - left, bottom - top), 0, 255)
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

function roundMetric(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
