import { hashPixelBuffer } from "./cache"
import { resolvePalette } from "./palettes"
import { normalizeSettings } from "./settings"
import {
  applyPreprocess,
  ditherAtkinson,
  ditherFloydSteinberg,
  ditherMattParker,
  ditherOrdered,
  flattenAlpha,
  mapToPalette,
  resizeImage,
} from "./stages"
import type {
  EditorSettings,
  PixelBuffer,
  ProcessImageResult,
  StageCache,
} from "./types"

export type ProcessImageOptions = {
  cache?: StageCache
  sourceKey?: string
}

export function processImage(
  input: PixelBuffer,
  unsafeSettings: EditorSettings,
  options: ProcessImageOptions = {}
): ProcessImageResult {
  const startedAt = Date.now()
  const settings = normalizeSettings(unsafeSettings)
  const palette = resolvePalette(settings)
  const sourceKey = options.sourceKey ?? hashPixelBuffer(input)

  const flattened = getOrSet(
    options.cache,
    `flat:${sourceKey}:${settings.alphaBackground}`,
    () => flattenAlpha(input, settings.alphaBackground)
  )
  const resized = getOrSet(
    options.cache,
    `resize:${sourceKey}:${settings.alphaBackground}:${JSON.stringify(settings.resize)}`,
    () => resizeImage(flattened, settings.resize, settings.alphaBackground)
  )
  const preprocessed = getOrSet(
    options.cache,
    `pre:${sourceKey}:${settings.alphaBackground}:${JSON.stringify(settings.resize)}:${JSON.stringify(settings.preprocess)}`,
    () => applyPreprocess(resized, settings.preprocess)
  )

  const image = applyAlgorithm(preprocessed, settings, palette)

  return {
    image,
    metadata: {
      sourceWidth: input.width,
      sourceHeight: input.height,
      outputWidth: settings.resize.width,
      outputHeight: settings.resize.height,
      paletteSize: palette.colors.length,
      algorithmName: algorithmLabel(settings),
      processingTimeMs: Date.now() - startedAt,
      exportFormat: "PNG",
    },
    settings,
    palette,
  }
}

function applyAlgorithm(
  input: PixelBuffer,
  settings: EditorSettings,
  palette: ReturnType<typeof resolvePalette>
): PixelBuffer {
  switch (settings.algorithm) {
    case "none":
      return mapToPalette(input, palette)
    case "bayer":
      return ditherOrdered(input, palette, settings.bayerSize)
    case "matt-parker":
      return ditherMattParker(input, palette)
    case "floyd-steinberg":
      return ditherFloydSteinberg(input, palette)
    case "atkinson":
      return ditherAtkinson(input, palette)
  }
}

function algorithmLabel(settings: EditorSettings): string {
  switch (settings.algorithm) {
    case "none":
      return "None"
    case "bayer":
      return `Bayer ${settings.bayerSize}x${settings.bayerSize}`
    case "matt-parker":
      return "Matt Parker"
    case "floyd-steinberg":
      return "Floyd-Steinberg"
    case "atkinson":
      return "Atkinson"
  }
}

function getOrSet(
  cache: StageCache | undefined,
  key: string,
  createValue: () => PixelBuffer
): PixelBuffer {
  const cached = cache?.get(key)

  if (cached) {
    return cached
  }

  const value = createValue()
  cache?.set(key, value)
  return value
}
