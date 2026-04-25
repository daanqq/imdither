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

export async function pixelBufferToPngBlob(buffer: PixelBuffer): Promise<Blob> {
  const canvas = document.createElement("canvas")
  drawPixelBuffer(canvas, buffer)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PNG export failed"))
        return
      }

      resolve(blob)
    }, "image/png")
  })
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
