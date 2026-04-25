import {
  MAX_OUTPUT_PIXELS,
  MAX_SOURCE_DIMENSION,
  type PixelBuffer,
} from "@workspace/core"

export type LoadedSource = {
  id: string
  name: string
  buffer: PixelBuffer
  originalWidth: number
  originalHeight: number
  notice: string | null
}

export async function decodeImageFile(file: File): Promise<LoadedSource> {
  const bitmap = await createImageBitmap(file)
  const source = bitmapToPixelBuffer(bitmap)
  bitmap.close()

  return normalizeSource({
    id: createSourceId(),
    name: file.name || "Clipboard image",
    buffer: source,
    originalWidth: source.width,
    originalHeight: source.height,
    notice: null,
  })
}

export function createDemoSource(): LoadedSource {
  const width = 960
  const height = 640
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const grid = (Math.floor(x / 32) + Math.floor(y / 32)) % 2
      const radial = Math.hypot(x - width * 0.68, y - height * 0.44)
      const diagonal = (x + y * 1.6) / (width + height * 1.6)
      const circle = radial < 170 ? 1 : radial < 230 ? 0.55 : 0
      const bar = x > 78 && x < 180 && y > 96 && y < height - 96 ? 0.32 : 0
      const signal = y > 432 && y < 466 && x > 260 && x < 820 ? 0.75 : 0
      const value = Math.max(
        0,
        Math.min(255, diagonal * 210 + grid * 18 + circle * 90 + bar * 70)
      )

      data[index] = signal ? 215 : value
      data[index + 1] = signal ? 25 : Math.max(0, value - 18)
      data[index + 2] = signal ? 33 : Math.max(0, value - 32)
      data[index + 3] = 255
    }
  }

  return {
    id: "demo",
    name: "Bundled demo image",
    buffer: { width, height, data },
    originalWidth: width,
    originalHeight: height,
    notice: "[DEMO SOURCE LOADED]",
  }
}

export function pickImageFromClipboard(
  clipboardData: DataTransfer | null
): File | null {
  if (!clipboardData) {
    return null
  }

  for (const item of clipboardData.items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      return item.getAsFile()
    }
  }

  return null
}

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

export function fitWithinOutputBudget(width: number, height: number) {
  const pixels = width * height

  if (pixels <= MAX_OUTPUT_PIXELS) {
    return { width, height, downscaled: false }
  }

  const scale = Math.sqrt(MAX_OUTPUT_PIXELS / pixels)

  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    downscaled: true,
  }
}

function normalizeSource(source: LoadedSource): LoadedSource {
  const longest = Math.max(source.buffer.width, source.buffer.height)

  if (longest <= MAX_SOURCE_DIMENSION) {
    return source
  }

  const scale = MAX_SOURCE_DIMENSION / longest
  const width = Math.max(1, Math.floor(source.buffer.width * scale))
  const height = Math.max(1, Math.floor(source.buffer.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")

  if (!context) {
    return source
  }

  const temporary = document.createElement("canvas")
  drawPixelBuffer(temporary, source.buffer)
  context.drawImage(temporary, 0, 0, width, height)

  return {
    ...source,
    buffer: imageDataToPixelBuffer(context.getImageData(0, 0, width, height)),
    notice: `[SOURCE AUTO-DOWNSCALED: ${source.buffer.width}x${source.buffer.height} -> ${width}x${height}]`,
  }
}

function bitmapToPixelBuffer(bitmap: ImageBitmap): PixelBuffer {
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Canvas context unavailable")
  }

  context.drawImage(bitmap, 0, 0)
  return imageDataToPixelBuffer(
    context.getImageData(0, 0, bitmap.width, bitmap.height)
  )
}

function imageDataToPixelBuffer(imageData: ImageData): PixelBuffer {
  return {
    width: imageData.width,
    height: imageData.height,
    data: new Uint8ClampedArray(imageData.data),
  }
}

function createSourceId(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
