import type { EditorSettings, PixelBuffer } from "@workspace/core"

import type {
  ProcessWorkerRequest,
  ProcessWorkerResponse,
} from "@/workers/protocol"

export type DitherJobResult = Extract<
  ProcessWorkerResponse,
  { type: "complete" }
>

type DitherJobParams = {
  jobId: number
  sourceKey: string
  image: PixelBuffer
  settings: EditorSettings
  signal?: AbortSignal
}

type DitherJob = {
  params: DitherJobParams
  resolve: (result: DitherJobResult) => void
  reject: (error: Error | DOMException) => void
  abortHandler?: () => void
  settled: boolean
  sourceRetry: boolean
}

const MAX_KNOWN_SOURCES = 4
const SOURCE_MISSING_MESSAGE = "Source image is not loaded in worker"

let worker: Worker | null = null
let activeJob: DitherJob | null = null
let queuedPreviewJob: DitherJob | null = null
const durableJobs: DitherJob[] = []
const knownSourceKeys = new Set<string>()

export function runDitherJob(
  params: DitherJobParams
): Promise<DitherJobResult> {
  return new Promise((resolve, reject) => {
    if (params.signal?.aborted) {
      reject(createAbortError())
      return
    }

    const job: DitherJob = {
      params,
      resolve,
      reject,
      settled: false,
      sourceRetry: false,
    }

    job.abortHandler = () => abortJob(job)
    params.signal?.addEventListener("abort", job.abortHandler, { once: true })
    enqueueJob(job)
  })
}

function enqueueJob(job: DitherJob) {
  if (activeJob) {
    if (job.params.signal) {
      if (queuedPreviewJob) {
        rejectJob(queuedPreviewJob, createAbortError())
      }

      queuedPreviewJob = job
      return
    }

    durableJobs.push(job)
    return
  }

  postJob(job)
}

function postJob(job: DitherJob) {
  if (job.params.signal?.aborted) {
    rejectJob(job, createAbortError())
    scheduleNextJob()
    return
  }

  activeJob = job

  try {
    const nextWorker = getWorker()
    const shouldSendSource = !knownSourceKeys.has(job.params.sourceKey)
    const image = shouldSendSource ? clonePixelBuffer(job.params.image) : null
    const request: ProcessWorkerRequest = {
      type: "process",
      jobId: job.params.jobId,
      sourceKey: job.params.sourceKey,
      settings: job.params.settings,
    }

    rememberKnownSourceKey(job.params.sourceKey)

    if (image) {
      request.image = image
      nextWorker.postMessage(request, [image.data.buffer])
      return
    }

    nextWorker.postMessage(request)
  } catch (error) {
    activeJob = null
    forgetKnownSourceKey(job.params.sourceKey)
    rejectJob(
      job,
      error instanceof Error ? error : new Error("Worker postMessage failed")
    )
    resetWorker()
    scheduleNextJob()
  }
}

function getWorker(): Worker {
  if (worker) {
    return worker
  }

  worker = new Worker(new URL("../workers/dither.worker.ts", import.meta.url), {
    type: "module",
  })
  worker.addEventListener("message", handleWorkerMessage)
  worker.addEventListener("error", handleWorkerError)

  return worker
}

function handleWorkerMessage(event: MessageEvent<ProcessWorkerResponse>) {
  const job = activeJob

  if (!job || event.data.jobId !== job.params.jobId) {
    return
  }

  activeJob = null

  if (
    event.data.type === "error" &&
    event.data.message === SOURCE_MISSING_MESSAGE &&
    !job.sourceRetry &&
    !job.params.signal?.aborted
  ) {
    job.sourceRetry = true
    forgetKnownSourceKey(job.params.sourceKey)
    postJob(job)
    return
  }

  if (event.data.type === "error") {
    rejectJob(job, new Error(event.data.message))
  } else {
    resolveJob(job, event.data)
  }

  scheduleNextJob()
}

function handleWorkerError(event: ErrorEvent) {
  const error = new Error(event.message || "Worker failed")

  if (activeJob) {
    rejectJob(activeJob, error)
    activeJob = null
  }

  if (queuedPreviewJob) {
    rejectJob(queuedPreviewJob, error)
    queuedPreviewJob = null
  }

  while (durableJobs.length > 0) {
    rejectJob(durableJobs.shift()!, error)
  }

  resetWorker()
}

function scheduleNextJob() {
  if (activeJob) {
    return
  }

  const durableJob = durableJobs.shift()

  if (durableJob) {
    postJob(durableJob)
    return
  }

  const previewJob = queuedPreviewJob
  queuedPreviewJob = null

  if (previewJob) {
    postJob(previewJob)
  }
}

function abortJob(job: DitherJob) {
  if (queuedPreviewJob === job) {
    queuedPreviewJob = null
  }

  const durableIndex = durableJobs.indexOf(job)

  if (durableIndex >= 0) {
    durableJobs.splice(durableIndex, 1)
  }

  rejectJob(job, createAbortError())
}

function resolveJob(job: DitherJob, result: DitherJobResult) {
  if (job.settled) {
    return
  }

  cleanupJob(job)
  job.resolve(result)
}

function rejectJob(job: DitherJob, error: Error | DOMException) {
  if (job.settled) {
    return
  }

  cleanupJob(job)
  job.reject(error)
}

function cleanupJob(job: DitherJob) {
  job.settled = true

  if (job.abortHandler) {
    job.params.signal?.removeEventListener("abort", job.abortHandler)
  }
}

function resetWorker() {
  worker?.terminate()
  worker = null
  knownSourceKeys.clear()
}

function rememberKnownSourceKey(sourceKey: string) {
  if (knownSourceKeys.has(sourceKey)) {
    knownSourceKeys.delete(sourceKey)
  }

  knownSourceKeys.add(sourceKey)

  while (knownSourceKeys.size > MAX_KNOWN_SOURCES) {
    const oldestKey = knownSourceKeys.keys().next().value

    if (typeof oldestKey !== "string") {
      break
    }

    knownSourceKeys.delete(oldestKey)
  }
}

function forgetKnownSourceKey(sourceKey: string) {
  knownSourceKeys.delete(sourceKey)
}

function clonePixelBuffer(buffer: PixelBuffer): PixelBuffer {
  return {
    width: buffer.width,
    height: buffer.height,
    data: new Uint8ClampedArray(buffer.data),
  }
}

function createAbortError(): DOMException {
  return new DOMException("Job canceled", "AbortError")
}
