import { getPerceptualColorDistance } from "./auto-tune-perceptual-color"
import { getEffectivePalette, hexToRgb, resolvePalette } from "./palettes"
import type { EditorSettings, PixelBuffer } from "./types"

type RgbLike = {
  red: number
  green: number
  blue: number
}

export function scorePaletteFitForSettings(
  source: PixelBuffer,
  settings: EditorSettings
): number {
  const palette = getEffectivePalette(
    resolvePalette(settings),
    settings.colorDepth
  )

  return scorePaletteFit(
    source,
    palette.colors.map((color) => color.hex)
  )
}

export function scorePaletteFit(
  source: PixelBuffer,
  paletteHexes: readonly string[]
): number {
  if (paletteHexes.length === 0) {
    return 0
  }

  const palette = paletteHexes.map((hex) => {
    const [red, green, blue] = hexToRgb(hex)

    return { red, green, blue }
  })
  const stride = Math.max(1, Math.floor((source.width * source.height) / 256))
  let distanceTotal = 0
  let compared = 0

  for (
    let pixelIndex = 0;
    pixelIndex < source.width * source.height;
    pixelIndex += stride
  ) {
    const dataIndex = pixelIndex * 4

    if (source.data[dataIndex + 3] === 0) {
      continue
    }

    distanceTotal += getNearestPaletteDistance(
      {
        red: source.data[dataIndex],
        green: source.data[dataIndex + 1],
        blue: source.data[dataIndex + 2],
      },
      palette
    )
    compared += 1
  }

  const averageDistance = distanceTotal / Math.max(1, compared)

  return roundMetric(clamp01(1 - averageDistance / 150))
}

function getNearestPaletteDistance(
  source: RgbLike,
  palette: RgbLike[]
): number {
  return palette.reduce(
    (nearest, color) =>
      Math.min(nearest, getPerceptualColorDistance(source, color)),
    Number.POSITIVE_INFINITY
  )
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function roundMetric(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}
