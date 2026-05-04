/// <reference lib="webworker" />

import {
  processImage,
  type EditorSettings,
  type FrameSequence,
} from "@workspace/core"

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

    if (event.data.type === "process-sequence") {
      void processFrameSequenceJob(
        event.data.jobId,
        event.data.frameSequence,
        event.data.settings
      )
    }
  }
)

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

function isCanceled(jobId: number): boolean {
  return canceledJobIds.has(jobId)
}

function yieldToWorkerEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
