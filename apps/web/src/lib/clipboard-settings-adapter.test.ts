import {
  DEFAULT_SETTINGS,
  encodeLookPayload,
  createLookSnapshot,
} from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import {
  copyLookPayload,
  copyPaletteJson,
  copySettingsJson,
  exportPaletteAsset,
  importPaletteText,
  pasteLookPayload,
  pasteSettingsJson,
} from "./clipboard-settings-adapter"

describe("Clipboard Settings Adapter", () => {
  it("copies Settings JSON and reports the clipboard notice", async () => {
    const clipboard = { writeText: vi.fn(async () => {}) }
    const onErrorChange = vi.fn()
    const onSourceNoticeChange = vi.fn()

    await copySettingsJson({
      clipboard,
      settings: DEFAULT_SETTINGS,
      onErrorChange,
      onSourceNoticeChange,
    })

    expect(clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(DEFAULT_SETTINGS, null, 2)
    )
    expect(onErrorChange).toHaveBeenCalledWith(null)
    expect(onSourceNoticeChange).toHaveBeenCalledWith(
      "[SETTINGS COPIED TO CLIPBOARD]"
    )
  })

  it("pastes Settings JSON through Settings Transition rules", async () => {
    const clipboard = {
      readText: vi.fn(async () => JSON.stringify(DEFAULT_SETTINGS)),
      writeText: vi.fn(),
    }
    const clearAppliedMarker = vi.fn()
    const onErrorChange = vi.fn()
    const onSourceNoticeChange = vi.fn()
    const transitionSettings = vi.fn(() => ({
      settings: DEFAULT_SETTINGS,
      sourceNotice: "[OUTPUT CLAMPED: 4000x3000 / 12MP]",
    }))

    await pasteSettingsJson({
      clearAppliedMarker,
      clipboard,
      onErrorChange,
      onSourceNoticeChange,
      transitionContext: { sourceDimensions: { width: 4, height: 3 } },
      transitionSettings,
    })

    expect(clipboard.readText).toHaveBeenCalledTimes(1)
    expect(transitionSettings).toHaveBeenCalledWith(
      { type: "apply-settings", settings: DEFAULT_SETTINGS },
      { sourceDimensions: { width: 4, height: 3 } }
    )
    expect(clearAppliedMarker).toHaveBeenCalledTimes(1)
    expect(onErrorChange).toHaveBeenCalledWith(null)
    expect(onSourceNoticeChange).toHaveBeenCalledWith(
      "[SETTINGS PASTED FROM CLIPBOARD] [OUTPUT CLAMPED: 4000x3000 / 12MP]"
    )
  })

  it("copies and pastes Look Payloads through clipboard URLs", async () => {
    const payload = encodeLookPayload(
      createLookSnapshot({ settings: DEFAULT_SETTINGS })
    )
    const clipboard = {
      readText: vi.fn(async () => `https://example.test/#look=${payload}`),
      writeText: vi.fn(async () => {}),
    }
    const callbacks = createLookCallbacks()

    await copyLookPayload({
      clipboard,
      href: "https://imdither.test/editor",
      settings: DEFAULT_SETTINGS,
      onErrorChange: callbacks.onErrorChange,
      onSourceNoticeChange: callbacks.onSourceNoticeChange,
    })
    await pasteLookPayload({
      clearAppliedMarker: callbacks.clearAppliedMarker,
      clipboard,
      onErrorChange: callbacks.onErrorChange,
      onSourceNoticeChange: callbacks.onSourceNoticeChange,
      transitionContext: {},
      transitionSettings: callbacks.transitionSettings,
    })

    expect(clipboard.writeText.mock.calls[0]?.[0]).toContain("#look=")
    expect(callbacks.transitionSettings).toHaveBeenCalledWith(
      { type: "apply-settings", settings: DEFAULT_SETTINGS },
      {}
    )
    expect(callbacks.clearAppliedMarker).toHaveBeenCalledTimes(1)
    expect(callbacks.onSourceNoticeChange).toHaveBeenLastCalledWith(
      "[LOOK PASTED FROM CLIPBOARD]"
    )
  })

  it("imports and exports Custom Palette assets", async () => {
    const callbacks = createPaletteCallbacks()
    const downloadBlob = vi.fn()

    importPaletteText({
      notice: "[PALETTE IMPORTED]",
      onErrorChange: callbacks.onErrorChange,
      onSourceNoticeChange: callbacks.onSourceNoticeChange,
      text: "#000\n#fff",
      transitionContext: {},
      transitionSettings: callbacks.transitionSettings,
    })
    await copyPaletteJson({
      clipboard: callbacks.clipboard,
      colors: ["#000000", "#ffffff"],
      onErrorChange: callbacks.onErrorChange,
      onSourceNoticeChange: callbacks.onSourceNoticeChange,
    })
    exportPaletteAsset({
      colors: ["#000000", "#ffffff"],
      downloadBlob,
      format: "json",
      onErrorChange: callbacks.onErrorChange,
      onSourceNoticeChange: callbacks.onSourceNoticeChange,
    })

    expect(callbacks.transitionSettings).toHaveBeenCalledWith(
      { type: "set-custom-palette", colors: ["#000000", "#ffffff"] },
      {}
    )
    expect(callbacks.clipboard.writeText.mock.calls[0]?.[0]).toContain(
      "#000000"
    )
    expect(downloadBlob.mock.calls[0]?.[1]).toBe("imdither-palette.json")
    expect(callbacks.onSourceNoticeChange).toHaveBeenLastCalledWith(
      "[PALETTE JSON EXPORTED]"
    )
  })
})

function createLookCallbacks() {
  return {
    clearAppliedMarker: vi.fn(),
    onErrorChange: vi.fn(),
    onSourceNoticeChange: vi.fn(),
    transitionSettings: vi.fn(() => ({ settings: DEFAULT_SETTINGS })),
  }
}

function createPaletteCallbacks() {
  return {
    clipboard: { readText: vi.fn(), writeText: vi.fn(async () => {}) },
    onErrorChange: vi.fn(),
    onSourceNoticeChange: vi.fn(),
    transitionSettings: vi.fn(() => ({ settings: DEFAULT_SETTINGS })),
  }
}
