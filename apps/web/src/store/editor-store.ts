import {
  DEFAULT_SETTINGS,
  PRESET_PALETTES,
  clampOutputSize,
  normalizeSettings,
  type EditorSettings,
  type ProcessingMetadata,
} from "@workspace/core"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

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
  setSettings: (settings: EditorSettings) => void
  patchSettings: (patch: Partial<EditorSettings>) => void
  patchResize: (patch: Partial<EditorSettings["resize"]>) => void
  patchPreprocess: (patch: Partial<EditorSettings["preprocess"]>) => void
  setCompareMode: (mode: CompareMode) => void
  setViewScale: (scale: ViewScale) => void
  setAdvancedOpen: (open: boolean) => void
  setStatus: (status: JobStatus) => void
  setError: (error: string | null) => void
  setSourceNotice: (notice: string | null) => void
  setMetadata: (metadata: ProcessingMetadata | null) => void
  resetSettings: () => void
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
      setSettings: (settings) => set({ settings }),
      patchSettings: (patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...patch,
          },
        })),
      patchResize: (patch) =>
        set((state) => {
          const size = clampOutputSize(
            patch.width ?? state.settings.resize.width,
            patch.height ?? state.settings.resize.height
          )

          return {
            sourceNotice: size.downscaled
              ? `[OUTPUT CLAMPED: ${size.width}x${size.height} / 12MP]`
              : state.sourceNotice,
            settings: {
              ...state.settings,
              resize: {
                ...state.settings.resize,
                ...patch,
                width: size.width,
                height: size.height,
              },
            },
          }
        }),
      patchPreprocess: (patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            preprocess: {
              ...state.settings.preprocess,
              ...patch,
            },
          },
        })),
      setCompareMode: (compareMode) => set({ compareMode }),
      setViewScale: (viewScale) => set({ viewScale }),
      setAdvancedOpen: (advancedOpen) => set({ advancedOpen }),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ error }),
      setSourceNotice: (sourceNotice) => set({ sourceNotice }),
      setMetadata: (metadata) => set({ metadata }),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
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
