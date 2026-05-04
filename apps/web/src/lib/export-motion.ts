import {
  resolvePalette,
  type EditorSettings,
  type FrameSequence,
  type MotionExportSettings,
} from "@workspace/core"
import { encodeFrameSequenceToGif } from "./gif-export"
import { processFrameSequence } from "./motion-processor"

export async function exportGifSequence(
  frameSequence: FrameSequence,
  settings: EditorSettings,
  motion?: MotionExportSettings
): Promise<Blob> {
  const palette = resolvePalette(settings)
  const processed = await processFrameSequence(frameSequence, settings)

  const baseDurations =
    frameSequence.durationsMs?.length === processed.length
      ? frameSequence.durationsMs
      : processed.map(() => 100)

  const durationsMs =
    motion != null ? processed.map(() => motion.frameDurationMs) : baseDurations

  const loopCount = motion?.loopCount ?? frameSequence.loopCount ?? 0

  const processedSequence: FrameSequence = {
    ...frameSequence,
    frames: processed.map((p) => p.image),
    durationsMs,
    loopCount,
  }

  const bytes = encodeFrameSequenceToGif(processedSequence, palette)
  return new Blob([bytes], { type: "image/gif" })
}

export function makeMotionExportName(baseName: string): string {
  const dotIndex = baseName.lastIndexOf(".")

  if (dotIndex > 0) {
    const stem = baseName.slice(0, dotIndex)

    return `${stem}.gif`
  }

  return `${baseName}.gif`
}
