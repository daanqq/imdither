import {
  ditherAtkinson,
  ditherBlueNoise,
  ditherBurkes,
  ditherFloydSteinberg,
  ditherHalftoneDot,
  ditherMattParker,
  ditherOrdered,
  ditherSierraLite,
  ditherStucki,
  mapToPalette,
} from "./stages"
import type { BayerSize, MatchingMode, Palette, PixelBuffer } from "./types"

export const DITHER_ALGORITHM_IDS = [
  "none",
  "bayer",
  "matt-parker",
  "floyd-steinberg",
  "atkinson",
  "burkes",
  "stucki",
  "sierra-lite",
  "blue-noise",
  "halftone-dot",
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
  matchingMode: MatchingMode
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
    process: (input, palette, settings) =>
      mapToPalette(input, palette, settings.matchingMode),
    metadataLabel: () => "None",
  },
  {
    id: "bayer",
    label: "Bayer",
    capabilities: { bayerSize: true },
    process: (input, palette, settings) =>
      ditherOrdered(input, palette, settings.bayerSize, settings.matchingMode),
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
    process: (input, palette, settings) =>
      ditherFloydSteinberg(input, palette, settings.matchingMode),
    metadataLabel: () => "Floyd-Steinberg",
  },
  {
    id: "atkinson",
    label: "Atkinson",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherAtkinson(input, palette, settings.matchingMode),
    metadataLabel: () => "Atkinson",
  },
  {
    id: "burkes",
    label: "Burkes",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherBurkes(input, palette, settings.matchingMode),
    metadataLabel: () => "Burkes",
  },
  {
    id: "stucki",
    label: "Stucki",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherStucki(input, palette, settings.matchingMode),
    metadataLabel: () => "Stucki",
  },
  {
    id: "sierra-lite",
    label: "Sierra Lite",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherSierraLite(input, palette, settings.matchingMode),
    metadataLabel: () => "Sierra Lite",
  },
  {
    id: "blue-noise",
    label: "Blue Noise",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherBlueNoise(input, palette, settings.matchingMode),
    metadataLabel: () => "Blue Noise",
  },
  {
    id: "halftone-dot",
    label: "Halftone Dot",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherHalftoneDot(input, palette, settings.matchingMode),
    metadataLabel: () => "Halftone Dot",
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
