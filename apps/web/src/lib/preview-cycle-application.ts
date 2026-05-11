import type {
  EditorSettings,
  PixelBuffer,
  ProcessingMetadata,
} from "@workspace/core"

import type { LoadedSource } from "@/lib/source-intake"
import type { PreviewViewport } from "@/lib/preview-viewport"
import { getScreenPreviewTarget } from "@/lib/screen-preview"
import type { createProcessingJobs } from "@/lib/processing-jobs"
import type { PreviewJobEvent } from "@/lib/processing-jobs"
import type { JobStatus } from "@/store/editor-store"

export type PreviewCycleRuntimeAdapter = {
  replacePreview: (preview: PixelBuffer | null) => void
  replacePreviewRefining: (pending: boolean) => void
  replaceStatus: (status: JobStatus) => void
  replaceError: (error: string | null) => void
  replaceMetadata: (metadata: ProcessingMetadata | null) => void
}

export type PreviewDisplaySize = {
  height: number
  width: number
}

export type PreviewPreviewTargetParams = {
  displaySize: PreviewDisplaySize | null
  outputHeight: number
  outputWidth: number
  viewportMode: PreviewViewport["mode"]
}

export function getPreviewTarget(
  params: PreviewPreviewTargetParams
): ReturnType<typeof getScreenPreviewTarget> {
  const { displaySize, outputHeight, outputWidth, viewportMode } = params

  return getScreenPreviewTarget({
    displayHeight: displaySize?.height,
    displayWidth: displaySize?.width,
    outputHeight,
    outputWidth,
    viewScale: viewportMode === "fit" ? "fit" : "actual",
  })
}

export type PreviewCycleApplication = {
  refreshPreview: (params: {
    source: LoadedSource | null
    settings: EditorSettings
    previewViewportMode: PreviewViewport["mode"]
    displaySize: PreviewDisplaySize | null
  }) => void
  cancel: () => void
  reset: () => void
}

export function createPreviewCycleApplication(params: {
  processingJobs: ReturnType<typeof createProcessingJobs>
  adapter: PreviewCycleRuntimeAdapter
}): PreviewCycleApplication {
  const { processingJobs, adapter } = params
  let sessionId = 0

  return {
    refreshPreview({ source, settings, previewViewportMode, displaySize }) {
      sessionId++
      const currentSession = sessionId

      if (!source) {
        processingJobs.cancelPreview()
        return
      }

      const previewTarget = getPreviewTarget({
        displaySize,
        outputHeight: settings.resize.height,
        outputWidth: settings.resize.width,
        viewportMode: previewViewportMode,
      })

      processingJobs.startPreviewJob({
        sourceKey: source.id,
        image: source.buffer,
        settings,
        previewTarget,
        onEvent: (event: PreviewJobEvent) => {
          if (sessionId !== currentSession) {
            return
          }

          switch (event.type) {
            case "queued":
            case "processing":
              adapter.replaceStatus(
                event.type === "queued" ? "queued" : "processing"
              )
              return
            case "reduced-preview-ready":
              adapter.replacePreview(event.result.image)
              adapter.replacePreviewRefining(event.willRefine)
              adapter.replaceMetadata(event.result.metadata)
              adapter.replaceError(null)
              adapter.replaceStatus("ready")
              return
            case "refined-preview-ready":
              adapter.replacePreview(event.result.image)
              adapter.replacePreviewRefining(false)
              adapter.replaceMetadata(event.result.metadata)
              adapter.replaceError(null)
              adapter.replaceStatus("ready")
              return
            case "failed":
              adapter.replaceError(event.error.message)
              adapter.replaceStatus("error")
              adapter.replaceMetadata(null)
              adapter.replacePreviewRefining(false)
              return
          }
        },
      })
    },

    cancel() {
      sessionId++
      processingJobs.cancelPreview()
    },

    reset() {
      sessionId++
      processingJobs.cancelPreview()
      adapter.replacePreview(null)
      adapter.replacePreviewRefining(false)
    },
  }
}
