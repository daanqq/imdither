import type { AutoTuneArchetypeId } from "./auto-tune"
import type { DitherAlgorithm } from "./algorithm-registry"
import type { BayerSize, ColorMode, MatchingMode, ResizeMode } from "./types"
import type { PaletteExtractionSize } from "./palette-extraction"

export type AutoTuneAlgorithmVariant = {
  algorithm: DitherAlgorithm
  bayerSize?: BayerSize
}

export type AutoTuneCandidateVariantConfig = {
  algorithms: readonly AutoTuneAlgorithmVariant[]
  palettes: readonly string[]
  matchingModes: readonly MatchingMode[]
  resizeModes: readonly ResizeMode[]
  contrastDeltas: readonly number[]
  gammaValues: readonly number[]
  colorModes: readonly ColorMode[]
  extractedPaletteSizes: readonly PaletteExtractionSize[]
}

export type AutoTuneCandidateDefinition = {
  id: AutoTuneArchetypeId
  label: string
  intent: string
  variants: AutoTuneCandidateVariantConfig
}

const CANDIDATE_DEFINITIONS: AutoTuneCandidateDefinition[] = [
  {
    id: "clean-reduction",
    label: "Clean Reduction",
    intent: "Plain mapped color with minimal texture for logos and flat art.",
    variants: variants({
      algorithms: [{ algorithm: "none" }, { algorithm: "atkinson" }],
      palettes: ["soft-8", "poster-12"],
      matchingModes: ["rgb", "perceptual"],
      contrastDeltas: [-6, 6],
      gammaValues: [0.95],
      colorModes: ["color-preserve"],
      extractedPaletteSizes: [8, 16, 32],
    }),
  },
  {
    id: "fine-ordered-mono",
    label: "Fine Ordered Mono",
    intent:
      "Controlled monochrome Bayer texture for photos and soft gradients.",
    variants: variants({
      algorithms: [
        { algorithm: "bayer", bayerSize: 4 },
        { algorithm: "blue-noise" },
      ],
      palettes: ["black-white", "gray-6"],
      contrastDeltas: [-4, 8],
      gammaValues: [0.92],
    }),
  },
  {
    id: "high-contrast-ink",
    label: "High Contrast Ink",
    intent: "Graphic black and white output with firm edge emphasis.",
    variants: variants({
      algorithms: [
        { algorithm: "atkinson" },
        { algorithm: "floyd-steinberg" },
        { algorithm: "bayer", bayerSize: 4 },
      ],
      palettes: ["black-white", "gray-4"],
      contrastDeltas: [16, 40],
      gammaValues: [0.85, 1],
    }),
  },
  {
    id: "screenprint-color",
    label: "Screenprint Color",
    intent: "Color-preserving print palette with perceptual matching.",
    variants: variants({
      algorithms: [{ algorithm: "none" }, { algorithm: "halftone-dot" }],
      palettes: ["screenprint-16", "poster-12", "risograph"],
      matchingModes: ["rgb", "perceptual"],
      contrastDeltas: [-2, 10],
      gammaValues: [0.95],
      colorModes: ["color-preserve"],
      extractedPaletteSizes: [16, 32],
    }),
  },
  {
    id: "texture-noise-look",
    label: "Texture/Noise Look",
    intent: "Visible screen texture for smooth fields and atmospheric images.",
    variants: variants({
      algorithms: [{ algorithm: "blue-noise" }, { algorithm: "halftone-dot" }],
      palettes: ["blue-ink", "risograph"],
      matchingModes: ["rgb", "perceptual"],
      contrastDeltas: [-6, 12],
      gammaValues: [0.95, 1.05],
    }),
  },
  {
    id: "soft-poster",
    label: "Soft Poster",
    intent: "Reduced poster color with a quieter tonal curve.",
    variants: variants({
      algorithms: [{ algorithm: "none" }, { algorithm: "sierra-lite" }],
      palettes: ["soft-8", "gray-6"],
      matchingModes: ["rgb", "perceptual"],
      contrastDeltas: [-10, 4],
      gammaValues: [0.94, 1.12],
    }),
  },
  {
    id: "newsprint-mono",
    label: "Newsprint Mono",
    intent: "Coarse black and white halftone for print-like source texture.",
    variants: variants({
      algorithms: [
        { algorithm: "halftone-dot" },
        { algorithm: "atkinson" },
        { algorithm: "bayer", bayerSize: 4 },
      ],
      palettes: ["black-white", "gray-4"],
      contrastDeltas: [8, 28],
      gammaValues: [0.85, 1],
    }),
  },
  {
    id: "low-noise-photo",
    label: "Low Noise Photo",
    intent: "Gentler diffusion for scans and noisy photographic sources.",
    variants: variants({
      algorithms: [
        { algorithm: "atkinson" },
        { algorithm: "sierra-lite" },
        { algorithm: "burkes" },
      ],
      palettes: ["gray-6", "soft-8"],
      matchingModes: ["rgb", "perceptual"],
      contrastDeltas: [-8, 2],
      gammaValues: [0.95, 1.05],
    }),
  },
  {
    id: "arcade-color",
    label: "Arcade Color",
    intent: "Game-like ordered color using a compact retro palette.",
    variants: variants({
      algorithms: [
        { algorithm: "bayer", bayerSize: 4 },
        { algorithm: "bayer", bayerSize: 8 },
        { algorithm: "sierra-lite" },
      ],
      palettes: ["pico-8", "c64", "game-boy"],
      matchingModes: ["rgb", "perceptual"],
      resizeModes: ["nearest"],
      contrastDeltas: [0, 14],
      colorModes: ["color-preserve"],
    }),
  },
  {
    id: "ink-wash",
    label: "Ink Wash",
    intent: "Soft monochrome wash with visible grain and less edge bite.",
    variants: variants({
      algorithms: [{ algorithm: "blue-noise" }, { algorithm: "burkes" }],
      palettes: ["warm-mono", "blue-ink"],
      matchingModes: ["rgb", "perceptual"],
      contrastDeltas: [4, 18],
      gammaValues: [1, 1.18],
    }),
  },
]

