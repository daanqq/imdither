/// <reference lib="webworker" />

import {
  createStageCache,
  processImage,
  type PixelBuffer,
} from "@workspace/core"

import type { ProcessWorkerRequest, ProcessWorkerResponse } from "./protocol"

const cache = createStageCache(16)
const sources = new Map<string, PixelBuffer>()
const scope = self as DedicatedWorkerGlobalScope
const MAX_CACHED_SOURCES = 4

scope.addEventListener(
  "message",
  (event: MessageEvent<ProcessWorkerRequest>) => {
    if (event.data.type !== "process") {
      return
    }

    try {
      if (event.data.image) {
        rememberSource(event.data.sourceKey, event.data.image)
      }

      const source = getSource(event.data.sourceKey)

      if (!source) {
        throw new Error("Source image is not loaded in worker")
      }

      const result = processImage(source, event.data.settings, {
        cache,
        sourceKey: event.data.sourceKey,
      })
      const response: ProcessWorkerResponse = {
        type: "complete",
        jobId: event.data.jobId,
        image: result.image,
        metadata: result.metadata,
      }

      scope.postMessage(response, [result.image.data.buffer])
    } catch (error) {
      const response: ProcessWorkerResponse = {
        type: "error",
        jobId: event.data.jobId,
        message: error instanceof Error ? error.message : "Processing failed",
      }

      scope.postMessage(response)
    }
  }
)

function getSource(sourceKey: string): PixelBuffer | undefined {
  const source = sources.get(sourceKey)

  if (!source) {
    return undefined
  }

  sources.delete(sourceKey)
  sources.set(sourceKey, source)
  return source
}

function rememberSource(sourceKey: string, image: PixelBuffer) {
  if (sources.has(sourceKey)) {
    sources.delete(sourceKey)
  }

  sources.set(sourceKey, image)

  while (sources.size > MAX_CACHED_SOURCES) {
    const oldestKey = sources.keys().next().value

    if (typeof oldestKey !== "string") {
      break
    }

    sources.delete(oldestKey)
  }
}
