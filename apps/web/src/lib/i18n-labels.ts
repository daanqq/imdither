import {
  DITHER_ALGORITHM_OPTIONS,
  type AutoTuneRecommendation,
  type DitherAlgorithm,
  type DitherAlgorithmFamily,
} from "@workspace/core"
import type { TFunction } from "i18next"

import type { LookRecipe } from "@/lib/look-recipes"

const ALGORITHM_FAMILY_KEYS: Record<DitherAlgorithmFamily, string> = {
  "Direct Mapping": "manual.algorithmFamilies.directMapping",
  Ordered: "manual.algorithmFamilies.ordered",
  "Error Diffusion": "manual.algorithmFamilies.errorDiffusion",
  "Blue Noise": "manual.algorithmFamilies.blueNoise",
  Halftone: "manual.algorithmFamilies.halftone",
}

const LOCALIZED_ALGORITHM_KEYS: Partial<Record<DitherAlgorithm, string>> = {
  none: "manual.algorithms.none",
  "blue-noise": "manual.algorithms.blue-noise",
  "halftone-dot": "manual.algorithms.halftone-dot",
}

export function getLocalizedAlgorithmFamily(
  family: DitherAlgorithmFamily,
  t: TFunction
): string {
  const key = ALGORITHM_FAMILY_KEYS[family]
  return key ? t(key, { defaultValue: family }) : family
}

export function getLocalizedAlgorithmLabel(
  algorithm: DitherAlgorithm,
  t: TFunction
): string {
  const fallback =
    DITHER_ALGORITHM_OPTIONS.find((option) => option.id === algorithm)?.label ??
    algorithm
  const key = LOCALIZED_ALGORITHM_KEYS[algorithm]
  return key ? t(key, { defaultValue: fallback }) : fallback
}

export function getLocalizedBuiltInRecipeName(
  recipe: Pick<LookRecipe, "id" | "name" | "builtIn">,
  t: TFunction
): string {
  if (!recipe.builtIn) {
    return recipe.name
  }

  return t(`looks.builtIn.${recipe.id}`, { defaultValue: recipe.name })
}

export function getLocalizedAutoTuneLabel(
  recommendation: Pick<AutoTuneRecommendation, "id" | "label">,
  t: TFunction
): string {
  return t(`autoTune.presets.${recommendation.id}.label`, {
    defaultValue: recommendation.label,
  })
}

export function getLocalizedAutoTuneIntent(
  recommendation: Pick<AutoTuneRecommendation, "id" | "intent">,
  t: TFunction
): string {
  return t(`autoTune.presets.${recommendation.id}.intent`, {
    defaultValue: recommendation.intent,
  })
}

export function formatAspectRatio(width: number, height: number): string {
  const safeWidth = Math.max(1, Math.round(width))
  const safeHeight = Math.max(1, Math.round(height))
  const divisor = greatestCommonDivisor(safeWidth, safeHeight)

  return `${safeWidth / divisor}:${safeHeight / divisor}`
}

export function formatByteSize(bytes: number, t: TFunction): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return t("export.sizeUnavailable")
  }

  if (bytes < 1024) {
    return `${Math.round(bytes)} ${t("export.unitBytes")}`
  }

  const kilobytes = bytes / 1024

  if (kilobytes < 1024) {
    const formatted =
      kilobytes >= 100 ? Math.round(kilobytes).toString() : kilobytes.toFixed(1)
    return `${formatted} ${t("export.unitKilobytes")}`
  }

  const megabytes = kilobytes / 1024
  return `${megabytes.toFixed(2)} ${t("export.unitMegabytes")}`
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)

  while (b > 0) {
    const next = a % b
    a = b
    b = next
  }

  return Math.max(1, a)
}
