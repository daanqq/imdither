import { z } from "zod"
import { gzipSync, gunzipSync, strFromU8, strToU8 } from "fflate"

import {
  DEFAULT_SETTINGS,
  editorSettingsSchema,
  normalizeSettings,
} from "./settings"
import type { EditorSettings } from "./types"

const LOOK_FORMAT = "imdither-look"
const LOOK_KIND = "look-snapshot"
const LOOK_VERSION = 1

const lookSnapshotSchema = z.object({
  format: z.literal(LOOK_FORMAT),
  version: z.literal(LOOK_VERSION),
  kind: z.literal(LOOK_KIND),
  createdAt: z.string().datetime(),
  name: z.string().min(1).optional(),
  settings: editorSettingsSchema,
})
const compactLookPayloadSchema = z.object({
  f: z.literal(LOOK_FORMAT),
  v: z.literal(LOOK_VERSION),
  k: z.literal("look"),
  t: z.string().datetime(),
  n: z.string().min(1).optional(),
  s: z.unknown(),
})

export type LookSnapshot = z.infer<typeof lookSnapshotSchema>

export function createLookSnapshot({
  createdAt = new Date().toISOString(),
  name,
  settings,
}: {
  createdAt?: string
  name?: string
  settings: EditorSettings
}): LookSnapshot {
  return lookSnapshotSchema.parse({
    format: LOOK_FORMAT,
    version: LOOK_VERSION,
    kind: LOOK_KIND,
    createdAt,
    ...(name ? { name } : {}),
    settings: normalizeSettings(settings),
  })
}

export function encodeLookPayload(snapshot: unknown): string {
  const result = lookSnapshotSchema.safeParse(snapshot)

  if (!result.success) {
    return encodeBase64Url(
      gzipSync(strToU8(JSON.stringify(snapshot)), {
        level: 9,
      })
    )
  }

  return encodeBase64Url(
    gzipSync(strToU8(JSON.stringify(toCompactLookPayload(result.data))), {
      level: 9,
    })
  )
}

export function decodeLookPayload(payload: string): LookSnapshot {
  let parsed: unknown

  try {
    parsed = JSON.parse(strFromU8(gunzipSync(decodeBase64Url(payload))))
  } catch {
    throw new Error("Look payload is not valid compressed base64url JSON")
  }

  const result = parseLookSnapshot(parsed)

  if (!result) {
    throw new Error("Unsupported Look Snapshot payload")
  }

  return result
}

export function extractLookPayload(text: string): string | null {
  const trimmed = text.trim()

  if (!trimmed) {
    return null
  }

  const hashPayload = extractLookPayloadFromHash(trimmed)

  if (hashPayload) {
    return hashPayload
  }

  const hashIndex = trimmed.indexOf("#")

  if (hashIndex >= 0) {
    return extractLookPayloadFromHash(trimmed.slice(hashIndex))
  }

  return trimmed
}

function extractLookPayloadFromHash(hash: string): string | null {
  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash

  for (const part of normalizedHash.split("&")) {
    const [key, value = ""] = part.split("=")

    if (key === "look") {
      return decodeURIComponent(value)
    }
  }

  return null
}

function parseLookSnapshot(value: unknown): LookSnapshot | null {
  const snapshotResult = lookSnapshotSchema.safeParse(value)

  if (snapshotResult.success) {
    return snapshotResult.data
  }

  const compactResult = compactLookPayloadSchema.safeParse(value)

  if (!compactResult.success) {
    return null
  }

  const snapshot = {
    format: LOOK_FORMAT,
    version: LOOK_VERSION,
    kind: LOOK_KIND,
    createdAt: compactResult.data.t,
    ...(compactResult.data.n ? { name: compactResult.data.n } : {}),
    settings: normalizeSettings(compactResult.data.s),
  }

  const normalizedResult = lookSnapshotSchema.safeParse(snapshot)

  if (!normalizedResult.success) {
    return null
  }

  return normalizedResult.data
}

function toCompactLookPayload(snapshot: LookSnapshot): unknown {
  return {
    f: snapshot.format,
    v: snapshot.version,
    k: "look",
    t: snapshot.createdAt,
    ...(snapshot.name ? { n: snapshot.name } : {}),
    s: diffSettings(snapshot.settings),
  }
}

function diffSettings(settings: EditorSettings): Partial<EditorSettings> {
  return diffValue(DEFAULT_SETTINGS, settings) as Partial<EditorSettings>
}

function diffValue(defaultValue: unknown, value: unknown): unknown {
  if (JSON.stringify(defaultValue) === JSON.stringify(value)) {
    return {}
  }

  if (isPlainRecord(defaultValue) && isPlainRecord(value)) {
    const result: Record<string, unknown> = {}

    for (const [key, nextValue] of Object.entries(value)) {
      const nestedDiff = diffValue(defaultValue[key], nextValue)
      const hasDiff =
        isPlainRecord(nestedDiff) && Object.keys(nestedDiff).length === 0
          ? false
          : true

      if (hasDiff) {
        result[key] = nestedDiff
      }
    }

    return result
  }

  return value
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function encodeBase64Url(bytes: Uint8Array): string {
  return encodeBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function decodeBase64Url(payload: string): Uint8Array {
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  )

  return Uint8Array.from(decodeBase64(padded))
}

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

function encodeBase64(bytes: Uint8Array): string {
  let output = ""

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]
    const second = bytes[index + 1]
    const third = bytes[index + 2]
    const chunk = (first << 16) | ((second ?? 0) << 8) | (third ?? 0)

    output += BASE64_ALPHABET[(chunk >> 18) & 0x3f]
    output += BASE64_ALPHABET[(chunk >> 12) & 0x3f]
    output += second === undefined ? "=" : BASE64_ALPHABET[(chunk >> 6) & 0x3f]
    output += third === undefined ? "=" : BASE64_ALPHABET[chunk & 0x3f]
  }

  return output
}

function decodeBase64(base64: string): number[] {
  const bytes: number[] = []

  for (let index = 0; index < base64.length; index += 4) {
    const first = BASE64_ALPHABET.indexOf(base64[index])
    const second = BASE64_ALPHABET.indexOf(base64[index + 1])
    const third =
      base64[index + 2] === "=" ? 0 : BASE64_ALPHABET.indexOf(base64[index + 2])
    const fourth =
      base64[index + 3] === "=" ? 0 : BASE64_ALPHABET.indexOf(base64[index + 3])
    const chunk = (first << 18) | (second << 12) | (third << 6) | fourth

    bytes.push((chunk >> 16) & 0xff)

    if (base64[index + 2] !== "=") {
      bytes.push((chunk >> 8) & 0xff)
    }

    if (base64[index + 3] !== "=") {
      bytes.push(chunk & 0xff)
    }
  }

  return bytes
}
