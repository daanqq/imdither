import type { EditorSettings } from "@workspace/core"
import type { AutoTuneRecommendation } from "@workspace/core"
import type { SettingsTransitionContext } from "./editor-settings-transition"

export function applyAutoTuneLookSettings({
  current,
  recommended,
}: {
  current: EditorSettings
  recommended: EditorSettings
}): EditorSettings {
  return {
    ...recommended,
    effectStack: current.effectStack,
    resize: {
      ...recommended.resize,
      height: current.resize.height,
      width: current.resize.width,
    },
  }
}

export type AutoTuneApplyCommand = {
  recommendation: AutoTuneRecommendation
  currentSettings: EditorSettings
}

export type AutoTuneApplyAdapter = {
  markApplied: (recommendationId: string) => void
  setError: (error: string | null) => void
  setSourceNotice: (notice: string | null) => void
}

type AutoTuneApplyOptions = {
  transitionSettings: (
    transition: { type: "apply-settings"; settings: EditorSettings },
    context?: SettingsTransitionContext
  ) => { settings: EditorSettings; sourceNotice?: string | null }
  mergeLookSettings?: (params: {
    current: EditorSettings
    recommended: EditorSettings
  }) => EditorSettings
}

export function applyAutoTuneRecommendation(
  command: AutoTuneApplyCommand,
  adapter: AutoTuneApplyAdapter,
  options: AutoTuneApplyOptions,
  transitionContext?: SettingsTransitionContext
): void {
  const { recommendation, currentSettings } = command
  const merge = options.mergeLookSettings ?? applyAutoTuneLookSettings

  try {
    const mergedSettings = merge({
      current: currentSettings,
      recommended: recommendation.snapshot.settings,
    })

    const result = options.transitionSettings(
      { type: "apply-settings", settings: mergedSettings },
      transitionContext
    )

    adapter.markApplied(recommendation.id)
    adapter.setError(null)
    adapter.setSourceNotice(
      result.sourceNotice
        ? `[AUTO-TUNE APPLIED: ${recommendation.label}] ${result.sourceNotice}`
        : `[AUTO-TUNE APPLIED: ${recommendation.label}]`
    )
  } catch (autoTuneError) {
    adapter.setError(
      autoTuneError instanceof Error
        ? autoTuneError.message
        : "Auto-Tune apply failed"
    )
  }
}
