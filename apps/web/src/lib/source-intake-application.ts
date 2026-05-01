import type { SettingsTransition } from "@/lib/editor-settings-transition"
import { DEFAULT_PREVIEW_VIEWPORT } from "@/lib/preview-viewport"
import {
  createDemoSourceIntake,
  formatSourceNotices,
  intakeImageFile,
  type LoadedSource,
  type SourceIntakeResult,
} from "@/lib/source-intake"
import type { JobStatus } from "@/store/editor-store"

type SourceIntakeApplicationCallbacks = {
  onErrorChange: (error: string | null) => void
  onPreviewCycleReset: () => void
  onPreviewViewportChange: (viewport: typeof DEFAULT_PREVIEW_VIEWPORT) => void
  onSettingsTransition: (
    transition: SettingsTransition,
    context: undefined,
    options: { recordHistory: false }
  ) => void
  onSourceChange: (source: LoadedSource) => void
  onSourceNoticeChange: (notice: string | null) => void
  onStatusChange: (status: JobStatus) => void
}

export function applySourceIntakeResult(
  result: SourceIntakeResult,
  callbacks: SourceIntakeApplicationCallbacks
): boolean {
  if (result.type === "rejected") {
    callbacks.onErrorChange(result.message)
    callbacks.onStatusChange("error")
    return false
  }

  callbacks.onSourceChange(result.source)
  callbacks.onPreviewCycleReset()
  callbacks.onPreviewViewportChange(DEFAULT_PREVIEW_VIEWPORT)
  callbacks.onErrorChange(null)
  callbacks.onSourceNoticeChange(formatSourceNotices(result.notices))
  callbacks.onSettingsTransition(
    {
      type: "set-output-size",
      width: result.outputSize.width,
      height: result.outputSize.height,
    },
    undefined,
    { recordHistory: false }
  )

  return true
}

type FileSourceIntakeCallbacks = {
  intakeImageFile?: (file: File) => Promise<SourceIntakeResult>
  onErrorChange: (error: string | null) => void
  onResult: (result: SourceIntakeResult) => void
  onStatusChange: (status: JobStatus) => void
}

export async function runFileSourceIntake(
  file: File,
  {
    intakeImageFile: intakeFile = intakeImageFile,
    onErrorChange,
    onResult,
    onStatusChange,
  }: FileSourceIntakeCallbacks
): Promise<void> {
  try {
    onStatusChange("processing")
    onResult(await intakeFile(file))
  } catch (fileError) {
    onErrorChange(
      fileError instanceof Error ? fileError.message : "Image decode failed"
    )
    onStatusChange("error")
  }
}

type DemoSourceIntakeCallbacks = {
  createDemoSourceIntake?: () => Promise<SourceIntakeResult>
  isCurrent: () => boolean
  onErrorChange: (error: string | null) => void
  onResult: (result: SourceIntakeResult) => void
  onStatusChange: (status: JobStatus) => void
}

export async function runDemoSourceIntake({
  createDemoSourceIntake: createDemoIntake = createDemoSourceIntake,
  isCurrent,
  onErrorChange,
  onResult,
  onStatusChange,
}: DemoSourceIntakeCallbacks): Promise<void> {
  try {
    onStatusChange("processing")
    const result = await createDemoIntake()

    if (isCurrent()) {
      onResult(result)
    }
  } catch (demoError) {
    if (!isCurrent()) {
      return
    }

    onErrorChange(
      demoError instanceof Error
        ? demoError.message
        : "Demo image failed to load"
    )
    onStatusChange("error")
  }
}
