import {
  DEFAULT_SETTINGS,
  encodeLookPayload,
  createLookSnapshot,
} from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import { executeClipboardCommand } from "./clipboard-settings-application"

function createAdapter() {
  return {
    setError: vi.fn(),
    setSourceNotice: vi.fn(),
  }
}

function createClipboard() {
  return {
    readText: vi.fn(async (): Promise<string> => ""),
    writeText: vi.fn(async () => {}),
  }
}

describe("executeClipboardCommand", () => {
  describe("copy-settings", () => {
    it("writes Settings JSON to clipboard and reports notice", async () => {
      const adapter = createAdapter()
      const clipboard = createClipboard()

      await executeClipboardCommand(
        { type: "copy-settings", settings: DEFAULT_SETTINGS },
        adapter,
        { clipboard }
      )

      expect(clipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(DEFAULT_SETTINGS, null, 2)
      )
      expect(adapter.setError).toHaveBeenCalledWith(null)
      expect(adapter.setSourceNotice).toHaveBeenCalledWith(
        "[SETTINGS COPIED TO CLIPBOARD]"
      )
    })

    it("reports error when clipboard write fails", async () => {
      const adapter = createAdapter()
      const clipboard = {
        ...createClipboard(),
        writeText: vi.fn(async () => {
          throw new Error("clipboard denied")
        }),
      }

      await executeClipboardCommand(
        { type: "copy-settings", settings: DEFAULT_SETTINGS },
        adapter,
        { clipboard }
      )

      expect(adapter.setError).toHaveBeenCalledWith("clipboard denied")
    })
  })

  describe("paste-settings", () => {
    it("reads JSON from clipboard and applies through Settings Transition", async () => {
      const adapter = createAdapter()
      const clipboard = {
        ...createClipboard(),
        readText: vi.fn(async () => JSON.stringify(DEFAULT_SETTINGS)),
      }
      const clearAppliedMarker = vi.fn()
      const transitionSettings = vi.fn(() => ({
        settings: DEFAULT_SETTINGS,
        sourceNotice: "[OUTPUT CLAMPED: 4000x3000 / 12MP]",
      }))

      await executeClipboardCommand(
        { type: "paste-settings" },
        adapter,
        { clipboard, transitionSettings, clearAppliedMarker },
        { sourceDimensions: { width: 4, height: 3 } }
      )

      expect(transitionSettings).toHaveBeenCalledWith(
        { type: "apply-settings", settings: DEFAULT_SETTINGS },
        { sourceDimensions: { width: 4, height: 3 } }
      )
      expect(clearAppliedMarker).toHaveBeenCalledTimes(1)
      expect(adapter.setError).toHaveBeenCalledWith(null)
      expect(adapter.setSourceNotice).toHaveBeenCalledWith(
        "[SETTINGS PASTED FROM CLIPBOARD] [OUTPUT CLAMPED: 4000x3000 / 12MP]"
      )
    })

    it("reports error when clipboard JSON does not match schema", async () => {
      const adapter = createAdapter()
      const clipboard = {
        ...createClipboard(),
        readText: vi.fn(async () => JSON.stringify({ algorithm: "bogus" })),
      }
      const clearAppliedMarker = vi.fn()
      const transitionSettings = vi.fn()

      await executeClipboardCommand({ type: "paste-settings" }, adapter, {
        clipboard,
        transitionSettings,
        clearAppliedMarker,
      })

      expect(adapter.setError).toHaveBeenCalledWith(
        "Clipboard JSON does not match settings schema v1"
      )
      expect(transitionSettings).not.toHaveBeenCalled()
    })
  })

  describe("copy-look", () => {
    it("writes look payload URL to clipboard", async () => {
      const adapter = createAdapter()
      const clipboard = createClipboard()

      await executeClipboardCommand(
        {
          type: "copy-look",
          settings: DEFAULT_SETTINGS,
          href: "https://imdither.test/editor",
        },
        adapter,
        { clipboard }
      )

      expect(clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("#look=")
      )
      expect(adapter.setSourceNotice).toHaveBeenCalledWith(
        "[LOOK COPIED TO CLIPBOARD]"
      )
    })
  })

  describe("paste-look", () => {
    it("extracts look payload from clipboard and applies through transition", async () => {
      const adapter = createAdapter()
      const payload = encodeLookPayload(
        createLookSnapshot({ settings: DEFAULT_SETTINGS })
      )
      const clipboard = {
        ...createClipboard(),
        readText: vi.fn(async () => `https://example.test/#look=${payload}`),
      }
      const clearAppliedMarker = vi.fn()
      const transitionSettings = vi.fn(() => ({ settings: DEFAULT_SETTINGS }))

      await executeClipboardCommand({ type: "paste-look" }, adapter, {
        clipboard,
        transitionSettings,
        clearAppliedMarker,
      })

      expect(transitionSettings).toHaveBeenCalledWith(
        { type: "apply-settings", settings: DEFAULT_SETTINGS },
        {}
      )
      expect(clearAppliedMarker).toHaveBeenCalledTimes(1)
      expect(adapter.setError).toHaveBeenCalledWith(null)
      expect(adapter.setSourceNotice).toHaveBeenCalledWith(
        "[LOOK PASTED FROM CLIPBOARD]"
      )
    })
  })

  describe("apply-look-from-url", () => {
    it("extracts look payload from URL hash and applies through transition", async () => {
      const adapter = createAdapter()
      const payload = encodeLookPayload(
        createLookSnapshot({ settings: DEFAULT_SETTINGS })
      )
      const clearAppliedMarker = vi.fn()
      const clearLookHash = vi.fn()
      const transitionSettings = vi.fn(() => ({ settings: DEFAULT_SETTINGS }))

      await executeClipboardCommand(
        {
          type: "apply-look-from-url",
          text: `#look=${payload}`,
        },
        adapter,
        {
          clipboard: createClipboard(),
          transitionSettings,
          clearAppliedMarker,
          clearLookHash,
        }
      )

      expect(transitionSettings).toHaveBeenCalledWith(
        { type: "apply-settings", settings: DEFAULT_SETTINGS },
        {}
      )
      expect(clearAppliedMarker).toHaveBeenCalledTimes(1)
      expect(clearLookHash).toHaveBeenCalledTimes(1)
      expect(adapter.setError).toHaveBeenCalledWith(null)
      expect(adapter.setSourceNotice).toHaveBeenCalledWith(
        "[LOOK APPLIED FROM URL]"
      )
    })

    it("reports error when look payload is empty", async () => {
      const adapter = createAdapter()
      const clearAppliedMarker = vi.fn()
      const clearLookHash = vi.fn()
      const transitionSettings = vi.fn()

      await executeClipboardCommand(
        { type: "apply-look-from-url", text: "#nothing" },
        adapter,
        {
          clipboard: createClipboard(),
          transitionSettings,
          clearAppliedMarker,
          clearLookHash,
        }
      )

      expect(adapter.setError).toHaveBeenCalledWith("Look payload is empty")
      expect(transitionSettings).not.toHaveBeenCalled()
      expect(clearLookHash).not.toHaveBeenCalled()
    })
  })
})
