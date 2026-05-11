import { renderToStaticMarkup } from "react-dom/server"
import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PixelBuffer } from "@workspace/core"

import { MIN_PREVIEW_ZOOM } from "@/lib/preview-viewport"

import { areCanvasPanelPropsEqual } from "./preview-render-boundaries"
import { PreviewStage } from "./preview-stage"
import {
  buildPreviewStageModel,
  type PreviewStageInput,
  type PreviewStageModel,
} from "@/lib/preview-stage-application"

type ButtonMockProps = React.ComponentProps<"button"> & {
  variant?: string
}

type InputMockProps = React.ComponentProps<"input">

const buttonRenders: ButtonMockProps[] = []
const inputRenders: InputMockProps[] = []
const toggleGroupItemRenders: Array<{
  onClick?: () => void
  value?: string
}> = []
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

vi.mock("@workspace/ui/components/toggle-group", () => ({
  ToggleGroup: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode
    onValueChange?: (value: string) => void
  }) => (
    <div>
      {React.Children.map(children, (child) =>
        React.isValidElement<{ onClick?: () => void; value?: string }>(child)
          ? React.cloneElement(child, {
              onClick: () => {
                child.props.onClick?.()
                onValueChange?.(child.props.value ?? "")
              },
            })
          : child
      )}
    </div>
  ),
  ToggleGroupItem: ({
    children,
    onClick,
    value,
  }: {
    children: React.ReactNode
    onClick?: () => void
    value?: string
  }) => {
    toggleGroupItemRenders.push({ onClick, value })
    return <button>{children}</button>
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
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: () => null,
}))

