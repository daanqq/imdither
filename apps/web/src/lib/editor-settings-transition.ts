import {
  DEFAULT_SETTINGS,
  PRESET_PALETTES,
  clampOutputSize,
  getProcessingPreset,
  getProcessingPresetColorMode,
  normalizePaletteColors,
  type ColorMode,
  type AlphaBackground,
  type BayerSize,
  type ColorDepth,
  type DitherAlgorithm,
  type EditorSettings,
  type MatchingMode,
  type ProcessingPresetId,
  type ResizeMode,
} from "@workspace/core"

export type SourceDimensions = {
  width: number
  height: number
}

export type SettingsTransition =
  | {
      type: "set-output-width"
      width: number
    }
  | {
      type: "set-output-size"
      width: number
      height: number
    }
  | {
      type: "set-palette"
      paletteId: string
    }
  | {
      type: "set-custom-palette"
      colors: string[]
    }
  | {
      type: "set-color-mode"
      colorMode: ColorMode
    }
  | {
      type: "set-color-depth"
      colorDepth: ColorDepth
    }
  | {
      type: "set-matching-mode"
      matchingMode: MatchingMode
    }
  | {
      type: "set-preprocess"
      patch: Partial<EditorSettings["preprocess"]>
    }
  | {
      type: "set-algorithm"
      algorithm: DitherAlgorithm
    }
  | {
      type: "set-alpha-background"
      alphaBackground: AlphaBackground
    }
  | {
      type: "set-bayer-size"
      bayerSize: BayerSize
    }
  | {
      type: "set-resize-mode"
      mode: ResizeMode
    }
  | {
      type: "apply-processing-preset"
      presetId: ProcessingPresetId
    }
  | {
      type: "apply-settings"
      settings: EditorSettings
    }
  | {
      type: "reset-defaults"
    }

export type SettingsTransitionContext = {
  sourceDimensions?: SourceDimensions | null
}

export type SettingsTransitionResult = {
  settings: EditorSettings
  sourceNotice?: string | null
}

export function applySettingsTransition(
  current: EditorSettings,
  transition: SettingsTransition,
  context: SettingsTransitionContext = {}
): SettingsTransitionResult {
  switch (transition.type) {
    case "set-output-width": {
      const aspectRatio = getAspectRatio(current, context.sourceDimensions)
      const height = Math.max(1, Math.round(transition.width * aspectRatio))

      return withOutputSize(current, transition.width, height)
    }
    case "set-output-size":
      return withOutputSize(current, transition.width, transition.height)
    case "set-palette": {
      const preset = PRESET_PALETTES.find(
        (palette) => palette.id === transition.paletteId
      )
      const customPaletteReplaced = Boolean(current.customPalette?.length)

      return {
        sourceNotice: customPaletteReplaced
          ? "[CUSTOM PALETTE REPLACED]"
          : undefined,
        settings: {
          ...current,
          customPalette: undefined,
          paletteId: transition.paletteId,
          preprocess: {
            ...current.preprocess,
            colorMode: preset?.defaultColorMode ?? current.preprocess.colorMode,
          },
        },
      }
    }
    case "set-custom-palette":
      return {
        settings: {
          ...current,
          paletteId: "custom",
          customPalette: normalizePaletteColors(transition.colors),
        },
      }
    case "set-color-mode":
      return {
        settings: {
          ...current,
          preprocess: {
            ...current.preprocess,
            colorMode: transition.colorMode,
          },
        },
      }
    case "set-color-depth":
      return {
        settings: {
          ...current,
          colorDepth: transition.colorDepth,
        },
      }
    case "set-matching-mode":
      return {
        settings: {
          ...current,
          matchingMode: transition.matchingMode,
        },
      }
    case "set-preprocess":
      return {
        settings: {
          ...current,
          preprocess: {
            ...current.preprocess,
            ...transition.patch,
          },
        },
      }
    case "set-algorithm":
      return {
        settings: {
          ...current,
          algorithm: transition.algorithm,
        },
      }
    case "set-alpha-background":
      return {
        settings: {
          ...current,
          alphaBackground: transition.alphaBackground,
        },
      }
    case "set-bayer-size":
      return {
        settings: {
          ...current,
          bayerSize: transition.bayerSize,
        },
      }
    case "set-resize-mode":
      return {
        settings: {
          ...current,
          resize: {
            ...current.resize,
            mode: transition.mode,
          },
        },
      }
    case "apply-processing-preset": {
      const preset = getProcessingPreset(transition.presetId)
      const { recipe } = preset
      const customPaletteReplaced = Boolean(current.customPalette?.length)

      return {
        sourceNotice: customPaletteReplaced
          ? "[CUSTOM PALETTE REPLACED]"
          : undefined,
        settings: {
          ...current,
          customPalette: undefined,
          paletteId: recipe.paletteId,
          algorithm: recipe.algorithm,
          bayerSize: recipe.bayerSize ?? current.bayerSize,
          matchingMode: recipe.matchingMode ?? "rgb",
          preprocess: {
            ...current.preprocess,
            colorMode: getProcessingPresetColorMode(recipe),
          },
        },
      }
    }
    case "apply-settings":
      return withAspectLockedWidth(
        transition.settings,
        transition.settings.resize.width,
        context
      )
    case "reset-defaults":
      return withAspectLockedWidth(
        DEFAULT_SETTINGS,
        DEFAULT_SETTINGS.resize.width,
        context
      )
  }
}

function withAspectLockedWidth(
  settings: EditorSettings,
  width: number,
  context: SettingsTransitionContext
): SettingsTransitionResult {
  const aspectRatio = getAspectRatio(settings, context.sourceDimensions)
  const height = Math.max(1, Math.round(width * aspectRatio))

  return withOutputSize(settings, width, height)
}

function withOutputSize(
  settings: EditorSettings,
  width: number,
  height: number
): SettingsTransitionResult {
  const size = clampOutputSize(width, height)

  return {
    sourceNotice: size.downscaled
      ? `[OUTPUT CLAMPED: ${size.width}x${size.height} / 12MP]`
      : undefined,
    settings: {
      ...settings,
      resize: {
        ...settings.resize,
        width: size.width,
        height: size.height,
      },
    },
  }
}

function getAspectRatio(
  settings: EditorSettings,
  sourceDimensions?: SourceDimensions | null
): number {
  if (
    sourceDimensions &&
    sourceDimensions.width > 0 &&
    sourceDimensions.height > 0
  ) {
    return sourceDimensions.height / sourceDimensions.width
  }

  return settings.resize.height / settings.resize.width
}
