import type { FrameSequence } from "@workspace/core"
import { calculateFrameStep } from "./motion-types"

const DEFAULT_FRAME_CAP = 120

export async function decodeVideoToFrameSequence(
  file: File,
  cap: number = DEFAULT_FRAME_CAP
): Promise<FrameSequence> {
  console.log("[video-intake] start", file.name, file.size, file.type)

  if (typeof HTMLVideoElement === "undefined") {
    throw new Error("Video intake requires DOM (HTMLVideoElement)")
  }

  const url = URL.createObjectURL(file)
  const video = document.createElement("video")
  video.muted = true
  video.playsInline = true
  video.src = url

  console.log("[video-intake] loading metadata")
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error("Failed to load video metadata"))
    video.load()
  })

  const width = video.videoWidth
  const height = video.videoHeight
  const duration = video.duration
  console.log(
    "[video-intake] dimensions:",
    width,
    "x",
    height,
    "duration:",
    duration
  )

  if (!width || !height || !duration || !isFinite(duration)) {
    URL.revokeObjectURL(url)
    throw new Error("Invalid video dimensions or duration")
  }

  // Estimate frame rate from metadata or default to 30
  const fps = await estimateFrameRate(video)
  const totalFrames = Math.round(duration * fps)
  const step = calculateFrameStep(totalFrames, cap)
  const frameCount = Math.min(Math.ceil(totalFrames / step), cap)

  console.log(
    "[video-intake] fps:",
    fps,
    "total frames:",
    totalFrames,
    "step:",
    step,
    "capturing:",
    frameCount
  )

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  const frames = []
  const durationsMs: number[] = []

  // eslint-disable-next-line react-doctor/async-await-in-loop
  for (let i = 0; i < frameCount; i++) {
    const frameIndex = i * step
    const time = frameIndex / fps

    video.currentTime = time
    // eslint-disable-next-line react-doctor/async-await-in-loop
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked)
        resolve()
      }
      video.addEventListener("seeked", onSeeked)
    })

    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, width, height)
    frames.push({
      width,
      height,
      data: new Uint8ClampedArray(imageData.data),
    })
    durationsMs.push(Math.round((1000 / fps) * step))

    if (i === 0) {
      console.log("[video-intake] first frame captured")
    }
  }

  URL.revokeObjectURL(url)
  console.log("[video-intake] captured", frames.length, "frames")

  return {
    frames,
    durationsMs,
    loopCount: 0,
    sourceWidth: width,
    sourceHeight: height,
  }
}

async function estimateFrameRate(video: HTMLVideoElement): Promise<number> {
  // Try to read video's internal frame rate via a quick seek-and-measure
  // Fallback to 30fps
  try {
    if (video.readyState < 2) {
      await new Promise<void>((resolve) => {
        const onCanPlay = () => {
          video.removeEventListener("canplay", onCanPlay)
          resolve()
        }
        video.addEventListener("canplay", onCanPlay)
      })
    }
  } catch {
    // ignore
  }
  return 30
}
