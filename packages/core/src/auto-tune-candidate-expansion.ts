import { getAutoTuneCandidateDefinition } from "./auto-tune-candidate-definitions"
import { createLookSnapshot } from "./look-snapshot"
import { extractPaletteFromSource } from "./palette-extraction"
import { normalizeSettings } from "./settings"
import type { AutoTuneCandidate } from "./auto-tune"
import type { PaletteExtractionSize } from "./palette-extraction"
import type { EditorSettings, PixelBuffer } from "./types"

const AUTO_TUNE_CREATED_AT = "2026-04-26T00:00:00.000Z"
const DEFAULT_CANDIDATE_POOL_CAP = 80

export function expandAutoTuneCandidateVariants(
  baseCandidates: AutoTuneCandidate[],
  source: PixelBuffer,
  cap = DEFAULT_CANDIDATE_POOL_CAP
): AutoTuneCandidate[] {
  const variants: AutoTuneCandidate[] = []

  for (const candidate of baseCandidates) {
    variants.push(...createCandidateVariants(candidate, source))
  }

  return variants.slice(0, cap)
}

function createCandidateVariants(
  candidate: AutoTuneCandidate,
  source: PixelBuffer
): AutoTuneCandidate[] {
  const settings = candidate.snapshot.settings
  const definition = getAutoTuneCandidateDefinition(candidate.id)
  const unique = new Map<string, AutoTuneCandidate>()

  addUnique(unique, candidate)

  for (const algorithm of definition.variants.algorithms) {
    addUnique(
      unique,
      variant(candidate, {
        algorithm: algorithm.algorithm,
        bayerSize: algorithm.bayerSize ?? settings.bayerSize,
      })
    )
  }

  for (const paletteId of definition.variants.palettes) {
    addUnique(
      unique,
      variant(candidate, {
        paletteId,
        customPalette: undefined,
      })
    )
  }

  for (const matchingMode of definition.variants.matchingModes) {
    addUnique(unique, variant(candidate, { matchingMode }))
  }

  for (const mode of definition.variants.resizeModes) {
    addUnique(
      unique,
      variant(candidate, {
        resize: {
          ...settings.resize,
          mode,
        },
      })
    )
  }

  for (const contrastDelta of definition.variants.contrastDeltas) {
    addUnique(
      unique,
      variant(candidate, {
        preprocess: {
          ...settings.preprocess,
          contrast: clamp(
            settings.preprocess.contrast + contrastDelta,
            -100,
            100
          ),
        },
      })
    )
  }

  for (const gamma of definition.variants.gammaValues) {
    addUnique(
      unique,
      variant(candidate, {
        preprocess: {
          ...settings.preprocess,
          gamma: clamp(gamma, 0.2, 3),
        },
      })
    )
  }

  for (const colorMode of definition.variants.colorModes) {
    addUnique(
      unique,
      variant(candidate, {
        preprocess: {
          ...settings.preprocess,
          colorMode,
        },
      })
    )
  }

  for (const size of definition.variants.extractedPaletteSizes) {
    const customPalette = extractCandidatePalette(source, size)

    if (!customPalette) {
      continue
    }

    addUnique(
      unique,
      variant(candidate, {
        paletteId: "custom",
        customPalette,
      })
    )
  }

  return [...unique.values()]
}

function addUnique(
  candidates: Map<string, AutoTuneCandidate>,
  candidate: AutoTuneCandidate
): void {
  candidates.set(getCandidateVariantKey(candidate), candidate)
}

function variant(
  candidate: AutoTuneCandidate,
  patch: Partial<EditorSettings>
): AutoTuneCandidate {
  const settings = normalizeSettings({
    ...candidate.snapshot.settings,
    ...patch,
    resize: {
      ...candidate.snapshot.settings.resize,
      ...patch.resize,
    },
    preprocess: {
      ...candidate.snapshot.settings.preprocess,
      ...patch.preprocess,
    },
  })

  return {
    ...candidate,
    snapshot: createLookSnapshot({
      createdAt: AUTO_TUNE_CREATED_AT,
      name: candidate.label,
      settings,
    }),
  }
}

function extractCandidatePalette(
  source: PixelBuffer,
  size: PaletteExtractionSize
): string[] | null {
  try {
    return extractPaletteFromSource(source, size)
  } catch {
    return null
  }
}

function getCandidateVariantKey(candidate: AutoTuneCandidate): string {
  const settings = candidate.snapshot.settings

  return [
    candidate.id,
    settings.algorithm,
    settings.paletteId,
    settings.customPalette?.length ?? 0,
    settings.bayerSize,
    settings.matchingMode,
    settings.resize.mode,
    settings.preprocess.contrast,
    settings.preprocess.gamma,
    settings.preprocess.colorMode,
  ].join(":")
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
