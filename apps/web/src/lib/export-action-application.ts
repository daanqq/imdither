import type {
  EditorSettings,
  PixelBuffer,
  ProcessingMetadata,
} from "@workspace/core"

import i18n from "@/i18n"
import {
  encodePixelBuffer as realEncodePixelBuffer,
  getExportFormatOption,
  makeExportName,
  type EncodePixelBufferOptions,
  type ExportFormat,
} from "@/lib/export-image"
import type { LoadedSource } from "@/lib/source-intake"
import type { DitherJobResult } from "@/lib/worker-client"
import type { JobStatus } from "@/store/editor-store"

export type ExportActionCommand = {
  source: LoadedSource | null
  settings: EditorSettings
  format: ExportFormat
  quality: number
}

export type ExportActionRuntimeAdapter = {
  setStatus: (status: JobStatus) => void
  setError: (error: string | null) => void
  setMetadata: (metadata: ProcessingMetadata | null) => void
  downloadBlob: (blob: Blob, filename: string) => void
}

type ExportJobParams = {
  sourceKey: string
  image: PixelBuffer
  settings: EditorSettings
}

type ExportActionApplicationOptions = {
  runExportJob: (params: ExportJobParams) => Promise<DitherJobResult>
  encodePixelBuffer?: (
    buffer: PixelBuffer,
    options: EncodePixelBufferOptions
  ) => Promise<Blob>
}

export async function applyExportAction(
  command: ExportActionCommand,
  adapter: ExportActionRuntimeAdapter,
  options: ExportActionApplicationOptions
): Promise<void> {
  if (!command.source) {
    return
  }

  if (!options.runExportJob) {
    throw new Error(
      "Export Job dependency is required when a Source Image is present"
    )
  }

  const { runExportJob } = options
  const encode = options.encodePixelBuffer ?? realEncodePixelBuffer

  const { source, settings, format, quality } = command

  adapter.setStatus("exporting")

  try {
    const result = await runExportJob({
      sourceKey: source.id,
      image: source.buffer,
      settings,
    })

    const blob = await encode(result.image, {
      alphaBackground: settings.alphaBackground,
      format,
      quality,
    })

    adapter.downloadBlob(blob, makeExportName(source.name, format))
    adapter.setMetadata({
      ...result.metadata,
      exportFormat: getExportFormatOption(format).label,
    })
    adapter.setError(null)
    adapter.setStatus("ready")
  } catch (exportError) {
    adapter.setError(
      exportError instanceof Error
        ? exportError.message
        : i18n.t("error.exportFailed")
    )
    adapter.setStatus("error")
  }
}

export type CopyImageActionCommand = {
  source: LoadedSource | null
  fallbackBuffer?: PixelBuffer | null
  settings: EditorSettings
}

export type CopyImageActionRuntimeAdapter = {
  setStatus: (status: JobStatus) => void
  setSourceNotice: (notice: string | null) => void
}

type CopyImageActionOptions = {
  runExportJob?: (params: ExportJobParams) => Promise<DitherJobResult>
  encodePixelBuffer?: (
    buffer: PixelBuffer,
    options: EncodePixelBufferOptions
  ) => Promise<Blob>
  writeImageToClipboard?: (blob: Blob) => Promise<void>
}

class CopyImageUnsupportedError extends Error {
  constructor() {
    super("Clipboard image copy is not supported")
  }
}

async function defaultWriteImageToClipboard(blob: Blob): Promise<void> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard?.write ||
    typeof ClipboardItem === "undefined"
  ) {
    throw new CopyImageUnsupportedError()
  }

  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
}

export async function applyCopyImageAction(
  command: CopyImageActionCommand,
  adapter: CopyImageActionRuntimeAdapter,
  options: CopyImageActionOptions = {}
): Promise<void> {
  if (!command.source && !command.fallbackBuffer) {
    return
  }

  if (
    !options.writeImageToClipboard &&
    (typeof navigator === "undefined" ||
      !navigator.clipboard?.write ||
      typeof ClipboardItem === "undefined")
  ) {
    adapter.setSourceNotice("[IMAGE COPY UNSUPPORTED]")
    return
  }

  const encode = options.encodePixelBuffer ?? realEncodePixelBuffer
  const writeImage =
    options.writeImageToClipboard ?? defaultWriteImageToClipboard

  adapter.setStatus("exporting")

  try {
    let imageBuffer: PixelBuffer | null = command.fallbackBuffer ?? null

    if (command.source && options.runExportJob) {
      const result = await options.runExportJob({
        sourceKey: command.source.id,
        image: command.source.buffer,
        settings: command.settings,
      })
      imageBuffer = result.image
    }

    if (!imageBuffer) {
      adapter.setSourceNotice("[IMAGE COPY FAILED]")
      return
    }

    const blob = await encode(imageBuffer, {
      alphaBackground: command.settings.alphaBackground,
      format: "png",
      quality: 1,
    })

    await writeImage(blob)
    adapter.setSourceNotice("[IMAGE COPIED TO CLIPBOARD]")
  } catch (copyError) {
    if (copyError instanceof CopyImageUnsupportedError) {
      adapter.setSourceNotice("[IMAGE COPY UNSUPPORTED]")
    } else {
      adapter.setSourceNotice("[IMAGE COPY FAILED]")
    }
  } finally {
    adapter.setStatus("ready")
  }
}
