import { describe, expect, it } from "vitest"

import en from "./en/common.json"
import ru from "./ru/common.json"

const PLURAL_SUFFIX_PATTERN = /_(zero|one|two|few|many|other)$/
const INTERPOLATION_PATTERN = /\{\{([a-zA-Z0-9_]+)\}\}/g

type FlatEntry = {
  key: string
  value: unknown
}

function flattenEntries(
  record: Record<string, unknown>,
  prefix = ""
): FlatEntry[] {
  const entries: FlatEntry[] = []

  for (const [key, value] of Object.entries(record)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      entries.push(...flattenEntries(value as Record<string, unknown>, path))
    } else {
      entries.push({ key: path, value })
    }
  }

  return entries
}

function extractPlaceholders(text: string): string[] {
  const names = new Set<string>()
  for (const match of text.matchAll(INTERPOLATION_PATTERN)) {
    if (match[1]) {
      names.add(match[1])
    }
  }
  return Array.from(names).sort()
}

function partitionPluralKeys(entries: FlatEntry[]) {
  const regular = new Map<string, string>()
  const plurals = new Map<string, Map<string, string>>()

  for (const entry of entries) {
    const strValue = typeof entry.value === "string" ? entry.value : ""
    const match = entry.key.match(PLURAL_SUFFIX_PATTERN)
    if (match) {
      const suffix = match[1]
      const baseKey = entry.key.slice(0, -suffix.length - 1)
      let forms = plurals.get(baseKey)
      if (!forms) {
        forms = new Map()
        plurals.set(baseKey, forms)
      }
      forms.set(suffix, strValue)
    } else {
      regular.set(entry.key, strValue)
    }
  }

  return { regular, plurals }
}

describe("EN / RU locale parity", () => {
  const enEntries = flattenEntries(en)
  const ruEntries = flattenEntries(ru)

  it("contains only non-empty trimmed strings with no em dashes in both EN and RU", () => {
    for (const [locale, entries] of [
      ["en", enEntries],
      ["ru", ruEntries],
    ] as const) {
      expect(entries.length).toBeGreaterThan(0)
      for (const { key, value } of entries) {
        expect(typeof value, `${locale}:${key} must be a string`).toBe("string")
        expect(
          (value as string).trim().length,
          `${locale}:${key} must not be empty`
        ).toBeGreaterThan(0)
        expect(
          value as string,
          `${locale}:${key} must not contain em dash`
        ).not.toContain("\u2014")
      }
    }
  })

  it("maintains identical nested keys and complete CLDR plural groups across EN and RU", () => {
    const enParts = partitionPluralKeys(enEntries)
    const ruParts = partitionPluralKeys(ruEntries)

    expect(Array.from(ruParts.regular.keys()).sort()).toEqual(
      Array.from(enParts.regular.keys()).sort()
    )

    expect(Array.from(ruParts.plurals.keys()).sort()).toEqual(
      Array.from(enParts.plurals.keys()).sort()
    )

    for (const [baseKey, enForms] of enParts.plurals) {
      expect(enForms.has("one"), `en:${baseKey}_one`).toBe(true)
      expect(enForms.has("other"), `en:${baseKey}_other`).toBe(true)

      const ruForms = ruParts.plurals.get(baseKey)
      expect(ruForms, `ru plural group ${baseKey}`).toBeDefined()
      expect(ruForms?.has("one"), `ru:${baseKey}_one`).toBe(true)
      expect(ruForms?.has("few"), `ru:${baseKey}_few`).toBe(true)
      expect(ruForms?.has("many"), `ru:${baseKey}_many`).toBe(true)
      expect(ruForms?.has("other"), `ru:${baseKey}_other`).toBe(true)
    }
  })

  it("keeps interpolation placeholders consistent between EN and RU", () => {
    const enParts = partitionPluralKeys(enEntries)
    const ruParts = partitionPluralKeys(ruEntries)

    for (const [key, enVal] of enParts.regular) {
      const ruVal = ruParts.regular.get(key)
      expect(ruVal).toBeDefined()
      expect(
        extractPlaceholders(ruVal ?? ""),
        `placeholders mismatch on ${key}`
      ).toEqual(extractPlaceholders(enVal))
    }

    for (const [baseKey, enForms] of enParts.plurals) {
      const expected = extractPlaceholders(enForms.get("other") ?? "")
      const ruForms = ruParts.plurals.get(baseKey)
      for (const [form, ruVal] of ruForms ?? []) {
        expect(
          extractPlaceholders(ruVal),
          `placeholders mismatch on ${baseKey}_${form}`
        ).toEqual(expected)
      }
    }
  })

  it("uses idiomatic Russian terminology without Look anglicisms", () => {
    expect(ru.tabs.looks).toBe("Стили")
    for (const { key, value } of ruEntries) {
      const text = String(value)
      expect(text, `ru:${key} contains Look anglicism`).not.toMatch(
        /\blook('и|'ов|-рецепт|-ссылк|\b)/i
      )
    }
  })
})
