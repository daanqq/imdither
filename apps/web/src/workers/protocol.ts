import type {
  EditorSettings,
  PixelBuffer,
  ProcessingMetadata,
} from "@workspace/core"

export type ProcessWorkerRequest = {
  type: "process"
  jobId: number
  sourceKey: string
  image?: PixelBuffer
  settings: EditorSettings
}

export type ProcessWorkerResponse =
  | {
      type: "complete"
      jobId: number
      image: PixelBuffer
      metadata: ProcessingMetadata
    }
  | {
      type: "error"
      jobId: number
      message: string
    }
