import type {
  AutoTuneRecommendation,
  EditorSettings,
  PixelBuffer,
} from "@workspace/core"

export type AutoTuneWorkerRequest = {
  type: "recommend"
  jobId: number
  sourceId: string
  analysisSample?: PixelBuffer
  settings: EditorSettings
  outputDimensions: {
    width: number
    height: number
  }
}

export type AutoTuneWorkerResponse =
  | {
      type: "complete"
      jobId: number
      sourceId: string
      recommendations: AutoTuneRecommendation[]
    }
  | {
      type: "error"
      jobId: number
      sourceId: string
      message: string
    }
