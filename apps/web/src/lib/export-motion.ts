import {
  resolvePalette,
  type EditorSettings,
  type FrameSequence,
  type MotionExportSettings,
} from "@workspace/core"
import { encodeFrameSequenceToApng } from "./apng-export"
import { encodeFrameSequenceToGif } from "./gif-export"
import { processFrameSequence } from "./motion-processor"
import type { AnimatedExportFormat, VideoExportSettings } from "./motion-types"

export async function exportGifSequence(
  frameSequence: FrameSequence,
  settings: EditorSettings,
  motion?: MotionExportSettings
): Promise<Blob> {
  const palette = resolvePalette(settings)
  const processedSequence = await buildProcessedSequence(
    frameSequence,
    settings,
    motion
  )
  const bytes = encodeFrameSequenceToGif(processedSequence, palette)
  return new Blob([bytes], { type: "image/gif" })
}

export async function exportWebMSequence(
  frameSequence: FrameSequence,
  settings: EditorSettings,
  motion?: MotionExportSettings,
  videoExport?: VideoExportSettings
): Promise<Blob> {
  const [processedSequence, { encodeFrameSequenceToWebM }] = await Promise.all([
    buildProcessedSequence(frameSequence, settings, motion),
    import("./webm-export"),
  ])

  const bytes = await encodeFrameSequenceToWebM(
    processedSequence,
    videoExport ?? { crf: 30 },
    frameSequence.audioTrack
  )
  return new Blob([bytes], { type: "video/webm" })
}

export async function exportApngSequence(
  frameSequence: FrameSequence,
  settings: EditorSettings,
  motion?: MotionExportSettings
): Promise<Blob> {
  if (frameSequence.frames.length === 0) {
    throw new Error("APNG export requires at least one frame")
  }

  // Save alpha before processing (processImage flattens alpha to 255)
  const originalAlphas = frameSequence.frames.map(extractAlpha)

  const processedSequence = await buildProcessedSequence(
    frameSequence,
    settings,
    motion
  )

  // Restore alpha on processed frames, resampling if dimensions changed
  const framesWithAlpha = processedSequence.frames.map((frame, i) => {
    const origAlpha =
      originalAlphas[i] ?? originalAlphas[originalAlphas.length - 1]
    const alpha = normalizeAlpha(origAlpha, frame.width, frame.height)
    return mergeAlpha(frame, alpha)
  })

  const restored: FrameSequence = {
    ...processedSequence,
    frames: framesWithAlpha,
  }
  const bytes = encodeFrameSequenceToApng(restored)
  return new Blob([bytes], { type: "image/png" })
}

type AlphaChannel = { width: number; height: number; data: Uint8Array }

function extractAlpha(frame: {
  width: number
  height: number
  data: Uint8ClampedArray
}): AlphaChannel {
  const len = frame.width * frame.height
  const data = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    data[i] = frame.data[i * 4 + 3]
  }
  return { width: frame.width, height: frame.height, data }
}

function normalizeAlpha(
  alpha: AlphaChannel,
  targetW: number,
  targetH: number
): Uint8Array {
  if (alpha.width === targetW && alpha.height === targetH) {
    return alpha.data
  }
  const out = new Uint8Array(targetW * targetH)
  for (let y = 0; y < targetH; y++) {
    const sourceY =
      targetH === 1 ? 0 : (y / Math.max(1, targetH - 1)) * (alpha.height - 1)
    const y0 = Math.floor(sourceY)
    const y1 = Math.min(alpha.height - 1, y0 + 1)
    const yWeight = sourceY - y0

    for (let x = 0; x < targetW; x++) {
      const sourceX =
        targetW === 1 ? 0 : (x / Math.max(1, targetW - 1)) * (alpha.width - 1)
      const x0 = Math.floor(sourceX)
      const x1 = Math.min(alpha.width - 1, x0 + 1)
      const xWeight = sourceX - x0
      const top =
        alpha.data[y0 * alpha.width + x0] * (1 - xWeight) +
        alpha.data[y0 * alpha.width + x1] * xWeight
      const bottom =
        alpha.data[y1 * alpha.width + x0] * (1 - xWeight) +
        alpha.data[y1 * alpha.width + x1] * xWeight

      out[y * targetW + x] = Math.round(top * (1 - yWeight) + bottom * yWeight)
    }
  }
  return out
}

function mergeAlpha(
  frame: { width: number; height: number; data: Uint8ClampedArray },
  alpha: Uint8Array
): typeof frame {
  const next = {
    ...frame,
    data: new Uint8ClampedArray(frame.data),
  }

  for (let i = 0; i < alpha.length; i++) {
    next.data[i * 4 + 3] = alpha[i]
  }

  return next
}

async function buildProcessedSequence(
  frameSequence: FrameSequence,
  settings: EditorSettings,
  motion?: MotionExportSettings
): Promise<FrameSequence> {
  const processed = await processFrameSequence(frameSequence, settings)

  const durationsMs = normalizeDurations(
    frameSequence.durationsMs,
    processed.length,
    motion?.frameDurationMs
  )

  const loopCount = motion?.loopCount ?? frameSequence.loopCount ?? 0

  return {
    ...frameSequence,
    frames: processed.map((p) => p.image),
    durationsMs,
    loopCount,
  }
}

function normalizeDurations(
  sourceDurations: number[] | undefined,
  targetLength: number,
  overrideMs?: number
): number[] {
  if (overrideMs != null) {
    return Array.from({ length: targetLength }, () => overrideMs)
  }
  if (!sourceDurations || sourceDurations.length === 0) {
    return Array.from({ length: targetLength }, () => 100)
  }
  if (sourceDurations.length === targetLength) {
    return sourceDurations
  }
  if (sourceDurations.length > targetLength) {
    return sourceDurations.slice(0, targetLength)
  }
  // Pad with last known duration or 100ms
  const last = sourceDurations[sourceDurations.length - 1] ?? 100
  return [
    ...sourceDurations,
    ...Array.from(
      { length: targetLength - sourceDurations.length },
      () => last
    ),
  ]
}

export function makeMotionExportName(
  baseName: string,
  format: AnimatedExportFormat = "gif"
): string {
  const ext = format === "apng" ? "png" : format === "webm" ? "webm" : "gif"
  const dotIndex = baseName.lastIndexOf(".")

  if (dotIndex > 0) {
    const stem = baseName.slice(0, dotIndex)

    return `${stem}.${ext}`
  }

  return `${baseName}.${ext}`
}
