import type {
  EditorSettings,
  FrameSequence,
  PixelBuffer,
} from "@workspace/core"

export type MotionWorkerRequest =
  | {
      type: "process-gif"
      jobId: number
      file: File
      settings: EditorSettings
    }
  | {
      type: "process-apng"
      jobId: number
      file: File
      settings: EditorSettings
    }
  | {
      type: "process-sequence"
      jobId: number
      frameSequence: FrameSequence
      settings: EditorSettings
    }
  | {
      type: "cancel"
      jobId: number
    }

export type MotionWorkerResponse =
  | {
      type: "decoded"
      jobId: number
      frameSequence: FrameSequence
    }
  | {
      type: "frame"
      jobId: number
      frameIndex: number
      image: PixelBuffer
    }
  | {
      type: "complete"
      jobId: number
    }
  | {
      type: "error"
      jobId: number
      message: string
    }
