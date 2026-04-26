import { z } from "zod"

import { DITHER_ALGORITHM_IDS } from "./algorithm-registry"
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

export const editorSettingsSchema = z.object({
  schemaVersion: z.literal(2),
  algorithm: z.enum(DITHER_ALGORITHM_IDS),
  bayerSize: z.union([z.literal(2), z.literal(4), z.literal(8)]),
  paletteId: z.string().min(1),
  customPalette: z.array(hexColorSchema).min(2).max(256).optional(),
  alphaBackground: z.enum(["black", "white"]),
  colorDepth: colorDepthSchema,
  matchingMode: z.enum(["rgb", "perceptual"]),
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
})

export const DEFAULT_SETTINGS: EditorSettings = {
  schemaVersion: 2,
  algorithm: "bayer",
  bayerSize: 8,
  paletteId: "gray-4",
  alphaBackground: "white",
  colorDepth: { mode: "full" },
  matchingMode: "rgb",
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
}

export function normalizeSettings(value: unknown): EditorSettings {
  const merged = mergeSettings(DEFAULT_SETTINGS, value)
  return editorSettingsSchema.parse(merged)
}

export function safeNormalizeSettings(value: unknown): EditorSettings | null {
  const result = editorSettingsSchema.safeParse(
    mergeSettings(DEFAULT_SETTINGS, value)
  )

  if (!result.success) {
    return null
  }

  return result.data
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
    schemaVersion: 2,
    colorDepth: isRecord(value.colorDepth)
      ? value.colorDepth
      : defaults.colorDepth,
    matchingMode:
      typeof value.matchingMode === "string"
        ? value.matchingMode
        : defaults.matchingMode,
    resize: {
      ...defaults.resize,
      ...(isRecord(value.resize) ? value.resize : {}),
    },
    preprocess: {
      ...defaults.preprocess,
      ...(isRecord(value.preprocess) ? value.preprocess : {}),
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
