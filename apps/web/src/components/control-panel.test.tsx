import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_SETTINGS } from "@workspace/core"

import { ControlPanel } from "./control-panel"
import type { CommittedSliderFieldProps } from "./committed-slider-field"

const sliderRenders: CommittedSliderFieldProps[] = []
const selectRenders: Array<{
  value?: string
  onValueChange?: (value: string) => void
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
    value,
  }: {
    children: React.ReactNode
    value: string
  }) => <div data-value={value}>{children}</div>,
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
        onCopySettings={vi.fn()}
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
        onCopySettings={vi.fn()}
        onPasteSettings={vi.fn()}
        onReset={vi.fn()}
        onResolutionWidthChange={vi.fn()}
        onSettingsTransition={onSettingsTransition}
      />
    )

    expect(markup).toContain("Recipe")
    expect(markup).toContain("Custom")
    expect(markup).toContain("Sea Glass Atkinson")
    expect(selectRenders[0]?.value).toBe("fine-mono-bayer")

    selectRenders[0]?.onValueChange?.("sea-glass-atkinson")
    expect(onSettingsTransition).toHaveBeenCalledWith({
      type: "apply-processing-preset",
      presetId: "sea-glass-atkinson",
    })
  })
})
