import type { AlphaBackground, PixelBuffer } from "@workspace/core"

import { drawPixelBuffer } from "@/lib/image"

export type ExportFormat = "png" | "webp" | "jpeg"

export type ExportFormatOption = {
  extension: "png" | "webp" | "jpg"
  id: ExportFormat
  label: "PNG" | "WebP" | "JPEG"
  mimeType: "image/png" | "image/webp" | "image/jpeg"
  supportsQuality: boolean
}

export const DEFAULT_EXPORT_FORMAT: ExportFormat = "png"
export const DEFAULT_EXPORT_QUALITY = 0.92
export const MIN_EXPORT_QUALITY = 0.1
export const MAX_EXPORT_QUALITY = 1
export const EXPORT_QUALITY_STEP = 0.05

export const EXPORT_FORMAT_OPTIONS: readonly ExportFormatOption[] = [
  {
    extension: "png",
    id: "png",
    label: "PNG",
    mimeType: "image/png",
    supportsQuality: false,
  },
  {
    extension: "webp",
    id: "webp",
    label: "WebP",
    mimeType: "image/webp",
    supportsQuality: true,
  },
  {
    extension: "jpg",
    id: "jpeg",
    label: "JPEG",
    mimeType: "image/jpeg",
    supportsQuality: true,
  },
] as const

export type EncodePixelBufferOptions = {
  alphaBackground: AlphaBackground
  format: ExportFormat
  quality: number
}

export async function encodePixelBuffer(
  buffer: PixelBuffer,
  options: EncodePixelBufferOptions
): Promise<Blob> {
  const format = getExportFormatOption(options.format)
  const canvas = document.createElement("canvas")

  if (options.format === "jpeg") {
    drawJpegPixelBuffer(canvas, buffer, options.alphaBackground)
  } else {
    drawPixelBuffer(canvas, buffer)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`${format.label} export failed`))
          return
        }

        resolve(blob)
      },
      format.mimeType,
      format.supportsQuality ? clampExportQuality(options.quality) : undefined
    )
  })
}

export function getExportFormatOption(format: ExportFormat) {
  return (
    EXPORT_FORMAT_OPTIONS.find((option) => option.id === format) ??
    EXPORT_FORMAT_OPTIONS[0]
  )
}

export function makeExportName(sourceName: string, format: ExportFormat) {
  const extension = getExportFormatOption(format).extension
  const base = sourceName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
  return `imdither-${base || "export"}.${extension}`
}

export function normalizeExportFormat(value: unknown): ExportFormat {
  if (value === "png" || value === "webp" || value === "jpeg") {
    return value
  }

  return DEFAULT_EXPORT_FORMAT
}

export function clampExportQuality(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_EXPORT_QUALITY
  }

  return Math.min(MAX_EXPORT_QUALITY, Math.max(MIN_EXPORT_QUALITY, value))
}

function drawJpegPixelBuffer(
  canvas: HTMLCanvasElement,
  buffer: PixelBuffer,
  alphaBackground: AlphaBackground
) {
  canvas.width = buffer.width
  canvas.height = buffer.height
  const context = canvas.getContext("2d")

  if (!context) {
    return
  }

  context.putImageData(
    new ImageData(
      flattenAlphaForJpeg(buffer, alphaBackground),
      buffer.width,
      buffer.height
    ),
    0,
    0
  )
}

function flattenAlphaForJpeg(
  buffer: PixelBuffer,
  alphaBackground: AlphaBackground
) {
  const output = new Uint8ClampedArray(buffer.data.length)
  const background = alphaBackground === "white" ? 255 : 0

  for (let index = 0; index < buffer.data.length; index += 4) {
    const alpha = buffer.data[index + 3] / 255
    output[index] = Math.round(
      buffer.data[index] * alpha + background * (1 - alpha)
    )
    output[index + 1] = Math.round(
      buffer.data[index + 1] * alpha + background * (1 - alpha)
    )
    output[index + 2] = Math.round(
      buffer.data[index + 2] * alpha + background * (1 - alpha)
    )
    output[index + 3] = 255
  }

  return output
}
