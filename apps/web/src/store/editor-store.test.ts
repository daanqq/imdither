import { DEFAULT_SETTINGS } from "@workspace/core"
import { describe, expect, it } from "vitest"

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: createMemoryStorage(),
})

const { normalizeCompareMode, useEditorStore } = await import("./editor-store")

describe("editor store compare mode migration", () => {
  it("migrates old split state to slide mode", () => {
    expect(normalizeCompareMode("split")).toBe("slide")
  })

  it("keeps supported compare modes unchanged", () => {
    expect(normalizeCompareMode("slide")).toBe("slide")
    expect(normalizeCompareMode("processed")).toBe("processed")
    expect(normalizeCompareMode("original")).toBe("original")
  })

  it("falls back to slide for unknown persisted values", () => {
    expect(normalizeCompareMode("unknown")).toBe("slide")
    expect(normalizeCompareMode(null)).toBe("slide")
  })
})

describe("editor store settings transitions", () => {
  it("applies settings intents and stores transition Source Notices", () => {
    useEditorStore.setState({
      settings: DEFAULT_SETTINGS,
      sourceNotice: null,
    })

    useEditorStore
      .getState()
      .transitionSettings(
        { type: "set-output-width", width: 4096 },
        { sourceDimensions: { width: 4096, height: 3072 } }
      )

    expect(useEditorStore.getState().settings.resize).toMatchObject({
      width: 4000,
      height: 3000,
    })
    expect(useEditorStore.getState().sourceNotice).toBe(
      "[OUTPUT CLAMPED: 4000x3000 / 12MP]"
    )
  })
})

function createMemoryStorage(): Storage {
  const entries = new Map<string, string>()

  return {
    get length() {
      return entries.size
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key) => entries.delete(key),
    setItem: (key, value) => entries.set(key, value),
  }
}
