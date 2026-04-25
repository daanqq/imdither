import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_SETTINGS } from "@workspace/core"

import { ControlPanel } from "./control-panel"
import type { CommittedSliderFieldProps } from "./committed-slider-field"

const sliderRenders: CommittedSliderFieldProps[] = []

vi.mock("./committed-slider-field", () => ({
  CommittedSliderField: (props: CommittedSliderFieldProps) => {
    sliderRenders.push(props)
    return <div data-slot="committed-slider-field">{props.value}</div>
  },
}))

describe("ControlPanel", () => {
  beforeEach(() => {
    sliderRenders.length = 0
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
})
