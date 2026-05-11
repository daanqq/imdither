import type {
  EditorSettings,
  FrameSequence,
  PixelBuffer,
} from "@workspace/core"

import {
  executeSourceLoadCommand,
  type SourceIntakeRuntimeAdapter,
} from "@/lib/source-intake-application"
import {
  MotionIntakeApplication,
  type MotionIntakeRuntimeAdapter,
} from "@/lib/motion-intake-application"
import { isVideoFile } from "@/lib/motion-types"
import { hasAcTlChunk as detectApngChunk } from "@/lib/apng-intake-detect"
import type { JobStatus } from "@/store/editor-store"
import type { SourceIntakeResult } from "./source-intake-core"
import type { LoadedSource } from "./source-intake"

export type SourceReplacementCommand =
  | { kind: "demo" }
  | { kind: "file"; file: File }

export type SourceReplacementRuntimeAdapter = {
  setStatus: (status: JobStatus) => void
  setSource: (source: LoadedSource | null) => void
  setSourceNotice: (notice: string | null) => void
  setError: (error: string | null) => void
  resetPreviewCycle: () => void
  resetPreviewViewport: () => void
  applyOutputSizeWithoutHistory: (width: number, height: number) => void
  applyMotionSource: (frameSequence: FrameSequence, sourceName: string) => void
  setMotionExportSettings: (settings: {
    frameDurationMs: number
    loopCount: number
  }) => void
  setProcessedFrame: (index: number, frame: PixelBuffer) => void
  cancelMotionCycle: () => void
  clearMotionState: () => void
  isCurrent?: () => boolean
}

export type SourceReplacementDependencies = {
  intakeImageFile?: (file: File) => Promise<SourceIntakeResult>
  createDemoSourceIntake?: () => Promise<SourceIntakeResult>
  hasAcTlChunk?: (file: File) => Promise<boolean>
  runMotionGifJob: (params: {
    jobId: number
    file: File
    settings: EditorSettings
    signal: AbortSignal
    onDecoded: (frameSequence: FrameSequence) => void
    onFrame: (frameIndex: number, image: PixelBuffer) => void
  }) => Promise<void>
  runMotionApngJob: (params: {
    jobId: number
    file: File
    settings: EditorSettings
    signal: AbortSignal
    onDecoded: (frameSequence: FrameSequence) => void
    onFrame: (frameIndex: number, image: PixelBuffer) => void
  }) => Promise<void>
  decodeVideo: (file: File) => Promise<FrameSequence>
}

export class SourceReplacementApplication {
  private motionIntake = new MotionIntakeApplication()

  async execute(
    command: SourceReplacementCommand,
    adapter: SourceReplacementRuntimeAdapter,
    settings: EditorSettings,
    dependencies: SourceReplacementDependencies
  ): Promise<void> {
    if (command.kind === "demo") {
      this.motionIntake.cancel()
      adapter.cancelMotionCycle()
      adapter.clearMotionState()
      return executeSourceLoadCommand(
        { kind: "demo" },
        this.toSourceIntakeAdapter(adapter),
        { createDemoSourceIntake: dependencies.createDemoSourceIntake }
      )
    }

    const { file } = command

    if (isVideoFile(file)) {
      adapter.resetPreviewCycle()
      return this.motionIntake.execute(
        { kind: "video", file },
        this.toMotionIntakeAdapter(adapter),
        settings,
        {
          runAnimatedJob: dependencies.runMotionGifJob,
          decodeVideo: dependencies.decodeVideo,
        }
      )
    }

    if (file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif")) {
      adapter.resetPreviewCycle()
      return this.motionIntake.execute(
        { kind: "gif", file },
        this.toMotionIntakeAdapter(adapter),
        settings,
        {
          runAnimatedJob: dependencies.runMotionGifJob,
          decodeVideo: dependencies.decodeVideo,
        }
      )
    }

    if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
      const checkApng = dependencies.hasAcTlChunk ?? detectApngChunk
      const isApng = await checkApng(file)

      if (isApng) {
        adapter.resetPreviewCycle()
        return this.motionIntake.execute(
          { kind: "apng", file },
          this.toMotionIntakeAdapter(adapter),
          settings,
          {
            runAnimatedJob: dependencies.runMotionApngJob,
            decodeVideo: dependencies.decodeVideo,
          }
        )
      }
    }

    this.motionIntake.cancel()
    adapter.cancelMotionCycle()
    adapter.clearMotionState()

    return executeSourceLoadCommand(
      { kind: "file", file },
      this.toSourceIntakeAdapter(adapter),
      { intakeImageFile: dependencies.intakeImageFile }
    )
  }

  cancel(): void {
    this.motionIntake.cancel()
  }

  private toMotionIntakeAdapter(
    adapter: SourceReplacementRuntimeAdapter
  ): MotionIntakeRuntimeAdapter {
    return {
      applyMotionSource: adapter.applyMotionSource,
      applyOutputSizeWithoutHistory: adapter.applyOutputSizeWithoutHistory,
      resetPreviewViewport: adapter.resetPreviewViewport,
      setError: adapter.setError,
      setMotionExportSettings: adapter.setMotionExportSettings,
      setProcessedFrame: adapter.setProcessedFrame,
      setSource: adapter.setSource,
      setStatus: adapter.setStatus,
    }
  }

  private toSourceIntakeAdapter(
    adapter: SourceReplacementRuntimeAdapter
  ): SourceIntakeRuntimeAdapter {
    return {
      setStatus: adapter.setStatus,
      setSource: adapter.setSource,
      setSourceNotice: adapter.setSourceNotice,
      setError: adapter.setError,
      resetPreviewCycle: adapter.resetPreviewCycle,
      resetPreviewViewport: adapter.resetPreviewViewport,
      applyOutputSizeWithoutHistory: adapter.applyOutputSizeWithoutHistory,
      isCurrent: adapter.isCurrent,
    }
  }
}
