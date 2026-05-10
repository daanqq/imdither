import type {
  EditorSettings,
  FrameSequence,
  MotionExportSettings,
} from "@workspace/core"

import {
  exportApngSequence as realExportApngSequence,
  exportGifSequence as realExportGifSequence,
  exportWebMSequence as realExportWebMSequence,
  makeMotionExportName,
} from "./export-motion"
import type { AnimatedExportFormat, VideoExportSettings } from "./motion-types"
import type { JobStatus } from "@/store/editor-store"

export type MotionExportActionCommand = {
  frameSequence: FrameSequence | null
  sourceName: string | null
  settings: EditorSettings
  animatedExportFormat: AnimatedExportFormat
  motionExportSettings: MotionExportSettings
  videoExportSettings: VideoExportSettings
  webCodecsAvailable: boolean
}

export type MotionExportActionRuntimeAdapter = {
  setStatus: (status: JobStatus) => void
  setError: (error: string | null) => void
  downloadBlob: (blob: Blob, filename: string) => void
}

type MotionExportEncoder = (
  frameSequence: FrameSequence,
  settings: EditorSettings,
  motionExportSettings: MotionExportSettings,
  videoExportSettings: VideoExportSettings | undefined
) => Promise<Blob>

type MotionExportActionDependencies = {
  exportGifSequence?: MotionExportEncoder
  exportApngSequence?: MotionExportEncoder
  exportWebMSequence?: MotionExportEncoder
}

export async function applyMotionExportAction(
  command: MotionExportActionCommand,
  adapter: MotionExportActionRuntimeAdapter,
  dependencies: MotionExportActionDependencies = {}
): Promise<void> {
  if (!command.frameSequence) {
    return
  }

  try {
    adapter.setStatus("exporting")

    if (
      command.animatedExportFormat === "webm" &&
      !command.webCodecsAvailable
    ) {
      throw new Error("WebM export requires WebCodecs support in this browser")
    }

    const encoder = selectEncoder(command.animatedExportFormat, dependencies)
    const blob = await encoder(
      command.frameSequence,
      command.settings,
      command.motionExportSettings,
      command.animatedExportFormat === "webm"
        ? command.videoExportSettings
        : undefined
    )

    adapter.downloadBlob(
      blob,
      makeMotionExportName(
        command.sourceName ?? fallbackSourceName(command.animatedExportFormat),
        command.animatedExportFormat
      )
    )
    adapter.setError(null)
    adapter.setStatus("ready")
  } catch (error) {
    adapter.setError(
      error instanceof Error
        ? error.message
        : fallbackFailureCopy(command.animatedExportFormat)
    )
    adapter.setStatus("error")
  }
}

function selectEncoder(
  format: AnimatedExportFormat,
  dependencies: MotionExportActionDependencies
): MotionExportEncoder {
  if (format === "apng") {
    return dependencies.exportApngSequence ?? realExportApngSequence
  }

  if (format === "webm") {
    return dependencies.exportWebMSequence ?? realExportWebMSequence
  }

  return dependencies.exportGifSequence ?? realExportGifSequence
}

function fallbackSourceName(format: AnimatedExportFormat): string {
  return `output.${format === "apng" ? "png" : format}`
}

function fallbackFailureCopy(format: AnimatedExportFormat): string {
  return `${format === "apng" ? "APNG" : format === "webm" ? "WebM" : "GIF"} export failed`
}
