import {
  DEFAULT_SETTINGS,
  extractPaletteFromSource,
  normalizeSettings,
  processImage,
  type EditorSettings,
  type FrameSequence,
  type PaletteExtractionSize,
  type PixelBuffer,
} from "@workspace/core"

export type ProcessedFrame = {
  image: PixelBuffer
  frameIndex: number
}

export async function processFrameSequence(
  frameSequence: FrameSequence,
  unsafeSettings: EditorSettings
): Promise<ProcessedFrame[]> {
  const baseSettings = normalizeSettings({
    ...DEFAULT_SETTINGS,
    ...unsafeSettings,
  })
  const temporalStability = baseSettings.temporalStability
  const settingsWithPalette =
    temporalStability === "global-palette"
      ? getGlobalPaletteSettings(frameSequence, baseSettings)
      : baseSettings

  const results: ProcessedFrame[] = []

  // eslint-disable-next-line react-doctor/async-await-in-loop
  for (let i = 0; i < frameSequence.frames.length; i += 1) {
    const processed = processImage(frameSequence.frames[i], settingsWithPalette)
    results.push({ image: processed.image, frameIndex: i })

    // Yield to event loop every frame to avoid blocking the main thread
    if (i < frameSequence.frames.length - 1) {
      // eslint-disable-next-line react-doctor/async-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  return results
}

function getGlobalPaletteSettings(
  frameSequence: FrameSequence,
  settings: EditorSettings
): EditorSettings {
  const combined = combineFramesForPalette(frameSequence)

  try {
    const colors = extractPaletteFromSource(
      combined,
      (settings.palette.extractionSize ?? 8) as PaletteExtractionSize
    )

    return {
      ...settings,
      palette: {
        source: "editorial" as const,
        extractionSize: settings.palette.extractionSize,
        colors,
      },
    }
  } catch {
    // Fallback: use existing settings if extraction fails
    return settings
  }
}

/** Concatenate all frames horizontally into one wide image for palette extraction */
function combineFramesForPalette(frameSequence: FrameSequence): PixelBuffer {
  const { frames, sourceWidth, sourceHeight } = frameSequence
  const totalWidth = sourceWidth * frames.length
  const data = new Uint8ClampedArray(totalWidth * sourceHeight * 4)

  for (let fi = 0; fi < frames.length; fi++) {
    const frame = frames[fi]
    const xOffset = fi * sourceWidth

    // Copy frame pixels at correct offset
    const frameWidth = Math.min(frame.width, sourceWidth)
    const frameHeight = Math.min(frame.height, sourceHeight)

    for (let y = 0; y < frameHeight; y++) {
      const srcRow = y * frame.width * 4
      const dstRow = y * totalWidth * 4 + xOffset * 4

      for (let x = 0; x < frameWidth; x++) {
        const srcIdx = srcRow + x * 4
        const dstIdx = dstRow + x * 4
        data[dstIdx] = frame.data[srcIdx]
        data[dstIdx + 1] = frame.data[srcIdx + 1]
        data[dstIdx + 2] = frame.data[srcIdx + 2]
        data[dstIdx + 3] = frame.data[srcIdx + 3]
      }
    }
  }

  return { width: totalWidth, height: sourceHeight, data }
}
