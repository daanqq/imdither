import {
  createLookSnapshot,
  decodeLookPayload,
  encodeLookPayload,
  exportPaletteGpl,
  exportPaletteJson,
  extractLookPayload,
  parsePaletteText,
  safeNormalizeSettings,
  type EditorSettings,
} from "@workspace/core"

import type {
  SettingsTransitionContext,
  SettingsTransitionResult,
} from "./editor-settings-transition"

type TextClipboard = {
  readText: () => Promise<string>
  writeText: (text: string) => Promise<void>
}

type NoticeCallbacks = {
  onErrorChange: (error: string | null) => void
  onSourceNoticeChange: (notice: string | null) => void
}

export async function copySettingsJson({
  clipboard,
  settings,
  onErrorChange,
  onSourceNoticeChange,
}: NoticeCallbacks & {
  clipboard: TextClipboard
  settings: EditorSettings
}): Promise<void> {
  try {
    await clipboard.writeText(JSON.stringify(settings, null, 2))
    onErrorChange(null)
    onSourceNoticeChange("[SETTINGS COPIED TO CLIPBOARD]")
  } catch (settingsError) {
    onErrorChange(
      settingsError instanceof Error
        ? settingsError.message
        : "Settings copy failed"
    )
  }
}

export async function pasteSettingsJson({
  clearAppliedMarker,
  clipboard,
  onErrorChange,
  onSourceNoticeChange,
  transitionContext,
  transitionSettings,
}: NoticeCallbacks & {
  clearAppliedMarker: () => void
  clipboard: TextClipboard
  transitionContext: SettingsTransitionContext
  transitionSettings: (
    transition: { type: "apply-settings"; settings: EditorSettings },
    context: SettingsTransitionContext
  ) => SettingsTransitionResult
}): Promise<void> {
  try {
    const parsed = safeNormalizeSettings(JSON.parse(await clipboard.readText()))

    if (!parsed) {
      onErrorChange("Clipboard JSON does not match settings schema v1")
      return
    }

    const result = transitionSettings(
      { type: "apply-settings", settings: parsed },
      transitionContext
    )
    clearAppliedMarker()
    onErrorChange(null)
    onSourceNoticeChange(
      withTransitionNotice("[SETTINGS PASTED FROM CLIPBOARD]", result)
    )
  } catch (settingsError) {
    onErrorChange(
      settingsError instanceof Error
        ? settingsError.message
        : "Settings paste failed"
    )
  }
}

export async function copyLookPayload({
  clipboard,
  href,
  settings,
  onErrorChange,
  onSourceNoticeChange,
}: NoticeCallbacks & {
  clipboard: TextClipboard
  href: string
  settings: EditorSettings
}): Promise<void> {
  try {
    const payload = encodeLookPayload(createLookSnapshot({ settings }))
    const url = new URL(href)
    url.hash = `look=${payload}`
    await clipboard.writeText(url.toString())
    onErrorChange(null)
    onSourceNoticeChange("[LOOK COPIED TO CLIPBOARD]")
  } catch (lookError) {
    onErrorChange(
      lookError instanceof Error ? lookError.message : "Look copy failed"
    )
  }
}

export async function pasteLookPayload({
  clearAppliedMarker,
  clipboard,
  onErrorChange,
  onSourceNoticeChange,
  transitionContext,
  transitionSettings,
}: NoticeCallbacks & {
  clearAppliedMarker: () => void
  clipboard: TextClipboard
  transitionContext: SettingsTransitionContext
  transitionSettings: (
    transition: { type: "apply-settings"; settings: EditorSettings },
    context: SettingsTransitionContext
  ) => SettingsTransitionResult
}): Promise<void> {
  try {
    applyLookText({
      clearAppliedMarker,
      notice: "[LOOK PASTED FROM CLIPBOARD]",
      onErrorChange,
      onSourceNoticeChange,
      text: await clipboard.readText(),
      transitionContext,
      transitionSettings,
    })
  } catch (lookError) {
    onErrorChange(
      lookError instanceof Error ? lookError.message : "Look paste failed"
    )
  }
}

export function applyLookText({
  clearAppliedMarker,
  notice,
  onErrorChange,
  onSourceNoticeChange,
  text,
  transitionContext,
  transitionSettings,
}: NoticeCallbacks & {
  clearAppliedMarker: () => void
  notice: string
  text: string
  transitionContext: SettingsTransitionContext
  transitionSettings: (
    transition: { type: "apply-settings"; settings: EditorSettings },
    context: SettingsTransitionContext
  ) => SettingsTransitionResult
}): void {
  const payload = extractLookPayload(text)

  if (!payload) {
    throw new Error("Look payload is empty")
  }

  const snapshot = decodeLookPayload(payload)
  const result = transitionSettings(
    { type: "apply-settings", settings: snapshot.settings },
    transitionContext
  )

  clearAppliedMarker()
  onErrorChange(null)
  onSourceNoticeChange(withTransitionNotice(notice, result))
}

