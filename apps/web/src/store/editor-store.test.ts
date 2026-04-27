import { DEFAULT_SETTINGS } from "@workspace/core"
import { beforeEach, describe, expect, it } from "vitest"

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
  beforeEach(() => {
    resetEditorStore()
  })

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

  it("does not restore session-local settings history from persisted state", () => {
    const persisted = normalizePersistedEditorState({
      canRedoSettingsChange: true,
      canUndoSettingsChange: true,
      settings: DEFAULT_SETTINGS,
      settingsHistory: {
        future: [{ ...DEFAULT_SETTINGS, algorithm: "jarvis" }],
        past: [{ ...DEFAULT_SETTINGS, algorithm: "atkinson" }],
      },
    })

    expect(persisted).not.toHaveProperty("canRedoSettingsChange")
    expect(persisted).not.toHaveProperty("canUndoSettingsChange")
    expect(persisted).not.toHaveProperty("settingsHistory")
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
      exportQuality: 0.9,
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

  it("undoes and redoes editor settings transitions", () => {
    useEditorStore.getState().transitionSettings({
      type: "set-algorithm",
      algorithm: "floyd-steinberg",
    })

    expect(useEditorStore.getState()).toMatchObject({
      canRedoSettingsChange: false,
      canUndoSettingsChange: true,
      settings: { algorithm: "floyd-steinberg" },
    })

    useEditorStore.getState().undoSettingsChange()

    expect(useEditorStore.getState()).toMatchObject({
      canRedoSettingsChange: true,
      canUndoSettingsChange: false,
      settings: { algorithm: DEFAULT_SETTINGS.algorithm },
    })

    useEditorStore.getState().redoSettingsChange()

    expect(useEditorStore.getState()).toMatchObject({
      canRedoSettingsChange: false,
      canUndoSettingsChange: true,
      settings: { algorithm: "floyd-steinberg" },
    })
  })

  it("resets manual preview viewport when undo or redo restores different output dimensions", () => {
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

    useEditorStore.setState({
      previewViewport: {
        mode: "manual",
        zoom: 8,
        center: { x: 3200, y: 2400 },
        gridEnabled: true,
        loupeEnabled: true,
      },
    })

    useEditorStore.getState().undoSettingsChange()

    expect(useEditorStore.getState().previewViewport).toMatchObject({
      mode: "fit",
      zoom: 1,
      center: { x: 0, y: 0 },
      gridEnabled: true,
      loupeEnabled: true,
    })

    useEditorStore.setState({
      previewViewport: {
        mode: "manual",
        zoom: 8,
        center: { x: 3200, y: 2400 },
        gridEnabled: true,
        loupeEnabled: true,
      },
    })

    useEditorStore.getState().redoSettingsChange()

    expect(useEditorStore.getState().previewViewport).toMatchObject({
      mode: "fit",
      zoom: 1,
      center: { x: 0, y: 0 },
      gridEnabled: true,
      loupeEnabled: true,
    })
  })

  it("clears redo when a new settings transition follows undo", () => {
    useEditorStore.getState().transitionSettings({
      type: "set-algorithm",
      algorithm: "floyd-steinberg",
    })
    useEditorStore.getState().transitionSettings({
      type: "set-matching-mode",
      matchingMode: "perceptual",
    })

    useEditorStore.getState().undoSettingsChange()
    expect(useEditorStore.getState().canRedoSettingsChange).toBe(true)

    useEditorStore.getState().transitionSettings({
      type: "set-color-mode",
      colorMode: "color-preserve",
    })

    expect(useEditorStore.getState()).toMatchObject({
      canRedoSettingsChange: false,
      canUndoSettingsChange: true,
      settings: {
        algorithm: "floyd-steinberg",
        matchingMode: "rgb",
        preprocess: { colorMode: "color-preserve" },
      },
    })
  })

  it("can apply source-driven output sizing without creating settings history", () => {
    useEditorStore
      .getState()
      .transitionSettings(
        { type: "set-output-size", width: 1024, height: 768 },
        undefined,
        { recordHistory: false }
      )

    expect(useEditorStore.getState()).toMatchObject({
      canRedoSettingsChange: false,
      canUndoSettingsChange: false,
      settings: {
        resize: {
          height: 768,
          width: 1024,
        },
      },
    })
  })

  it("keeps view, export, panel, runtime, notice, and metadata state out of settings history", () => {
    useEditorStore.getState().setCompareMode("original")
    useEditorStore.getState().setPreviewViewport({
      mode: "manual",
      zoom: 2,
      center: { x: 8, y: 4 },
    })
    useEditorStore.getState().setExportFormat("jpeg")
    useEditorStore.getState().setExportQuality(0.47)
    useEditorStore.getState().setAdvancedOpen(true)
    useEditorStore.getState().setStatus("ready")
    useEditorStore.getState().setError("Preview failed")
    useEditorStore.getState().setSourceNotice("[SOURCE LOADED]")
    useEditorStore.getState().setMetadata({
      algorithmName: DEFAULT_SETTINGS.algorithm,
      exportFormat: "PNG",
      outputHeight: 1,
      outputWidth: 1,
      paletteSize: 2,
      processingTimeMs: 4.7,
      sourceHeight: 1,
      sourceWidth: 1,
    })

    expect(useEditorStore.getState()).toMatchObject({
      canRedoSettingsChange: false,
      canUndoSettingsChange: false,
      settings: DEFAULT_SETTINGS,
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

function resetEditorStore() {
  useEditorStore.setState({
    advancedOpen: false,
    canRedoSettingsChange: false,
    canUndoSettingsChange: false,
    compareMode: "slide",
    error: null,
    exportFormat: "png",
    exportQuality: 1,
    metadata: null,
    previewViewport: {
      center: { x: 0, y: 0 },
      gridEnabled: false,
      loupeEnabled: false,
      mode: "fit",
      zoom: 1,
    },
    settings: DEFAULT_SETTINGS,
    settingsHistory: {
      future: [],
      past: [],
    },
    sourceNotice: null,
    status: "idle",
  })
}
