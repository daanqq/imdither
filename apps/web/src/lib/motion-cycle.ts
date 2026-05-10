import type {
  EditorSettings,
  FrameSequence,
  PixelBuffer,
} from "@workspace/core"

import type { JobStatus } from "@/store/editor-store"

export type MotionCycleRuntimeAdapter = {
  clearProcessedFrames: () => void
  setError: (error: string | null) => void
  setProcessedFrame: (index: number, frame: PixelBuffer) => void
  setStatus: (status: JobStatus) => void
}

type MotionCycleJobParams = {
  jobId: number
  frameSequence: FrameSequence
  settings: EditorSettings
  signal: AbortSignal
  onFrame: (frameIndex: number, image: PixelBuffer) => void
}

export type MotionCycleDependencies = {
  runFrameSequenceJob: (params: MotionCycleJobParams) => Promise<void>
}

export class MotionCycle {
  private currentJobId = 0
  private abortController: AbortController | null = null

  async start(
    frameSequence: FrameSequence,
    settings: EditorSettings,
    adapter: MotionCycleRuntimeAdapter,
    dependencies: MotionCycleDependencies
  ): Promise<void> {
    this.abortController?.abort()
    const controller = new AbortController()
    this.abortController = controller
    const jobId = this.currentJobId + 1
    this.currentJobId = jobId

    adapter.setStatus("processing")
    adapter.clearProcessedFrames()

    try {
      await dependencies.runFrameSequenceJob({
        jobId,
        frameSequence,
        settings,
        signal: controller.signal,
        onFrame: (frameIndex, image) => {
          if (this.isCurrent(jobId, controller)) {
            adapter.setProcessedFrame(frameIndex, image)
          }
        },
      })

      if (this.isCurrent(jobId, controller)) {
        adapter.setStatus("ready")
      }
    } catch (error) {
      if (isAbortError(error) || !this.isCurrent(jobId, controller)) {
        return
      }

      adapter.setStatus("error")
      adapter.setError(
        error instanceof Error ? error.message : "GIF processing failed"
      )
    }
  }

  cancel(): void {
    this.abortController?.abort()
    this.currentJobId += 1
  }

  private isCurrent(jobId: number, controller: AbortController): boolean {
    return !controller.signal.aborted && jobId === this.currentJobId
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}
