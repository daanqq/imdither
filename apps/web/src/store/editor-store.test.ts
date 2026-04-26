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

  it("migrates old view scale into preview viewport state", () => {
    expect(
      normalizePersistedEditorState({
        settings: DEFAULT_SETTINGS,
        viewScale: "actual",
      })
    ).toMatchObject({
      previewViewport: {
        mode: "manual",
        zoom: 1,
        center: { x: 0, y: 0 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })
  })

  it("stores preview viewport separately from editor settings", () => {
    useEditorStore.setState({
      previewViewport: {
        mode: "manual",
        zoom: 4,
        center: { x: 12, y: 9 },
        gridEnabled: true,
        loupeEnabled: true,
      },
      settings: DEFAULT_SETTINGS,
    })

    useEditorStore.getState().setPreviewViewport({ mode: "fit" })
    useEditorStore.getState().transitionSettings({
      type: "apply-settings",
      settings: DEFAULT_SETTINGS,
    })

    expect(useEditorStore.getState().previewViewport).toMatchObject({
      mode: "fit",
      gridEnabled: true,
      loupeEnabled: true,
    })
    expect(useEditorStore.getState().settings).not.toHaveProperty(
      "previewViewport"
    )
  })

  it("resets manual preview viewport when output dimensions change", () => {
    useEditorStore.setState({
      previewViewport: {
        mode: "manual",
        zoom: 8,
        center: { x: 3200, y: 2400 },
        gridEnabled: true,
        loupeEnabled: true,
      },
      settings: DEFAULT_SETTINGS,
    })

    useEditorStore
      .getState()
      .transitionSettings(
        { type: "set-output-width", width: 640 },
        { sourceDimensions: { width: 4, height: 3 } }
      )

    expect(useEditorStore.getState().previewViewport).toMatchObject({
      mode: "fit",
      zoom: 1,
      center: { x: 0, y: 0 },
      gridEnabled: true,
      loupeEnabled: true,
    })
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