export function importPaletteText({
  notice,
  onErrorChange,
  onSourceNoticeChange,
  text,
  transitionContext,
  transitionSettings,
}: NoticeCallbacks & {
  notice: string
  text: string
  transitionContext: SettingsTransitionContext
  transitionSettings: (
    transition: { type: "set-custom-palette"; colors: string[] },
    context: SettingsTransitionContext
  ) => SettingsTransitionResult
}): void {
  const palette = parsePaletteText(text)
  transitionSettings(
    { type: "set-custom-palette", colors: palette.colors },
    transitionContext
  )
  onErrorChange(null)
  onSourceNoticeChange(notice)
}

export async function importPaletteFile({
  file,
  onErrorChange,
  onSourceNoticeChange,
  transitionContext,
  transitionSettings,
}: NoticeCallbacks & {
  file: File
  transitionContext: SettingsTransitionContext
  transitionSettings: (
    transition: { type: "set-custom-palette"; colors: string[] },
    context: SettingsTransitionContext
  ) => SettingsTransitionResult
}): Promise<void> {
  try {
    importPaletteText({
      notice: "[PALETTE IMPORTED]",
      onErrorChange,
      onSourceNoticeChange,
      text: await file.text(),
      transitionContext,
      transitionSettings,
    })
  } catch (paletteError) {
    onErrorChange(
      paletteError instanceof Error
        ? paletteError.message
        : "Palette import failed"
    )
  }
}

export async function importPaletteFromClipboard({
  clipboard,
  onErrorChange,
  onSourceNoticeChange,
  transitionContext,
  transitionSettings,
}: NoticeCallbacks & {
  clipboard: TextClipboard
  transitionContext: SettingsTransitionContext
  transitionSettings: (
    transition: { type: "set-custom-palette"; colors: string[] },
    context: SettingsTransitionContext
  ) => SettingsTransitionResult
}): Promise<void> {
  try {
    importPaletteText({
      notice: "[PALETTE IMPORTED FROM CLIPBOARD]",
      onErrorChange,
      onSourceNoticeChange,
      text: await clipboard.readText(),
      transitionContext,
      transitionSettings,
    })
  } catch (paletteError) {
    onErrorChange(
      paletteError instanceof Error
        ? paletteError.message
        : "Palette clipboard import failed"
    )
  }
}

export async function copyPaletteJson({
  clipboard,
  colors,
  onErrorChange,
  onSourceNoticeChange,
}: NoticeCallbacks & {
  clipboard: TextClipboard
  colors: string[] | undefined
}): Promise<void> {
  if (!colors) {
    onErrorChange("Convert the current preset to Custom before copy")
    return
  }

  try {
    await clipboard.writeText(exportPaletteJson(colors))
    onErrorChange(null)
    onSourceNoticeChange("[PALETTE JSON COPIED TO CLIPBOARD]")
  } catch (paletteError) {
    onErrorChange(
      paletteError instanceof Error
        ? paletteError.message
        : "Palette copy failed"
    )
  }
}

export function exportPaletteAsset({
  colors,
  downloadBlob,
  format,
  onErrorChange,
  onSourceNoticeChange,
}: NoticeCallbacks & {
  colors: string[] | undefined
  downloadBlob: (blob: Blob, filename: string) => void
  format: "gpl" | "json"
}): void {
  if (!colors) {
    onErrorChange("Convert the current preset to Custom before export")
    return
  }

  try {
    if (format === "json") {
      downloadBlob(
        new Blob([exportPaletteJson(colors)], { type: "application/json" }),
        "imdither-palette.json"
      )
      onErrorChange(null)
      onSourceNoticeChange("[PALETTE JSON EXPORTED]")
      return
    }

    downloadBlob(
      new Blob([exportPaletteGpl(colors)], { type: "text/plain" }),
      "imdither-palette.gpl"
    )
    onErrorChange(null)
    onSourceNoticeChange("[PALETTE GPL EXPORTED]")
  } catch (paletteError) {
    onErrorChange(
      paletteError instanceof Error
        ? paletteError.message
        : "Palette export failed"
    )
  }
}

function withTransitionNotice(
  notice: string,
  result: Pick<SettingsTransitionResult, "sourceNotice">
): string {
  return result.sourceNotice ? `${notice} ${result.sourceNotice}` : notice
}
