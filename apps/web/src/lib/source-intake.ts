import type { PixelBuffer } from "@workspace/core"

import demoImageUrl from "../assets/demo.webp"
import { hidePixelBufferData } from "./pixel-buffer-visibility"
import {
  acceptLoadedSource,
  formatSourceNotices,
  isOversizedSource,
  rejectOversizedSource,
  type LoadedSource,
  type SourceIntakeResult,
  type SourceNotice,
} from "./source-intake-core"

export {
  acceptLoadedSource,
  formatSourceNotices,
  type LoadedSource,
  type SourceIntakeResult,
  type SourceNotice,
}

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

let nextIntakeJobId = 0

export async function intakeImageFile(file: File): Promise<SourceIntakeResult> {
  if (typeof Worker !== "undefined") {
    try {
      return prepareSourceIntakeResult(await runSourceIntakeWorkerJob(file))
    } catch {
      return prepareSourceIntakeResult(await intakeImageFileOnMainThread(file))
    }
  }

  return prepareSourceIntakeResult(await intakeImageFileOnMainThread(file))
}

export async function createDemoSourceIntake(): Promise<SourceIntakeResult> {
  const response = await fetch(demoImageUrl)

  if (!response.ok) {
    return {
      type: "rejected",
      message: "Demo image failed to load.",
    }
  }

  const blob = await response.blob()
  const file = new File([blob], "Bundled demo image", {
    type: blob.type || "image/webp",
  })
  const result = await intakeImageFile(file)

  if (result.type === "rejected") {
    return result
  }

  return {
    ...result,
    source: {
      ...result.source,
      id: "demo",
      name: "Bundled demo image",
    },
    notices: [
      { kind: "demo-loaded", message: "[DEMO SOURCE LOADED]" },
      ...result.notices,
    ],
  }
}

async function intakeImageFileOnMainThread(
  file: File
): Promise<SourceIntakeResult> {
  await yieldBeforeMainThreadIntake()

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

function runSourceIntakeWorkerJob(file: File): Promise<SourceIntakeResult> {
  const jobId = createIntakeJobId()
  const worker = new Worker(
    new URL("../workers/source-intake.worker.ts", import.meta.url),
    { type: "module" }
  )

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      worker.removeEventListener("message", handleMessage)
      worker.removeEventListener("error", handleError)
      worker.terminate()
    }

    const handleMessage = (event: MessageEvent<SourceIntakeWorkerResponse>) => {
      if (event.data.jobId !== jobId) {
        return
      }

      cleanup()

      if (event.data.type === "error") {
        reject(new Error(event.data.message))
        return
      }

      resolve(event.data.result)
    }

    const handleError = (event: ErrorEvent) => {
      cleanup()
      reject(new Error(event.message || "Image intake worker failed"))
    }

    worker.addEventListener("message", handleMessage)
    worker.addEventListener("error", handleError)
    worker.postMessage({
      type: "intake-image",
      jobId,
      file,
    } satisfies SourceIntakeWorkerRequest)
  })
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

function createIntakeJobId(): number {
  nextIntakeJobId += 1
  return nextIntakeJobId
}

function prepareSourceIntakeResult(
  result: SourceIntakeResult
): SourceIntakeResult {
  if (result.type === "accepted") {
    hidePixelBufferData(result.source.buffer)
    hidePixelBufferData(result.source.autoTuneAnalysisSample)
  }

  return result
}

function yieldBeforeMainThreadIntake(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}
