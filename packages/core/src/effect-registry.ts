import type { EffectStage } from "./effect-stack"
import type { PixelBuffer } from "./types"

export type EffectId =
  | "pre.blur"
  | "pre.contrast-shape"
  | "post.grain"
  | "post.edge-threshold"
  | "post.paper-noise"
  | "post.crt-bloom"

type ParamBound = { min: number; max: number; default: number }

type ParamOptions = readonly string[]

type EffectDefinition = {
  id: EffectId
  defaultParams: Record<string, number | string | boolean>
  paramBounds: Record<string, ParamBound>
  paramOptions: Record<string, ParamOptions>
  process: (input: PixelBuffer, params: Record<string, unknown>) => PixelBuffer
}

export const EFFECT_DEFINITIONS: readonly EffectDefinition[] = [
  {
    id: "pre.blur",
    defaultParams: { radius: 1.5 },
    paramBounds: { radius: { min: 0.5, max: 8, default: 1.5 } },
    paramOptions: {},
    process: applyBlur,
  },
  {
    id: "pre.contrast-shape",
    defaultParams: { amount: 0.25, curve: "soft" },
    paramBounds: { amount: { min: 0, max: 1, default: 0.25 } },
    paramOptions: { curve: ["soft", "medium", "hard"] },
    process: applyContrastShape,
  },
  {
    id: "post.grain",
    defaultParams: { amount: 0.12, seed: 42 },
    paramBounds: {
      amount: { min: 0, max: 1, default: 0.12 },
    },
    paramOptions: {},
    process: applyGrain,
  },
  {
    id: "post.edge-threshold",
    defaultParams: { threshold: 0.32, strength: 0.5 },
    paramBounds: {
      threshold: { min: 0, max: 1, default: 0.32 },
      strength: { min: 0, max: 1, default: 0.5 },
    },
    paramOptions: {},
    process: applyEdgeThreshold,
  },
  {
    id: "post.paper-noise",
    defaultParams: { amount: 0.08, scale: 2 },
    paramBounds: {
      amount: { min: 0, max: 1, default: 0.08 },
      scale: { min: 1, max: 16, default: 2 },
    },
    paramOptions: {},
    process: applyPaperNoise,
  },
  {
    id: "post.crt-bloom",
    defaultParams: { intensity: 0.2, radius: 2 },
    paramBounds: {
      intensity: { min: 0, max: 1, default: 0.2 },
      radius: { min: 1, max: 4, default: 2 },
    },
    paramOptions: {},
    process: applyCrtBloom,
  },
]

const effectMap = new Map<string, EffectDefinition>(
  EFFECT_DEFINITIONS.map((def) => [def.id, def])
)

export function applyEffectStages(
  input: PixelBuffer,
  stages: EffectStage[]
): PixelBuffer {
  let buffer = input

  for (const stage of stages) {
    if (!stage.enabled) {
      continue
    }

    const effectId = stage.params.effect

    if (typeof effectId !== "string") {
      continue
    }

    const definition = effectMap.get(effectId)

    if (!definition) {
      continue
    }

    buffer = definition.process(buffer, stage.params as Record<string, unknown>)
  }

  return buffer
}

function applyBlur(
  input: PixelBuffer,
  params: Record<string, unknown>
): PixelBuffer {
  const radius = clampToNumber(params.radius, 1.5, 0.5, 8)

  return boxBlur(input, radius)
}

function applyContrastShape(
  input: PixelBuffer,
  params: Record<string, unknown>
): PixelBuffer {
  const amount = clampToNumber(params.amount, 0.25, 0, 1)
  const curve = String(params.curve ?? "soft")

  return contrastShape(input, amount, curve)
}

function applyGrain(
  input: PixelBuffer,
  params: Record<string, unknown>
): PixelBuffer {
  const amount = clampToNumber(params.amount, 0.12, 0, 1)
  const seed = clampSeed(params.seed)

  return filmGrain(input, amount, seed)
}

