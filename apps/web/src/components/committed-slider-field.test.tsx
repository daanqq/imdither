import { renderToStaticMarkup } from "react-dom/server"
import type * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

type ButtonMockProps = React.ComponentProps<"button"> & {
  size?: string
  variant?: string
  "data-dirty"?: string
}

const buttonRenders: ButtonMockProps[] = []

vi.mock("@workspace/ui/components/button", () => ({
  Button: (props: ButtonMockProps) => {
    buttonRenders.push(props)
    return <button {...props} />
  },
}))

const { CommittedSliderField } = await import("./committed-slider-field")

describe("CommittedSliderField", () => {
  beforeEach(() => {
    buttonRenders.length = 0
  })

  it("renders a native range input for direct thumb movement", () => {
    const onCommit = vi.fn()

    const html = renderToStaticMarkup(
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

    expect(html).toContain('type="range"')
    expect(html).toContain('data-slot="committed-range-slider"')
    expect(html).not.toContain('data-slot="slider"')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it("disables and hides reset when the visible value is already the default", () => {
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
      "data-dirty": "false",
      disabled: true,
      size: "icon-xs",
      tabIndex: -1,
      title: "Reset Brightness to 0",
      variant: "ghost",
    })
    expect(button?.className).toContain("opacity-0")
    expect(button?.onClick).toBeDefined()
  })

  it("reveals reset and commits the default when modified and clicked", () => {
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
    expect(button?.["data-dirty"]).toBe("true")
    expect(button?.tabIndex).toBe(0)
    expect(button?.className).not.toContain(" pointer-events-none opacity-0")

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
    expect(button?.["data-dirty"]).toBe("false")
  })

  it("uses center-origin fill and renders a center tick for bipolar ranges", () => {
    const neutralHtml = renderToStaticMarkup(
      <CommittedSliderField
        defaultValue={0}
        label="Brightness"
        max={100}
        min={-100}
        step={1}
        value={0}
        onCommit={vi.fn()}
      />
    )
    expect(neutralHtml).toContain('data-bipolar="true"')
    expect(neutralHtml).toContain('data-slot="committed-slider-center-tick"')
    expect(neutralHtml).toContain("--committed-slider-fill-start:50%")
    expect(neutralHtml).toContain("--committed-slider-fill-end:50%")

    const positiveHtml = renderToStaticMarkup(
      <CommittedSliderField
        defaultValue={0}
        label="Brightness"
        max={100}
        min={-100}
        step={1}
        value={50}
        onCommit={vi.fn()}
      />
    )
    expect(positiveHtml).toContain("--committed-slider-fill-start:50%")
    expect(positiveHtml).toContain("--committed-slider-fill-end:75%")

    const negativeHtml = renderToStaticMarkup(
      <CommittedSliderField
        defaultValue={0}
        label="Contrast"
        max={100}
        min={-100}
        step={1}
        value={-50}
        onCommit={vi.fn()}
      />
    )
    expect(negativeHtml).toContain("--committed-slider-fill-start:25%")
    expect(negativeHtml).toContain("--committed-slider-fill-end:50%")
  })

  it("uses left-origin fill without a center tick for unipolar ranges and formats units", () => {
    const html = renderToStaticMarkup(
      <CommittedSliderField
        defaultValue={45}
        label="Angle"
        max={360}
        min={0}
        step={1}
        unit="°"
        value={90}
        onCommit={vi.fn()}
      />
    )

    expect(html).not.toContain('data-bipolar="true"')
    expect(html).not.toContain('data-slot="committed-slider-center-tick"')
    expect(html).toContain("--committed-slider-fill-start:0%")
    expect(html).toContain("--committed-slider-fill-end:25%")
    expect(html).toContain('data-slot="committed-slider-unit"')
    expect(html).toContain("90")
    expect(html).toContain("°")

    const button = buttonRenders.at(-1)
    expect(button?.["aria-label"]).toBe("Reset Angle to 45°")
  })
})
