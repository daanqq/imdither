/// <reference lib="webworker" />

import type { PixelBuffer } from "@workspace/core"

import {
  acceptLoadedSource,
  isOversizedSource,
  rejectOversizedSource,
  type SourceIntakeResult,
} from "@/lib/source-intake-core"

type SourceIntakeWorkerRequest = {
  type: "intake-image"
  jobId: number
  file: File
}

type SourceIntakeWorkerResponse =
  | {
      type: "complete"
      jobId: number
      result: SourceIntakeResult
    }
  | {
      type: "error"
      jobId: number
      message: string
    }

const scope = self as DedicatedWorkerGlobalScope

scope.addEventListener(
  "message",
  async (event: MessageEvent<SourceIntakeWorkerRequest>) => {
    if (event.data.type !== "intake-image") {
      return
    }

    try {
      const result = await intakeImageFileInWorker(event.data.file)

      postResponse({
        type: "complete",
        jobId: event.data.jobId,
        result,
      })
    } catch (error) {
      postResponse({
        type: "error",
        jobId: event.data.jobId,
        message: error instanceof Error ? error.message : "Image decode failed",
      })
    }
  }
)

async function intakeImageFileInWorker(
  file: File
): Promise<SourceIntakeResult> {
  const bitmap = await createImageBitmap(file)

  try {
    if (isOversizedSource(bitmap.width, bitmap.height)) {
      return rejectOversizedSource(bitmap.width, bitmap.height)
    }

    return acceptLoadedSource({
      id: createSourceId(),
      name: file.name || "Clipboard image",
      buffer: bitmapToPixelBuffer(bitmap),
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
    })
  } finally {
    bitmap.close()
  }
}

function bitmapToPixelBuffer(bitmap: ImageBitmap): PixelBuffer {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
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

function postResponse(response: SourceIntakeWorkerResponse) {
  if (response.type === "complete" && response.result.type === "accepted") {
    scope.postMessage(response, [response.result.source.buffer.data.buffer])
    return
  }

  scope.postMessage(response)
}
