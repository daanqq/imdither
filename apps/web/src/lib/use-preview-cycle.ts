import * as React from "react"
import type {
  EditorSettings,
  PixelBuffer,
  ProcessingMetadata,
} from "@workspace/core"

import type { LoadedSource } from "@/lib/source-intake"
import { createProcessingJobs } from "@/lib/processing-jobs"
import { getScreenPreviewTarget } from "@/lib/screen-preview"
import type { PreviewViewport } from "@/lib/preview-viewport"
import type { JobStatus } from "@/store/editor-store"

type PreviewCycleParams = {
  processingJobs: ReturnType<typeof createProcessingJobs>
  previewViewportMode: PreviewViewport["mode"]
  settings: EditorSettings
  source: LoadedSource | null
  onErrorChange: (error: string | null) => void
  onMetadataChange: (metadata: ProcessingMetadata | null) => void
  onStatusChange: (status: JobStatus) => void
}

type PreviewDisplaySize = {
  height: number
  width: number
}

export function usePreviewCycle({
  processingJobs,
  previewViewportMode,
  settings,
  source,
  onErrorChange,
  onMetadataChange,
  onStatusChange,
}: PreviewCycleParams) {
  const [state, dispatch] = React.useReducer(
    (
      prev: { preview: PixelBuffer | null; previewRefiningPending: boolean },
      action:
        | Partial<{
            preview: PixelBuffer | null
            previewRefiningPending: boolean
          }>
        | ((prev: {
            preview: PixelBuffer | null
            previewRefiningPending: boolean
          }) => Partial<{
            preview: PixelBuffer | null
            previewRefiningPending: boolean
          }>)
    ) => ({
      ...prev,
      ...(typeof action === "function" ? action(prev) : action),
    }),
    {
      preview: null as PixelBuffer | null,
      previewRefiningPending: false,
    }
  )
  const { preview, previewRefiningPending } = state
  const [previewDisplaySize, setPreviewDisplaySize] =
    React.useState<PreviewDisplaySize | null>(null)
  const previewTarget = React.useMemo(
    () =>
      getScreenPreviewTarget({
        displayHeight: previewDisplaySize?.height,
        displayWidth: previewDisplaySize?.width,
        outputHeight: settings.resize.height,
        outputWidth: settings.resize.width,
        viewScale: previewViewportMode === "fit" ? "fit" : "actual",
      }),
    [
      previewDisplaySize?.height,
      previewDisplaySize?.width,
      previewViewportMode,
      settings.resize.height,
      settings.resize.width,
    ]
  )

  const resetPreviewCycle = React.useCallback(() => {
    dispatch({ preview: null, previewRefiningPending: false })
  }, [])

  React.useEffect(() => {
    if (!source) {
      return undefined
    }

    const handle = processingJobs.startPreviewJob({
      sourceKey: source.id,
      image: source.buffer,
      settings,
      previewTarget,
      onEvent: (event) => {
        switch (event.type) {
          case "queued":
            onStatusChange("queued")
            return
          case "processing":
            onStatusChange("processing")
            return
          case "reduced-preview-ready":
            dispatch({
              preview: event.result.image,
              previewRefiningPending: event.willRefine,
            })
            onMetadataChange(event.result.metadata)
            onErrorChange(null)
            onStatusChange("ready")
            return
          case "refined-preview-ready":
            dispatch({
              preview: event.result.image,
              previewRefiningPending: false,
            })
            onMetadataChange(event.result.metadata)
            onErrorChange(null)
            onStatusChange("ready")
            return
          case "failed":
            onErrorChange(event.error.message)
            onStatusChange("error")
            dispatch((prev) => ({
              ...prev,
              previewRefiningPending: false,
            }))
            return
        }
      },
    })

    return () => {
      handle.cancel()
    }
  }, [
    onErrorChange,
    onMetadataChange,
    onStatusChange,
    previewTarget,
    processingJobs,
    settings,
    source,
  ])

  return {
    preview,
    previewRefiningPending,
    previewTarget,
    resetPreviewCycle,
    setPreviewDisplaySize,
  }
}
