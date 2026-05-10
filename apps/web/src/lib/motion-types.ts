import type { FrameSequence } from "@workspace/core"

export type AnimatedExportFormat = "gif" | "apng" | "webm"

export type VideoExportSettings = {
  crf: number
}

export function calculateFrameStep(totalFrames: number, cap: number): number {
  if (totalFrames <= 0 || cap <= 0) return 1
  return Math.max(1, Math.ceil(totalFrames / cap))
}

export function sampleFrames(
  frameSequence: FrameSequence,
  step: number
): FrameSequence {
  if (step <= 1) return frameSequence

  const sampled = frameSequence.frames.filter((_, i) => i % step === 0)
  const durations = frameSequence.durationsMs.filter((_, i) => i % step === 0)

  return {
    ...frameSequence,
    frames: sampled,
    durationsMs: durations,
    audioTrack: undefined,
  }
}

export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/x-msvideo",
  "video/mpeg",
  "video/mp2t",
] as const

export const VIDEO_EXTENSIONS = [
  ".mp4",
  ".m4v",
  ".webm",
  ".mov",
  ".mkv",
  ".avi",
  ".mpeg",
  ".mpg",
  ".ts",
] as const

export function isVideoFile(file: File): boolean {
  const mimeMatch = VIDEO_MIME_TYPES.some((t) => file.type.startsWith(t))
  if (mimeMatch) return true
  const name = file.name.toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext))
}
