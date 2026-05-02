import { renderToStaticMarkup } from "react-dom/server"
import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ExportDrawerContent } from "./export-drawer-content"

type SliderProps = {
  disabled?: boolean
  max?: number
  min?: number
  step?: number
  value?: number[]
  onValueChange?: (value: number[]) => void
}

const sliderRenders: SliderProps[] = []

vi.mock("@workspace/ui/components/slider", () => ({
  Slider: (props: SliderProps) => {
    sliderRenders.push(props)
    return (
      <div
        aria-valuemax={props.max}
        aria-valuemin={props.min}
        aria-valuenow={props.value?.[0]}
        role="slider"
      />
    )
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
  }) => (
    <select
      aria-label={
        value === "png" || value === "webp" || value === "jpeg"
          ? "Export format"
          : undefined
      }
      value={value}
      onChange={(event) => onValueChange?.(event.currentTarget.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode
    value: string
  }) => <option value={value}>{children}</option>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}))

vi.mock("@workspace/ui/components/drawer", () => ({
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div data-slot="drawer-content">{children}</div>
  ),
  DrawerDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DrawerFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}))

vi.mock("@workspace/ui/components/button", () => ({
  Button: (props: React.ComponentProps<"button">) => <button {...props} />,
}))

describe("ExportDrawerContent", () => {
  beforeEach(() => {
    sliderRenders.length = 0
  })

  it("renders format options and quality slider", () => {
    const html = renderToStaticMarkup(
      <ExportDrawerContent
        exportFormat="webp"
        exportQuality={0.75}
        status="ready"
        onExport={vi.fn()}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
      />
    )

    expect(html).toContain("Export Format")
    expect(html).toContain("Export Quality")
    expect(html).toContain("Download WebP")
    expect(sliderRenders.at(-1)).toMatchObject({
      disabled: false,
      max: 1,
      min: 0.1,
      step: 0.05,
      value: [0.75],
    })
  })

  it("disables quality slider for PNG and shows lossless note", () => {
    const html = renderToStaticMarkup(
      <ExportDrawerContent
        exportFormat="png"
        exportQuality={0.92}
        status="ready"
        onExport={vi.fn()}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
      />
    )

    expect(sliderRenders.at(-1)).toMatchObject({
      disabled: true,
      value: [1],
    })
    expect(html).toContain("PNG exports remain lossless at 100%.")
    expect(html).toContain("Download PNG")
  })

  it("shows correct format label for JPEG", () => {
    const html = renderToStaticMarkup(
      <ExportDrawerContent
        exportFormat="jpeg"
        exportQuality={0.85}
        status="ready"
        onExport={vi.fn()}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
      />
    )

    expect(html).toContain("Download JPEG")
  })

  it("disables export button while exporting", () => {
    const html = renderToStaticMarkup(
      <ExportDrawerContent
        exportFormat="png"
        exportQuality={1}
        status="exporting"
        onExport={vi.fn()}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
      />
    )

    expect(html).toContain("disabled")
    expect(html).toContain("Download PNG")
  })
})
