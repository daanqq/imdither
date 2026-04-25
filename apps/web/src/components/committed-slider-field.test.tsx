import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

type SliderMockProps = {
  max?: number
  min?: number
  onValueChange?: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  step?: number
  value?: number[]
}

const sliderRenders: SliderMockProps[] = []

vi.mock("@workspace/ui/components/slider", () => ({
  Slider: (props: SliderMockProps) => {
    sliderRenders.push(props)
    return <div data-slot="slider">{props.value?.[0]}</div>
  },
}))

const { CommittedSliderField } = await import("./committed-slider-field")

describe("CommittedSliderField", () => {
  it("keeps drag edits local until the slider commits", () => {
    const onCommit = vi.fn()

    renderToStaticMarkup(
      <CommittedSliderField
        label="Brightness"
        max={100}
        min={-100}
        step={1}
        value={0}
        onCommit={onCommit}
      />
    )

    const slider = sliderRenders.at(-1)
    expect(slider).toBeDefined()

    slider?.onValueChange?.([25])
    expect(onCommit).not.toHaveBeenCalled()

    slider?.onValueCommit?.([25])
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(25)
  })
})
