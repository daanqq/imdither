import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_SETTINGS } from "@workspace/core"

import { normalizeHexColorDraft } from "@/lib/palette-color-draft"
import { getRandomDifferentValue } from "@/lib/random-options"

import { ControlPanel } from "./control-panel"
import type { CommittedSliderFieldProps } from "./committed-slider-field"

const sliderRenders: CommittedSliderFieldProps[] = []
const selectRenders: Array<{
  value?: string
  onValueChange?: (value: string) => void
}> = []
const selectItemRenders: Array<{
  value: string
  onKeyDown?: (event: { key: string }) => void
  onPointerUp?: () => void
}> = []

vi.mock("./committed-slider-field", () => ({
  CommittedSliderField: (props: CommittedSliderFieldProps) => {
    sliderRenders.push(props)
    return <div data-slot="committed-slider-field">{props.value}</div>
  },
}))

vi.mock("@workspace/ui/components/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode
    onValueChange?: (value: string) => void
    value?: string
  }) => {
    selectRenders.push({ onValueChange, value })
    return <div data-slot="select">{children}</div>
  },
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-slot="select-content">{children}</div>
  ),
  SelectGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-slot="select-group">{children}</div>
  ),
  SelectItem: ({
    children,
    onKeyDown,
    onPointerUp,
    value,
  }: {
    children: React.ReactNode
    onKeyDown?: (event: { key: string }) => void
    onPointerUp?: () => void
    value: string
  }) => {
    selectItemRenders.push({ onKeyDown, onPointerUp, value })
    return <div data-value={value}>{children}</div>
  },
  SelectTrigger: ({
    children,
    id,
  }: {
    children: React.ReactNode
    id?: string
  }) => (
    <button data-slot="select-trigger" id={id}>
      {children}
    </button>
  ),
  SelectValue: () => <span data-slot="select-value" />,
}))

