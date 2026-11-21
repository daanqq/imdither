import { describe, expect, it, vi } from "vitest"

import { DEFAULT_PREVIEW_VIEWPORT } from "@/lib/preview-viewport"
import type { CompareMode } from "@/store/editor-store"

import {
  createEditorShortcutsController,
  getNextCompareMode,
  getSteppedZoom,
  isEditableShortcutTarget,
  type EditorShortcutsState,
  type ShortcutKeyboardEvent,
} from "./editor-shortcuts"

function makeEvent(
  overrides: Partial<ShortcutKeyboardEvent>
): ShortcutKeyboardEvent {
  return {
    altKey: false,
    ctrlKey: false,
    key: "",
    metaKey: false,
    shiftKey: false,
    target: null,
    preventDefault: vi.fn(),
    ...overrides,
  }
}

function makeState(
  overrides?: Partial<EditorShortcutsState>
): EditorShortcutsState {
  return {
    canRedo: true,
    canUndo: true,
    compareMode: "slide",
    hasSource: true,
    outputHeight: 600,
    outputWidth: 800,
    previewViewport: DEFAULT_PREVIEW_VIEWPORT,
    ...overrides,
  }
}

describe("editor shortcuts", () => {
  it("skips editable targets such as inputs, textareas, selects, and contenteditable elements", () => {
    expect(
      isEditableShortcutTarget({ tagName: "INPUT" } as unknown as EventTarget)
    ).toBe(true)
    expect(
      isEditableShortcutTarget({
        tagName: "TEXTAREA",
      } as unknown as EventTarget)
    ).toBe(true)
    expect(
      isEditableShortcutTarget({ tagName: "SELECT" } as unknown as EventTarget)
    ).toBe(true)
    expect(
      isEditableShortcutTarget({
        isContentEditable: true,
        tagName: "DIV",
      } as unknown as EventTarget)
    ).toBe(true)
    expect(
      isEditableShortcutTarget({ tagName: "DIV" } as unknown as EventTarget)
    ).toBe(false)

    const actions = {
      redo: vi.fn(),
      setCompareMode: vi.fn(),
      setPreviewViewport: vi.fn(),
      undo: vi.fn(),
    }
    const controller = createEditorShortcutsController(
      () => makeState(),
      actions
    )
    const event = makeEvent({
      ctrlKey: true,
      key: "z",
      target: { tagName: "INPUT" } as unknown as EventTarget,
    })

    expect(controller.handleKeyDown(event)).toBe(false)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(actions.undo).not.toHaveBeenCalled()
  })

  it("handles Ctrl/Cmd+Z for undo and Ctrl/Cmd+Shift+Z or Ctrl+Y for redo", () => {
    const actions = {
      redo: vi.fn(),
      setCompareMode: vi.fn(),
      setPreviewViewport: vi.fn(),
      undo: vi.fn(),
    }
    const controller = createEditorShortcutsController(
      () => makeState(),
      actions
    )

    const undoEvent = makeEvent({ metaKey: true, key: "z", code: "KeyZ" })
    const redoShiftZEvent = makeEvent({
      ctrlKey: true,
      shiftKey: true,
      key: "Z",
      code: "KeyZ",
    })
    const redoYEvent = makeEvent({ ctrlKey: true, key: "y", code: "KeyY" })

    expect(controller.handleKeyDown(undoEvent)).toBe(true)
    expect(controller.handleKeyDown(redoShiftZEvent)).toBe(true)
    expect(controller.handleKeyDown(redoYEvent)).toBe(true)

    expect(undoEvent.preventDefault).toHaveBeenCalled()
    expect(redoShiftZEvent.preventDefault).toHaveBeenCalled()
    expect(redoYEvent.preventDefault).toHaveBeenCalled()
    expect(actions.undo).toHaveBeenCalledTimes(1)
    expect(actions.redo).toHaveBeenCalledTimes(2)
  })

  it("peeks Original while holding Space, prevents scroll, and restores previous mode on keyup or blur", () => {
    let compareMode: CompareMode = "slide"
    const setCompareMode = vi.fn((mode: CompareMode) => {
      compareMode = mode
    })
    const controller = createEditorShortcutsController(
      () => makeState({ compareMode }),
      {
        redo: vi.fn(),
        setCompareMode,
        setPreviewViewport: vi.fn(),
        undo: vi.fn(),
      }
    )

    const spaceDown = makeEvent({ code: "Space", key: " " })
    const spaceRepeat = makeEvent({ code: "Space", key: " ", repeat: true })
    const spaceUp = makeEvent({ code: "Space", key: " " })

    expect(controller.handleKeyDown(spaceDown)).toBe(true)
    expect(spaceDown.preventDefault).toHaveBeenCalled()
    expect(setCompareMode).toHaveBeenLastCalledWith("original")

    // Repeated keydown while held must still prevent page scroll without clobbering saved mode
    expect(controller.handleKeyDown(spaceRepeat)).toBe(true)
    expect(spaceRepeat.preventDefault).toHaveBeenCalled()
    expect(setCompareMode).toHaveBeenCalledTimes(1)

    expect(controller.handleKeyUp(spaceUp)).toBe(true)
    expect(setCompareMode).toHaveBeenLastCalledWith("slide")

    // Window blur while peeking also restores previous mode
    compareMode = "processed"
    controller.handleKeyDown(makeEvent({ code: "Space", key: " " }))
    expect(compareMode).toBe("original")
    controller.handleWindowBlur()
    expect(compareMode).toBe("processed")
  })

  it("cycles compare mode on C and controls zoom on +, -, and 0", () => {
    expect(getNextCompareMode("slide")).toBe("processed")
    expect(getNextCompareMode("processed")).toBe("original")
    expect(getNextCompareMode("original")).toBe("slide")

    expect(getSteppedZoom(1, "in")).toBe(1.25)
    expect(getSteppedZoom(1, "out")).toBe(0.75)

    const state = makeState({ compareMode: "slide" })
    const actions = {
      redo: vi.fn(),
      setCompareMode: vi.fn(),
      setPreviewViewport: vi.fn(),
      undo: vi.fn(),
    }
    const controller = createEditorShortcutsController(() => state, actions)

    controller.handleKeyDown(makeEvent({ key: "c", code: "KeyC" }))
    expect(actions.setCompareMode).toHaveBeenCalledWith("processed")

    controller.handleKeyDown(makeEvent({ key: "=", code: "Equal" }))
    expect(actions.setPreviewViewport).toHaveBeenLastCalledWith({
      center: { x: 400, y: 300 },
      mode: "manual",
      zoom: 1.25,
    })

    state.previewViewport = {
      ...DEFAULT_PREVIEW_VIEWPORT,
      mode: "manual",
      zoom: 2,
      center: { x: 400, y: 300 },
    }
    controller.handleKeyDown(makeEvent({ key: "-", code: "Minus" }))
    expect(actions.setPreviewViewport).toHaveBeenLastCalledWith({
      mode: "manual",
      zoom: 1.5,
    })

    controller.handleKeyDown(makeEvent({ key: "0", code: "Digit0" }))
    expect(actions.setPreviewViewport).toHaveBeenLastCalledWith({
      center: { x: 400, y: 300 },
      mode: "fit",
      zoom: 1,
    })
  })
})
