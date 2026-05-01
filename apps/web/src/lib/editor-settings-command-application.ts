import type {
  SettingsTransition,
  SettingsTransitionContext,
  SettingsTransitionResult,
} from "./editor-settings-transition"

export type EditorSettingsCommand =
  | { type: "reset-defaults" }
  | { type: "set-output-width"; width: number }
  | { type: "settings-transition"; transition: SettingsTransition }

export type EditorSettingsCommandAdapter = {
  clearAppliedMarker: () => void
}

type EditorSettingsCommandOptions = {
  transitionSettings: (
    transition: SettingsTransition,
    context?: SettingsTransitionContext
  ) => SettingsTransitionResult
}

export function applyEditorSettingsCommand(
  command: EditorSettingsCommand,
  adapter: EditorSettingsCommandAdapter,
  options: EditorSettingsCommandOptions,
  context?: SettingsTransitionContext
): SettingsTransitionResult {
  adapter.clearAppliedMarker()

  const transition: SettingsTransition =
    command.type === "settings-transition" ? command.transition : command

  return options.transitionSettings(transition as SettingsTransition, context)
}
