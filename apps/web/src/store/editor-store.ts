import {
  DEFAULT_SETTINGS,
  PRESET_PALETTES,
  normalizeSettings,
  type EditorSettings,
  type ProcessingMetadata,
} from "@workspace/core"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import {
  clampExportQuality,
  DEFAULT_EXPORT_FORMAT,
  DEFAULT_EXPORT_QUALITY,
  normalizeExportFormat,
  type ExportFormat,
} from "../lib/export-image"
import {
  applySettingsTransition,
  type SettingsTransition,
  type SettingsTransitionContext,
  type SettingsTransitionResult,
} from "../lib/editor-settings-transition"
import {
  DEFAULT_PREVIEW_VIEWPORT,
  normalizePreviewViewport,
  type PreviewViewport,
} from "../lib/preview-viewport"

export type CompareMode = "processed" | "original" | "slide"
export type ViewScale = "fit" | "actual"
export type JobStatus =
  | "idle"
  | "queued"
  | "processing"
  | "ready"
  | "exporting"
  | "error"

type EditorState = {
  settings: EditorSettings
  canRedoSettingsChange: boolean
  canUndoSettingsChange: boolean
  settingsHistory: SettingsHistory
  compareMode: CompareMode
  previewViewport: PreviewViewport
  exportFormat: ExportFormat
  exportQuality: number
  advancedOpen: boolean
  status: JobStatus
  error: string | null
  sourceNotice: string | null
  metadata: ProcessingMetadata | null
  transitionSettings: (
    transition: SettingsTransition,
    context?: SettingsTransitionContext,
    options?: SettingsHistoryOptions
  ) => SettingsTransitionResult
  undoSettingsChange: () => void
  redoSettingsChange: () => void
  setCompareMode: (mode: CompareMode) => void
  setPreviewViewport: (viewport: Partial<PreviewViewport>) => void
  setExportFormat: (format: ExportFormat) => void
  setExportQuality: (quality: number) => void
  setAdvancedOpen: (open: boolean) => void
  setStatus: (status: JobStatus) => void
  setError: (error: string | null) => void
  setSourceNotice: (notice: string | null) => void
  setMetadata: (metadata: ProcessingMetadata | null) => void
}

type SettingsHistoryOptions = {
  recordHistory?: boolean
}

type SettingsHistory = {
  future: EditorSettings[]
  past: EditorSettings[]
}

