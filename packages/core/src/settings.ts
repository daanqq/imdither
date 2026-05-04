import { z } from "zod"

import { DITHER_ALGORITHM_IDS } from "./algorithm-registry"
import { buildCompatibilityStack, validateEffectStack } from "./effect-stack"
import type { EditorSettings } from "./types"

export const MAX_SOURCE_DIMENSION = 4096
export const MAX_OUTPUT_PIXELS = 12_000_000
export const DEFAULT_OUTPUT_WIDTH = 960
export const DEFAULT_OUTPUT_HEIGHT = 640

const hexColorSchema = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
const colorDepthSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("full") }),
  z.object({
    mode: z.literal("limit"),
    count: z.union([z.literal(2), z.literal(4), z.literal(8), z.literal(16)]),
  }),
])

const effectStageParamsSchema = z.record(
  z.union([z.string(), z.number(), z.boolean()])
)

const halftoneDotShapeSchema = z.enum(["round", "square", "line"])
const halftonePatternSizeSchema = z.union([
  z.literal(4),
  z.literal(6),
  z.literal(8),
])

const halftoneScreenSchema = z.object({
  dotShape: halftoneDotShapeSchema,
  angle: z.number().min(0).max(360),
  frequency: z.number().min(1).max(100),
  patternSize: halftonePatternSizeSchema,
})

const effectStageSchema = z.object({
  instanceId: z.string().min(1),
  kind: z.enum(["pre", "quantize", "dither", "post"]),
  enabled: z.boolean(),
  params: effectStageParamsSchema,
})

