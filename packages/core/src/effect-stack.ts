import { EFFECT_DEFINITIONS } from "./effect-registry"

const BAYER_ALGORITHMS = new Set(["bayer"])

export type StageKind = "pre" | "quantize" | "dither" | "post"

export type EffectStage = {
  instanceId: string
  kind: StageKind
  enabled: boolean
  params: Record<string, number | string | boolean>
}

export function buildCompatibilityStack(settings: {
  algorithm: string
  bayerSize: number
  colorDepth: { mode: string; count?: number }
  customPalette?: string[]
  matchingMode: string
  paletteId: string
}): EffectStage[] {
  const paletteParam: Record<string, number | string | boolean> = {
    paletteId: settings.paletteId,
    colorDepth:
      settings.colorDepth.mode === "limit" && settings.colorDepth.count
        ? `limit:${settings.colorDepth.count}`
        : "full",
    matchingMode: settings.matchingMode,
  }

  const ditherParam: Record<string, number | string | boolean> = {
    algorithm: settings.algorithm,
  }

  if (BAYER_ALGORITHMS.has(settings.algorithm)) {
    ditherParam.bayerSize = settings.bayerSize
  }

  const paletteKey = JSON.stringify(paletteParam)
  const ditherKey = JSON.stringify(ditherParam)

  return [
    {
      instanceId: `qs-${hashString(paletteKey)}`,
      kind: "quantize",
      enabled: true,
      params: paletteParam,
    },
    {
      instanceId: `ds-${hashString(ditherKey)}`,
      kind: "dither",
      enabled: true,
      params: ditherParam,
    },
  ]
}

const ALLOWED_KINDS: StageKind[] = ["pre", "quantize", "dither", "post"]
const KIND_ORDER: Record<StageKind, number> = {
  pre: 0,
  quantize: 1,
  dither: 2,
  post: 3,
}

export function validateEffectStack(
  stack: EffectStage[]
): { valid: true } | { valid: false; reason: string } {
  const seenIds = new Set<string>()
  let lastOrder = -1

  for (const stage of stack) {
    if (!ALLOWED_KINDS.includes(stage.kind)) {
      return {
        valid: false,
        reason: `Unknown stage kind: ${stage.kind}`,
      }
    }

    if (typeof stage.instanceId !== "string" || !stage.instanceId) {
      return { valid: false, reason: "Stage must have a non-empty instanceId" }
    }

    if (seenIds.has(stage.instanceId)) {
      return {
        valid: false,
        reason: `Duplicate stage instanceId: ${stage.instanceId}`,
      }
    }

    seenIds.add(stage.instanceId)

    if (typeof stage.enabled !== "boolean") {
      return { valid: false, reason: "Stage enabled must be boolean" }
    }

    const paramsValid = validateStageParams(stage.params)

    if (!paramsValid) {
      return {
        valid: false,
        reason: `Stage params must be plain values (string, number, boolean)`,
      }
    }

    if (stage.kind === "pre" || stage.kind === "post") {
      const effect = stage.params.effect

      if (typeof effect !== "string" || !effect) {
        return {
          valid: false,
          reason: `Stage params.effect must be a non-empty string`,
        }
      }

      if (!effect.startsWith(`${stage.kind}.`)) {
        return {
          valid: false,
          reason: `Effect "${effect}" does not match stage kind "${stage.kind}"`,
        }
      }

      const knownEffect = EFFECT_DEFINITIONS.find((def) => def.id === effect)

      if (!knownEffect) {
        return {
          valid: false,
          reason: `Unknown effect id: ${effect}`,
        }
      }

      for (const [key, bound] of Object.entries(knownEffect.paramBounds)) {
        const value = stage.params[key]

        if (typeof value !== "number") {
          return {
            valid: false,
            reason: `Param "${key}" must be a number, got ${typeof value}`,
          }
        }

        if (value < bound.min || value > bound.max) {
          return {
            valid: false,
            reason: `Param "${key}" value ${value} out of range [${bound.min}, ${bound.max}]`,
          }
        }
      }

      for (const [key, options] of Object.entries(knownEffect.paramOptions)) {
        const value = stage.params[key]

        if (typeof value !== "string" || !options.includes(value)) {
          return {
            valid: false,
            reason: `Param "${key}" must be one of [${options.join(", ")}], got ${JSON.stringify(value)}`,
          }
        }
      }
    }

    const order = KIND_ORDER[stage.kind]

    if (order < lastOrder) {
      return {
        valid: false,
        reason: `Stage group order violation: ${stage.kind} after lower-order group`,
      }
    }

    lastOrder = order
  }

  return { valid: true }
}

export function normalizeEffectStack(value: unknown): EffectStage[] {
  if (!Array.isArray(value)) {
    return []
  }

  const normalized = value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      instanceId: String(item.instanceId ?? ""),
      kind: String(item.kind ?? "") as StageKind,
      enabled: Boolean(item.enabled),
      params: isPlainRecord(item.params)
        ? toPlainParams(item.params)
        : ({} as Record<string, number | string | boolean>),
    }))

  const result = validateEffectStack(normalized)

  if (!result.valid) {
    return []
  }

  return normalized
}

function validateStageParams(
  params: Record<string, unknown>
): params is Record<string, number | string | boolean> {
  if (!isPlainRecord(params)) {
    return false
  }

  for (const value of Object.values(params)) {
    const type = typeof value

    if (type !== "string" && type !== "number" && type !== "boolean") {
      return false
    }
  }

  return true
}

function toPlainParams(
  source: Record<string, unknown>
): Record<string, number | string | boolean> {
  const result: Record<string, number | string | boolean> = {}

  for (const [key, value] of Object.entries(source)) {
    const type = typeof value

    if (type === "string" || type === "number" || type === "boolean") {
      result[key] = value as string | number | boolean
    }
  }

  return result
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hashString(value: string): string {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }

  return (hash >>> 0).toString(16).padStart(8, "0")
}
