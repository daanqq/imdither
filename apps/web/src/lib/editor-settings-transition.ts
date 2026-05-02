import {
  DEFAULT_SETTINGS,
  PRESET_PALETTES,
  buildCompatibilityStack,
  EFFECT_DEFINITIONS,
  getProcessingPreset,
  getProcessingPresetColorMode,
  normalizePaletteColors,
  type ColorMode,
  type AlphaBackground,
  type BayerSize,
  type ColorDepth,
  type DitherAlgorithm,
  type EditorSettings,
  type EffectStage,
  type MatchingMode,
  type ProcessingPresetId,
  type ResizeMode,
  type StageKind,
} from "@workspace/core"

import {
  getOutputClampedNotice,
  resolveOutputSizePolicy,
} from "./output-size-policy"

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
  | {
      type: "add-effect-stage"
      kind: StageKind
      effect: string
    }
  | {
      type: "remove-effect-stage"
      instanceId: string
    }
  | {
      type: "set-effect-stage-enabled"
      instanceId: string
      enabled: boolean
    }
  | {
      type: "set-effect-stage-params"
      instanceId: string
      params: Record<string, number | string | boolean>
    }
  | {
      type: "reorder-effect-stages"
      group: "pre" | "post"
      fromIndex: number
      toIndex: number
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
    case "add-effect-stage": {
      const id = `es-${Math.random().toString(36).slice(2, 10)}`
      const def = EFFECT_DEFINITIONS.find((d) => d.id === transition.effect)
      const defaultParams = def?.defaultParams ?? {}
      const newStage: EffectStage = {
        instanceId: id,
        kind: transition.kind,
        enabled: true,
        params: { effect: transition.effect, ...defaultParams },
      }

      return {
        settings: withCanonicalEffectStack({
          ...current,
          effectStack: [...current.effectStack, newStage],
        }),
      }
    }
    case "remove-effect-stage":
      return {
        settings: withCanonicalEffectStack({
          ...current,
          effectStack: current.effectStack.filter(
            (s) => s.instanceId !== transition.instanceId
          ),
        }),
      }
    case "set-effect-stage-enabled":
      return {
        settings: {
          ...current,
          effectStack: current.effectStack.map((s) =>
            s.instanceId === transition.instanceId
              ? { ...s, enabled: transition.enabled }
              : s
          ),
        },
      }
    case "set-effect-stage-params":
      return {
        settings: {
          ...current,
          effectStack: current.effectStack.map((s) =>
            s.instanceId === transition.instanceId
              ? { ...s, params: transition.params }
              : s
          ),
        },
      }
    case "reorder-effect-stages": {
      const groupStages = current.effectStack
        .map((s, i) => ({ stage: s, index: i }))
        .filter(({ stage }) => stage.kind === transition.group)

      if (
        transition.fromIndex < 0 ||
        transition.fromIndex >= groupStages.length ||
        transition.toIndex < 0 ||
        transition.toIndex >= groupStages.length
      ) {
        return { settings: current }
      }

      const moved = groupStages.splice(transition.fromIndex, 1)[0]
      groupStages.splice(transition.toIndex, 0, moved)

      const newStack = [...current.effectStack]
      const groupIndices = current.effectStack
        .map((s, i) => (s.kind === transition.group ? i : -1))
        .filter((i) => i >= 0)

      for (let i = 0; i < groupIndices.length; i += 1) {
        newStack[groupIndices[i]] = groupStages[i].stage
      }

      return {
        settings: withCanonicalEffectStack({
          ...current,
          effectStack: newStack,
        }),
      }
    }
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
  const size = resolveOutputSizePolicy(width, height)

  return {
    sourceNotice: size.downscaled ? getOutputClampedNotice(size) : undefined,
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

function withCanonicalEffectStack(current: EditorSettings): EditorSettings {
  const pre = current.effectStack.filter((s) => s.kind === "pre")
  const post = current.effectStack.filter((s) => s.kind === "post")
  const core = buildCompatibilityStack(current)

  return {
    ...current,
    effectStack: [...pre, ...core, ...post],
  }
}