function applyEdgeThreshold(
  input: PixelBuffer,
  params: Record<string, unknown>
): PixelBuffer {
  const threshold = clampToNumber(params.threshold, 0.32, 0, 1)
  const strength = clampToNumber(params.strength, 0.5, 0, 1)

  return edgeThreshold(input, threshold, strength)
}

function applyPaperNoise(
  input: PixelBuffer,
  params: Record<string, unknown>
): PixelBuffer {
  const amount = clampToNumber(params.amount, 0.08, 0, 1)
  const scale = clampToNumber(params.scale, 2, 1, 16)

  return paperNoise(input, amount, scale)
}

function applyCrtBloom(
  input: PixelBuffer,
  params: Record<string, unknown>
): PixelBuffer {
  const intensity = clampToNumber(params.intensity, 0.2, 0, 1)
  const radius = clampToNumber(params.radius, 2, 1, 4)

  return crtBloom(input, intensity, Math.round(radius))
}

function boxBlur(input: PixelBuffer, radius: number): PixelBuffer {
  const output = clonePixelBuffer(input)
  const w = input.width
  const h = input.height
  const r = Math.max(1, Math.round(radius))
  const kernelSize = r * 2 + 1
  const area = kernelSize * kernelSize

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let sumR = 0
      let sumG = 0
      let sumB = 0

      for (let dy = -r; dy <= r; dy += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          const sx = clampInt(x + dx, 0, w - 1)
          const sy = clampInt(y + dy, 0, h - 1)
          const i = (sy * w + sx) * 4

          sumR += input.data[i]
          sumG += input.data[i + 1]
          sumB += input.data[i + 2]
        }
      }

      const oi = (y * w + x) * 4
      output.data[oi] = Math.round(sumR / area)
      output.data[oi + 1] = Math.round(sumG / area)
      output.data[oi + 2] = Math.round(sumB / area)
    }
  }

  return output
}

function contrastShape(
  input: PixelBuffer,
  amount: number,
  curve: string
): PixelBuffer {
  const output = clonePixelBuffer(input)

  for (let i = 0; i < input.data.length; i += 4) {
    let r = (input.data[i] - 128) / 128
    let g = (input.data[i + 1] - 128) / 128
    let b = (input.data[i + 2] - 128) / 128

    if (curve === "hard") {
      const factor = 1 + amount * 3
      r = Math.sign(r) * Math.pow(Math.abs(r), 1 / factor) * factor
      g = Math.sign(g) * Math.pow(Math.abs(g), 1 / factor) * factor
      b = Math.sign(b) * Math.pow(Math.abs(b), 1 / factor) * factor
    } else if (curve === "medium") {
      const factor = 1 + amount * 2.5
      r = Math.sign(r) * Math.pow(Math.abs(r), 1 / factor) * factor * 0.8
      g = Math.sign(g) * Math.pow(Math.abs(g), 1 / factor) * factor * 0.8
      b = Math.sign(b) * Math.pow(Math.abs(b), 1 / factor) * factor * 0.8
    } else {
      const factor = 1 + amount * 2
      r = r * factor
      g = g * factor
      b = b * factor
    }

    output.data[i] = clampByte(r * 128 + 128)
    output.data[i + 1] = clampByte(g * 128 + 128)
    output.data[i + 2] = clampByte(b * 128 + 128)
  }

  return output
}

function filmGrain(
  input: PixelBuffer,
  amount: number,
  seed: number
): PixelBuffer {
  const output = clonePixelBuffer(input)
  const strength = amount * 64

  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      const noise = seededNoise(seed, x, y, 0) * strength
      const i = (y * input.width + x) * 4

      output.data[i] = clampByte(input.data[i] + noise)
      output.data[i + 1] = clampByte(input.data[i + 1] + noise)
      output.data[i + 2] = clampByte(input.data[i + 2] + noise)
    }
  }

  return output
}

