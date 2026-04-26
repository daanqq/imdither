import { safeNormalizeSettings } from "./settings"

export type ParsedPalette = {
  colors: string[]
}

const HEX_TOKEN_PATTERN = /^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const ALPHA_HEX_TOKEN_PATTERN = /^#?(?:[0-9a-fA-F]{4}|[0-9a-fA-F]{8})$/
const MAX_PALETTE_COLORS = 256

export function normalizePaletteColors(colors: readonly string[]): string[] {
  const normalized: string[] = []
  const seen = new Set<string>()

  for (const color of colors) {
    const normalizedColor = normalizePaletteColor(color)

    if (!seen.has(normalizedColor)) {
      seen.add(normalizedColor)
      normalized.push(normalizedColor)
    }
  }

  if (normalized.length < 2) {
    throw new Error("Palette must contain at least 2 unique colors")
  }

  if (normalized.length > MAX_PALETTE_COLORS) {
    throw new Error("Palette must contain no more than 256 colors")
  }

  return normalized
}

export function normalizePaletteColor(value: string): string {
  const token = value.trim()

  if (ALPHA_HEX_TOKEN_PATTERN.test(token)) {
    throw new Error("Alpha palette colors are not supported")
  }

  if (!HEX_TOKEN_PATTERN.test(token)) {
    throw new Error(`Unsupported palette color: ${value}`)
  }

  const hex = token.startsWith("#") ? token.slice(1) : token

  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((part) => `${part}${part}`)
      .join("")
      .toLowerCase()}`
  }

  return `#${hex.toLowerCase()}`
}

export function parsePaletteText(text: string): ParsedPalette {
  const trimmed = text.trim()

  if (!trimmed) {
    throw new Error("Palette input is empty")
  }

  const jsonPalette = tryParseJsonPalette(trimmed)

  if (jsonPalette) {
    return { colors: normalizePaletteColors(jsonPalette) }
  }

  if (/^GIMP Palette\b/i.test(trimmed)) {
    return { colors: normalizePaletteColors(parseGplRows(trimmed)) }
  }

  return { colors: normalizePaletteColors(parsePlainHexText(trimmed)) }
}

export function exportPaletteJson(colors: readonly string[]): string {
  return JSON.stringify(
    {
      format: "imdither-palette",
      version: 1,
      colors: normalizePaletteColors(colors),
    },
    null,
    2
  )
}

export function exportPaletteGpl(
  colors: readonly string[],
  name = "IMDITHER Palette"
): string {
  const normalized = normalizePaletteColors(colors)
  const rows = normalized.map((hex) => {
    const red = Number.parseInt(hex.slice(1, 3), 16)
    const green = Number.parseInt(hex.slice(3, 5), 16)
    const blue = Number.parseInt(hex.slice(5, 7), 16)

    return `${red} ${green} ${blue}\t${hex}`
  })

  return ["GIMP Palette", `Name: ${name}`, "Columns: 8", "#", ...rows, ""].join(
    "\n"
  )
}

function tryParseJsonPalette(text: string): string[] | null {
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }

  if (Array.isArray(parsed)) {
    return parsed.map(assertStringColor)
  }

  if (!isRecord(parsed)) {
    throw new Error("Unsupported JSON palette payload")
  }

  if (Array.isArray(parsed.colors)) {
    return parsed.colors.map(assertStringColor)
  }

  const settings = safeNormalizeSettings(parsed)

  if (settings?.customPalette?.length) {
    return settings.customPalette
  }

  throw new Error("JSON palette payload does not contain colors")
}

function parseGplRows(text: string): string[] {
  const colors: string[] = []

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      /^GIMP Palette\b/i.test(trimmed) ||
      /^Name:/i.test(trimmed) ||
      /^Columns:/i.test(trimmed)
    ) {
      continue
    }

    const match = trimmed.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s|$)/)

    if (!match) {
      throw new Error(`Unsupported GPL palette row: ${trimmed}`)
    }

    const channels = match.slice(1, 4).map((part) => Number(part))

    if (channels.some((channel) => channel < 0 || channel > 255)) {
      throw new Error(`Unsupported GPL palette row: ${trimmed}`)
    }

    colors.push(
      `#${channels
        .map((channel) => channel.toString(16).padStart(2, "0"))
        .join("")}`
    )
  }

  return colors
}

function parsePlainHexText(text: string): string[] {
  const colors: string[] = []

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed) {
      continue
    }

    const tokens = trimmed.split(/[\s,]+/).filter(Boolean)
    const isCommentLine =
      trimmed.startsWith("#") &&
      !tokens.some((token) => HEX_TOKEN_PATTERN.test(token))

    if (isCommentLine) {
      continue
    }

    colors.push(...tokens)
  }

  return colors
}

function assertStringColor(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Palette colors must be strings")
  }

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
