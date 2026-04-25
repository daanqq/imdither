import { PRESET_PALETTES } from "./palettes"
import type { DitherAlgorithm } from "./algorithm-registry"
import type { BayerSize, ColorMode, EditorSettings } from "./types"

export type ProcessingPresetId =
  | "mono-bayer"
  | "fine-mono-bayer"
  | "sea-glass-atkinson"
  | "redline-floyd"
  | "poster-blocks"
  | "blue-ink-noise"
  | "halftone-mono"
  | "game-boy-sierra"

export type ProcessingPresetRecipe = {
  paletteId: string
  algorithm: DitherAlgorithm
  bayerSize?: BayerSize
  colorMode?: ColorMode
}

export type ProcessingPresetOption = {
  id: ProcessingPresetId
  label: string
  recipe: ProcessingPresetRecipe
}

export const PROCESSING_PRESET_OPTIONS: readonly ProcessingPresetOption[] = [
  {
    id: "fine-mono-bayer",
    label: "Fine Mono Bayer",
    recipe: {
      paletteId: "gray-4",
      algorithm: "bayer",
      bayerSize: 8,
      colorMode: "grayscale-first",
    },
  },
  {
    id: "mono-bayer",
    label: "Mono Bayer",
    recipe: {
      paletteId: "black-white",
      algorithm: "bayer",
      bayerSize: 4,
      colorMode: "grayscale-first",
    },
  },
  {
    id: "sea-glass-atkinson",
    label: "Sea Glass Atkinson",
    recipe: {
      paletteId: "sea-glass",
      algorithm: "atkinson",
      colorMode: "color-preserve",
    },
  },
  {
    id: "redline-floyd",
    label: "Redline Floyd",
    recipe: {
      paletteId: "redline",
      algorithm: "floyd-steinberg",
      colorMode: "color-preserve",
    },
  },
  {
    id: "poster-blocks",
    label: "Poster Blocks",
    recipe: {
      paletteId: "poster-12",
      algorithm: "none",
      colorMode: "color-preserve",
    },
  },
  {
    id: "blue-ink-noise",
    label: "Blue Ink Noise",
    recipe: {
      paletteId: "blue-ink",
      algorithm: "blue-noise",
      colorMode: "grayscale-first",
    },
  },
  {
    id: "halftone-mono",
    label: "Halftone Mono",
    recipe: {
      paletteId: "black-white",
      algorithm: "halftone-dot",
      colorMode: "grayscale-first",
    },
  },
  {
    id: "game-boy-sierra",
    label: "Game Boy Sierra",
    recipe: {
      paletteId: "game-boy",
      algorithm: "sierra-lite",
      colorMode: "grayscale-first",
    },
  },
]

const PROCESSING_PRESETS_BY_ID = new Map(
  PROCESSING_PRESET_OPTIONS.map((preset) => [preset.id, preset])
)

export function findProcessingPreset(
  id: string
): ProcessingPresetOption | null {
  return PROCESSING_PRESETS_BY_ID.get(id as ProcessingPresetId) ?? null
}

export function getProcessingPreset(id: string): ProcessingPresetOption {
  const preset = findProcessingPreset(id)

  if (!preset) {
    throw new Error(`Unknown processing preset: ${id}`)
  }

  return preset
}

export function matchProcessingPreset(
  settings: EditorSettings
): ProcessingPresetOption | null {
  if (settings.customPalette?.length) {
    return null
  }

  return (
    PROCESSING_PRESET_OPTIONS.find((preset) =>
      settingsMatchRecipe(settings, preset.recipe)
    ) ?? null
  )
}

export function getProcessingPresetColorMode(
  recipe: ProcessingPresetRecipe
): ColorMode {
  return (
    recipe.colorMode ??
    PRESET_PALETTES.find((palette) => palette.id === recipe.paletteId)
      ?.defaultColorMode ??
    "grayscale-first"
  )
}

function settingsMatchRecipe(
  settings: EditorSettings,
  recipe: ProcessingPresetRecipe
): boolean {
  if (
    settings.paletteId !== recipe.paletteId ||
    settings.algorithm !== recipe.algorithm ||
    settings.preprocess.colorMode !== getProcessingPresetColorMode(recipe)
  ) {
    return false
  }

  if (recipe.algorithm === "bayer") {
    return settings.bayerSize === recipe.bayerSize
  }

  return true
}
