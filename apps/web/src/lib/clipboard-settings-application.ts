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

type ClipboardSettingsReadOptions = {
  clipboard: TextClipboard
}

type ClipboardSettingsWriteOptions = ClipboardSettingsReadOptions & {
  transitionSettings: (
    transition: SettingsTransition,
    context?: SettingsTransitionContext
  ) => { settings: EditorSettings; sourceNotice?: string | null }
  clearAppliedMarker: () => void
  clearLookHash?: () => void
}

export async function executeClipboardCommand(
  command:
    | { type: "copy-settings"; settings: EditorSettings }
    | { type: "copy-look"; settings: EditorSettings; href: string },
  adapter: ClipboardSettingsAdapter,
  options: ClipboardSettingsReadOptions
): Promise<void>
export async function executeClipboardCommand(
  command:
    | { type: "paste-settings" }
    | { type: "paste-look" }
    | { type: "apply-look-from-url"; text: string },
  adapter: ClipboardSettingsAdapter,
  options: ClipboardSettingsWriteOptions,
  transitionContext?: SettingsTransitionContext
): Promise<void>
export async function executeClipboardCommand(
  command: ClipboardSettingsCommand,
  adapter: ClipboardSettingsAdapter,
  options: ClipboardSettingsReadOptions | ClipboardSettingsWriteOptions,
  transitionContext?: SettingsTransitionContext
): Promise<void> {
  const { setError, setSourceNotice } = adapter
  const opts = options as ClipboardSettingsWriteOptions

  switch (command.type) {
    case "copy-settings":
      return copySettingsJson({
        clipboard: options.clipboard,
        settings: command.settings,
        onErrorChange: setError,
        onSourceNoticeChange: setSourceNotice,
      })

    case "paste-settings":
      return pasteSettingsJson({
        clearAppliedMarker: opts.clearAppliedMarker,
        clipboard: options.clipboard,
        onErrorChange: setError,
        onSourceNoticeChange: setSourceNotice,
        transitionContext: transitionContext ?? {},
        transitionSettings: opts.transitionSettings,
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
        clearAppliedMarker: opts.clearAppliedMarker,
        clipboard: options.clipboard,
        onErrorChange: setError,
        onSourceNoticeChange: setSourceNotice,
        transitionContext: transitionContext ?? {},
        transitionSettings: opts.transitionSettings,
      })

    case "apply-look-from-url":
      try {
        applyLookText({
          clearAppliedMarker: opts.clearAppliedMarker,
          notice: "[LOOK APPLIED FROM URL]",
          onErrorChange: setError,
          onSourceNoticeChange: setSourceNotice,
          text: command.text,
          transitionContext: transitionContext ?? {},
          transitionSettings: opts.transitionSettings,
        })

        opts.clearLookHash?.()
      } catch (lookError) {
        adapter.setError(
          lookError instanceof Error ? lookError.message : "Look import failed"
        )
      }
  }
}
