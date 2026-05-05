import os from "node:os"

import type { FrameSequence, PixelBuffer } from "./types"

export const IMAGE_SIZES = {
  small: { width: 240, height: 160 },
  medium: { width: 960, height: 640 },
  large: { width: 1920, height: 1280 },
  huge: { width: 3840, height: 2560 },
} as const

export type ImageSizeLabel = keyof typeof IMAGE_SIZES

export function createBaselineInput(
  width: number,
  height: number,
  pattern: "gradient" | "checkerboard" | "solid" = "gradient"
): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4

      switch (pattern) {
        case "solid": {
          data[i] = 128
          data[i + 1] = 128
          data[i + 2] = 128
          break
        }
        case "checkerboard": {
          const checker =
            (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0 ? 255 : 0
          data[i] = checker
          data[i + 1] = checker
          data[i + 2] = checker
          break
        }
        case "gradient":
        default: {
          const h = x / Math.max(1, width - 1)
          const v = y / Math.max(1, height - 1)
          data[i] = Math.round((h * 0.7 + v * 0.3) * 255)
          data[i + 1] = Math.round(128 + (h - v) * 96)
          data[i + 2] = Math.round(255 - (h * 0.5 + v * 0.5) * 255)
          break
        }
      }

      data[i + 3] = 255
    }
  }

  return { width, height, data }
}

export function getMachineProfile() {
  return {
    platform: process.platform,
    arch: process.arch,
    cpuCores: os.cpus().length,
    memory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
    nodeVersion: process.version,
  }
}

export type AllocationSnapshot = {
  uint8ClampedArrays: number
  uint8ClampedBytes: number
  float32Arrays: number
  float32Bytes: number
}

type OriginalConstructors = {
  Uint8ClampedArray: typeof Uint8ClampedArray
  Float32Array: typeof Float32Array
}

export function trackAllocations(): {
  counts: () => AllocationSnapshot
  restore: () => void
} {
  let uint8ClampedArrays = 0
  let uint8ClampedBytes = 0
  let float32Arrays = 0
  let float32Bytes = 0

  const originals: OriginalConstructors = {
    Uint8ClampedArray: globalThis.Uint8ClampedArray,
    Float32Array: globalThis.Float32Array,
  }

  globalThis.Uint8ClampedArray = class extends originals.Uint8ClampedArray {
    constructor(...args: unknown[]) {
      super(
        ...(args as unknown as ConstructorParameters<typeof Uint8ClampedArray>)
      )
      uint8ClampedArrays++
      uint8ClampedBytes += this.byteLength
    }
  } as typeof Uint8ClampedArray

  globalThis.Float32Array = class extends originals.Float32Array {
    constructor(...args: unknown[]) {
      super(...(args as unknown as ConstructorParameters<typeof Float32Array>))
      float32Arrays++
      float32Bytes += this.byteLength
    }
  } as typeof Float32Array

  return {
    counts: () => ({
      uint8ClampedArrays,
      uint8ClampedBytes,
      float32Arrays,
      float32Bytes,
    }),
    restore: () => {
      globalThis.Uint8ClampedArray = originals.Uint8ClampedArray
      globalThis.Float32Array = originals.Float32Array
    },
  }
}

export type ThresholdGate = {
  name: string
  description: string
  maxMedianMs: number
  maxMeanMs: number
}

export const BASELINE_GATES: ThresholdGate[] = [
  {
    name: "ordered-bayer-4-small",
    description: "Bayer 4x4 ordered dither on 240x160 input",
    maxMedianMs: 100,
    maxMeanMs: 100,
  },
  {
    name: "ordered-bayer-8-medium",
    description: "Bayer 8x8 ordered dither on 960x640 input",
    maxMedianMs: 110,
    maxMeanMs: 110,
  },
  {
    name: "diffusion-floyd-medium",
    description: "Floyd-Steinberg error diffusion on 960x640 input",
    maxMedianMs: 150,
    maxMeanMs: 150,
  },
  {
    name: "diffusion-jarvis-medium",
    description: "Jarvis-Judice-Ninke error diffusion on 960x640 input",
    maxMedianMs: 200,
    maxMeanMs: 200,
  },
  {
    name: "halftone-dot-round-small",
    description: "Halftone dot round on 240x160 input",
    maxMedianMs: 150,
    maxMeanMs: 150,
  },
  {
    name: "quantization-none-medium",
    description: "Direct quantization (none) on 960x640 input",
    maxMedianMs: 100,
    maxMeanMs: 100,
  },
  {
    name: "preview-960x640",
    description: "Preview path at 960x640 output",
    maxMedianMs: 130,
    maxMeanMs: 130,
  },
  {
    name: "export-1920x1280",
    description: "Export path at full resolution",
    maxMedianMs: 420,
    maxMeanMs: 420,
  },
  {
    name: "size-scaling-floyd-huge",
    description: "Floyd-Steinberg on 3840x2560 input",
    maxMedianMs: 280,
    maxMeanMs: 280,
  },
  {
    name: "palette-matching-perceptual-medium",
    description: "Perceptual (Oklab) palette matching on 960x640",
    maxMedianMs: 200,
    maxMeanMs: 200,
  },
  {
    name: "full-effect-stack-medium",
    description:
      "Pre-blur + contrast-shape + post-grain + paper-noise on 960x640",
    maxMedianMs: 200,
    maxMeanMs: 200,
  },
]

export function createFrameSequence(options: {
  width: number
  height: number
  frameCount: number
  motionDelta?: number
}): FrameSequence {
  const { width, height, frameCount, motionDelta = 8 } = options
  const frames: PixelBuffer[] = []

  for (let f = 0; f < frameCount; f++) {
    const data = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const shift = Math.round((f / frameCount) * motionDelta)
        const sx = (x + shift) % width
        const sy = (y + shift) % height
        data[i] = Math.round(((sx / width) * 0.7 + (sy / height) * 0.3) * 255)
        data[i + 1] =
          255 - Math.round(((sx / width) * 0.5 + (sy / height) * 0.5) * 255)
        data[i + 2] = Math.round(128 + (sx / width - sy / height) * 96)
        data[i + 3] = 255
      }
    }
    frames.push({ width, height, data })
  }

  return {
    frames,
    durationsMs: Array.from({ length: frameCount }, () => 40),
    loopCount: 1,
    sourceWidth: width,
    sourceHeight: height,
  }
}
