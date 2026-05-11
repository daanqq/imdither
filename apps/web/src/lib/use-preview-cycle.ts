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
import {
  createPreviewCycleApplication,
  type PreviewDisplaySize,
} from "@/lib/preview-cycle-application"

type PreviewCycleParams = {
  processingJobs: ReturnType<typeof createProcessingJobs>
  previewViewportMode: PreviewViewport["mode"]
  settings: EditorSettings
  source: LoadedSource | null
  onErrorChange: (error: string | null) => void
  onMetadataChange: (metadata: ProcessingMetadata | null) => void
  onStatusChange: (status: JobStatus) => void
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
  const [preview, setPreview] = React.useState<PixelBuffer | null>(null)
  const [previewRefiningPending, setPreviewRefiningPending] =
    React.useState(false)
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

  const onErrorChangeRef = React.useRef(onErrorChange)
  const onMetadataChangeRef = React.useRef(onMetadataChange)
  const onStatusChangeRef = React.useRef(onStatusChange)

  React.useLayoutEffect(() => {
    onErrorChangeRef.current = onErrorChange
    onMetadataChangeRef.current = onMetadataChange
    onStatusChangeRef.current = onStatusChange
  }, [onErrorChange, onMetadataChange, onStatusChange])

  const app = React.useMemo(
    () =>
      createPreviewCycleApplication({
        processingJobs,
        adapter: {
          replacePreview: (p) => setPreview(p),
          replacePreviewRefining: (p) => setPreviewRefiningPending(p),
          replaceStatus: (s) => onStatusChangeRef.current(s),
          replaceError: (e) => onErrorChangeRef.current(e),
          replaceMetadata: (m) => onMetadataChangeRef.current(m),
        },
      }),
    [processingJobs]
  )

  const resetPreviewCycle = React.useCallback(() => {
    app.reset()
  }, [app])

  React.useEffect(() => {
    app.refreshPreview({
      source,
      settings,
      previewViewportMode,
      displaySize: previewDisplaySize,
    })

    return () => {
      app.cancel()
    }
  }, [app, source, settings, previewViewportMode, previewDisplaySize])

  return {
    preview,
    previewRefiningPending,
    previewTarget,
    resetPreviewCycle,
    setPreviewDisplaySize,
  }
}
