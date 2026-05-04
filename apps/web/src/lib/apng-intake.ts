import { decodeApng } from "fast-png"
import type { FrameSequence } from "@workspace/core"

export function decodeApngToFrameSequence(buffer: ArrayBuffer): FrameSequence {
  const decoded = decodeApng(buffer)

  if (decoded.frames.length === 0) {
    throw new Error("APNG contains no frames")
  }

  const frames = decoded.frames.map((frame) => {
    const data = ensureUint8Clamped(frame.data, decoded.channels)
    return { width: decoded.width, height: decoded.height, data }
  })

  const durationsMs = decoded.frames.map((frame) => {
    const den = frame.delayDenominator || 100
    return Math.round((frame.delayNumber / den) * 1000)
  })

  const loopCount = decoded.numberOfPlays

  return {
    frames,
    durationsMs,
    loopCount,
    sourceWidth: decoded.width,
    sourceHeight: decoded.height,
  }
}

function ensureUint8Clamped(
  data: Uint8Array | Uint16Array,
  channels: number
): Uint8ClampedArray {
  if (data instanceof Uint8Array) {
    if (channels === 4) {
      return new Uint8ClampedArray(
        data.buffer,
        data.byteOffset,
        data.byteLength
      )
    }
    // Convert non-RGBA to RGBA
    return convertToRgba(data, channels)
  }
  // Uint16Array — downsample to 8-bit RGBA
  return downsampleToRgba(data, channels)
}

function convertToRgba(data: Uint8Array, channels: number): Uint8ClampedArray {
  const pixelCount = data.length / channels
  const rgba = new Uint8ClampedArray(pixelCount * 4)
  for (let i = 0; i < pixelCount; i++) {
    const src = i * channels
    const dst = i * 4
    if (channels === 1) {
      rgba[dst] = data[src]
      rgba[dst + 1] = data[src]
      rgba[dst + 2] = data[src]
      rgba[dst + 3] = 255
    } else if (channels === 2) {
      rgba[dst] = data[src]
      rgba[dst + 1] = data[src]
      rgba[dst + 2] = data[src]
      rgba[dst + 3] = data[src + 1]
    } else if (channels === 3) {
      rgba[dst] = data[src]
      rgba[dst + 1] = data[src + 1]
      rgba[dst + 2] = data[src + 2]
      rgba[dst + 3] = 255
    }
  }
  return rgba
}

function downsampleToRgba(
  data: Uint16Array,
  channels: number
): Uint8ClampedArray {
  const pixelCount = data.length / channels
  const rgba = new Uint8ClampedArray(pixelCount * 4)
  for (let i = 0; i < pixelCount; i++) {
    const src = i * channels
    const dst = i * 4
    if (channels === 1) {
      const v = data[src] >> 8
      rgba[dst] = v
      rgba[dst + 1] = v
      rgba[dst + 2] = v
      rgba[dst + 3] = 255
    } else if (channels === 2) {
      const v = data[src] >> 8
      rgba[dst] = v
      rgba[dst + 1] = v
      rgba[dst + 2] = v
      rgba[dst + 3] = data[src + 1] >> 8
    } else if (channels === 3) {
      rgba[dst] = data[src] >> 8
      rgba[dst + 1] = data[src + 1] >> 8
      rgba[dst + 2] = data[src + 2] >> 8
      rgba[dst + 3] = 255
    } else {
      rgba[dst] = data[src] >> 8
      rgba[dst + 1] = data[src + 1] >> 8
      rgba[dst + 2] = data[src + 2] >> 8
      rgba[dst + 3] = data[src + 3] >> 8
    }
  }
  return rgba
}
