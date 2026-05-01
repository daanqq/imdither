import type {
  EditorSettings,
  PixelBuffer,
  ProcessingMetadata,
} from "@workspace/core"

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
      exportError instanceof Error ? exportError.message : "Export failed"
    )
    adapter.setStatus("error")
  }
}