function edgeThreshold(
  input: PixelBuffer,
  threshold: number,
  strength: number
): PixelBuffer {
  const output = clonePixelBuffer(input)
  const w = input.width
  const h = input.height
  const t = threshold * 255

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4
      const centerLuma =
        input.data[i] * 0.2126 +
        input.data[i + 1] * 0.7152 +
        input.data[i + 2] * 0.0722
      let edge = 0

      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const sx = clampInt(x + dx, 0, w - 1)
        const sy = clampInt(y + dy, 0, h - 1)
        const si = (sy * w + sx) * 4
        const nl =
          input.data[si] * 0.2126 +
          input.data[si + 1] * 0.7152 +
          input.data[si + 2] * 0.0722

        edge = Math.max(edge, Math.abs(centerLuma - nl))
      }

      if (edge > t) {
        const glow = ((edge - t) / (255 - t)) * strength * 64

        output.data[i] = clampByte(input.data[i] - glow)
        output.data[i + 1] = clampByte(input.data[i + 1] - glow)
        output.data[i + 2] = clampByte(input.data[i + 2] - glow)
      }
    }
  }

  return output
}

function paperNoise(
  input: PixelBuffer,
  amount: number,
  scale: number
): PixelBuffer {
  const output = clonePixelBuffer(input)
  const strength = amount * 32

  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      const sx = Math.floor(x / scale)
      const sy = Math.floor(y / scale)
      const noise = seededNoise(0xca_feb_abe, sx, sy, 0) * strength
      const i = (y * input.width + x) * 4

      output.data[i] = clampByte(input.data[i] + noise)
      output.data[i + 1] = clampByte(input.data[i + 1] + noise)
      output.data[i + 2] = clampByte(input.data[i + 2] + noise)
    }
  }

  return output
}

function crtBloom(
  input: PixelBuffer,
  intensity: number,
  radius: number
): PixelBuffer {
  if (radius < 1) {
    return input
  }

  const output = clonePixelBuffer(input)
  const w = input.width
  const h = input.height
  const glowStrength = intensity * 0.3

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4

      let glow = 0

      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist > radius) {
            continue
          }

          const sx = clampInt(x + dx, 0, w - 1)
          const sy = clampInt(y + dy, 0, h - 1)
          const si = (sy * w + sx) * 4
          const sl =
            input.data[si] * 0.2126 +
            input.data[si + 1] * 0.7152 +
            input.data[si + 2] * 0.0722
          const weight = 1 - dist / radius

          glow += sl * weight
        }
      }

      const normalizedGlow = glow / ((radius * 2 + 1) * (radius * 2 + 1))
      const bloom = normalizedGlow * glowStrength

      output.data[i] = clampByte(input.data[i] + bloom)
      output.data[i + 1] = clampByte(input.data[i + 1] + bloom)
      output.data[i + 2] = clampByte(input.data[i + 2] + bloom)
    }
  }

  return output
}

function seededNoise(
  seed: number,
  x: number,
  y: number,
  channel: number
): number {
  let hash = seed
  hash = ((hash << 5) - hash + x) | 0
  hash = ((hash << 5) - hash + y) | 0
  hash = ((hash << 5) - hash + channel) | 0
  hash = (hash ^ (hash >>> 16)) * 0x45_9b
  hash = (hash ^ (hash >>> 13)) * 0xc2_b2_ae_35

  return ((hash ^ (hash >>> 16)) & 0xff) / 128 - 1
}

function clampToNumber(
  value: unknown,
  defaultValue: number,
  min: number,
  max: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultValue
  }

  return Math.max(min, Math.min(max, value))
}

function clampSeed(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 42
  }

  return Math.round(Math.abs(value)) | 0
}

function clonePixelBuffer(buffer: PixelBuffer): PixelBuffer {
  return {
    width: buffer.width,
    height: buffer.height,
    data: new Uint8ClampedArray(buffer.data),
  }
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}
