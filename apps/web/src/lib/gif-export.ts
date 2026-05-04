import { GIFEncoder, applyPalette, type GIFPalette } from "gifenc"
import type { FrameSequence, Palette } from "@workspace/core"

export function encodeFrameSequenceToGif(
  frameSequence: FrameSequence,
  palette: Palette
): Uint8Array {
  const gifencPalette = paletteToGifencPalette(palette)

  if (gifencPalette.length > 256) {
    throw new Error(
      `GIF export limited to 256 colors. Palette has ${gifencPalette.length} colors.`
    )
  }

  const encoder = GIFEncoder()
  const { frames, durationsMs, loopCount } = frameSequence

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i]
    const indexed = applyPalette(frame.data, gifencPalette)

    encoder.writeFrame(indexed, frame.width, frame.height, {
      palette: gifencPalette,
      delay: durationsMs[i] ?? 100,
      repeat: i === 0 ? loopCount : undefined,
    })
  }

  encoder.finish()
  return encoder.bytes()
}

function paletteToGifencPalette(palette: Palette): GIFPalette {
  return palette.colors.map(
    (color) =>
      [color.rgb[0], color.rgb[1], color.rgb[2]] as [number, number, number]
  )
}
