import { clampZoom, type PreviewViewport } from "@/lib/preview-viewport"
import type { CompareMode } from "@/store/editor-store"

const ZOOM_SHORTCUT_STOPS = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8, 12, 16,
] as const

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"])

export type ShortcutKeyboardEvent = {
  altKey: boolean
  code?: string
  ctrlKey: boolean
  isComposing?: boolean
  key: string
  metaKey: boolean
  repeat?: boolean
  shiftKey: boolean
  target: EventTarget | null
  preventDefault: () => void
}

export type EditorShortcutsState = {
  canRedo: boolean
  canUndo: boolean
  compareMode: CompareMode
  hasSource: boolean
  outputHeight: number
  outputWidth: number
  previewViewport: PreviewViewport
}

export type EditorShortcutsActions = {
  redo: () => void
  setCompareMode: (mode: CompareMode) => void
  setPreviewViewport: (viewport: Partial<PreviewViewport>) => void
  undo: () => void
}

export function getNextCompareMode(compareMode: CompareMode): CompareMode {
  if (compareMode === "slide") {
    return "processed"
  }

  if (compareMode === "processed") {
    return "original"
  }

  return "slide"
}

export function getSteppedZoom(
  currentZoom: number,
  direction: "in" | "out"
): number {
  const safeZoom = clampZoom(currentZoom)

  if (direction === "in") {
    const nextStop = ZOOM_SHORTCUT_STOPS.find((stop) => stop > safeZoom + 0.001)
    return nextStop ?? ZOOM_SHORTCUT_STOPS[ZOOM_SHORTCUT_STOPS.length - 1]
  }

  for (let index = ZOOM_SHORTCUT_STOPS.length - 1; index >= 0; index -= 1) {
    const stop = ZOOM_SHORTCUT_STOPS[index]

    if (stop !== undefined && stop < safeZoom - 0.001) {
      return stop
    }
  }

  return ZOOM_SHORTCUT_STOPS[0]
}

export function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") {
    return false
  }

  const candidate = target as {
    closest?: (selector: string) => unknown
    contentEditable?: string
    isContentEditable?: boolean
    tagName?: string
  }

  if (
    candidate.isContentEditable === true ||
    candidate.contentEditable === "true" ||
    candidate.contentEditable === ""
  ) {
    return true
  }

  if (
    typeof candidate.tagName === "string" &&
    EDITABLE_TAGS.has(candidate.tagName.toUpperCase())
  ) {
    return true
  }

  if (typeof candidate.closest === "function") {
    return Boolean(
      candidate.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""]'
      )
    )
  }

  return false
}

export function createEditorShortcutsController(
  getState: () => EditorShortcutsState,
  actions: EditorShortcutsActions
) {
  let spacePeekPreviousMode: CompareMode | null = null

  function restoreSpacePeek() {
    if (spacePeekPreviousMode === null) {
      return
    }

    const previousMode = spacePeekPreviousMode
    spacePeekPreviousMode = null
    actions.setCompareMode(previousMode)
  }

  function handleKeyDown(event: ShortcutKeyboardEvent): boolean {
    if (event.isComposing || isEditableShortcutTarget(event.target)) {
      return false
    }

    const state = getState()
    const keyLower = event.key.toLowerCase()
    const hasModifier = event.metaKey || event.ctrlKey

    if (hasModifier && !event.altKey) {
      const isZ = event.code === "KeyZ" || keyLower === "z"
      const isY = event.code === "KeyY" || keyLower === "y"

      if (isZ && !event.shiftKey) {
        event.preventDefault()

        if (state.canUndo) {
          actions.undo()
        }

        return true
      }

      if ((isZ && event.shiftKey) || (isY && !event.shiftKey)) {
        event.preventDefault()

        if (state.canRedo) {
          actions.redo()
        }

        return true
      }

      return false
    }

    if (event.altKey) {
      return false
    }

    if (event.code === "Space" || event.key === " ") {
      event.preventDefault()

      if (event.repeat || spacePeekPreviousMode !== null) {
        return true
      }

      spacePeekPreviousMode = state.compareMode

      if (state.compareMode !== "original") {
        actions.setCompareMode("original")
      }

      return true
    }

    if ((event.code === "KeyC" || keyLower === "c") && !event.shiftKey) {
      event.preventDefault()
      spacePeekPreviousMode = null
      actions.setCompareMode(getNextCompareMode(state.compareMode))
      return true
    }

    if (!state.hasSource) {
      return false
    }

    const center = {
      x: Math.max(1, state.outputWidth) / 2,
      y: Math.max(1, state.outputHeight) / 2,
    }

    if (
      event.key === "+" ||
      event.key === "=" ||
      event.code === "Equal" ||
      event.code === "NumpadAdd"
    ) {
      event.preventDefault()
      const baseZoom =
        state.previewViewport.mode === "fit" ? 1 : state.previewViewport.zoom
      actions.setPreviewViewport({
        ...(state.previewViewport.mode === "fit" ? { center } : null),
        mode: "manual",
        zoom: getSteppedZoom(baseZoom, "in"),
      })
      return true
    }

    if (
      event.key === "-" ||
      event.key === "_" ||
      event.code === "Minus" ||
      event.code === "NumpadSubtract"
    ) {
      event.preventDefault()
      const baseZoom =
        state.previewViewport.mode === "fit" ? 1 : state.previewViewport.zoom
      actions.setPreviewViewport({
        ...(state.previewViewport.mode === "fit" ? { center } : null),
        mode: "manual",
        zoom: getSteppedZoom(baseZoom, "out"),
      })
      return true
    }

    if (
      event.key === "0" ||
      event.code === "Digit0" ||
      event.code === "Numpad0"
    ) {
      event.preventDefault()
      actions.setPreviewViewport({
        center,
        mode: "fit",
        zoom: 1,
      })
      return true
    }

    return false
  }

  function handleKeyUp(event: ShortcutKeyboardEvent): boolean {
    if (event.code === "Space" || event.key === " ") {
      if (spacePeekPreviousMode !== null) {
        event.preventDefault()
        restoreSpacePeek()
        return true
      }
    }

    return false
  }

  function handleWindowBlur() {
    restoreSpacePeek()
  }

  return {
    handleKeyDown,
    handleKeyUp,
    handleWindowBlur,
  }
}
