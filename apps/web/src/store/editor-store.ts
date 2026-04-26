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
  compareMode: CompareMode
  viewScale: ViewScale
  exportFormat: ExportFormat
  exportQuality: number
  advancedOpen: boolean
  status: JobStatus
  error: string | null
  sourceNotice: string | null
  metadata: ProcessingMetadata | null
  transitionSettings: (
    transition: SettingsTransition,
    context?: SettingsTransitionContext
  ) => SettingsTransitionResult
  setCompareMode: (mode: CompareMode) => void
  setViewScale: (scale: ViewScale) => void
  setExportFormat: (format: ExportFormat) => void
  setExportQuality: (quality: number) => void
  setAdvancedOpen: (open: boolean) => void
  setStatus: (status: JobStatus) => void
  setError: (error: string | null) => void
  setSourceNotice: (notice: string | null) => void
  setMetadata: (metadata: ProcessingMetadata | null) => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      compareMode: "slide",
      viewScale: "fit",
      exportFormat: DEFAULT_EXPORT_FORMAT,
      exportQuality: DEFAULT_EXPORT_QUALITY,
      advancedOpen: false,
      status: "idle",
      error: null,
      sourceNotice: null,
      metadata: null,
      transitionSettings: (transition, context) => {
        let transitionResult: SettingsTransitionResult | null = null

        set((state) => {
          const result = applySettingsTransition(
            state.settings,
            transition,
            context
          )
          transitionResult = result

          return {
            settings: result.settings,
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
      setCompareMode: (compareMode) => set({ compareMode }),
      setViewScale: (viewScale) => set({ viewScale }),
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
        viewScale: state.viewScale,
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
    ...persistedState,
    compareMode: normalizeCompareMode(persistedState.compareMode),
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

function isPersistedEditorState(value: unknown): value is {
  settings: unknown
  compareMode?: unknown
  exportFormat?: unknown
  exportQuality?: unknown
} {
  return typeof value === "object" && value !== null && "settings" in value
}
