import { describe, expect, it, vi } from "vitest"

import { executePaletteCommand } from "./palette-action-application"

function createAdapter() {
  return {
    setError: vi.fn(),
    setSourceNotice: vi.fn(),
    clearAppliedMarker: vi.fn(),
  }
}

function createFakeExtractor(colors: string[]) {
  return vi.fn(() => colors)
}

function createClipboard() {
  return {
    readText: vi.fn(async (): Promise<string> => ""),
    writeText: vi.fn(async () => {}),
  }
}

describe("executePaletteCommand", () => {
  describe("import-file", () => {
    it("parses palette text from file and transitions to custom palette", async () => {
      const adapter = createAdapter()
      const transitionSettings = vi.fn()

      await executePaletteCommand(
        { type: "import-file", file: new File(["#000\n#fff"], "test.txt") },
        adapter,
        { transitionSettings }
      )

      expect(transitionSettings).toHaveBeenCalledWith(
        { type: "set-custom-palette", colors: ["#000000", "#ffffff"] },
        undefined
      )
      expect(adapter.setError).toHaveBeenCalledWith(null)
      expect(adapter.setSourceNotice).toHaveBeenCalledWith("[PALETTE IMPORTED]")
      expect(adapter.clearAppliedMarker).not.toHaveBeenCalled()
    })

    it("passes transitionContext through to transitionSettings", async () => {
      const adapter = createAdapter()
      const transitionSettings = vi.fn()
      const context = { sourceDimensions: { width: 1920, height: 1080 } }

      await executePaletteCommand(
        { type: "import-file", file: new File(["#000\n#fff"], "test.txt") },
        adapter,
        { transitionSettings },
        context
      )

      expect(transitionSettings).toHaveBeenCalledWith(
        { type: "set-custom-palette", colors: ["#000000", "#ffffff"] },
        context
      )
    })

    it("reports error when file read fails", async () => {
      const adapter = createAdapter()
      const transitionSettings = vi.fn()

      await executePaletteCommand(
        {
          type: "import-file",
          file: {
            text: async () => {
              throw new Error("read failed")
            },
          } as unknown as File,
        },
        adapter,
        { transitionSettings }
      )

      expect(adapter.setError).toHaveBeenCalledWith("read failed")
      expect(transitionSettings).not.toHaveBeenCalled()
    })
  })

  describe("import-clipboard", () => {
    it("reads palette text from clipboard and transitions to custom palette", async () => {
      const adapter = createAdapter()
      const clipboard = {
        ...createClipboard(),
        readText: vi.fn(async () => "#000\n#fff"),
      }
      const transitionSettings = vi.fn()

      await executePaletteCommand({ type: "import-clipboard" }, adapter, {
        clipboard,
        transitionSettings,
      })

      expect(transitionSettings).toHaveBeenCalledWith(
        { type: "set-custom-palette", colors: ["#000000", "#ffffff"] },
        undefined
      )
      expect(adapter.setError).toHaveBeenCalledWith(null)
      expect(adapter.setSourceNotice).toHaveBeenCalledWith(
        "[PALETTE IMPORTED FROM CLIPBOARD]"
      )
    })

    it("reports error when clipboard read fails", async () => {
      const adapter = createAdapter()
      const clipboard = {
        ...createClipboard(),
        readText: vi.fn(async () => {
          throw new Error("clipboard denied")
        }),
      }
      const transitionSettings = vi.fn()

      await executePaletteCommand({ type: "import-clipboard" }, adapter, {
        clipboard,
        transitionSettings,
      })

      expect(adapter.setError).toHaveBeenCalledWith("clipboard denied")
      expect(transitionSettings).not.toHaveBeenCalled()
    })
  })

  describe("copy-json", () => {
    it("copies palette JSON to clipboard", async () => {
      const adapter = createAdapter()
      const clipboard = createClipboard()

      await executePaletteCommand(
        { type: "copy-json", colors: ["#000000", "#ffffff"] },
        adapter,
        { clipboard }
      )

      expect(clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("#000000")
      )
      expect(adapter.setSourceNotice).toHaveBeenCalledWith(
        "[PALETTE JSON COPIED TO CLIPBOARD]"
      )
      expect(adapter.setError).toHaveBeenCalledWith(null)
    })

    it("sets error when no custom palette is active", async () => {
      const adapter = createAdapter()

      await executePaletteCommand(
        { type: "copy-json", colors: undefined },
        adapter,
        { clipboard: createClipboard() }
      )

      expect(adapter.setError).toHaveBeenCalledWith(
        "Convert the current preset to Custom before copy"
      )
    })
  })

  describe("export-json", () => {
    it("downloads palette JSON file", async () => {
      const adapter = createAdapter()
      const downloadBlob = vi.fn()

      await executePaletteCommand(
        { type: "export-json", colors: ["#000000", "#ffffff"] },
        adapter,
        { downloadBlob }
      )

      expect(downloadBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        "imdither-palette.json"
      )
      expect(adapter.setSourceNotice).toHaveBeenCalledWith(
        "[PALETTE JSON EXPORTED]"
      )
      expect(adapter.setError).toHaveBeenCalledWith(null)
    })

    it("sets error when no custom palette is active", async () => {
      const adapter = createAdapter()
      const downloadBlob = vi.fn()

      await executePaletteCommand(
        { type: "export-json", colors: undefined },
        adapter,
        { downloadBlob }
      )

      expect(downloadBlob).not.toHaveBeenCalled()
      expect(adapter.setError).toHaveBeenCalledWith(
        "Convert the current preset to Custom before export"
      )
    })
  })

  describe("export-gpl", () => {
    it("downloads palette GPL file", async () => {
      const adapter = createAdapter()
      const downloadBlob = vi.fn()

      await executePaletteCommand(
        { type: "export-gpl", colors: ["#000000", "#ffffff"] },
        adapter,
        { downloadBlob }
      )

      expect(downloadBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        "imdither-palette.gpl"
      )
      expect(adapter.setSourceNotice).toHaveBeenCalledWith(
        "[PALETTE GPL EXPORTED]"
      )
    })
  })

  describe("extract", () => {
    it("extracts palette from source image and transitions", async () => {
      const adapter = createAdapter()
      const transitionSettings = vi.fn()
      const extractPaletteFromSource = createFakeExtractor(["#abc", "#def"])

      await executePaletteCommand(
        {
          type: "extract",
          size: 8,
          source: { width: 2, height: 2, data: new Uint8ClampedArray(16) },
        },
        adapter,
        { transitionSettings, extractPaletteFromSource }
      )

      expect(adapter.clearAppliedMarker).toHaveBeenCalledTimes(1)
      expect(transitionSettings).toHaveBeenCalledWith(
        { type: "set-custom-palette", colors: ["#abc", "#def"] },
        undefined
      )
      expect(adapter.setError).toHaveBeenCalledWith(null)
      expect(adapter.setSourceNotice).toHaveBeenCalledWith(
        "[PALETTE EXTRACTED: 8 COLORS]"
      )
    })

    it("passes transitionContext through to transitionSettings", async () => {
      const adapter = createAdapter()
      const transitionSettings = vi.fn()
      const extractPaletteFromSource = createFakeExtractor(["#abc"])
      const context = { sourceDimensions: { width: 100, height: 100 } }

      await executePaletteCommand(
        {
          type: "extract",
          size: 2,
          source: { width: 1, height: 1, data: new Uint8ClampedArray(4) },
        },
        adapter,
        { transitionSettings, extractPaletteFromSource },
        context
      )

      expect(transitionSettings).toHaveBeenCalledWith(
        { type: "set-custom-palette", colors: ["#abc"] },
        context
      )
    })

    it("sets error when no source image is available", async () => {
      const adapter = createAdapter()
      const transitionSettings = vi.fn()

      await executePaletteCommand(
        { type: "extract", size: 4, source: null },
        adapter,
        { transitionSettings }
      )

      expect(adapter.setError).toHaveBeenCalledWith(
        "Load a Source Image before extracting a palette"
      )
      expect(transitionSettings).not.toHaveBeenCalled()
      expect(adapter.clearAppliedMarker).not.toHaveBeenCalled()
    })

    it("reports error when extraction throws", async () => {
      const adapter = createAdapter()
      const transitionSettings = vi.fn()
      const extractPaletteFromSource = vi.fn(() => {
        throw new Error("extraction failed")
      })

      await executePaletteCommand(
        {
          type: "extract",
          size: 4,
          source: { width: 2, height: 2, data: new Uint8ClampedArray(16) },
        },
        adapter,
        { transitionSettings, extractPaletteFromSource }
      )

      expect(adapter.setError).toHaveBeenCalledWith("extraction failed")
      expect(transitionSettings).not.toHaveBeenCalled()
    })
  })
})
