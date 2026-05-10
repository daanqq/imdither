/// <reference lib="webworker" />

import {
  processImage,
  type EditorSettings,
  type FrameSequence,
} from "@workspace/core"

import { decodeApngToFrameSequence } from "@/lib/apng-intake"
import { decodeGifToFrameSequence } from "@/lib/gif-intake"
import type {
  MotionWorkerRequest,
  MotionWorkerResponse,
} from "./motion-protocol"

const scope = self as DedicatedWorkerGlobalScope
const canceledJobIds = new Set<number>()

scope.addEventListener(
  "message",
  (event: MessageEvent<MotionWorkerRequest>) => {
    if (event.data.type === "cancel") {
      canceledJobIds.add(event.data.jobId)
      return
    }

    if (event.data.type === "process-gif") {
      void processGif(event.data)
      return
    }

    if (event.data.type === "process-apng") {
      void processApng(event.data)
      return
    }

    if (event.data.type === "process-and-encode-webm") {
      void processWebmEncode(event.data)
      return
    }

    if (event.data.type === "process-sequence") {
      void processFrameSequenceJob(
        event.data.jobId,
        event.data.frameSequence,
        event.data.settings
      )
    }
  }
)

async function processApng(
  request: Extract<MotionWorkerRequest, { type: "process-apng" }>
) {
  try {
    canceledJobIds.delete(request.jobId)

    const buffer = await request.file.arrayBuffer()

    if (isCanceled(request.jobId)) {
      return
    }

    const frameSequence = decodeApngToFrameSequence(buffer)
    const decodedResponse: MotionWorkerResponse = {
      type: "decoded",
      jobId: request.jobId,
      frameSequence,
    }

    scope.postMessage(decodedResponse)

    if (!isCanceled(request.jobId)) {
      const completeResponse: MotionWorkerResponse = {
        type: "complete",
        jobId: request.jobId,
      }
      scope.postMessage(completeResponse)
    }
  } catch (error) {
    if (isCanceled(request.jobId)) {
      return
    }

    const errorResponse: MotionWorkerResponse = {
      type: "error",
      jobId: request.jobId,
      message:
        error instanceof Error ? error.message : "APNG processing failed",
    }
    scope.postMessage(errorResponse)
  } finally {
    canceledJobIds.delete(request.jobId)
  }
}

async function processGif(
  request: Extract<MotionWorkerRequest, { type: "process-gif" }>
) {
  try {
    canceledJobIds.delete(request.jobId)

    const buffer = await request.file.arrayBuffer()

    if (isCanceled(request.jobId)) {
      return
    }

    const frameSequence = decodeGifToFrameSequence(buffer)
    const decodedResponse: MotionWorkerResponse = {
      type: "decoded",
      jobId: request.jobId,
      frameSequence,
    }

    scope.postMessage(decodedResponse)

    if (!isCanceled(request.jobId)) {
      const completeResponse: MotionWorkerResponse = {
        type: "complete",
        jobId: request.jobId,
      }
      scope.postMessage(completeResponse)
    }
  } catch (error) {
    if (isCanceled(request.jobId)) {
      return
    }

    const errorResponse: MotionWorkerResponse = {
      type: "error",
      jobId: request.jobId,
      message: error instanceof Error ? error.message : "GIF processing failed",
    }
    scope.postMessage(errorResponse)
  } finally {
    canceledJobIds.delete(request.jobId)
  }
}

async function processFrameSequenceJob(
  jobId: number,
  frameSequence: FrameSequence,
  settings: EditorSettings
) {
  try {
    canceledJobIds.delete(jobId)
    await processFrameSequence(jobId, frameSequence, settings)
  } catch (error) {
    if (isCanceled(jobId)) {
      return
    }

    const errorResponse: MotionWorkerResponse = {
      type: "error",
      jobId,
      message: error instanceof Error ? error.message : "GIF processing failed",
    }
    scope.postMessage(errorResponse)
  } finally {
    canceledJobIds.delete(jobId)
  }
}

async function processFrameSequence(
  jobId: number,
  frameSequence: FrameSequence,
  settings: EditorSettings
) {
  for (let i = 0; i < frameSequence.frames.length; i += 1) {
    if (isCanceled(jobId)) {
      return
    }

    const processed = processImage(frameSequence.frames[i], settings)
    const frameResponse: MotionWorkerResponse = {
      type: "frame",
      jobId,
      frameIndex: i,
      image: processed.image,
    }

    scope.postMessage(frameResponse, [processed.image.data.buffer])
    // eslint-disable-next-line react-doctor/async-await-in-loop
    await yieldToWorkerEventLoop()
  }

  if (!isCanceled(jobId)) {
    const completeResponse: MotionWorkerResponse = {
      type: "complete",
      jobId,
    }
    scope.postMessage(completeResponse)
  }
}

async function processWebmEncode(
  request: Extract<MotionWorkerRequest, { type: "process-and-encode-webm" }>
) {
  try {
    canceledJobIds.delete(request.jobId)

    for (let i = 0; i < request.frameSequence.frames.length; i += 1) {
      if (isCanceled(request.jobId)) {
        return
      }

      const processed = processImage(
        request.frameSequence.frames[i],
        request.settings
      )
      const frameResponse: MotionWorkerResponse = {
        type: "frame",
        jobId: request.jobId,
        frameIndex: i,
        image: processed.image,
      }

      scope.postMessage(frameResponse, [processed.image.data.buffer])
      // eslint-disable-next-line react-doctor/async-await-in-loop
      await yieldToWorkerEventLoop()
    }

    if (isCanceled(request.jobId)) {
      return
    }

    const { encodeFrameSequenceToWebM: encodeWebM } =
      await import("@/lib/webm-export")

    const bytes = await encodeWebM(
      request.frameSequence,
      request.videoExport,
      request.frameSequence.audioTrack
    )

    const blob = new Blob([bytes], { type: "video/webm" })
    const blobResponse: MotionWorkerResponse = {
      type: "webm-blob",
      jobId: request.jobId,
      blob,
    }

    scope.postMessage(blobResponse)
  } catch (error) {
    if (isCanceled(request.jobId)) {
      return
    }

    const errorResponse: MotionWorkerResponse = {
      type: "error",
      jobId: request.jobId,
      message: error instanceof Error ? error.message : "WebM encoding failed",
    }
    scope.postMessage(errorResponse)
  } finally {
    canceledJobIds.delete(request.jobId)
  }
}

function isCanceled(jobId: number): boolean {
  return canceledJobIds.has(jobId)
}

function yieldToWorkerEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
