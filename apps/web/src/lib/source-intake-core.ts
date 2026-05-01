import { createAutoTuneAnalysisSample, type PixelBuffer } from "@workspace/core"

import {
  getOutputAutoSizedNotice,
  getSourceRejectionMessage,
  resolveOutputSizePolicy,
  shouldRejectSourceSize,
  type OutputSizePolicy,
} from "./output-size-policy"

export type LoadedSource = {
  id: string
  name: string
  buffer: PixelBuffer
  autoTuneAnalysisSample: PixelBuffer
  originalWidth: number
  originalHeight: number
}

type LoadedSourceInput = Omit<LoadedSource, "autoTuneAnalysisSample"> & {
  autoTuneAnalysisSample?: PixelBuffer
}

export type SourceNotice = {
  kind: "demo-loaded" | "output-auto-sized"
  message: string
}

export type SourceIntakeResult =
  | {
      type: "accepted"
      source: LoadedSource
      outputSize: OutputSizePolicy
      notices: SourceNotice[]
    }
  | {
      type: "rejected"
      message: string
    }

export function acceptLoadedSource(
  source: LoadedSourceInput,
  initialNotices: SourceNotice[] = []
): SourceIntakeResult {
  if (isOversizedSource(source.buffer.width, source.buffer.height)) {
    return rejectOversizedSource(source.buffer.width, source.buffer.height)
  }

  const acceptedSource = {
    ...source,
    autoTuneAnalysisSample:
      source.autoTuneAnalysisSample ??
      createAutoTuneAnalysisSample(source.buffer),
  }
  const outputSize = resolveOutputSizePolicy(
    source.buffer.width,
    source.buffer.height
  )
  const notices = [...initialNotices]

  if (outputSize.downscaled) {
    notices.push({
      kind: "output-auto-sized",
      message: getOutputAutoSizedNotice(outputSize),
    })
  }

  return {
    type: "accepted",
    source: acceptedSource,
    outputSize,
    notices,
  }
}

export function formatSourceNotices(notices: SourceNotice[]): string | null {
  const message = notices.map((notice) => notice.message).join(" ")
  return message || null
}

export function isOversizedSource(width: number, height: number): boolean {
  return shouldRejectSourceSize(width, height)
}

export function rejectOversizedSource(
  width: number,
  height: number
): SourceIntakeResult {
  return {
    type: "rejected",
    message: getSourceRejectionMessage(width, height),
  }
}