export function getAutoTuneCandidateDefinitions(): AutoTuneCandidateDefinition[] {
  return CANDIDATE_DEFINITIONS.map(cloneDefinition)
}

export function getAutoTuneCandidateDefinition(
  id: AutoTuneArchetypeId
): AutoTuneCandidateDefinition {
  const definition = CANDIDATE_DEFINITIONS.find(
    (candidateDefinition) => candidateDefinition.id === id
  )

  if (!definition) {
    throw new Error(`Unknown Auto-Tune candidate definition: ${id}`)
  }

  return cloneDefinition(definition)
}

function variants(
  config: Partial<AutoTuneCandidateVariantConfig>
): AutoTuneCandidateVariantConfig {
  return {
    algorithms: config.algorithms ?? [],
    palettes: config.palettes ?? [],
    matchingModes: config.matchingModes ?? [],
    resizeModes: config.resizeModes ?? [],
    contrastDeltas: config.contrastDeltas ?? [],
    gammaValues: config.gammaValues ?? [],
    colorModes: config.colorModes ?? [],
    extractedPaletteSizes: config.extractedPaletteSizes ?? [],
  }
}

function cloneDefinition(
  definition: AutoTuneCandidateDefinition
): AutoTuneCandidateDefinition {
  return {
    ...definition,
    variants: {
      algorithms: definition.variants.algorithms.map((algorithm) => ({
        ...algorithm,
      })),
      palettes: [...definition.variants.palettes],
      matchingModes: [...definition.variants.matchingModes],
      resizeModes: [...definition.variants.resizeModes],
      contrastDeltas: [...definition.variants.contrastDeltas],
      gammaValues: [...definition.variants.gammaValues],
      colorModes: [...definition.variants.colorModes],
      extractedPaletteSizes: [...definition.variants.extractedPaletteSizes],
    },
  }
}
