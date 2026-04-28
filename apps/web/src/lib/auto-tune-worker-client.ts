import {
  recommendAutoTuneLooks,
  type AutoTuneRecommendation,
  type EditorSettings,
  type PixelBuffer,
} from "@workspace/core"

import type {
  AutoTuneWorkerRequest,
  AutoTuneWorkerResponse,
} from "@/workers/auto-tune-protocol"

type AutoTuneJobParams = {
  jobId: number
  sourceId: string
  analysisSample: PixelBuffer
  settings: EditorSettings
  outputDimensions: {
    width: number
    height: number
  }
  signal?: AbortSignal
}

type AutoTuneJob = {
  params: AutoTuneJobParams
  resolve: (recommendations: AutoTuneRecommendation[]) => void
  reject: (error: Error | DOMException) => void
  abortHandler?: () => void
  settled: boolean
  sampleRetry: boolean
}

const MAX_KNOWN_SAMPLES = 4
const SAMPLE_MISSING_MESSAGE =
  "Auto-Tune analysis sample is not loaded in worker"

let worker: Worker | null = null
let activeJob: AutoTuneJob | null = null
const queuedJobs: AutoTuneJob[] = []
const knownSampleSourceIds = new Set<string>()

export function runAutoTuneJob(
  params: AutoTuneJobParams
): Promise<AutoTuneRecommendation[]> {
  return new Promise((resolve, reject) => {
    if (params.signal?.aborted) {
      reject(createAbortError())
      return
    }

    const job: AutoTuneJob = {
      params,
      resolve,
      reject,
      settled: false,
      sampleRetry: false,
    }

    job.abortHandler = () => abortJob(job)
    params.signal?.addEventListener("abort", job.abortHandler, { once: true })
    enqueueJob(job)
  })
}

export function resetAutoTuneWorkerClient() {
  worker?.terminate()
  worker = null
  activeJob = null
  queuedJobs.length = 0
  knownSampleSourceIds.clear()
}

function enqueueJob(job: AutoTuneJob) {
  if (activeJob) {
    queuedJobs.push(job)
    return
  }

  postJob(job)
}

function postJob(job: AutoTuneJob) {
  if (job.params.signal?.aborted) {
    rejectJob(job, createAbortError())
    scheduleNextJob()
    return
  }

  activeJob = job

  try {
    const nextWorker = getWorker()
    const shouldSendSample = !knownSampleSourceIds.has(job.params.sourceId)
    const analysisSample = shouldSendSample
      ? clonePixelBuffer(job.params.analysisSample)
      : undefined
    const request: AutoTuneWorkerRequest = {
      type: "recommend",
      jobId: job.params.jobId,
      sourceId: job.params.sourceId,
      settings: job.params.settings,
      outputDimensions: job.params.outputDimensions,
    }

    rememberKnownSample(job.params.sourceId)

    if (analysisSample) {
      request.analysisSample = analysisSample
      nextWorker.postMessage(request, [analysisSample.data.buffer])
      return
    }

    nextWorker.postMessage(request)
  } catch (error) {
    activeJob = null
    forgetKnownSample(job.params.sourceId)

    if (isWorkerUnavailableError(error)) {
      void runFallbackJob(job)
      return
    }

    rejectJob(
      job,
      error instanceof Error
        ? error
        : new Error("Auto-Tune worker postMessage failed")
    )
    resetWorker()
    scheduleNextJob()
  }
}

function getWorker(): Worker {
  if (worker) {
    return worker
  }

  if (typeof Worker === "undefined") {
    throw new Error("Auto-Tune worker unavailable")
  }

  worker = new Worker(
    new URL("../workers/auto-tune.worker.ts", import.meta.url),
    {
      type: "module",
    }
  )
  worker.addEventListener("message", handleWorkerMessage)
  worker.addEventListener("error", handleWorkerError)

  return worker
}

