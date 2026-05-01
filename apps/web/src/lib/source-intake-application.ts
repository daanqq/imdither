import {
  createDemoSourceIntake,
  formatSourceNotices,
  intakeImageFile,
  type LoadedSource,
  type SourceIntakeResult,
} from "@/lib/source-intake"
import type { JobStatus } from "@/store/editor-store"

export type SourceLoadCommand = { kind: "file"; file: File } | { kind: "demo" }

export type SourceIntakeRuntimeAdapter = {
  setStatus: (status: JobStatus) => void
  setSource: (source: LoadedSource) => void
  setSourceNotice: (notice: string | null) => void
  setError: (error: string | null) => void
  resetPreviewCycle: () => void
  resetPreviewViewport: () => void
  applyOutputSizeWithoutHistory: (width: number, height: number) => void
  isCurrent?: () => boolean
}

type ExecuteSourceLoadCommandOptions = {
  intakeImageFile?: (file: File) => Promise<SourceIntakeResult>
  createDemoSourceIntake?: () => Promise<SourceIntakeResult>
}

export async function executeSourceLoadCommand(
  command: SourceLoadCommand,
  adapter: SourceIntakeRuntimeAdapter,
  options?: ExecuteSourceLoadCommandOptions
): Promise<void> {
  const runIntake = options?.intakeImageFile ?? intakeImageFile

  adapter.setStatus("processing")

  if (command.kind === "file") {
    try {
      const result = await runIntake(command.file)
      applyIntakeResult(result, adapter)
    } catch (fileError) {
      adapter.setError(
        fileError instanceof Error ? fileError.message : "Image decode failed"
      )
      adapter.setStatus("error")
    }
  } else {
    const runDemo = options?.createDemoSourceIntake ?? createDemoSourceIntake
    const isCurrent = adapter.isCurrent

    try {
      const result = await runDemo()

      if (isCurrent?.() ?? true) {
        applyIntakeResult(result, adapter)
      }
    } catch (demoError) {
      if (isCurrent?.() ?? true) {
        adapter.setError(
          demoError instanceof Error
            ? demoError.message
            : "Demo image failed to load"
        )
        adapter.setStatus("error")
      }
    }
  }
}

function applyIntakeResult(
  result: SourceIntakeResult,
  adapter: SourceIntakeRuntimeAdapter
): void {
  if (result.type === "rejected") {
    adapter.setError(result.message)
    adapter.setStatus("error")
    return
  }

  adapter.setSource(result.source)
  adapter.resetPreviewCycle()
  adapter.resetPreviewViewport()
  adapter.setError(null)
  adapter.setSourceNotice(formatSourceNotices(result.notices))
  adapter.applyOutputSizeWithoutHistory(
    result.outputSize.width,
    result.outputSize.height
  )
}
