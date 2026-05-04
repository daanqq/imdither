import type {
  EditorSettings,
  FrameSequence,
  PixelBuffer,
} from "@workspace/core"

import { hidePixelBufferData } from "@/lib/pixel-buffer-visibility"
import type {
  MotionWorkerRequest,
  MotionWorkerResponse,
} from "@/workers/motion-protocol"

type MotionGifJobParams = {
  jobId: number
  file: File
  settings: EditorSettings
  signal?: AbortSignal
  onDecoded: (frameSequence: FrameSequence) => void
  onFrame: (frameIndex: number, image: PixelBuffer) => void
}

type MotionFrameSequenceJobParams = {
  jobId: number
  frameSequence: FrameSequence
  settings: EditorSettings
  signal?: AbortSignal
  onFrame: (frameIndex: number, image: PixelBuffer) => void
}

type MotionApngJobParams = {
  jobId: number
  file: File
  settings: EditorSettings
  signal?: AbortSignal
  onDecoded: (frameSequence: FrameSequence) => void
  onFrame: (frameIndex: number, image: PixelBuffer) => void
}

type MotionJobParams =
  | MotionGifJobParams
  | MotionApngJobParams
  | MotionFrameSequenceJobParams

type MotionGifJob = {
  requestType: "process-gif" | "process-apng" | "process-sequence"
  params: MotionJobParams
  resolve: () => void
  reject: (error: Error | DOMException) => void
  abortHandler?: () => void
  settled: boolean
}

let worker: Worker | null = null
let activeJob: MotionGifJob | null = null

export function runMotionGifJob(params: MotionGifJobParams): Promise<void> {
  return runMotionJob("process-gif", params)
}

export function runMotionApngJob(params: MotionApngJobParams): Promise<void> {
  return runMotionJob("process-apng", params)
}

export function runMotionFrameSequenceJob(
  params: MotionFrameSequenceJobParams
): Promise<void> {
  return runMotionJob("process-sequence", params)
}

function runMotionJob(
  requestType: MotionGifJob["requestType"],
  params: MotionJobParams
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (params.signal?.aborted) {
      reject(createAbortError())
      return
    }

    if (activeJob) {
      rejectJob(activeJob, createAbortError())
      postCancel(activeJob.params.jobId)
      activeJob = null
    }

    const job: MotionGifJob = {
      requestType,
      params,
      resolve,
      reject,
      settled: false,
    }

    job.abortHandler = () => {
      postCancel(job.params.jobId)
      rejectJob(job, createAbortError())
      if (activeJob === job) {
        activeJob = null
      }
    }
    params.signal?.addEventListener("abort", job.abortHandler, { once: true })
    postJob(job)
  })
}

function postJob(job: MotionGifJob) {
  activeJob = job

  try {
    const isFileJob =
      job.requestType === "process-gif" || job.requestType === "process-apng"
    const request: MotionWorkerRequest = isFileJob
      ? {
          type: job.requestType,
          jobId: job.params.jobId,
          file: (job.params as MotionGifJobParams).file,
          settings: (job.params as MotionGifJobParams).settings,
        }
      : {
          type: "process-sequence",
          jobId: job.params.jobId,
          frameSequence: (job.params as MotionFrameSequenceJobParams)
            .frameSequence,
          settings: (job.params as MotionFrameSequenceJobParams).settings,
        }

    getWorker().postMessage(request)
  } catch (error) {
    activeJob = null
    rejectJob(
      job,
      error instanceof Error
        ? error
        : new Error("Motion worker postMessage failed")
    )
    resetWorker()
  }
}

function getWorker(): Worker {
  if (worker) {
    return worker
  }

  worker = new Worker(new URL("../workers/motion.worker.ts", import.meta.url), {
    type: "module",
  })
  worker.addEventListener("message", handleWorkerMessage)
  worker.addEventListener("error", handleWorkerError)

  return worker
}

function handleWorkerMessage(event: MessageEvent<MotionWorkerResponse>) {
  const job = activeJob

  if (!job || event.data.jobId !== job.params.jobId) {
    return
  }

  if (event.data.type === "decoded") {
    if ("onDecoded" in job.params) {
      job.params.onDecoded(event.data.frameSequence)
    }
    return
  }

  if (event.data.type === "frame") {
    hidePixelBufferData(event.data.image)
    job.params.onFrame(event.data.frameIndex, event.data.image)
    return
  }

  activeJob = null

  if (event.data.type === "error") {
    rejectJob(job, new Error(event.data.message))
    return
  }

  resolveJob(job)
}

function handleWorkerError(event: ErrorEvent) {
  const error = new Error(event.message || "Motion worker failed")

  if (activeJob) {
    rejectJob(activeJob, error)
    activeJob = null
  }

  resetWorker()
}

function postCancel(jobId: number) {
  const request: MotionWorkerRequest = { type: "cancel", jobId }
  worker?.postMessage(request)
}

function resolveJob(job: MotionGifJob) {
  if (job.settled) {
    return
  }

  cleanupJob(job)
  job.resolve()
}

function rejectJob(job: MotionGifJob, error: Error | DOMException) {
  if (job.settled) {
    return
  }

  cleanupJob(job)
  job.reject(error)
}

function cleanupJob(job: MotionGifJob) {
  job.settled = true

  if (job.abortHandler) {
    job.params.signal?.removeEventListener("abort", job.abortHandler)
  }
}

function resetWorker() {
  worker?.terminate()
  worker = null
}

function createAbortError(): DOMException {
  return new DOMException("Motion GIF job aborted", "AbortError")
}
