import {
  MAX_SOURCE_DIMENSION,
  clampOutputSize,
  type PixelBuffer,
} from "@workspace/core"

export type LoadedSource = {
  id: string
  name: string
  buffer: PixelBuffer
  originalWidth: number
  originalHeight: number
}

export type SourceNotice = {
  kind: "demo-loaded" | "output-auto-sized"
  message: string
}

export type SourceIntakeResult =
  | {
      type: "accepted"
      source: LoadedSource
      outputSize: ReturnType<typeof clampOutputSize>
      notices: SourceNotice[]
    }
  | {
      type: "rejected"
      message: string
    }

export function acceptLoadedSource(
  source: LoadedSource,
  initialNotices: SourceNotice[] = []
): SourceIntakeResult {
  if (isOversizedSource(source.buffer.width, source.buffer.height)) {
    return rejectOversizedSource(source.buffer.width, source.buffer.height)
  }

  const outputSize = clampOutputSize(source.buffer.width, source.buffer.height)
  const notices = [...initialNotices]

  if (outputSize.downscaled) {
    notices.push({
      kind: "output-auto-sized",
      message: `[OUTPUT AUTO-SIZED: ${outputSize.width}x${outputSize.height} / 12MP]`,
    })
  }

  return {
    type: "accepted",
    source,
    outputSize,
    notices,
  }
}

export function formatSourceNotices(notices: SourceNotice[]): string | null {
  const message = notices.map((notice) => notice.message).join(" ")
  return message || null
}

export function isOversizedSource(width: number, height: number): boolean {
  return width > MAX_SOURCE_DIMENSION || height > MAX_SOURCE_DIMENSION
}

export function rejectOversizedSource(
  width: number,
  height: number
): SourceIntakeResult {
  return {
    type: "rejected",
    message: `Image is too large (${width}x${height}). Maximum source dimension is ${MAX_SOURCE_DIMENSION}px.`,
  }
}
