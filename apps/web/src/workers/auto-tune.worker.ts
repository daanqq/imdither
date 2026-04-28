/// <reference lib="webworker" />

import { recommendAutoTuneLooks, type PixelBuffer } from "@workspace/core"

import type {
  AutoTuneWorkerRequest,
  AutoTuneWorkerResponse,
} from "./auto-tune-protocol"

const SAMPLE_MISSING_MESSAGE =
  "Auto-Tune analysis sample is not loaded in worker"
const MAX_CACHED_SAMPLES = 4
const scope = self as DedicatedWorkerGlobalScope
const samplesBySourceId = new Map<string, PixelBuffer>()

scope.addEventListener(
  "message",
  (event: MessageEvent<AutoTuneWorkerRequest>) => {
    if (event.data.type !== "recommend") {
      return
    }

    const sample = getSampleForRequest(event.data)

    if (!sample) {
      postResponse({
        type: "error",
        jobId: event.data.jobId,
        sourceId: event.data.sourceId,
        message: SAMPLE_MISSING_MESSAGE,
      })
      return
    }

    try {
      postResponse({
        type: "complete",
        jobId: event.data.jobId,
        sourceId: event.data.sourceId,
        recommendations: recommendAutoTuneLooks(sample, {
          settings: event.data.settings,
          sourceDimensions: {
            width: sample.width,
            height: sample.height,
          },
          outputDimensions: event.data.outputDimensions,
        }),
      })
    } catch (error) {
      postResponse({
        type: "error",
        jobId: event.data.jobId,
        sourceId: event.data.sourceId,
        message: error instanceof Error ? error.message : "Auto-Tune failed",
      })
    }
  }
)

function getSampleForRequest(
  request: AutoTuneWorkerRequest
): PixelBuffer | null {
  if (request.analysisSample) {
    rememberSample(request.sourceId, request.analysisSample)
    return request.analysisSample
  }

  return samplesBySourceId.get(request.sourceId) ?? null
}

function rememberSample(sourceId: string, sample: PixelBuffer) {
  if (samplesBySourceId.has(sourceId)) {
    samplesBySourceId.delete(sourceId)
  }

  samplesBySourceId.set(sourceId, sample)

  while (samplesBySourceId.size > MAX_CACHED_SAMPLES) {
    const oldestSourceId = samplesBySourceId.keys().next().value

    if (typeof oldestSourceId !== "string") {
      break
    }

    samplesBySourceId.delete(oldestSourceId)
  }
}

function postResponse(response: AutoTuneWorkerResponse) {
  scope.postMessage(response)
}
