import type { PixelBuffer } from "@workspace/core"

import type { ViewportCenter } from "./preview-viewport"

export type PixelInspectorSample = {
  x: number
  y: number
  originalHex: string | null
  processedHex: string | null
}

export function samplePixelHex(
  buffer: PixelBuffer | null,
  coordinates: ViewportCenter
): string | null {
  if (!buffer) {
    return null
  }

  const x = Math.floor(coordinates.x)
  const y = Math.floor(coordinates.y)

  if (x < 0 || y < 0 || x >= buffer.width || y >= buffer.height) {
    return null
  }

  const index = (y * buffer.width + x) * 4
  const red = buffer.data[index] ?? 0
  const green = buffer.data[index + 1] ?? 0
  const blue = buffer.data[index + 2] ?? 0

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}

export function getPixelInspectorSample({
  coordinates,
  original,
  processed,
}: {
  coordinates: ViewportCenter
  original: PixelBuffer | null
  processed: PixelBuffer | null
}): PixelInspectorSample {
  return {
    x: Math.floor(coordinates.x),
    y: Math.floor(coordinates.y),
    originalHex: samplePixelHex(original, coordinates),
    processedHex: samplePixelHex(processed, coordinates),
  }
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, value))
    .toString(16)
    .padStart(2, "0")
    .toUpperCase()
}