export const editorSettingsSchema = z.object({
  schemaVersion: z.union([
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  algorithm: z.enum(DITHER_ALGORITHM_IDS),
  bayerSize: z.union([z.literal(2), z.literal(4), z.literal(8)]),
  paletteId: z.string().min(1),
  customPalette: z.array(hexColorSchema).min(2).max(256).optional(),
  alphaBackground: z.enum(["black", "white"]),
  colorDepth: colorDepthSchema,
  matchingMode: z.enum(["rgb", "perceptual"]),
  effectStack: z.array(effectStageSchema),
  resize: z.object({
    mode: z.enum(["bilinear", "nearest"]),
    fit: z.enum(["contain", "cover", "stretch"]),
    width: z.number().int().min(1).max(MAX_SOURCE_DIMENSION),
    height: z.number().int().min(1).max(MAX_SOURCE_DIMENSION),
  }),
  preprocess: z.object({
    brightness: z.number().min(-100).max(100),
    contrast: z.number().min(-100).max(100),
    gamma: z.number().min(0.2).max(3),
    invert: z.boolean(),
    colorMode: z.enum(["grayscale-first", "color-preserve"]),
  }),
  halftoneScreen: halftoneScreenSchema,
  temporalStability: z.enum(["none", "global-palette"]),
})

export const DEFAULT_HALFTONE_SCREEN = {
  dotShape: "round" as const,
  angle: 0,
  frequency: 50,
  patternSize: 8 as const,
}

export const DEFAULT_SETTINGS: EditorSettings = {
  schemaVersion: 5,
  algorithm: "bayer",
  bayerSize: 8,
  paletteId: "gray-4",
  alphaBackground: "white",
  colorDepth: { mode: "full" },
  matchingMode: "rgb",
  effectStack: buildCompatibilityStack({
    algorithm: "bayer",
    bayerSize: 8,
    colorDepth: { mode: "full" },
    matchingMode: "rgb",
    paletteId: "gray-4",
  }),
  resize: {
    mode: "bilinear",
    fit: "contain",
    width: DEFAULT_OUTPUT_WIDTH,
    height: DEFAULT_OUTPUT_HEIGHT,
  },
  preprocess: {
    brightness: 0,
    contrast: 0,
    gamma: 1,
    invert: false,
    colorMode: "grayscale-first",
  },
  halftoneScreen: DEFAULT_HALFTONE_SCREEN,
  temporalStability: "none" as const,
}

export function normalizeSettings(value: unknown): EditorSettings {
  const merged = mergeSettings(DEFAULT_SETTINGS, value)
  const parsed = editorSettingsSchema.parse(merged)

  if (Array.isArray(parsed.effectStack) && parsed.effectStack.length > 0) {
    const validation = validateEffectStack(parsed.effectStack)

    if (!validation.valid) {
      throw new Error(`Invalid effect stack: ${validation.reason}`)
    }
  }

  return {
    ...parsed,
    schemaVersion: 5,
    effectStack: resolveEffectStack(parsed),
  }
}

export function safeNormalizeSettings(value: unknown): EditorSettings | null {
  const merged = mergeSettings(DEFAULT_SETTINGS, value)
  const result = editorSettingsSchema.safeParse(merged)

  if (!result.success) {
    return null
  }

  if (
    Array.isArray(result.data.effectStack) &&
    result.data.effectStack.length > 0
  ) {
    const validation = validateEffectStack(result.data.effectStack)

    if (!validation.valid) {
      return null
    }
  }

  return {
    ...result.data,
    schemaVersion: 5,
    effectStack: resolveEffectStack(result.data),
  }
}

function resolveEffectStack(settings: {
  algorithm: string
  bayerSize: number
  colorDepth: { mode: string; count?: number }
  matchingMode: string
  paletteId: string
  effectStack: unknown[]
}): EditorSettings["effectStack"] {
  const core = buildCompatibilityStack(settings)
  const preStages = extractGroup(settings.effectStack, "pre")
  const postStages = extractGroup(settings.effectStack, "post")

  if (preStages.length === 0 && postStages.length === 0) {
    return core
  }

  return [...preStages, ...core, ...postStages]
}

function extractGroup(
  stack: unknown,
  kind: string
): EditorSettings["effectStack"] {
  if (!Array.isArray(stack)) {
    return []
  }

  return stack
    .filter(
      (item): item is Record<string, unknown> =>
        isRecord(item) && item.kind === kind
    )
    .map((item) => ({
      instanceId: String(
        item.instanceId ?? `es-${Math.random().toString(36).slice(2, 10)}`
      ),
      kind: kind as EditorSettings["effectStack"][0]["kind"],
      enabled: Boolean(item.enabled),
      params: isRecord(item.params)
        ? (Object.fromEntries(
            Object.entries(item.params).filter(
              ([, v]) =>
                typeof v === "string" ||
                typeof v === "number" ||
                typeof v === "boolean"
            )
          ) as Record<string, number | string | boolean>)
        : {},
    }))
}

export function clampOutputSize(
  width: number,
  height: number
): {
  width: number
  height: number
  downscaled: boolean
} {
  const safeWidth = Math.max(
    1,
    Math.min(MAX_SOURCE_DIMENSION, Math.round(width))
  )
  const safeHeight = Math.max(
    1,
    Math.min(MAX_SOURCE_DIMENSION, Math.round(height))
  )
  const pixels = safeWidth * safeHeight

  if (pixels <= MAX_OUTPUT_PIXELS) {
    return { width: safeWidth, height: safeHeight, downscaled: false }
  }

  const scale = Math.sqrt(MAX_OUTPUT_PIXELS / pixels)

  return {
    width: Math.max(1, Math.floor(safeWidth * scale)),
    height: Math.max(1, Math.floor(safeHeight * scale)),
    downscaled: true,
  }
}

function mergeSettings(defaults: EditorSettings, value: unknown): unknown {
  if (!isRecord(value)) {
    return defaults
  }

  return {
    ...defaults,
    ...value,
    schemaVersion: 5,
    colorDepth: isRecord(value.colorDepth)
      ? value.colorDepth
      : defaults.colorDepth,
    matchingMode:
      typeof value.matchingMode === "string"
        ? value.matchingMode
        : defaults.matchingMode,
    effectStack: Array.isArray(value.effectStack)
      ? value.effectStack
      : defaults.effectStack,
    resize: {
      ...defaults.resize,
      ...(isRecord(value.resize) ? value.resize : {}),
    },
    preprocess: {
      ...defaults.preprocess,
      ...(isRecord(value.preprocess) ? value.preprocess : {}),
    },
    halftoneScreen: {
      ...defaults.halftoneScreen,
      ...(isRecord(value.halftoneScreen) ? value.halftoneScreen : {}),
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
