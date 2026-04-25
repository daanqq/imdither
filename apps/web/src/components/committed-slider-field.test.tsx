import { renderToStaticMarkup } from "react-dom/server"
import type * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

type ButtonMockProps = React.ComponentProps<"button"> & {
  size?: string
  variant?: string
}

type SliderMockProps = {
  max?: number
  min?: number
  onValueChange?: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  step?: number
  value?: number[]
}

const sliderRenders: SliderMockProps[] = []
const buttonRenders: ButtonMockProps[] = []

vi.mock("@workspace/ui/components/button", () => ({
  Button: (props: ButtonMockProps) => {
    buttonRenders.push(props)
    return <button {...props} />
  },
}))

vi.mock("@workspace/ui/components/slider", () => ({
  Slider: (props: SliderMockProps) => {
    sliderRenders.push(props)
    return <div data-slot="slider">{props.value?.[0]}</div>
  },
}))

const { CommittedSliderField } = await import("./committed-slider-field")

describe("CommittedSliderField", () => {
  beforeEach(() => {
    buttonRenders.length = 0
    sliderRenders.length = 0
  })

  it("keeps drag edits local until the slider commits", () => {
    const onCommit = vi.fn()

    renderToStaticMarkup(
      <CommittedSliderField
        defaultValue={0}
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
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith(25)
  })

  it("disables reset when the visible value is already the default", () => {
    const onCommit = vi.fn()

    renderToStaticMarkup(
      <CommittedSliderField
        defaultValue={0}
        label="Brightness"
        max={100}
        min={-100}
        step={1}
        value={0}
        onCommit={onCommit}
      />
    )

    const button = buttonRenders.at(-1)
    expect(button).toMatchObject({
      "aria-label": "Reset Brightness to 0",
      disabled: true,
      size: "icon-xs",
      title: "Reset Brightness to 0",
      variant: "ghost",
    })
    expect(button?.onClick).toBeUndefined()
  })

  it("commits the default when reset is clicked", () => {
    const onCommit = vi.fn()

    renderToStaticMarkup(
      <CommittedSliderField
        defaultValue={0}
        label="Brightness"
        max={100}
        min={-100}
        step={1}
        value={25}
        onCommit={onCommit}
      />
    )

    const button = buttonRenders.at(-1)
    expect(button?.disabled).toBe(false)

    const onClick = button?.onClick as (() => void) | undefined
    onClick?.()

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith(0)
  })

  it("uses the slider step as the reset equality threshold", () => {
    const onCommit = vi.fn()

    renderToStaticMarkup(
      <CommittedSliderField
        defaultValue={1}
        label="Gamma"
        max={3}
        min={0.2}
        step={0.05}
        value={1.01}
        onCommit={onCommit}
      />
    )

    const button = buttonRenders.at(-1)
    expect(button?.disabled).toBe(true)
  })
})