vi.mock("@workspace/ui/components/drawer", () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
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
  DrawerTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock("@workspace/ui/components/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-slot="popover-content">{children}</div>
  ),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

const buffer: PixelBuffer = {
  data: new Uint8ClampedArray([0, 0, 0, 255]),
  height: 1,
  width: 1,
}

function makeInput(overrides?: Partial<PreviewStageInput>): PreviewStageInput {
  return {
    algorithm: "floyd-steinberg",
    compareMode: "processed",
    isDesktopViewScale: true,
    original: buffer,
    outputHeight: 1,
    outputWidth: 1,
    preview: buffer,
    previewRefiningPending: false,
    previewTargetHeight: 1,
    previewTargetWidth: 1,
    status: "ready",
    error: null,
    previewViewport: {
      mode: "fit",
      zoom: 1,
      center: { x: 0, y: 0 },
      gridEnabled: false,
      loupeEnabled: false,
    },
    exportFormat: "png",
    exportQuality: 0.92,
    canUndoSettingsChange: false,
    canRedoSettingsChange: false,
    isAnimated: false,
    frameCount: 0,
    currentFrame: 0,
    isPlaying: false,
    animatedExportFormat: "gif",
    webCodecsAvailable: false,
    ...overrides,
  }
}

function makeModel(overrides?: Partial<PreviewStageInput>): PreviewStageModel {
  return buildPreviewStageModel(makeInput(overrides))
}

describe("PreviewStage", () => {
  beforeEach(() => {
    buttonRenders.length = 0
    inputRenders.length = 0
    sliderRenders.length = 0
    toggleGroupItemRenders.length = 0
  })

  it("keeps upload and export side effects behind callbacks", () => {
    const onCommand = vi.fn()

    renderToStaticMarkup(
      <PreviewStage model={makeModel()} onCommand={onCommand} />
    )

    const file = new File(["x"], "source.png", { type: "image/png" })
    const fileInput = inputRenders.at(-1)

    fileInput?.onChange?.({
      target: { files: [file], value: "source.png" },
    } as unknown as React.ChangeEvent<HTMLInputElement>)

    const downloadButton = buttonRenders.find((button) =>
      button.children?.toString().includes("Download")
    )
    downloadButton?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)

    expect(onCommand).toHaveBeenCalledWith({
      kind: "source-replacement-intent",
      file,
    })
    expect(onCommand).toHaveBeenCalledWith({ kind: "export-intent" })
  })

  it("shows source rejection errors in the preview stage", () => {
    const model = makeModel({
      original: null,
      preview: null,
      previewTargetHeight: 640,
      previewTargetWidth: 960,
      status: "error",
      error:
        "Image is too large (3300x4900). Maximum source dimension is 4096px.",
    })

    const markup = renderToStaticMarkup(
      <PreviewStage model={model} onCommand={vi.fn()} />
    )

    expect(markup).toContain("SOURCE REJECTED")
    expect(markup).toContain(
      "Image is too large (3300x4900). Maximum source dimension is 4096px."
    )
  })

  it("centers mobile manual zoom at the full output size while fit preview is reduced", () => {
    const onCommand = vi.fn()
    const model = makeModel({
      algorithm: "bayer",
      compareMode: "slide",
      isDesktopViewScale: false,
      original: makeBuffer(4000, 3000),
      outputHeight: 3000,
      outputWidth: 4000,
      preview: makeBuffer(600, 450),
      previewTargetHeight: 450,
      previewTargetWidth: 600,
    })

    renderToStaticMarkup(<PreviewStage model={model} onCommand={onCommand} />)

    toggleGroupItemRenders.find((item) => item.value === "manual")?.onClick?.()

    expect(onCommand).toHaveBeenCalledWith({
      kind: "preview-viewport-changed",
      viewport: { center: { x: 2000, y: 1500 }, mode: "manual", zoom: 1 },
    })
  })

  it("shows undo and redo controls with availability states", () => {
    const onCommand = vi.fn()
    const model = makeModel({
      canRedoSettingsChange: false,
      canUndoSettingsChange: true,
    })

    renderToStaticMarkup(<PreviewStage model={model} onCommand={onCommand} />)

    const undoButton = buttonRenders.find(
      (button) => button["aria-label"] === "Undo settings change"
    )
    const redoButton = buttonRenders.find(
      (button) => button["aria-label"] === "Redo settings change"
    )

    undoButton?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    redoButton?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)

    expect(undoButton).toMatchObject({ disabled: false })
    expect(redoButton).toMatchObject({ disabled: true })
    expect(onCommand).toHaveBeenCalledWith({ kind: "undo-settings-change" })
    expect(onCommand).toHaveBeenCalledWith({ kind: "redo-settings-change" })
  })

  it("cycles compare mode from the floating preview control", () => {
    const onCommand = vi.fn()
    const model = makeModel()

    const markup = renderToStaticMarkup(
      <PreviewStage model={model} onCommand={onCommand} />
    )

    buttonRenders
      .find(
        (button) => button["aria-label"] === "Switch compare mode to Original"
      )
      ?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)

    expect(markup).toContain("Processed")
    expect(
      renderToStaticMarkup(
        <PreviewStage
          model={makeModel({ compareMode: "slide" })}
          onCommand={vi.fn()}
        />
      )
    ).toContain("Comparison")

    expect(onCommand).toHaveBeenCalledWith({
      kind: "compare-mode-changed",
      mode: "original",
    })
  })

  it("moves export preferences into the export drawer", () => {
    const onCommand = vi.fn()

    renderToStaticMarkup(
      <PreviewStage
        model={makeModel({ exportFormat: "webp" })}
        onCommand={vi.fn()}
      />
    )

    const markup = renderToStaticMarkup(
      <PreviewStage
        model={makeModel({ exportFormat: "jpeg", exportQuality: 0.75 })}
        onCommand={onCommand}
      />
    )

    renderToStaticMarkup(
      <PreviewStage
        model={makeModel({ exportFormat: "png", exportQuality: 0.75 })}
        onCommand={vi.fn()}
      />
    )

    expect(markup).toContain("Export Format")
    expect(markup).toContain("Export Quality")
    expect(markup).toContain("Download JPEG")
    expect(markup).not.toContain("Palette JSON")
    expect(markup).not.toContain("Palette GPL")
    expect(inputRenders.some((input) => input.type === "range")).toBe(false)
    expect(sliderRenders.find((slider) => slider.max === 1)).toBeDefined()
    expect(sliderRenders.at(-1)).toMatchObject({
      disabled: true,
      value: [1],
    })
    expect(onCommand).not.toHaveBeenCalled()
  })

  it("shows reduced preview overlay only while a refined preview is pending", () => {
    const baseModel = makeModel({
      original: makeBuffer(4000, 3000),
      outputHeight: 3000,
      outputWidth: 4000,
      preview: makeBuffer(600, 450),
      previewTargetHeight: 3000,
      previewTargetWidth: 4000,
    })

    expect(
      renderToStaticMarkup(
        <PreviewStage model={baseModel} onCommand={vi.fn()} />
      )
    ).not.toContain("PREVIEW ONLY")

    expect(
      renderToStaticMarkup(
        <PreviewStage
          model={makeModel({
            original: makeBuffer(4000, 3000),
            outputHeight: 3000,
            outputWidth: 4000,
            preview: makeBuffer(600, 450),
            previewTargetHeight: 3000,
            previewTargetWidth: 4000,
            previewRefiningPending: true,
          })}
          onCommand={vi.fn()}
        />
      )
    ).toContain("PREVIEW ONLY")
  })

  it("keeps ready canvas presentation stable across status-only updates", () => {
    const onViewportChange = vi.fn()
    const baseProps = {
      buffer,
      expectedHeight: 1,
      expectedWidth: 1,
      label: "Processed",
      missing: false,
      onViewportChange,
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

    expect(
      areCanvasPanelPropsEqual(baseProps, {
        ...baseProps,
        onViewportChange: vi.fn(),
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
      onViewportChange: vi.fn(),
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
    const model = makeModel({
      algorithm: "bayer",
      compareMode: "slide",
      isDesktopViewScale: true,
      original: makeBuffer(960, 640),
      outputHeight: 1333,
      outputWidth: 2000,
      preview: makeBuffer(480, 320),
      previewTargetHeight: 1333,
      previewTargetWidth: 2000,
      status: "ready",
      previewViewport: {
        mode: "manual",
        zoom: 1,
        center: { x: 0, y: 0 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    const html = renderToStaticMarkup(
      <PreviewStage model={model} onCommand={vi.fn()} />
    )

    expect(html).toContain("height:1321px")
    expect(html).toContain("width:1982px")
  })

  it("keeps inspection controls in the preview toolbar", () => {
    const onCommand = vi.fn()
    const model = makeModel({
      algorithm: "bayer",
      original: makeBuffer(2, 2),
      outputHeight: 2,
      outputWidth: 2,
      preview: makeBuffer(2, 2),
      previewTargetHeight: 2,
      previewTargetWidth: 2,
      previewViewport: {
        mode: "manual",
        zoom: 4,
        center: { x: 1, y: 1 },
        gridEnabled: true,
        loupeEnabled: false,
      },
    })

    renderToStaticMarkup(<PreviewStage model={model} onCommand={onCommand} />)

    const zoomSlider = sliderRenders.find((slider) => slider.max === 16)

    zoomSlider?.onValueChange?.([5])
    buttonRenders
      .find((button) => button["aria-label"] === "Set output pixels to 1:1")
      ?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)

    expect(zoomSlider).toMatchObject({
      min: MIN_PREVIEW_ZOOM,
      max: 16,
      step: 0.25,
    })
    expect(onCommand).toHaveBeenCalledWith({
      kind: "preview-viewport-changed",
      viewport: { mode: "manual", zoom: 5 },
    })
    expect(onCommand).toHaveBeenCalledWith({
      kind: "preview-viewport-changed",
      viewport: { mode: "manual", zoom: 1, center: { x: 1, y: 1 } },
    })
  })

  it("keeps zoom controls visible in fit mode and switches interactions to real pixels", () => {
    const onCommand = vi.fn()
    const model = makeModel({
      algorithm: "bayer",
      original: makeBuffer(2, 2),
      outputHeight: 2,
      outputWidth: 2,
      preview: makeBuffer(2, 2),
      previewTargetHeight: 2,
      previewTargetWidth: 2,
      previewViewport: {
        mode: "fit",
        zoom: 4,
        center: { x: 1, y: 1 },
        gridEnabled: true,
        loupeEnabled: false,
      },
    })

    renderToStaticMarkup(<PreviewStage model={model} onCommand={onCommand} />)

    const zoomSlider = sliderRenders.find((slider) => slider.max === 16)

    zoomSlider?.onValueChange?.([5])
    buttonRenders
      .find((button) => button["aria-label"] === "Set output pixels to 1:1")
      ?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)

    expect(zoomSlider).toMatchObject({
      min: MIN_PREVIEW_ZOOM,
      max: 16,
      step: 0.25,
    })
    expect(
      buttonRenders.some(
        (button) => button["aria-label"] === "Set output pixels to 1:1"
      )
    ).toBe(true)
    expect(
      buttonRenders.some(
        (button) => button["aria-label"] === "Toggle pixel inspector"
      )
    ).toBe(true)
    expect(onCommand).toHaveBeenCalledWith({
      kind: "preview-viewport-changed",
      viewport: { center: { x: 1, y: 1 }, mode: "manual", zoom: 5 },
    })
    expect(onCommand).toHaveBeenCalledWith({
      kind: "preview-viewport-changed",
      viewport: { mode: "manual", zoom: 1, center: { x: 1, y: 1 } },
    })
  })

  it("centers output pixels when the zoom slider enters manual mode from fit", () => {
    const onCommand = vi.fn()
    const model = makeModel({
      algorithm: "bayer",
      original: makeBuffer(4000, 3000),
      outputHeight: 3000,
      outputWidth: 4000,
      preview: makeBuffer(600, 450),
      previewTargetHeight: 450,
      previewTargetWidth: 600,
      previewViewport: {
        mode: "fit",
        zoom: 1,
        center: { x: 0, y: 0 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    renderToStaticMarkup(<PreviewStage model={model} onCommand={onCommand} />)

    sliderRenders.find((slider) => slider.max === 16)?.onValueChange?.([2])

    expect(onCommand).toHaveBeenCalledWith({
      kind: "preview-viewport-changed",
      viewport: { center: { x: 2000, y: 1500 }, mode: "manual", zoom: 2 },
    })
  })

  it("centers slide real pixels when output size is larger than the original", () => {
    const onCommand = vi.fn()
    const model = makeModel({
      algorithm: "bayer",
      compareMode: "slide",
      original: makeBuffer(768, 768),
      outputHeight: 2048,
      outputWidth: 2048,
      preview: makeBuffer(768, 768),
      previewTargetHeight: 768,
      previewTargetWidth: 768,
      previewViewport: {
        mode: "fit",
        zoom: 1,
        center: { x: 0, y: 0 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    renderToStaticMarkup(<PreviewStage model={model} onCommand={onCommand} />)

    sliderRenders.find((slider) => slider.max === 16)?.onValueChange?.([2])

    expect(onCommand).toHaveBeenCalledWith({
      kind: "preview-viewport-changed",
      viewport: { center: { x: 1024, y: 1024 }, mode: "manual", zoom: 2 },
    })
  })

  it("uses full output dimensions for manual slide zoom when fit preview is screen-sized", () => {
    const model = makeModel({
      algorithm: "bayer",
      compareMode: "slide",
      original: makeBuffer(768, 768),
      outputHeight: 2048,
      outputWidth: 2048,
      preview: makeBuffer(768, 768),
      previewTargetHeight: 768,
      previewTargetWidth: 768,
      previewViewport: {
        mode: "manual",
        zoom: 2,
        center: { x: 1024, y: 1024 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    const html = renderToStaticMarkup(
      <PreviewStage model={model} onCommand={vi.fn()} />
    )

    expect(html).toContain("height:4072px")
    expect(html).toContain("width:4072px")
    expect(html).toContain("margin-left:-2036px")
    expect(html).toContain("margin-top:-2036px")
  })

  it("centers real pixels view when enabling the pixel inspector from fit mode", () => {
    const onCommand = vi.fn()
    const model = makeModel({
      algorithm: "bayer",
      original: makeBuffer(8, 6),
      outputHeight: 6,
      outputWidth: 8,
      preview: makeBuffer(8, 6),
      previewTargetHeight: 6,
      previewTargetWidth: 8,
      previewViewport: {
        mode: "fit",
        zoom: 1,
        center: { x: 0, y: 0 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    renderToStaticMarkup(<PreviewStage model={model} onCommand={onCommand} />)

    buttonRenders
      .find((button) => button["aria-label"] === "Toggle pixel inspector")
      ?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)

    expect(onCommand).toHaveBeenCalledWith({
      kind: "preview-viewport-changed",
      viewport: { center: { x: 4, y: 3 }, loupeEnabled: true, mode: "manual" },
    })
  })

  it("centers real pixels from fit mode at the full output size, not the reduced preview target", () => {
    const onCommand = vi.fn()
    const model = makeModel({
      algorithm: "bayer",
      compareMode: "slide",
      original: makeBuffer(4000, 3000),
      outputHeight: 3000,
      outputWidth: 4000,
      preview: makeBuffer(600, 450),
      previewTargetHeight: 450,
      previewTargetWidth: 600,
      previewViewport: {
        mode: "fit",
        zoom: 1,
        center: { x: 0, y: 0 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    renderToStaticMarkup(<PreviewStage model={model} onCommand={onCommand} />)

    toggleGroupItemRenders.find((item) => item.value === "manual")?.onClick?.()

    expect(onCommand).toHaveBeenCalledWith({
      kind: "preview-viewport-changed",
      viewport: { center: { x: 2000, y: 1500 }, mode: "manual", zoom: 1 },
    })
  })

  it("resets zoom when switching from real pixels back to fit", () => {
    const onCommand = vi.fn()
    const model = makeModel({
      algorithm: "bayer",
      original: makeBuffer(4000, 3000),
      outputHeight: 3000,
      outputWidth: 4000,
      preview: makeBuffer(4000, 3000),
      previewTargetHeight: 3000,
      previewTargetWidth: 4000,
      previewViewport: {
        mode: "manual",
        zoom: 3,
        center: { x: 1200, y: 900 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    renderToStaticMarkup(<PreviewStage model={model} onCommand={onCommand} />)

    toggleGroupItemRenders.find((item) => item.value === "fit")?.onClick?.()

    expect(onCommand).toHaveBeenCalledWith({
      kind: "preview-viewport-changed",
      viewport: { center: { x: 2000, y: 1500 }, mode: "fit", zoom: 1 },
    })
  })

  it("hides the pixel inspector control on mobile", () => {
    const model = makeModel({
      algorithm: "bayer",
      isDesktopViewScale: false,
      original: makeBuffer(2, 2),
      preview: makeBuffer(2, 2),
      previewTargetHeight: 2,
      previewTargetWidth: 2,
      previewViewport: {
        mode: "manual",
        zoom: 4,
        center: { x: 1, y: 1 },
        gridEnabled: true,
        loupeEnabled: true,
      },
    })

    renderToStaticMarkup(<PreviewStage model={model} onCommand={vi.fn()} />)

    expect(
      buttonRenders.some(
        (button) => button["aria-label"] === "Toggle pixel inspector"
      )
    ).toBe(false)
  })

  it("reserves mobile touch drag gestures for manual preview panning", () => {
    const model = makeModel({
      algorithm: "bayer",
      isDesktopViewScale: false,
      original: makeBuffer(2, 2),
      preview: makeBuffer(2, 2),
      previewTargetHeight: 2,
      previewTargetWidth: 2,
      previewViewport: {
        mode: "manual",
        zoom: 4,
        center: { x: 1, y: 1 },
        gridEnabled: true,
        loupeEnabled: false,
      },
    })

    const html = renderToStaticMarkup(
      <PreviewStage model={model} onCommand={vi.fn()} />
    )

    expect(html).toContain("touch-action:none")
  })

  it("uses full output dimensions for mobile real-pixels zoom", () => {
    const model = makeModel({
      algorithm: "bayer",
      isDesktopViewScale: false,
      original: makeBuffer(4000, 3000),
      outputHeight: 3000,
      outputWidth: 4000,
      preview: makeBuffer(600, 450),
      previewTargetHeight: 450,
      previewTargetWidth: 600,
      previewViewport: {
        mode: "manual",
        zoom: 2,
        center: { x: 2000, y: 1500 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    const html = renderToStaticMarkup(
      <PreviewStage model={model} onCommand={vi.fn()} />
    )

    expect(html).toContain("height:5976px")
    expect(html).toContain("width:7968px")
    expect(html).toContain("margin-left:-3984px")
    expect(html).toContain("margin-top:-2988px")
  })

  it("keeps mobile manual geometry based on output size after Fit preview", () => {
    const onCommand = vi.fn()
    const model = makeModel({
      algorithm: "bayer",
      isDesktopViewScale: false,
      original: makeBuffer(4000, 3000),
      outputHeight: 3000,
      outputWidth: 4000,
      preview: makeBuffer(600, 450),
      previewTargetHeight: 450,
      previewTargetWidth: 600,
      previewViewport: {
        mode: "fit",
        zoom: 1,
        center: { x: 0, y: 0 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    renderToStaticMarkup(<PreviewStage model={model} onCommand={onCommand} />)

    sliderRenders.find((slider) => slider.max === 16)?.onValueChange?.([2])

    expect(onCommand).toHaveBeenCalledWith({
      kind: "preview-viewport-changed",
      viewport: { center: { x: 2000, y: 1500 }, mode: "manual", zoom: 2 },
    })
  })

  it("reserves mobile touch gestures while fit preview can pinch into manual mode", () => {
    const model = makeModel({
      algorithm: "bayer",
      isDesktopViewScale: false,
      original: makeBuffer(2, 2),
      preview: makeBuffer(2, 2),
      previewTargetHeight: 2,
      previewTargetWidth: 2,
      previewViewport: {
        mode: "fit",
        zoom: 1,
        center: { x: 0, y: 0 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    const html = renderToStaticMarkup(
      <PreviewStage model={model} onCommand={vi.fn()} />
    )

    expect(html).toContain("touch-action:none")
  })

  it("applies manual viewport center as a visible frame offset", () => {
    const model = makeModel({
      algorithm: "bayer",
      original: makeBuffer(10, 8),
      outputHeight: 8,
      outputWidth: 10,
      preview: makeBuffer(10, 8),
      previewTargetHeight: 8,
      previewTargetWidth: 10,
      previewViewport: {
        mode: "manual",
        zoom: 4,
        center: { x: 4, y: 3 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    const html = renderToStaticMarkup(
      <PreviewStage model={model} onCommand={vi.fn()} />
    )

    expect(html).toContain("left:50%")
    expect(html).toContain("top:50%")
    expect(html).toContain("margin-left:-2px")
    expect(html).toContain("margin-top:-1px")
  })

  it("does not hide non-default real-pixels frames during compare mode changes", () => {
    const model = makeModel({
      algorithm: "bayer",
      original: makeBuffer(4000, 3000),
      outputHeight: 3000,
      outputWidth: 4000,
      preview: makeBuffer(4000, 3000),
      previewTargetHeight: 3000,
      previewTargetWidth: 4000,
      previewViewport: {
        mode: "manual",
        zoom: 3,
        center: { x: 1200, y: 900 },
        gridEnabled: false,
        loupeEnabled: false,
      },
    })

    const html = renderToStaticMarkup(
      <PreviewStage model={model} onCommand={vi.fn()} />
    )

    expect(html).not.toContain("visibility:hidden")
  })

  it("uses the same real-pixels frame size for slide, processed, and original", () => {
    function renderStage(compareMode: string) {
      return renderToStaticMarkup(
        <PreviewStage
          model={makeModel({
            algorithm: "bayer",
            compareMode: compareMode as never,
            original: makeBuffer(4000, 3000),
            outputHeight: 3000,
            outputWidth: 4000,
            preview: makeBuffer(600, 450),
            previewTargetHeight: 3000,
            previewTargetWidth: 4000,
            previewViewport: {
              mode: "manual",
              zoom: 3,
              center: { x: 1200, y: 900 },
              gridEnabled: false,
              loupeEnabled: false,
            },
          })}
          onCommand={vi.fn()}
        />
      )
    }

    const slide = renderStage("slide")
    const processed = renderStage("processed")
    const original = renderStage("original")

    for (const html of [slide, processed, original]) {
      expect(html).toContain("height:8964px")
      expect(html).toContain("width:11952px")
      expect(html).toContain("margin-left:-3586px")
      expect(html).toContain("margin-top:-2689px")
    }
  })
})

function makeBuffer(width: number, height: number): PixelBuffer {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    height,
    width,
  }
}
