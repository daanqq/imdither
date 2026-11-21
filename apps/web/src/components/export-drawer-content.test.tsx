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

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: string
  size?: string
}

const sliderRenders: SliderProps[] = []
const buttonRenders: ButtonProps[] = []
const toggleGroupItemRenders: Array<{
  onClick?: () => void
  value?: string
}> = []

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

vi.mock("@workspace/ui/components/toggle-group", () => ({
  ToggleGroup: ({
    children,
    onValueChange,
    ...props
  }: {
    children: React.ReactNode
    onValueChange?: (value: string) => void
    [key: string]: unknown
  }) => (
    <div
      aria-label={props["aria-label"] as string | undefined}
      data-slot={props["data-slot"] as string | undefined}
    >
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
    return (
      <button type="button" data-value={value} onClick={onClick}>
        {children}
      </button>
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
  DrawerClose: ({ children }: { children: React.ReactNode }) => (
    <span data-slot="drawer-close">{children}</span>
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
}))

vi.mock("@workspace/ui/components/button", () => ({
  Button: (props: ButtonProps) => {
    buttonRenders.push(props)
    return <button {...props} />
  },
}))

describe("ExportDrawerContent", () => {
  beforeEach(() => {
    sliderRenders.length = 0
    buttonRenders.length = 0
    toggleGroupItemRenders.length = 0
  })

  it("renders accessible close button, output summary metadata, segmented format selector, and active quality slider", () => {
    const onExportFormatChange = vi.fn()
    const html = renderToStaticMarkup(
      <ExportDrawerContent
        algorithm="floyd-steinberg"
        exportFormat="webp"
        exportQuality={0.75}
        outputHeight={600}
        outputWidth={800}
        paletteId="screenprint-16"
        status="ready"
        onCopyImage={vi.fn()}
        onExport={vi.fn()}
        onExportFormatChange={onExportFormatChange}
        onExportQualityChange={vi.fn()}
      />
    )

    expect(html).toContain('data-slot="drawer-close"')
    expect(html).toContain('aria-label="Close"')
    expect(html).toContain('data-slot="export-summary-card"')
    expect(html).toContain("Output Summary")
    expect(html).toContain("800×600 px")
    expect(html).toContain("4:3")
    expect(html).toContain("Floyd-Steinberg")
    expect(html).toContain("Screenprint 16")
    expect(html).toContain('data-slot="export-estimated-size"')
    expect(html).toContain('data-slot="export-format-selector"')
    expect(html).toContain("PNG")
    expect(html).toContain("WebP")
    expect(html).toContain("JPEG")
    expect(html).toContain("Export Format")
    expect(html).toContain("Export Quality")
    expect(html).toContain("75%")
    expect(html).toContain("Download WebP")
    expect(sliderRenders.at(-1)).toMatchObject({
      disabled: false,
      max: 1,
      min: 0.1,
      step: 0.05,
      value: [0.75],
    })

    toggleGroupItemRenders.find((item) => item.value === "jpeg")?.onClick?.()
    expect(onExportFormatChange).toHaveBeenCalledWith("jpeg")
  })

  it("shows lossless badge instead of a dimmed slider for PNG and displays the lossless note", () => {
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

    expect(sliderRenders).toHaveLength(0)
    expect(html).toContain('data-slot="export-lossless-badge"')
    expect(html).toContain("Lossless · 100%")
    expect(html).toContain("PNG exports remain lossless at 100%.")
    expect(html).toContain("Download PNG")
  })

  it("triggers Copy Image callback for static images and disables both actions while exporting", () => {
    const onCopyImage = vi.fn()
    const onExport = vi.fn()

    const readyHtml = renderToStaticMarkup(
      <ExportDrawerContent
        exportFormat="jpeg"
        exportQuality={0.85}
        status="ready"
        onCopyImage={onCopyImage}
        onExport={onExport}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
      />
    )

    expect(readyHtml).toContain("Copy Image")
    expect(readyHtml).toContain("Download JPEG")

    const copyButton = buttonRenders.find(
      (button) => button.title === "Copy rendered PNG image to clipboard"
    )
    expect(copyButton).toBeDefined()
    copyButton?.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    expect(onCopyImage).toHaveBeenCalledTimes(1)

    buttonRenders.length = 0
    renderToStaticMarkup(
      <ExportDrawerContent
        exportFormat="png"
        exportQuality={1}
        status="exporting"
        onCopyImage={onCopyImage}
        onExport={onExport}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
      />
    )

    const exportingCopy = buttonRenders.find(
      (button) => button.title === "Copy rendered PNG image to clipboard"
    )
    const exportingDownload = buttonRenders.find((button) =>
      String(button.children).includes("Download")
    )
    expect(exportingCopy?.disabled).toBe(true)
    expect(exportingDownload?.disabled).toBe(true)
  })

  it("renders animated format selector, WebM gate, and frame metadata summary without static Copy Image", () => {
    const onAnimatedExportFormatChange = vi.fn()
    const html = renderToStaticMarkup(
      <ExportDrawerContent
        algorithm="bayer"
        animatedExportFormat="gif"
        exportFormat="png"
        exportQuality={0.9}
        frameCount={24}
        isAnimated
        motionExportSettings={{ frameDurationMs: 100, loopCount: 0 }}
        outputHeight={240}
        outputWidth={320}
        paletteId="game-boy"
        status="ready"
        webCodecsAvailable
        onAnimatedExportFormatChange={onAnimatedExportFormatChange}
        onCopyImage={vi.fn()}
        onExport={vi.fn()}
        onExportFormatChange={vi.fn()}
        onExportQualityChange={vi.fn()}
        onMotionExportSettingsChange={vi.fn()}
      />
    )

    expect(html).toContain("320×240 px")
    expect(html).toContain("24 · 10 fps")
    expect(html).toContain("2.4s")
    expect(html).toContain("GIF")
    expect(html).toContain("APNG")
    expect(html).toContain("WebM")
    expect(html).not.toContain("Copy Image")

    toggleGroupItemRenders.find((item) => item.value === "webm")?.onClick?.()
    expect(onAnimatedExportFormatChange).toHaveBeenCalledWith("webm")
  })
})
