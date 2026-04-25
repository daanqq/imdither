import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_SETTINGS } from "@workspace/core"

import { ControlPanel } from "./control-panel"

type SliderMockProps = {
  onValueChange?: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  value?: number[]
}

const sliderRenders: SliderMockProps[] = []

vi.mock("@workspace/ui/components/slider", () => ({
  Slider: (props: SliderMockProps) => {
    sliderRenders.push(props)
    return <div data-slot="slider">{props.value?.[0]}</div>
  },
}))

describe("ControlPanel", () => {
  beforeEach(() => {
    sliderRenders.length = 0
  })

  it("keeps slider draft changes away from committed settings transitions", () => {
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

    brightnessSlider?.onValueChange?.([25])
    expect(onSettingsTransition).not.toHaveBeenCalled()

    brightnessSlider?.onValueCommit?.([25])
    expect(onSettingsTransition).toHaveBeenCalledTimes(1)
    expect(onSettingsTransition).toHaveBeenCalledWith({
      type: "set-preprocess",
      patch: { brightness: 25 },
    })
  })
})
