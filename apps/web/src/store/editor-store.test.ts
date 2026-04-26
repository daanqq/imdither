import { DEFAULT_SETTINGS } from "@workspace/core"
import { describe, expect, it } from "vitest"

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: createMemoryStorage(),
})

const { normalizeCompareMode, normalizePersistedEditorState, useEditorStore } =
  await import("./editor-store")

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
  it("normalizes persisted schema version 1 settings even when Zustand version already matches", () => {
    const persisted = normalizePersistedEditorState({
      settings: {
        schemaVersion: 1,
        algorithm: "atkinson",
      },
      compareMode: "split",
      exportFormat: "jpeg",
      exportQuality: 0.5,
    })

    expect(persisted).toMatchObject({
      compareMode: "slide",
      exportFormat: "jpeg",
      exportQuality: 0.5,
      settings: {
        schemaVersion: 2,
        algorithm: "atkinson",
        colorDepth: { mode: "full" },
        matchingMode: "rgb",
      },
    })
  })

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

  it("stores export preferences separately from editor settings", () => {
    useEditorStore.setState({
      exportFormat: "png",
      exportQuality: 0.92,
      settings: DEFAULT_SETTINGS,
    })

    useEditorStore.getState().setExportFormat("webp")
    useEditorStore.getState().setExportQuality(0.5)
    useEditorStore.getState().transitionSettings({
      type: "apply-settings",
      settings: DEFAULT_SETTINGS,
    })

    expect(useEditorStore.getState().exportFormat).toBe("webp")
    expect(useEditorStore.getState().exportQuality).toBe(0.5)
    expect(useEditorStore.getState().settings).not.toHaveProperty(
      "exportFormat"
    )
    expect(useEditorStore.getState().settings).not.toHaveProperty(
      "exportQuality"
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
