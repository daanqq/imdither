import {
  ditherAtkinson,
  ditherFloydSteinberg,
  ditherMattParker,
  ditherOrdered,
  mapToPalette,
} from "./stages"
import type { BayerSize, Palette, PixelBuffer } from "./types"

export const DITHER_ALGORITHM_IDS = [
  "none",
  "bayer",
  "matt-parker",
  "floyd-steinberg",
  "atkinson",
] as const

export type DitherAlgorithm = (typeof DITHER_ALGORITHM_IDS)[number]

export type DitherAlgorithmCapabilities = {
  bayerSize: boolean
}

export type DitherAlgorithmOption = {
  id: DitherAlgorithm
  label: string
  capabilities: DitherAlgorithmCapabilities
}

type DitherAlgorithmSettings = {
  algorithm: DitherAlgorithm
  bayerSize: BayerSize
}

type DitherAlgorithmDefinition = DitherAlgorithmOption & {
  process: (
    input: PixelBuffer,
    palette: Palette,
    settings: DitherAlgorithmSettings
  ) => PixelBuffer
  metadataLabel: (settings: DitherAlgorithmSettings) => string
}

const DITHER_ALGORITHMS: readonly DitherAlgorithmDefinition[] = [
  {
    id: "none",
    label: "None",
    capabilities: { bayerSize: false },
    process: (input, palette) => mapToPalette(input, palette),
    metadataLabel: () => "None",
  },
  {
    id: "bayer",
    label: "Bayer",
    capabilities: { bayerSize: true },
    process: (input, palette, settings) =>
      ditherOrdered(input, palette, settings.bayerSize),
    metadataLabel: (settings) =>
      `Bayer ${settings.bayerSize}x${settings.bayerSize}`,
  },
  {
    id: "matt-parker",
    label: "Matt Parker",
    capabilities: { bayerSize: false },
    process: (input, palette) => ditherMattParker(input, palette),
    metadataLabel: () => "Matt Parker",
  },
  {
    id: "floyd-steinberg",
    label: "Floyd-Steinberg",
    capabilities: { bayerSize: false },
    process: (input, palette) => ditherFloydSteinberg(input, palette),
    metadataLabel: () => "Floyd-Steinberg",
  },
  {
    id: "atkinson",
    label: "Atkinson",
    capabilities: { bayerSize: false },
    process: (input, palette) => ditherAtkinson(input, palette),
    metadataLabel: () => "Atkinson",
  },
]

const DITHER_ALGORITHMS_BY_ID = new Map(
  DITHER_ALGORITHMS.map((algorithm) => [algorithm.id, algorithm])
)

export const DITHER_ALGORITHM_OPTIONS: readonly DitherAlgorithmOption[] =
  DITHER_ALGORITHMS.map(({ id, label, capabilities }) => ({
    id,
    label,
    capabilities,
  }))

export function processWithDitherAlgorithm(
  input: PixelBuffer,
  settings: DitherAlgorithmSettings,
  palette: Palette
): PixelBuffer {
  return getDitherAlgorithm(settings.algorithm).process(
    input,
    palette,
    settings
  )
}

export function getDitherAlgorithmMetadataLabel(
  settings: DitherAlgorithmSettings
): string {
  return getDitherAlgorithm(settings.algorithm).metadataLabel(settings)
}

export function getDitherAlgorithmOption(
  algorithm: DitherAlgorithm
): DitherAlgorithmOption {
  const { id, label, capabilities } = getDitherAlgorithm(algorithm)

  return { id, label, capabilities }
}

function getDitherAlgorithm(
  algorithm: DitherAlgorithm
): DitherAlgorithmDefinition {
  const definition = DITHER_ALGORITHMS_BY_ID.get(algorithm)

  if (!definition) {
    throw new Error(`Unsupported dither algorithm: ${algorithm}`)
  }

  return definition
}