describe("ControlPanel", () => {
  beforeEach(() => {
    sliderRenders.length = 0
    selectRenders.length = 0
    selectItemRenders.length = 0
  })

  it("wires slider commits to committed settings transitions", () => {
    const onSettingsTransition = vi.fn()

    renderToStaticMarkup(
      <ControlPanel
        advancedOpen={false}
        compareMode="slide"
        settings={DEFAULT_SETTINGS}
        resolutionAspectLabel="1:1"
        onAdvancedOpenChange={vi.fn()}
        onCompareModeChange={vi.fn()}
        onCopyPaletteJson={vi.fn()}
        onCopySettings={vi.fn()}
        onExportPaletteGpl={vi.fn()}
        onExportPaletteJson={vi.fn()}
        onExtractPalette={vi.fn()}
        onImportPaletteFile={vi.fn()}
        onImportPaletteFromClipboard={vi.fn()}
        onPasteSettings={vi.fn()}
        onReset={vi.fn()}
        onResolutionWidthChange={vi.fn()}
        onSettingsTransition={onSettingsTransition}
      />
    )

    const brightnessSlider = sliderRenders[0]
    expect(brightnessSlider).toBeDefined()

    expect(onSettingsTransition).not.toHaveBeenCalled()

    brightnessSlider?.onCommit(25)
    expect(onSettingsTransition).toHaveBeenCalledTimes(1)
    expect(onSettingsTransition).toHaveBeenCalledWith({
      type: "set-preprocess",
      patch: { brightness: 25 },
    })
  })

  it("shows computed processing recipe state and applies recipe selections", () => {
    const onSettingsTransition = vi.fn()
    const markup = renderToStaticMarkup(
      <ControlPanel
        advancedOpen={false}
        compareMode="slide"
        settings={DEFAULT_SETTINGS}
        resolutionAspectLabel="1:1"
        onAdvancedOpenChange={vi.fn()}
        onCompareModeChange={vi.fn()}
        onCopyPaletteJson={vi.fn()}
        onCopySettings={vi.fn()}
        onExportPaletteGpl={vi.fn()}
        onExportPaletteJson={vi.fn()}
        onExtractPalette={vi.fn()}
        onImportPaletteFile={vi.fn()}
        onImportPaletteFromClipboard={vi.fn()}
        onPasteSettings={vi.fn()}
        onReset={vi.fn()}
        onResolutionWidthChange={vi.fn()}
        onSettingsTransition={onSettingsTransition}
      />
    )

    expect(markup).toContain("Recipe")
    expect(markup).toContain("Random recipe")
    expect(markup).toContain("Random palette")
    expect(markup).toContain("Random algorithm")
    expect(markup).toContain("Custom")
    expect(markup).toContain("Sea Glass Atkinson")
    expect(selectRenders[0]?.value).toBe("fine-mono-bayer")

    selectRenders[0]?.onValueChange?.("sea-glass-atkinson")
    expect(onSettingsTransition).toHaveBeenCalledWith({
      type: "apply-processing-preset",
      presetId: "sea-glass-atkinson",
    })
  })

  it("keeps custom palette controls hidden until Custom is selected", () => {
    const onExtractPalette = vi.fn()
    const onSettingsTransition = vi.fn()
    const markup = renderToStaticMarkup(
      <ControlPanel
        advancedOpen={false}
        compareMode="slide"
        settings={DEFAULT_SETTINGS}
        resolutionAspectLabel="1:1"
        onAdvancedOpenChange={vi.fn()}
        onCompareModeChange={vi.fn()}
        onCopyPaletteJson={vi.fn()}
        onCopySettings={vi.fn()}
        onExportPaletteGpl={vi.fn()}
        onExportPaletteJson={vi.fn()}
        onExtractPalette={onExtractPalette}
        onImportPaletteFile={vi.fn()}
        onImportPaletteFromClipboard={vi.fn()}
        onPasteSettings={vi.fn()}
        onReset={vi.fn()}
        onResolutionWidthChange={vi.fn()}
        onSettingsTransition={onSettingsTransition}
      />
    )

    expect(markup).not.toContain("Custom Palette")
    expect(selectRenders[2]?.value).toBe(DEFAULT_SETTINGS.paletteId)

    selectRenders[2]?.onValueChange?.("custom")
    expect(onExtractPalette).toHaveBeenCalledWith(16)
    expect(onSettingsTransition).not.toHaveBeenCalled()
  })

  it("chooses a random option without repeating the current value when possible", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0)

    expect(getRandomDifferentValue(["a", "b", "c"], "a")).toBe("b")
    expect(getRandomDifferentValue(["a"], "a")).toBe("a")

    randomSpy.mockRestore()
  })

  it("pads incomplete manual hex color drafts with trailing zeroes", () => {
    expect(normalizeHexColorDraft("#2")).toBe("#200000")
    expect(normalizeHexColorDraft("23")).toBe("#230000")
    expect(normalizeHexColorDraft("#2345")).toBe("#234500")
    expect(normalizeHexColorDraft("#234567")).toBe("#234567")
    expect(normalizeHexColorDraft("#xyz")).toBeNull()
  })

  it("shows Custom as the active palette state when custom colors are present", () => {
    const onSettingsTransition = vi.fn()
    const markup = renderToStaticMarkup(
      <ControlPanel
        advancedOpen={false}
        compareMode="slide"
        settings={{
          ...DEFAULT_SETTINGS,
          paletteId: "custom",
          customPalette: ["#000000", "#ffffff", "#ff0000"],
        }}
        resolutionAspectLabel="1:1"
        onAdvancedOpenChange={vi.fn()}
        onCompareModeChange={vi.fn()}
        onCopyPaletteJson={vi.fn()}
        onCopySettings={vi.fn()}
        onExportPaletteGpl={vi.fn()}
        onExportPaletteJson={vi.fn()}
        onExtractPalette={vi.fn()}
        onImportPaletteFile={vi.fn()}
        onImportPaletteFromClipboard={vi.fn()}
        onPasteSettings={vi.fn()}
        onReset={vi.fn()}
        onResolutionWidthChange={vi.fn()}
        onSettingsTransition={onSettingsTransition}
      />
    )

    expect(markup).toContain("Custom Palette")
    expect(markup).toContain("Copy palette JSON")
    expect(markup).toContain("Color pickers")
    expect(markup).toContain("Color inputs")
    expect(markup).toContain("Pick palette swatch color 1")
    expect(markup).not.toContain("Hex color 1")
    expect(selectRenders[2]?.value).toBe("custom")

    selectRenders[2]?.onValueChange?.("sea-glass")
    expect(onSettingsTransition).toHaveBeenCalledWith({
      type: "set-palette",
      paletteId: "sea-glass",
    })
  })

  it("shows the saved custom palette size in the extract palette control", () => {
    renderToStaticMarkup(
      <ControlPanel
        advancedOpen={false}
        compareMode="slide"
        settings={{
          ...DEFAULT_SETTINGS,
          paletteId: "custom",
          customPalette: Array.from(
            { length: 32 },
            (_, index) =>
              `#${index.toString(16).padStart(2, "0")}${index
                .toString(16)
                .padStart(2, "0")}${index.toString(16).padStart(2, "0")}`
          ),
        }}
        resolutionAspectLabel="1:1"
        onAdvancedOpenChange={vi.fn()}
        onCompareModeChange={vi.fn()}
        onCopyPaletteJson={vi.fn()}
        onCopySettings={vi.fn()}
        onExportPaletteGpl={vi.fn()}
        onExportPaletteJson={vi.fn()}
        onExtractPalette={vi.fn()}
        onImportPaletteFile={vi.fn()}
        onImportPaletteFromClipboard={vi.fn()}
        onPasteSettings={vi.fn()}
        onReset={vi.fn()}
        onResolutionWidthChange={vi.fn()}
        onSettingsTransition={vi.fn()}
      />
    )

    expect(selectRenders[3]?.value).toBe("32")
  })

  it("extracts again when selecting the active custom palette size", () => {
    const onExtractPalette = vi.fn()

    renderToStaticMarkup(
      <ControlPanel
        advancedOpen={false}
        compareMode="slide"
        settings={{
          ...DEFAULT_SETTINGS,
          paletteId: "custom",
          customPalette: [
            "#000000",
            "#222222",
            "#444444",
            "#666666",
            "#888888",
            "#aaaaaa",
            "#cccccc",
            "#ffffff",
          ],
        }}
        resolutionAspectLabel="1:1"
        onAdvancedOpenChange={vi.fn()}
        onCompareModeChange={vi.fn()}
        onCopyPaletteJson={vi.fn()}
        onCopySettings={vi.fn()}
        onExportPaletteGpl={vi.fn()}
        onExportPaletteJson={vi.fn()}
        onExtractPalette={onExtractPalette}
        onImportPaletteFile={vi.fn()}
        onImportPaletteFromClipboard={vi.fn()}
        onPasteSettings={vi.fn()}
        onReset={vi.fn()}
        onResolutionWidthChange={vi.fn()}
        onSettingsTransition={vi.fn()}
      />
    )

    const activeExtractItem = selectItemRenders
      .filter((item) => ["2", "4", "8", "16", "32"].includes(item.value))
      .find((item) => item.value === "8")

    activeExtractItem?.onPointerUp?.()

    expect(onExtractPalette).toHaveBeenCalledWith(8)
  })
})
