import type { EditorSettings } from "@workspace/core"

import {
  applyLookText,
  copyLookPayload,
  copySettingsJson,
  pasteLookPayload,
  pasteSettingsJson,
} from "./clipboard-settings-adapter"
import type {
  SettingsTransition,
  SettingsTransitionContext,
} from "./editor-settings-transition"

export type ClipboardSettingsCommand =
  | { type: "copy-settings"; settings: EditorSettings }
  | { type: "paste-settings" }
  | { type: "copy-look"; settings: EditorSettings; href: string }
  | { type: "paste-look" }
  | { type: "apply-look-from-url"; text: string }

export type ClipboardSettingsAdapter = {
  setError: (error: string | null) => void
  setSourceNotice: (notice: string | null) => void
}

type TextClipboard = {
  readText: () => Promise<string>
  writeText: (text: string) => Promise<void>
}

type ClipboardSettingsOptions = {
  clipboard: TextClipboard
  transitionSettings?: (
    transition: SettingsTransition,
    context?: SettingsTransitionContext
  ) => { settings: EditorSettings; sourceNotice?: string | null }
  clearAppliedMarker?: () => void
  clearLookHash?: () => void
}

export async function executeClipboardCommand(
  command: ClipboardSettingsCommand,
  adapter: ClipboardSettingsAdapter,
  options: ClipboardSettingsOptions,
  transitionContext?: SettingsTransitionContext
): Promise<void> {
  const { setError, setSourceNotice } = adapter

  switch (command.type) {
    case "copy-settings":
      return copySettingsJson({
        clipboard: options.clipboard,
        settings: command.settings,
        onErrorChange: setError,
        onSourceNoticeChange: setSourceNotice,
      })

    case "paste-settings":
      if (!options.transitionSettings) {
        throw new Error("transitionSettings is required for paste-settings")
      }
      return pasteSettingsJson({
        clearAppliedMarker: options.clearAppliedMarker ?? (() => {}),
        clipboard: options.clipboard,
        onErrorChange: setError,
        onSourceNoticeChange: setSourceNotice,
        transitionContext: transitionContext ?? {},
        transitionSettings: options.transitionSettings as NonNullable<
          typeof options.transitionSettings
        >,
      })

    case "copy-look":
      return copyLookPayload({
        clipboard: options.clipboard,
        href: command.href,
        settings: command.settings,
        onErrorChange: setError,
        onSourceNoticeChange: setSourceNotice,
      })

    case "paste-look":
      return pasteLookPayload({
        clearAppliedMarker: options.clearAppliedMarker ?? (() => {}),
        clipboard: options.clipboard,
        onErrorChange: setError,
        onSourceNoticeChange: setSourceNotice,
        transitionContext: transitionContext ?? {},
        transitionSettings: options.transitionSettings as NonNullable<
          typeof options.transitionSettings
        >,
      })

    case "apply-look-from-url":
      try {
        if (!options.transitionSettings) {
          throw new Error("transitionSettings is required for URL look apply")
        }

        applyLookText({
          clearAppliedMarker: options.clearAppliedMarker ?? (() => {}),
          notice: "[LOOK APPLIED FROM URL]",
          onErrorChange: setError,
          onSourceNoticeChange: setSourceNotice,
          text: command.text,
          transitionContext: transitionContext ?? {},
          transitionSettings: options.transitionSettings as NonNullable<
            typeof options.transitionSettings
          >,
        })

        options.clearLookHash?.()
      } catch (lookError) {
        adapter.setError(
          lookError instanceof Error ? lookError.message : "Look import failed"
        )
      }
  }
}
