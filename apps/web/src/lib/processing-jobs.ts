import type { EditorSettings, PixelBuffer } from "@workspace/core"

import { runDitherJob, type DitherJobResult } from "@/lib/worker-client"
import type { PreviewTarget } from "@/lib/screen-preview"

type RunProcessingJobParams = {
  jobId: number
  sourceKey: string
  image: PixelBuffer
  settings: EditorSettings
  signal?: AbortSignal
}

type PreviewJobParams = {
  sourceKey: string
  image: PixelBuffer
  previewTarget?: PreviewTarget | null
  settings: EditorSettings
  onEvent: (event: PreviewJobEvent) => void
}

type ExportJobParams = {
  sourceKey: string
  image: PixelBuffer
  settings: EditorSettings
}

type PreviewJobHandle = {
  cancel: () => void
}

export type PreviewJobEvent =
  | { type: "queued" }
  | { type: "processing" }
  | {
      type: "reduced-preview-ready"
      result: DitherJobResult
      willRefine: boolean
    }
  | { type: "refined-preview-ready"; result: DitherJobResult }
  | { type: "failed"; error: Error }

export type ProcessingJobTimings = {
  queueDelayMs: number
  refineDelayMs: number
  interactivePixelBudget: number
  previewPixelBudget: number
}

export type ProcessingJobsOptions = {
  runJob?: (params: RunProcessingJobParams) => Promise<DitherJobResult>
  timings?: Partial<ProcessingJobTimings>
}

const DEFAULT_TIMINGS: ProcessingJobTimings = {
  queueDelayMs: 120,
  refineDelayMs: 650,
  interactivePixelBudget: 450_000,
  previewPixelBudget: 1_300_000,
}

export function createProcessingJobs(options: ProcessingJobsOptions = {}) {
  const runJob = options.runJob ?? runDitherJob
  const timings = { ...DEFAULT_TIMINGS, ...options.timings }
  let nextJobId = 0
  let activePreview: PreviewJobState | null = null

  const getNextJobId = () => {
    nextJobId += 1
    return nextJobId
  }

  const cancelActivePreview = () => {
    activePreview?.cancel()
    activePreview = null
  }

  return {
    startPreviewJob(params: PreviewJobParams): PreviewJobHandle {
      cancelActivePreview()

      const preview = createPreviewJob(params, {
        getNextJobId,
        runJob,
        timings,
        onCancel: () => {
          if (activePreview === preview) {
            activePreview = null
          }
        },
      })

      activePreview = preview
      preview.start()

      return {
        cancel: preview.cancel,
      }
    },

    async runExportJob(params: ExportJobParams): Promise<DitherJobResult> {
      cancelActivePreview()

      return runJob({
        jobId: getNextJobId(),
        sourceKey: params.sourceKey,
        image: params.image,
        settings: params.settings,
      })
    },

    cancelPreview: cancelActivePreview,
  }
}

type PreviewJobState = {
  start: () => void
  cancel: () => void
}

type PreviewJobDependencies = {
  getNextJobId: () => number
  runJob: (params: RunProcessingJobParams) => Promise<DitherJobResult>
  timings: ProcessingJobTimings
  onCancel: () => void
}

function createPreviewJob(
  params: PreviewJobParams,
  dependencies: PreviewJobDependencies
): PreviewJobState {
  const controller = new AbortController()
  const previewSettings = settingsWithPreviewTarget(
    params.settings,
    params.previewTarget
  )
  const quickSettings = settingsWithinPixelBudget(
    previewSettings,
    dependencies.timings.interactivePixelBudget
  )
  const refinedSettings = settingsWithinPixelBudget(
    previewSettings,
    dependencies.timings.previewPixelBudget
  )
  const shouldRefine =
    quickSettings.resize.width !== refinedSettings.resize.width ||
    quickSettings.resize.height !== refinedSettings.resize.height
  let canceled = false
  let quickTimer: ReturnType<typeof setTimeout> | null = null
  let refineTimer: ReturnType<typeof setTimeout> | null = null

  const isActive = () => !canceled && !controller.signal.aborted

  const cancel = () => {
    if (canceled) {
      return
    }

    canceled = true

    if (quickTimer) {
      clearTimeout(quickTimer)
    }

    if (refineTimer) {
      clearTimeout(refineTimer)
    }

    controller.abort()
    dependencies.onCancel()
  }

  const fail = (error: unknown) => {
    if (!isActive() || isAbortError(error)) {
      return
    }

    params.onEvent({
      type: "failed",
      error: error instanceof Error ? error : new Error("Job failed"),
    })
    cancel()
  }

  const runPreview = async (
    settings: EditorSettings,
    type: "reduced-preview-ready" | "refined-preview-ready"
  ) => {
    if (!isActive()) {
      return
    }

    try {
      const result = await dependencies.runJob({
        jobId: dependencies.getNextJobId(),
        sourceKey: params.sourceKey,
        image: params.image,
        settings,
        signal: controller.signal,
      })

      if (!isActive()) {
        return
      }

      const correctedResult = withExpectedOutputSize(result, params.settings)

      if (type === "reduced-preview-ready") {
        params.onEvent({
          type,
          result: correctedResult,
          willRefine: shouldRefine,
        })
        return
      }

      params.onEvent({ type, result: correctedResult })
    } catch (error) {
      fail(error)
    }
  }

  return {
    start() {
      params.onEvent({ type: "queued" })

      quickTimer = setTimeout(() => {
        if (!isActive()) {
          return
        }

        params.onEvent({ type: "processing" })
        void runPreview(quickSettings, "reduced-preview-ready")
      }, dependencies.timings.queueDelayMs)

      if (shouldRefine) {
        refineTimer = setTimeout(() => {
          void runPreview(refinedSettings, "refined-preview-ready")
        }, dependencies.timings.refineDelayMs)
      }
    },
    cancel,
  }
}

function settingsWithinPixelBudget(
  settings: EditorSettings,
  pixelBudget: number
): EditorSettings {
  const pixels = settings.resize.width * settings.resize.height

  if (pixels <= pixelBudget) {
    return settings
  }

  const scale = Math.sqrt(pixelBudget / pixels)

  return {
    ...settings,
    resize: {
      ...settings.resize,
      width: Math.max(1, Math.floor(settings.resize.width * scale)),
      height: Math.max(1, Math.floor(settings.resize.height * scale)),
    },
  }
}

function settingsWithPreviewTarget(
  settings: EditorSettings,
  previewTarget?: PreviewTarget | null
): EditorSettings {
  if (!previewTarget) {
    return settings
  }

  return {
    ...settings,
    resize: {
      ...settings.resize,
      height: previewTarget.height,
      width: previewTarget.width,
    },
  }
}

function withExpectedOutputSize(
  result: DitherJobResult,
  settings: EditorSettings
): DitherJobResult {
  return {
    ...result,
    metadata: {
      ...result.metadata,
      outputWidth: settings.resize.width,
      outputHeight: settings.resize.height,
    },
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}
