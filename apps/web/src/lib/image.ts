import type { PixelBuffer } from "@workspace/core"

export function drawPixelBuffer(
  canvas: HTMLCanvasElement,
  buffer: PixelBuffer
) {
  canvas.width = buffer.width
  canvas.height = buffer.height
  const context = canvas.getContext("2d")

  if (!context) {
    return
  }

  context.putImageData(
    new ImageData(
      new Uint8ClampedArray(buffer.data),
      buffer.width,
      buffer.height
    ),
    0,
    0
  )
}

export function drawPixelBufferToCanvasSize(
  canvas: HTMLCanvasElement,
  buffer: PixelBuffer,
  size: { height: number; width: number }
) {
  const width = Math.max(1, Math.round(size.width))
  const height = Math.max(1, Math.round(size.height))
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")

  if (!context) {
    return
  }

  const source = document.createElement("canvas")
  source.width = buffer.width
  source.height = buffer.height
  const sourceContext = source.getContext("2d")

  if (!sourceContext) {
    return
  }

  sourceContext.putImageData(
    new ImageData(
      new Uint8ClampedArray(buffer.data),
      buffer.width,
      buffer.height
    ),
    0,
    0
  )
  context.imageSmoothingEnabled = true
  context.drawImage(source, 0, 0, width, height)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  })
  downloadBlob(blob, filename)
}
