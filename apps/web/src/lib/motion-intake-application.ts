import {
  type EditorSettings,
  type FrameSequence,
  type PixelBuffer,
} from "@workspace/core"

import { acceptLoadedSource, type LoadedSource } from "./source-intake"
import type { JobStatus } from "@/store/editor-store"

export type MotionLoadCommand = {
  kind: "gif" | "apng" | "video"
  file: File
}

export type MotionIntakeRuntimeAdapter = {
  applyMotionSource: (frameSequence: FrameSequence, sourceName: string) => void
  applyOutputSizeWithoutHistory: (width: number, height: number) => void
  resetPreviewViewport: () => void
  setError: (error: string | null) => void
  setMotionExportSettings: (settings: {
    frameDurationMs: number
    loopCount: number
  }) => void
  setProcessedFrame: (index: number, frame: PixelBuffer) => void
  setSource: (source: LoadedSource | null) => void
  setStatus: (status: JobStatus) => void
}

type AnimatedJobParams = {
  jobId: number
  file: File
  settings: EditorSettings
  signal: AbortSignal
  onDecoded: (frameSequence: FrameSequence) => void
  onFrame: (frameIndex: number, image: PixelBuffer) => void
}

export type MotionIntakeDependencies = {
  runAnimatedJob: (params: AnimatedJobParams) => Promise<void>
  decodeVideo: (file: File) => Promise<FrameSequence>
}

export class MotionIntakeApplication {
  private currentJobId = 0
  private abortController: AbortController | null = null

  async execute(
    command: MotionLoadCommand,
    adapter: MotionIntakeRuntimeAdapter,
    settings: EditorSettings,
    dependencies: MotionIntakeDependencies
  ): Promise<void> {
    this.abortController?.abort()
    const controller = new AbortController()
    this.abortController = controller
    const jobId = this.currentJobId + 1
    this.currentJobId = jobId

    adapter.setSource(null)
    adapter.setStatus("processing")

    try {
      if (command.kind === "video") {
        const frameSequence = await dependencies.decodeVideo(command.file)

        if (!this.isCurrent(jobId, controller)) {
          return
        }

        this.applyDecodedFrameSequence(frameSequence, command.file, adapter)
        adapter.setStatus("ready")
        return
      }

      await dependencies.runAnimatedJob({
        jobId,
        file: command.file,
        settings,
        signal: controller.signal,
        onDecoded: (frameSequence) => {
          if (this.isCurrent(jobId, controller)) {
            this.applyDecodedFrameSequence(frameSequence, command.file, adapter)
          }
        },
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

      adapter.setError(
        error instanceof Error ? error.message : fallbackError(command.kind)
      )
      adapter.setStatus("error")
    }
  }

  cancel(): void {
    this.abortController?.abort()
    this.currentJobId += 1
  }

  private isCurrent(jobId: number, controller: AbortController): boolean {
    return !controller.signal.aborted && jobId === this.currentJobId
  }

  private applyDecodedFrameSequence(
    frameSequence: FrameSequence,
    file: File,
    adapter: MotionIntakeRuntimeAdapter
  ): void {
    const firstFrame = frameSequence.frames[0]

    if (!firstFrame) {
      return
    }

    const accepted = acceptLoadedSource({
      id: createMotionSourceId(file),
      name: file.name,
      buffer: firstFrame,
      originalWidth: frameSequence.sourceWidth,
      originalHeight: frameSequence.sourceHeight,
    })

    if (accepted.type === "rejected") {
      adapter.setError(accepted.message)
      adapter.setStatus("error")
      return
    }

    adapter.applyMotionSource(frameSequence, file.name)
    adapter.setMotionExportSettings({
      frameDurationMs: frameSequence.durationsMs[0] ?? 100,
      loopCount: frameSequence.loopCount ?? 0,
    })
    adapter.applyOutputSizeWithoutHistory(
      frameSequence.sourceWidth,
      frameSequence.sourceHeight
    )
    adapter.resetPreviewViewport()
    adapter.setError(null)
    adapter.setSource(accepted.source)
  }
}

function createMotionSourceId(file: File): string {
  return `motion-${file.name}-${file.size}-${file.lastModified}`
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

function fallbackError(kind: MotionLoadCommand["kind"]): string {
  return kind === "video" ? "Video intake failed" : "GIF decode failed"
}
