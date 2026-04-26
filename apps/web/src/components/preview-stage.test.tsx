import { renderToStaticMarkup } from "react-dom/server"
import type * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PixelBuffer } from "@workspace/core"

import type { ExportFormat } from "@/lib/export-image"

import { areCanvasPanelPropsEqual } from "./preview-render-boundaries"
import { PreviewStage } from "./preview-stage"

type ButtonMockProps = React.ComponentProps<"button"> & {
  variant?: string
}

type InputMockProps = React.ComponentProps<"input">

const buttonRenders: ButtonMockProps[] = []
const inputRenders: InputMockProps[] = []
const sliderRenders: Array<{
  disabled?: boolean
  max?: number
  min?: number
  step?: number
  value?: number[]
  onValueChange?: (value: number[]) => void
}> = []

vi.mock("@workspace/ui/components/button", () => ({
  Button: (props: ButtonMockProps) => {
    buttonRenders.push(props)
    return <button {...props} />
  },
}))

vi.mock("@workspace/ui/components/input", () => ({
  Input: (props: InputMockProps) => {
    inputRenders.push(props)
    return <input {...props} />
  },
}))

vi.mock("@workspace/ui/components/slider", () => ({
  Slider: (props: {
    disabled?: boolean
    max?: number
    min?: number
    step?: number
    value?: number[]
    onValueChange?: (value: number[]) => void
  }) => {
    sliderRenders.push(props)
    return <div role="slider" />
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
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: () => null,
}))

const buffer: PixelBuffer = {
  data: new Uint8ClampedArray([0, 0, 0, 255]),
  height: 1,
  width: 1,
}

describe("PreviewStage", () => {
  beforeEach(() => {
    buttonRenders.length = 0
    inputRenders.length = 0
    sliderRenders.length = 0
  })

  it("keeps upload and export side effects behind callbacks", () => {
    const onExportPng = vi.fn()
    const onFileSelected = vi.fn()

    renderToStaticMarkup(
      <PreviewStage
        algorithm="floyd-steinberg"
        compareMode="processed"
        isDesktopViewScale
        original={buffer}
        preview={buffer}
        previewTargetHeight={1}
        previewTargetWidth={1}
        status="ready"
        previewViewport={{
          mode: "fit",
          zoom: 1,
          center: { x: 0, y: 0 },
          gridEnabled: false,
          loupeEnabled: false,
        }}
        exportFormat="png"
        exportQuality={0.92}
        onExport={onExportPng}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
        onFileSelected={onFileSelected}
        onInvalidDrop={vi.fn()}
        onPreviewDisplaySizeChange={vi.fn()}
        onPreviewViewportChange={vi.fn()}
      />
    )

    const file = new File(["x"], "source.png", { type: "image/png" })
    const fileInput = inputRenders.at(-1)
    const exportButton = buttonRenders.find((button) =>
      button.children?.toString().includes("Export")
    )

    fileInput?.onChange?.({
      target: { files: [file], value: "source.png" },
    } as unknown as React.ChangeEvent<HTMLInputElement>)
    exportButton?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)

    expect(onFileSelected).toHaveBeenCalledTimes(1)
    expect(onFileSelected).toHaveBeenCalledWith(file)
    expect(onExportPng).toHaveBeenCalledTimes(1)
  })

  it("shows quality only for formats that support it", () => {
    const onExportFormatChange = vi.fn()
    const onExportQualityChange = vi.fn()
    const baseProps = {
      algorithm: "floyd-steinberg",
      compareMode: "processed",
      isDesktopViewScale: true,
      original: buffer,
      preview: buffer,
      previewTargetHeight: 1,
      previewTargetWidth: 1,
      status: "ready",
      previewViewport: {
        mode: "fit",
        zoom: 1,
        center: { x: 0, y: 0 },
        gridEnabled: false,
        loupeEnabled: false,
      },
      exportQuality: 0.75,
      onExport: vi.fn(),
      onExportFormatChange,
      onExportQualityChange,
      onFileSelected: vi.fn(),
      onInvalidDrop: vi.fn(),
      onPreviewDisplaySizeChange: vi.fn(),
      onPreviewViewportChange: vi.fn(),
    } as const

    const render = (exportFormat: ExportFormat) =>
      renderToStaticMarkup(
        <PreviewStage {...baseProps} exportFormat={exportFormat} />
      )

    expect(render("png")).not.toContain("Quality")
    expect(render("webp")).toContain("Quality")
    expect(render("webp")).toContain("75%")
    expect(render("jpeg")).toContain("Quality")
    expect(inputRenders.some((input) => input.type === "range")).toBe(false)
    expect(sliderRenders.find((slider) => slider.max === 1)).toMatchObject({
      max: 1,
      min: 0.1,
      step: 0.05,
      value: [0.75],
    })
    sliderRenders.find((slider) => slider.max === 1)?.onValueChange?.([0.8])
    expect(onExportQualityChange).toHaveBeenLastCalledWith(0.8)
  })

  it("keeps ready canvas presentation stable across status-only updates", () => {
    const baseProps = {
      buffer,
      expectedHeight: 1,
      expectedWidth: 1,
      label: "Processed",
      missing: false,
      status: "ready",
      viewScale: "fit",
    } as const

    expect(
      areCanvasPanelPropsEqual(baseProps, {
        ...baseProps,
        status: "processing",
      })
    ).toBe(true)

    expect(
      areCanvasPanelPropsEqual(baseProps, {
        ...baseProps,
        buffer: {
          ...buffer,
          data: new Uint8ClampedArray(buffer.data),
        },
      })
    ).toBe(false)
  })

  it("keeps placeholder status updates visible while processed output is missing", () => {
    const baseProps = {
      buffer: null,
      expectedHeight: 1,
      expectedWidth: 1,
      label: "Processed",
      missing: true,
      status: "queued",
      viewScale: "fit",
    } as const

    expect(
      areCanvasPanelPropsEqual(baseProps, {
        ...baseProps,
        status: "processing",
      })
    ).toBe(false)
  })

  it("keeps slide compare 1:1 frame at the selected output size while preview is reduced", () => {
    const html = renderToStaticMarkup(
      <PreviewStage
        algorithm="bayer"
        compareMode="slide"
        isDesktopViewScale
        original={makeBuffer(960, 640)}
        preview={makeBuffer(480, 320)}
        previewTargetHeight={1333}
        previewTargetWidth={2000}
        status="ready"
        previewViewport={{
          mode: "manual",
          zoom: 1,
          center: { x: 0, y: 0 },
          gridEnabled: false,
          loupeEnabled: false,
        }}
        exportFormat="png"
        exportQuality={0.92}
        onExport={vi.fn()}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
        onFileSelected={vi.fn()}
        onInvalidDrop={vi.fn()}
        onPreviewDisplaySizeChange={vi.fn()}
        onPreviewViewportChange={vi.fn()}
      />
    )

    expect(html).toContain("height:1333px")
    expect(html).toContain("width:2000px")
  })

  it("keeps inspection controls in the preview toolbar", () => {
    const onPreviewViewportChange = vi.fn()

    renderToStaticMarkup(
      <PreviewStage
        algorithm="bayer"
        compareMode="processed"
        isDesktopViewScale
        original={makeBuffer(2, 2)}
        preview={makeBuffer(2, 2)}
        previewTargetHeight={2}
        previewTargetWidth={2}
        status="ready"
        previewViewport={{
          mode: "manual",
          zoom: 4,
          center: { x: 1, y: 1 },
          gridEnabled: true,
          loupeEnabled: false,
        }}
        exportFormat="png"
        exportQuality={0.92}
        onExport={vi.fn()}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
        onFileSelected={vi.fn()}
        onInvalidDrop={vi.fn()}
        onPreviewDisplaySizeChange={vi.fn()}
        onPreviewViewportChange={onPreviewViewportChange}
      />
    )

    const zoomSlider = sliderRenders.find((slider) => slider.max === 16)
    const gridButton = buttonRenders.find(
      (button) => button["aria-label"] === "Toggle pixel grid"
    )

    zoomSlider?.onValueChange?.([5])
    gridButton?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)

    expect(zoomSlider).toMatchObject({ min: 0.25, max: 16, step: 0.25 })
    expect(onPreviewViewportChange).toHaveBeenCalledWith({
      mode: "manual",
      zoom: 5,
    })
    expect(onPreviewViewportChange).toHaveBeenCalledWith({
      gridEnabled: false,
    })
  })

  it("hides the pixel inspector control on mobile", () => {
    renderToStaticMarkup(
      <PreviewStage
        algorithm="bayer"
        compareMode="processed"
        isDesktopViewScale={false}
        original={makeBuffer(2, 2)}
        preview={makeBuffer(2, 2)}
        previewTargetHeight={2}
        previewTargetWidth={2}
        status="ready"
        previewViewport={{
          mode: "manual",
          zoom: 4,
          center: { x: 1, y: 1 },
          gridEnabled: true,
          loupeEnabled: true,
        }}
        exportFormat="png"
        exportQuality={0.92}
        onExport={vi.fn()}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
        onFileSelected={vi.fn()}
        onInvalidDrop={vi.fn()}
        onPreviewDisplaySizeChange={vi.fn()}
        onPreviewViewportChange={vi.fn()}
      />
    )

    expect(
      buttonRenders.some(
        (button) => button["aria-label"] === "Toggle pixel grid"
      )
    ).toBe(true)
    expect(
      buttonRenders.some(
        (button) => button["aria-label"] === "Toggle pixel inspector"
      )
    ).toBe(false)
  })

  it("applies manual viewport center as a visible frame offset", () => {
    const html = renderToStaticMarkup(
      <PreviewStage
        algorithm="bayer"
        compareMode="processed"
        isDesktopViewScale
        original={makeBuffer(10, 8)}
        preview={makeBuffer(10, 8)}
        previewTargetHeight={8}
        previewTargetWidth={10}
        status="ready"
        previewViewport={{
          mode: "manual",
          zoom: 4,
          center: { x: 4, y: 3 },
          gridEnabled: false,
          loupeEnabled: false,
        }}
        exportFormat="png"
        exportQuality={0.92}
        onExport={vi.fn()}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
        onFileSelected={vi.fn()}
        onInvalidDrop={vi.fn()}
        onPreviewDisplaySizeChange={vi.fn()}
        onPreviewViewportChange={vi.fn()}
      />
    )

    expect(html).toContain("left:50%")
    expect(html).toContain("top:50%")
    expect(html).toContain("margin-left:-16px")
    expect(html).toContain("margin-top:-12px")
  })
})

function makeBuffer(width: number, height: number): PixelBuffer {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    height,
    width,
  }
}
