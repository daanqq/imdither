import {
  MAX_SOURCE_DIMENSION,
  clampOutputSize,
  type PixelBuffer,
} from "@workspace/core"

export type LoadedSource = {
  id: string
  name: string
  buffer: PixelBuffer
  originalWidth: number
  originalHeight: number
}

export type SourceNotice = {
  kind: "demo-loaded" | "output-auto-sized"
  message: string
}

export type SourceIntakeResult =
  | {
      type: "accepted"
      source: LoadedSource
      outputSize: ReturnType<typeof clampOutputSize>
      notices: SourceNotice[]
    }
  | {
      type: "rejected"
      message: string
    }

export async function intakeImageFile(file: File): Promise<SourceIntakeResult> {
  const bitmap = await createImageBitmap(file)

  try {
    if (isOversizedSource(bitmap.width, bitmap.height)) {
      return rejectOversizedSource(bitmap.width, bitmap.height)
    }

    const buffer = bitmapToPixelBuffer(bitmap)

    return acceptLoadedSource({
      id: createSourceId(),
      name: file.name || "Clipboard image",
      buffer,
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
    })
  } finally {
    bitmap.close()
  }
}

export function createDemoSourceIntake(): SourceIntakeResult {
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

  return acceptLoadedSource(
    {
      id: "demo",
      name: "Bundled demo image",
      buffer: { width, height, data },
      originalWidth: width,
      originalHeight: height,
    },
    [{ kind: "demo-loaded", message: "[DEMO SOURCE LOADED]" }]
  )
}

export function acceptLoadedSource(
  source: LoadedSource,
  initialNotices: SourceNotice[] = []
): SourceIntakeResult {
  if (isOversizedSource(source.buffer.width, source.buffer.height)) {
    return rejectOversizedSource(source.buffer.width, source.buffer.height)
  }

  const outputSize = clampOutputSize(source.buffer.width, source.buffer.height)
  const notices = [...initialNotices]

  if (outputSize.downscaled) {
    notices.push({
      kind: "output-auto-sized",
      message: `[OUTPUT AUTO-SIZED: ${outputSize.width}x${outputSize.height} / 12MP]`,
    })
  }

  return {
    type: "accepted",
    source,
    outputSize,
    notices,
  }
}

export function formatSourceNotices(notices: SourceNotice[]): string | null {
  const message = notices.map((notice) => notice.message).join(" ")
  return message || null
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

function isOversizedSource(width: number, height: number): boolean {
  return width > MAX_SOURCE_DIMENSION || height > MAX_SOURCE_DIMENSION
}

function rejectOversizedSource(
  width: number,
  height: number
): SourceIntakeResult {
  return {
    type: "rejected",
    message: `Image is too large (${width}x${height}). Maximum source dimension is ${MAX_SOURCE_DIMENSION}px.`,
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