const EMPTY_SETTINGS_HISTORY: SettingsHistory = {
  future: [],
  past: [],
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      canRedoSettingsChange: false,
      canUndoSettingsChange: false,
      settingsHistory: EMPTY_SETTINGS_HISTORY,
      compareMode: "slide",
      previewViewport: DEFAULT_PREVIEW_VIEWPORT,
      exportFormat: DEFAULT_EXPORT_FORMAT,
      exportQuality: DEFAULT_EXPORT_QUALITY,
      advancedOpen: false,
      status: "idle",
      error: null,
      sourceNotice: null,
      metadata: null,
      transitionSettings: (transition, context, options = {}) => {
        let transitionResult: SettingsTransitionResult | null = null

        set((state) => {
          const result = applySettingsTransition(
            state.settings,
            transition,
            context
          )
          const resizeChanged = outputDimensionsChanged(
            state.settings,
            result.settings
          )
          const recordHistory = options.recordHistory !== false
          const settingsChanged = !areSettingsEqual(
            state.settings,
            result.settings
          )
          const settingsHistory =
            recordHistory && settingsChanged
              ? {
                  future: [],
                  past: [...state.settingsHistory.past, state.settings],
                }
              : state.settingsHistory
          transitionResult = result

          return {
            canRedoSettingsChange: settingsHistory.future.length > 0,
            canUndoSettingsChange: settingsHistory.past.length > 0,
            settings: result.settings,
            settingsHistory,
            ...(resizeChanged
              ? resetPreviewViewportForOutputChange(state.previewViewport)
              : {}),
            ...(result.sourceNotice !== undefined
              ? { sourceNotice: result.sourceNotice }
              : {}),
          }
        })

        if (!transitionResult) {
          throw new Error("Settings transition did not produce a result")
        }

        return transitionResult
      },
      undoSettingsChange: () =>
        set((state) => {
          const previous = state.settingsHistory.past.at(-1)

          if (!previous) {
            return state
          }

          const past = state.settingsHistory.past.slice(0, -1)
          const future = [state.settings, ...state.settingsHistory.future]

          return {
            canRedoSettingsChange: true,
            canUndoSettingsChange: past.length > 0,
            settings: previous,
            settingsHistory: { future, past },
            ...(outputDimensionsChanged(state.settings, previous)
              ? resetPreviewViewportForOutputChange(state.previewViewport)
              : {}),
          }
        }),
      redoSettingsChange: () =>
        set((state) => {
          const next = state.settingsHistory.future[0]

          if (!next) {
            return state
          }

          const future = state.settingsHistory.future.slice(1)
          const past = [...state.settingsHistory.past, state.settings]

          return {
            canRedoSettingsChange: future.length > 0,
            canUndoSettingsChange: true,
            settings: next,
            settingsHistory: { future, past },
            ...(outputDimensionsChanged(state.settings, next)
              ? resetPreviewViewportForOutputChange(state.previewViewport)
              : {}),
          }
        }),
      setCompareMode: (compareMode) => set({ compareMode }),
      setPreviewViewport: (previewViewport) =>
        set((state) => ({
          previewViewport: normalizePreviewViewport({
            ...state.previewViewport,
            ...previewViewport,
            center: {
              ...state.previewViewport.center,
              ...previewViewport.center,
            },
          }),
        })),
      setExportFormat: (exportFormat) => set({ exportFormat }),
      setExportQuality: (exportQuality) =>
        set({ exportQuality: clampExportQuality(exportQuality) }),
      setAdvancedOpen: (advancedOpen) => set({ advancedOpen }),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ error }),
      setSourceNotice: (sourceNotice) => set({ sourceNotice }),
      setMetadata: (metadata) => set({ metadata }),
    }),
    {
      name: "imdither-editor",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: settingsWithoutPersistedDimensions(state.settings),
        compareMode: state.compareMode,
        previewViewport: state.previewViewport,
        exportFormat: state.exportFormat,
        exportQuality: state.exportQuality,
        advancedOpen: state.advancedOpen,
      }),
      migrate: (persistedState) => {
        return normalizePersistedEditorState(persistedState)
      },
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedEditorState(persistedState),
      }),
      version: 4,
    }
  )
)

export function normalizeCompareMode(value: unknown): CompareMode {
  if (value === "processed" || value === "original" || value === "slide") {
    return value
  }

  if (value === "split") {
    return "slide"
  }

  return "slide"
}

export function paletteName(id: string): string {
  return PRESET_PALETTES.find((palette) => palette.id === id)?.name ?? "Custom"
}

export function normalizePersistedEditorState(
  persistedState: unknown
): Partial<EditorState> {
  if (!isPersistedEditorState(persistedState)) {
    return {}
  }

  return {
    advancedOpen: persistedState.advancedOpen === true,
    compareMode: normalizeCompareMode(persistedState.compareMode),
    previewViewport: normalizePreviewViewport(
      persistedState.previewViewport ?? persistedState.viewScale
    ),
    exportFormat: normalizeExportFormat(persistedState.exportFormat),
    exportQuality: clampExportQuality(persistedState.exportQuality),
    settings: settingsWithoutPersistedDimensions(
      normalizeSettings(persistedState.settings)
    ),
  }
}

function settingsWithoutPersistedDimensions(
  settings: EditorSettings
): EditorSettings {
  return {
    ...settings,
    resize: {
      ...settings.resize,
      width: DEFAULT_SETTINGS.resize.width,
      height: DEFAULT_SETTINGS.resize.height,
    },
  }
}

function areSettingsEqual(
  left: EditorSettings,
  right: EditorSettings
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function outputDimensionsChanged(
  current: EditorSettings,
  next: EditorSettings
): boolean {
  return (
    current.resize.width !== next.resize.width ||
    current.resize.height !== next.resize.height
  )
}

function resetPreviewViewportForOutputChange(
  previewViewport: PreviewViewport
): { previewViewport: PreviewViewport } {
  return {
    previewViewport: normalizePreviewViewport({
      ...previewViewport,
      mode: "fit",
      zoom: 1,
      center: { x: 0, y: 0 },
    }),
  }
}

function isPersistedEditorState(value: unknown): value is {
  settings: unknown
  advancedOpen?: unknown
  compareMode?: unknown
  previewViewport?: unknown
  viewScale?: unknown
  exportFormat?: unknown
  exportQuality?: unknown
} {
  return typeof value === "object" && value !== null && "settings" in value
}
