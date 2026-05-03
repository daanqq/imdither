import {
  ditherAtkinson,
  ditherBlueNoise,
  ditherBurkes,
  ditherFloydSteinberg,
  ditherHalftoneDot,
  ditherJarvisJudiceNinke,
  ditherMattParker,
  ditherOrdered,
  ditherOstromoukhov,
  ditherSierra,
  ditherSierraLite,
  ditherStucki,
  ditherTwoRowSierra,
  mapToPalette,
} from "./stages"
import type {
  BayerSize,
  DitherAlgorithmFamily,
  HalftoneScreenSettings,
  MatchingMode,
  Palette,
  PixelBuffer,
} from "./types"

export const DITHER_ALGORITHM_IDS = [
  "none",
  "bayer",
  "matt-parker",
  "floyd-steinberg",
  "atkinson",
  "burkes",
  "stucki",
  "sierra-lite",
  "jarvis-judice-ninke",
  "sierra",
  "two-row-sierra",
  "ostromoukhov",
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
  family: DitherAlgorithmFamily
  capabilities: DitherAlgorithmCapabilities
}

type DitherAlgorithmSettings = {
  algorithm: DitherAlgorithm
  bayerSize: BayerSize
  matchingMode: MatchingMode
  halftoneScreen: HalftoneScreenSettings
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
    family: "Direct Mapping",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      mapToPalette(input, palette, settings.matchingMode),
    metadataLabel: () => "None",
  },
  {
    id: "bayer",
    label: "Bayer",
    family: "Ordered",
    capabilities: { bayerSize: true },
    process: (input, palette, settings) =>
      ditherOrdered(input, palette, settings.bayerSize, settings.matchingMode),
    metadataLabel: (settings) =>
      `Bayer ${settings.bayerSize}x${settings.bayerSize}`,
  },
  {
    id: "matt-parker",
    label: "Matt Parker",
    family: "Ordered",
    capabilities: { bayerSize: false },
    process: (input, palette) => ditherMattParker(input, palette),
    metadataLabel: () => "Matt Parker",
  },
  {
    id: "floyd-steinberg",
    label: "Floyd-Steinberg",
    family: "Error Diffusion",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherFloydSteinberg(input, palette, settings.matchingMode),
    metadataLabel: () => "Floyd-Steinberg",
  },
  {
    id: "atkinson",
    label: "Atkinson",
    family: "Error Diffusion",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherAtkinson(input, palette, settings.matchingMode),
    metadataLabel: () => "Atkinson",
  },
  {
    id: "burkes",
    label: "Burkes",
    family: "Error Diffusion",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherBurkes(input, palette, settings.matchingMode),
    metadataLabel: () => "Burkes",
  },
  {
    id: "stucki",
    label: "Stucki",
    family: "Error Diffusion",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherStucki(input, palette, settings.matchingMode),
    metadataLabel: () => "Stucki",
  },
  {
    id: "sierra-lite",
    label: "Sierra Lite",
    family: "Error Diffusion",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherSierraLite(input, palette, settings.matchingMode),
    metadataLabel: () => "Sierra Lite",
  },
  {
    id: "jarvis-judice-ninke",
    label: "Jarvis-Judice-Ninke",
    family: "Error Diffusion",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherJarvisJudiceNinke(input, palette, settings.matchingMode),
    metadataLabel: () => "Jarvis-Judice-Ninke",
  },
  {
    id: "sierra",
    label: "Sierra",
    family: "Error Diffusion",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherSierra(input, palette, settings.matchingMode),
    metadataLabel: () => "Sierra",
  },
  {
    id: "two-row-sierra",
    label: "Two-Row Sierra",
    family: "Error Diffusion",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherTwoRowSierra(input, palette, settings.matchingMode),
    metadataLabel: () => "Two-Row Sierra",
  },
  {
    id: "ostromoukhov",
    label: "Ostromoukhov",
    family: "Error Diffusion",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherOstromoukhov(input, palette, settings.matchingMode),
    metadataLabel: () => "Ostromoukhov",
  },
  {
    id: "blue-noise",
    label: "Blue Noise",
    family: "Blue Noise",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherBlueNoise(input, palette, settings.matchingMode),
    metadataLabel: () => "Blue Noise",
  },
  {
    id: "halftone-dot",
    label: "Halftone Dot",
    family: "Halftone",
    capabilities: { bayerSize: false },
    process: (input, palette, settings) =>
      ditherHalftoneDot(
        input,
        palette,
        settings.matchingMode,
        settings.halftoneScreen
      ),
    metadataLabel: () => "Halftone Dot",
  },
]

const DITHER_ALGORITHMS_BY_ID = new Map(
  DITHER_ALGORITHMS.map((algorithm) => [algorithm.id, algorithm])
)

export const DITHER_ALGORITHM_OPTIONS: readonly DitherAlgorithmOption[] =
  DITHER_ALGORITHMS.map(({ id, label, family, capabilities }) => ({
    id,
    label,
    family,
    capabilities,
  }))

function buildAlgorithmsByFamily(): Map<
  DitherAlgorithmFamily,
  DitherAlgorithmOption[]
> {
  const byFamily = new Map<DitherAlgorithmFamily, DitherAlgorithmOption[]>()

  for (const option of DITHER_ALGORITHM_OPTIONS) {
    const existing = byFamily.get(option.family) ?? []

    existing.push(option)
    byFamily.set(option.family, existing)
  }

  return byFamily
}

export const ALGORITHMS_BY_FAMILY = buildAlgorithmsByFamily()

export function getAlgorithmsByFamily(): Map<
  DitherAlgorithmFamily,
  DitherAlgorithmOption[]
> {
  return ALGORITHMS_BY_FAMILY
}

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
  const { id, label, family, capabilities } = getDitherAlgorithm(algorithm)

  return { id, label, family, capabilities }
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