function handleWorkerMessage(event: MessageEvent<AutoTuneWorkerResponse>) {
  const job = activeJob

  if (!job || event.data.jobId !== job.params.jobId) {
    return
  }

  activeJob = null

  if (
    event.data.type === "error" &&
    event.data.message === SAMPLE_MISSING_MESSAGE &&
    !job.sampleRetry &&
    !job.params.signal?.aborted
  ) {
    job.sampleRetry = true
    forgetKnownSample(job.params.sourceId)
    postJob(job)
    return
  }

  if (event.data.type === "error") {
    rejectJob(job, new Error(event.data.message))
  } else {
    resolveJob(job, event.data.recommendations)
  }

  scheduleNextJob()
}

function handleWorkerError(event: ErrorEvent) {
  const error = new Error(event.message || "Auto-Tune worker failed")

  if (activeJob) {
    rejectJob(activeJob, error)
    activeJob = null
  }

  while (queuedJobs.length > 0) {
    rejectJob(queuedJobs.shift()!, error)
  }

  resetWorker()
}

async function runFallbackJob(job: AutoTuneJob) {
  try {
    await waitForFallbackPaint()

    if (job.params.signal?.aborted) {
      rejectJob(job, createAbortError())
      return
    }

    resolveJob(
      job,
      recommendAutoTuneLooks(job.params.analysisSample, {
        settings: job.params.settings,
        sourceDimensions: {
          width: job.params.analysisSample.width,
          height: job.params.analysisSample.height,
        },
        outputDimensions: job.params.outputDimensions,
      })
    )
  } catch (error) {
    rejectJob(
      job,
      error instanceof Error ? error : new Error("Auto-Tune failed")
    )
  } finally {
    scheduleNextJob()
  }
}

function scheduleNextJob() {
  if (activeJob) {
    return
  }

  const nextJob = queuedJobs.shift()

  if (nextJob) {
    postJob(nextJob)
  }
}

function abortJob(job: AutoTuneJob) {
  const queuedIndex = queuedJobs.indexOf(job)

  if (queuedIndex >= 0) {
    queuedJobs.splice(queuedIndex, 1)
  }

  rejectJob(job, createAbortError())
}

function resolveJob(
  job: AutoTuneJob,
  recommendations: AutoTuneRecommendation[]
) {
  if (job.settled) {
    return
  }

  cleanupJob(job)
  job.resolve(recommendations)
}

function rejectJob(job: AutoTuneJob, error: Error | DOMException) {
  if (job.settled) {
    return
  }

  cleanupJob(job)
  job.reject(error)
}

function cleanupJob(job: AutoTuneJob) {
  job.settled = true
  job.params.signal?.removeEventListener("abort", job.abortHandler ?? noop)
}

function resetWorker() {
  worker?.terminate()
  worker = null
  knownSampleSourceIds.clear()
}

function rememberKnownSample(sourceId: string) {
  if (knownSampleSourceIds.has(sourceId)) {
    knownSampleSourceIds.delete(sourceId)
  }

  knownSampleSourceIds.add(sourceId)

  while (knownSampleSourceIds.size > MAX_KNOWN_SAMPLES) {
    const oldestSourceId = knownSampleSourceIds.keys().next().value

    if (typeof oldestSourceId !== "string") {
      break
    }

    knownSampleSourceIds.delete(oldestSourceId)
  }
}

function forgetKnownSample(sourceId: string) {
  knownSampleSourceIds.delete(sourceId)
}

function clonePixelBuffer(buffer: PixelBuffer): PixelBuffer {
  return {
    width: buffer.width,
    height: buffer.height,
    data: new Uint8ClampedArray(buffer.data),
  }
}

function waitForFallbackPaint() {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve())
      return
    }

    setTimeout(resolve, 0)
  })
}

function isWorkerUnavailableError(error: unknown): boolean {
  return (
    error instanceof Error && error.message === "Auto-Tune worker unavailable"
  )
}

function createAbortError(): DOMException {
  return new DOMException("Job canceled", "AbortError")
}

function noop() {}
