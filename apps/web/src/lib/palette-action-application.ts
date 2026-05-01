import {
  exportPaletteGpl,
  exportPaletteJson,
  extractPaletteFromSource as realExtractPaletteFromSource,
  parsePaletteText,
  type EditorSettings,
  type PaletteExtractionSize,
  type PixelBuffer,
} from "@workspace/core"
import type { SettingsTransitionContext } from "./editor-settings-transition"

export type PaletteActionCommand =
  | { type: "import-file"; file: File }
  | { type: "import-clipboard" }
  | { type: "copy-json"; colors: string[] | undefined }
  | { type: "export-json"; colors: string[] | undefined }
  | { type: "export-gpl"; colors: string[] | undefined }
  | { type: "extract"; size: PaletteExtractionSize; source: PixelBuffer | null }

export type PaletteActionAdapter = {
  setError: (error: string | null) => void
  setSourceNotice: (notice: string | null) => void
  clearAppliedMarker: () => void
}

type PaletteActionOptions = {
  clipboard?: {
    readText: () => Promise<string>
    writeText: (text: string) => Promise<void>
  }
  downloadBlob?: (blob: Blob, filename: string) => void
  transitionSettings?: (
    transition: { type: "set-custom-palette"; colors: string[] },
    context?: SettingsTransitionContext
  ) => { settings: EditorSettings }
  extractPaletteFromSource?: (
    buffer: PixelBuffer,
    size: PaletteExtractionSize
  ) => string[]
}

export async function executePaletteCommand(
  command: PaletteActionCommand,
  adapter: PaletteActionAdapter,
  options: PaletteActionOptions = {},
  transitionContext?: SettingsTransitionContext
): Promise<void> {
  switch (command.type) {
    case "import-file":
      return executeImportFile(command, adapter, options, transitionContext)
    case "import-clipboard":
      return executeImportClipboard(
        command,
        adapter,
        options,
        transitionContext
      )
    case "copy-json":
      return executeCopyJson(command, adapter, options)
    case "export-json":
      return executeExportJson(command, adapter, options)
    case "export-gpl":
      return executeExportGpl(command, adapter, options)
    case "extract":
      return executeExtract(command, adapter, options, transitionContext)
  }
}

async function executeImportFile(
  _command: { type: "import-file"; file: File },
  adapter: PaletteActionAdapter,
  options: PaletteActionOptions,
  transitionContext?: SettingsTransitionContext
): Promise<void> {
  try {
    const { transitionSettings } = options

    applyImportPaletteText({
      notice: "[PALETTE IMPORTED]",
      adapter,
      text: await _command.file.text(),
      transitionSettings,
      transitionContext,
    })
  } catch (paletteError) {
    adapter.setError(
      paletteError instanceof Error
        ? paletteError.message
        : "Palette import failed"
    )
  }
}

async function executeImportClipboard(
  _command: { type: "import-clipboard" },
  adapter: PaletteActionAdapter,
  options: PaletteActionOptions,
  transitionContext?: SettingsTransitionContext
): Promise<void> {
  const { clipboard, transitionSettings } = options

  if (!clipboard) {
    throw new Error("clipboard is required for palette clipboard import")
  }

  try {
    applyImportPaletteText({
      notice: "[PALETTE IMPORTED FROM CLIPBOARD]",
      adapter,
      text: await clipboard.readText(),
      transitionSettings,
      transitionContext,
    })
  } catch (paletteError) {
    adapter.setError(
      paletteError instanceof Error
        ? paletteError.message
        : "Palette clipboard import failed"
    )
  }
}

function applyImportPaletteText({
  notice,
  adapter,
  text,
  transitionSettings,
  transitionContext,
}: {
  notice: string
  adapter: PaletteActionAdapter
  text: string
  transitionSettings?: PaletteActionOptions["transitionSettings"]
  transitionContext?: SettingsTransitionContext
}): void {
  if (!transitionSettings) {
    throw new Error("transitionSettings is required for palette import")
  }

  const palette = parsePaletteText(text)
  transitionSettings(
    { type: "set-custom-palette", colors: palette.colors },
    transitionContext
  )
  adapter.setError(null)
  adapter.setSourceNotice(notice)
}

async function executeCopyJson(
  command: { type: "copy-json"; colors: string[] | undefined },
  adapter: PaletteActionAdapter,
  options: PaletteActionOptions
): Promise<void> {
  const { clipboard } = options

  if (!command.colors) {
    adapter.setError("Convert the current preset to Custom before copy")
    return
  }

  if (!clipboard) {
    throw new Error("clipboard is required for palette copy")
  }

  try {
    await clipboard.writeText(exportPaletteJson(command.colors))
    adapter.setError(null)
    adapter.setSourceNotice("[PALETTE JSON COPIED TO CLIPBOARD]")
  } catch (paletteError) {
    adapter.setError(
      paletteError instanceof Error
        ? paletteError.message
        : "Palette copy failed"
    )
  }
}

function executeExportJson(
  command: { type: "export-json"; colors: string[] | undefined },
  adapter: PaletteActionAdapter,
  options: PaletteActionOptions
): void {
  executeExportAsset(command, adapter, options, "json")
}

function executeExportGpl(
  command: { type: "export-gpl"; colors: string[] | undefined },
  adapter: PaletteActionAdapter,
  options: PaletteActionOptions
): void {
  executeExportAsset(command, adapter, options, "gpl")
}

function executeExportAsset(
  command: { type: string; colors: string[] | undefined },
  adapter: PaletteActionAdapter,
  options: PaletteActionOptions,
  format: "json" | "gpl"
): void {
  const { downloadBlob } = options

  if (!command.colors) {
    adapter.setError("Convert the current preset to Custom before export")
    return
  }

  if (!downloadBlob) {
    throw new Error("downloadBlob is required for palette export")
  }

  try {
    if (format === "json") {
      downloadBlob(
        new Blob([exportPaletteJson(command.colors)], {
          type: "application/json",
        }),
        "imdither-palette.json"
      )
      adapter.setError(null)
      adapter.setSourceNotice("[PALETTE JSON EXPORTED]")
      return
    }

    downloadBlob(
      new Blob([exportPaletteGpl(command.colors)], { type: "text/plain" }),
      "imdither-palette.gpl"
    )
    adapter.setError(null)
    adapter.setSourceNotice("[PALETTE GPL EXPORTED]")
  } catch (paletteError) {
    adapter.setError(
      paletteError instanceof Error
        ? paletteError.message
        : "Palette export failed"
    )
  }
}

function executeExtract(
  command: {
    type: "extract"
    size: PaletteExtractionSize
    source: PixelBuffer | null
  },
  adapter: PaletteActionAdapter,
  options: PaletteActionOptions,
  transitionContext?: SettingsTransitionContext
): void {
  if (!command.source) {
    adapter.setError("Load a Source Image before extracting a palette")
    return
  }

  const { transitionSettings } = options

  if (!transitionSettings) {
    throw new Error("transitionSettings is required for palette extraction")
  }

  const extractFn =
    options.extractPaletteFromSource ?? realExtractPaletteFromSource

  try {
    const colors = extractFn(command.source, command.size)
    transitionSettings(
      { type: "set-custom-palette", colors },
      transitionContext
    )
    adapter.clearAppliedMarker()
    adapter.setError(null)
    adapter.setSourceNotice(`[PALETTE EXTRACTED: ${command.size} COLORS]`)
  } catch (paletteError) {
    adapter.setError(
      paletteError instanceof Error
        ? paletteError.message
        : "Palette extraction failed"
    )
  }
}
