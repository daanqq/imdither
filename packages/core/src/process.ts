import { hashPixelBuffer } from "./cache"
import {
  getDitherAlgorithmMetadataLabel,
  processWithDitherAlgorithm,
} from "./algorithm-registry"
import { releasePixelBuffer } from "./buffer-pool"
import { applyEffectStages } from "./effect-registry"
import { getEffectivePalette, resolvePalette } from "./palettes"
import { normalizeSettings } from "./settings"
import { applyPreprocess, flattenAlpha, resizeImage } from "./stages"
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
  const effectivePalette = getEffectivePalette(palette, settings.colorDepth)
  const sourceKey = options.sourceKey ?? hashPixelBuffer(input)

  const flattened = getOrSet(
    options.cache,
    `flat:${sourceKey}:${settings.alphaBackground}`,
    () => flattenAlpha(input, settings.alphaBackground)
  )
  const preStages = settings.effectStack.filter((s) => s.kind === "pre")
  const postStages = settings.effectStack.filter((s) => s.kind === "post")
  const effectStackKey = JSON.stringify(settings.effectStack)

  const resized = getOrSet(
    options.cache,
    `resize:${sourceKey}:${settings.alphaBackground}:${JSON.stringify(settings.resize)}`,
    () => resizeImage(flattened, settings.resize, settings.alphaBackground)
  )

  const effected = applyEffectStages(resized, preStages)

  const preprocessed = getOrSet(
    options.cache,
    `pre:${sourceKey}:${settings.alphaBackground}:${JSON.stringify(settings.resize)}:${JSON.stringify(settings.preprocess)}:${effectStackKey}`,
    () => applyPreprocess(effected, settings.preprocess)
  )

  const dithered = processWithDitherAlgorithm(
    preprocessed,
    settings,
    effectivePalette
  )

  const image = applyEffectStages(dithered, postStages)

  if (!options.cache) {
    if (flattened !== input) releasePixelBuffer(flattened)
    releasePixelBuffer(resized)
    if (effected !== resized) releasePixelBuffer(effected)
    releasePixelBuffer(preprocessed)
    if (dithered !== image) releasePixelBuffer(dithered)
  }

  return {
    image,
    metadata: {
      sourceWidth: input.width,
      sourceHeight: input.height,
      outputWidth: settings.resize.width,
      outputHeight: settings.resize.height,
      paletteSize: effectivePalette.colors.length,
      algorithmName: getDitherAlgorithmMetadataLabel(settings),
      processingTimeMs: Date.now() - startedAt,
      exportFormat: "PNG",
    },
    settings,
    palette,
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
