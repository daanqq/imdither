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
        advancedOpen: state.advancedOpen,
      }),
      migrate: (persistedState) => {
        if (!isPersistedEditorState(persistedState)) {
          return persistedState
        }

        return {
          ...persistedState,
          compareMode: normalizeCompareMode(persistedState.compareMode),
          settings: settingsWithoutPersistedDimensions(
            normalizeSettings(persistedState.settings)
          ),
        }
      },
      version: 3,
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

function isPersistedEditorState(
  value: unknown
): value is { settings: unknown; compareMode?: unknown } {
  return typeof value === "object" && value !== null && "settings" in value
}
